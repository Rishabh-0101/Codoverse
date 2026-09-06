import fetch from "node-fetch";

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Codoverse/1.0"
};

/**
 * People often paste a full profile URL instead of a bare username
 * (e.g. "https://github.com/torvalds" instead of "torvalds"). This accepts
 * either and always returns the bare handle so every fetch function below
 * gets a clean username.
 */
export function sanitizeUsername(platform, raw) {
  if (!raw) return "";
  let value = raw.trim();
  if (!/^https?:\/\//i.test(value)) return value.replace(/\/+$/, "");

  try {
    const u = new URL(value);
    const parts = u.pathname.split("/").filter(Boolean);
    if (platform === "codeforces") {
      const i = parts.indexOf("profile");
      return i >= 0 ? parts[i + 1] : parts[0] || "";
    }
    if (platform === "codechef") {
      const i = parts.indexOf("users");
      return i >= 0 ? parts[i + 1] : parts[0] || "";
    }
    if (platform === "leetcode") {
      // LeetCode has two profile URL formats: the newer leetcode.com/u/handle/
      // and the older leetcode.com/handle/. Without this, a pasted new-style
      // URL would extract "u" as the username instead of the real handle.
      const i = parts.indexOf("u");
      return i >= 0 ? parts[i + 1] : parts[0] || "";
    }
    return parts[0] || "";
  } catch {
    return value;
  }
}

/* ---------------------------------------------------------------------- */
/* GitHub — official REST API + the public contributions-calendar page.   */
/* ---------------------------------------------------------------------- */
export async function fetchGithubStats(username) {
  const headers = { ...BROWSER_HEADERS };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const profileRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers });
  if (profileRes.status === 404) throw new Error(`GitHub user "${username}" not found`);
  if (!profileRes.ok) throw new Error(`GitHub API error (${profileRes.status}). You may be rate-limited — add GITHUB_TOKEN in backend/.env`);
  const profile = await profileRes.json();

  const reposRes = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
    { headers }
  );
  const repos = reposRes.ok ? await reposRes.json() : [];

  const languageCounts = {};
  let totalStars = 0;
  for (const r of repos) {
    if (r.language) languageCounts[r.language] = (languageCounts[r.language] || 0) + 1;
    totalStars += r.stargazers_count || 0;
  }
  const topLanguages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([language, count]) => ({ language, count }));

  const calendarHtml = await fetch(`https://github.com/users/${encodeURIComponent(username)}/contributions`, {
    headers: BROWSER_HEADERS
  }).then((r) => (r.ok ? r.text() : ""));

  // GitHub renders each day as a <td id="contribution-day-component-X-Y" data-date="..." data-level="...">
  // and a matching <tool-tip for="contribution-day-component-X-Y">N contributions on Month Day.</tool-tip>
  // with the EXACT count. We read both and match them up for real per-day numbers,
  // not just the 0-3 bucketed "level".
  const dayMeta = {}; // id -> { date, level }
  const cellRe = /id="(contribution-day-component-[\d-]+)"\s+data-level="(\d)"[^>]*>|data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="(contribution-day-component-[\d-]+)"[^>]*data-level="(\d)"/g;
  // The attribute order in GitHub's HTML is: data-date ... id ... data-level. Handle that directly:
  const tdRe = /<td[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="(contribution-day-component-[\d-]+)"[^>]*data-level="(\d)"[^>]*>/g;
  let tdMatch;
  while ((tdMatch = tdRe.exec(calendarHtml))) {
    const [, date, id, level] = tdMatch;
    dayMeta[id] = { date, level: Number(level), count: null };
  }

  const tooltipRe = /for="(contribution-day-component-[\d-]+)"[^>]*>(\d+) contributions? on/g;
  let ttMatch;
  while ((ttMatch = tooltipRe.exec(calendarHtml))) {
    const [, id, count] = ttMatch;
    if (dayMeta[id]) dayMeta[id].count = Number(count);
  }

  const activity = []; // { date, level, count } — count is the REAL exact number when available
  let totalContributions = 0;
  const commitsByWeekday = [0, 0, 0, 0, 0, 0, 0];
  for (const { date, level, count } of Object.values(dayMeta)) {
    const real = count ?? 0;
    activity.push({ date, level, count: real });
    if (real > 0) {
      totalContributions += real;
      const weekday = new Date(date + "T00:00:00Z").getUTCDay();
      commitsByWeekday[weekday] += real;
    }
  }

  return {
    platform: "github",
    username,
    displayName: profile.name || username,
    publicRepos: profile.public_repos,
    followers: profile.followers,
    totalStars,
    topLanguages,
    activity,
    totalContributions,
    commitsByWeekday,
    profileUrl: profile.html_url
  };
}

/* ---------------------------------------------------------------------- */
/* Codeforces — official public API. Includes full real contest history.  */
/* ---------------------------------------------------------------------- */
export async function fetchCodeforcesStats(handle) {
  const infoRes = await fetch(
    `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
    { headers: BROWSER_HEADERS }
  );
  const infoData = await infoRes.json();
  if (infoData.status !== "OK") throw new Error(`Codeforces handle "${handle}" not found`);
  const info = infoData.result[0];

  const statusRes = await fetch(
    `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=10000`,
    { headers: BROWSER_HEADERS }
  );
  const statusData = await statusRes.json();
  const submissions = statusData.status === "OK" ? statusData.result : [];

  const solvedSet = new Set();
  const activityMap = {};
  // Codeforces tags each problem with a difficulty "rating" (800-3500+),
  // not an easy/medium/hard label — we bucket using the same brackets
  // Codeforces' own community and tools (e.g. codeforces.com/problemset,
  // CF-Predictor) commonly use: <1200 easy, 1200-1899 medium, 1900+ hard.
  // Problems with no rating (very new/unrated) aren't counted in any bucket.
  const difficultyCounts = { easy: 0, medium: 0, hard: 0, unrated: 0 };
  for (const sub of submissions) {
    const date = new Date(sub.creationTimeSeconds * 1000).toISOString().slice(0, 10);
    activityMap[date] = (activityMap[date] || 0) + 1;
    if (sub.verdict === "OK") {
      const key = `${sub.problem.contestId}-${sub.problem.index}`;
      if (!solvedSet.has(key)) {
        solvedSet.add(key);
        const r = sub.problem.rating;
        if (!r) difficultyCounts.unrated++;
        else if (r < 1200) difficultyCounts.easy++;
        else if (r < 1900) difficultyCounts.medium++;
        else difficultyCounts.hard++;
      }
    }
  }
  const activity = Object.entries(activityMap).map(([date, count]) => ({
    date,
    level: count >= 5 ? 3 : count >= 2 ? 2 : 1,
    count
  }));

  // Real, complete contest participation history — exact date, rank and
  // rating change for every rated contest this handle has entered.
  const ratingRes = await fetch(
    `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`,
    { headers: BROWSER_HEADERS }
  );
  const ratingData = await ratingRes.json();
  const contestHistory =
    ratingData.status === "OK"
      ? ratingData.result.map((c) => ({
          name: c.contestName,
          rank: c.rank,
          rating: c.newRating,
          ratingChange: c.newRating - c.oldRating,
          date: new Date(c.ratingUpdateTimeSeconds * 1000).toISOString(),
          url: `https://codeforces.com/contest/${c.contestId}`
        }))
      : [];

  return {
    platform: "codeforces",
    username: handle,
    rating: info.rating || 0,
    maxRating: info.maxRating || 0,
    rank: info.rank || "unrated",
    solvedCount: solvedSet.size,
    difficultyCounts,
    totalSubmissions: submissions.length,
    activity,
    contestHistory,
    profileUrl: `https://codeforces.com/profile/${handle}`
  };
}

/* ---------------------------------------------------------------------- */
/* LeetCode — public GraphQL endpoint. Includes full contest history.     */
/* ---------------------------------------------------------------------- */
export async function fetchLeetcodeStats(username) {
  const query = `
    query userStats($username: String!) {
      matchedUser(username: $username) {
        username
        submitStats {
          acSubmissionNum { difficulty count }
        }
        userCalendar {
          submissionCalendar
        }
      }
      userContestRanking(username: $username) {
        rating
        globalRanking
        attendedContestsCount
      }
      userContestRankingHistory(username: $username) {
        attended
        rating
        ranking
        problemsSolved
        totalProblems
        finishTimeInSeconds
        contest { title startTime }
      }
    }`;

  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      ...BROWSER_HEADERS,
      "Content-Type": "application/json",
      Referer: `https://leetcode.com/${username}/`
    },
    body: JSON.stringify({ query, variables: { username } })
  });

  if (!res.ok) throw new Error(`LeetCode API error (${res.status})`);
  const data = await res.json();

  // LeetCode's GraphQL can return HTTP 200 with a top-level "errors" array
  // (e.g. rate-limited, blocked, or field renamed) — surface that instead
  // of silently returning empty data.
  if (data.errors?.length) {
    throw new Error(`LeetCode API error: ${data.errors.map((e) => e.message).join("; ")}`);
  }

  const user = data?.data?.matchedUser;
  if (!user) throw new Error(`LeetCode user "${username}" not found`);

  const byDifficulty = {};
  for (const s of user.submitStats?.acSubmissionNum || []) {
    byDifficulty[s.difficulty] = s.count;
  }

  let activity = [];
  try {
    const calendar = JSON.parse(user.userCalendar?.submissionCalendar || "{}");
    activity = Object.entries(calendar).map(([ts, count]) => ({
      date: new Date(Number(ts) * 1000).toISOString().slice(0, 10),
      level: count >= 5 ? 3 : count >= 2 ? 2 : 1,
      count
    }));
  } catch {
    activity = [];
  }

  const contest = data?.data?.userContestRanking;
  const rawHistory = data?.data?.userContestRankingHistory || [];
  const contestHistory = rawHistory
    .filter((c) => c.attended || c.rating > 0 || c.ranking > 0 || c.problemsSolved > 0 || c.finishTimeInSeconds > 0)
    .map((c) => ({
      name: c.contest?.title,
      rank: c.ranking,
      rating: Math.round(c.rating || 0),
      problemsSolved: c.problemsSolved,
      totalProblems: c.totalProblems,
      date: new Date(c.contest.startTime * 1000).toISOString(),
      url: null
    }));

  // LeetCode's own profile page shows a single authoritative "Attended: N"
  // number (userContestRanking.attendedContestsCount) which is the real
  // total — more reliable than counting individual history entries, since
  // the per-entry "attended" flag can be inconsistent for accounts with
  // very few contests. We use the authoritative count for the headline
  // total, and the (best-effort) per-entry history for monthly detail.
  const totalContestsAttended = contest?.attendedContestsCount ?? contestHistory.length;

  return {
    platform: "leetcode",
    // Debug info surfaced on the Connect page: if contestHistory.length is
    // lower than totalContestsAttended, some real contests exist in
    // LeetCode's per-entry data but didn't pass the filter above — tells us
    // exactly where any remaining mismatch is.
    _debugContestEntriesSeen: rawHistory.length,
    _debugContestEntriesAttended: rawHistory.filter((c) => c.attended).length,
    _debugAuthoritativeAttendedCount: contest?.attendedContestsCount ?? null,
    username,
    totalSolved: byDifficulty.All || 0,
    easySolved: byDifficulty.Easy || 0,
    mediumSolved: byDifficulty.Medium || 0,
    hardSolved: byDifficulty.Hard || 0,
    contestRating: contest?.rating ? Math.round(contest.rating) : null,
    globalRanking: contest?.globalRanking || null,
    totalContestsAttended,
    activity,
    contestHistory,
    profileUrl: `https://leetcode.com/${username}/`
  };
}

/* ---------------------------------------------------------------------- */
/* Live upcoming contests — real data, no seed/demo entries.              */
/* ---------------------------------------------------------------------- */
export async function fetchCodeforcesContests() {
  const res = await fetch("https://codeforces.com/api/contest.list?gym=false", { headers: BROWSER_HEADERS });
  const data = await res.json();
  if (data.status !== "OK") return [];
  return data.result
    .filter((c) => c.phase === "BEFORE")
    .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
    .slice(0, 5)
    .map((c) => ({
      id: `cf-${c.id}`,
      name: c.name,
      platform: "codeforces",
      level: c.type || "Contest",
      durationSeconds: c.durationSeconds,
      startsAt: new Date(c.startTimeSeconds * 1000).toISOString(),
      url: `https://codeforces.com/contests/${c.id}`
    }));
}

export async function fetchLeetcodeContests() {
  const query = `
    query {
      allContests {
        title
        titleSlug
        startTime
        duration
      }
    }`;
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { ...BROWSER_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });
  if (!res.ok) return [];
  const data = await res.json();
  const now = Date.now() / 1000;
  return (data?.data?.allContests || [])
    .filter((c) => c.startTime > now)
    .sort((a, b) => a.startTime - b.startTime)
    .slice(0, 5)
    .map((c) => ({
      id: `lc-${c.titleSlug}`,
      name: c.title,
      platform: "leetcode",
      level: "All levels",
      durationSeconds: c.duration,
      startsAt: new Date(c.startTime * 1000).toISOString(),
      url: `https://leetcode.com/contest/${c.titleSlug}`
    }));
}

export async function fetchCodechefContests() {
  const res = await fetch("https://www.codechef.com/api/list/contests/all", { headers: BROWSER_HEADERS });
  if (!res.ok) return [];
  const data = await res.json();
  const future = data?.future_contests || [];
  return future.slice(0, 5).map((c) => ({
    id: `cc-${c.contest_code}`,
    name: c.contest_name,
    platform: "codechef",
    level: "All levels",
    durationSeconds: Number(c.contest_duration) * 60 || null,
    startsAt: new Date(c.contest_start_date_iso).toISOString(),
    url: `https://www.codechef.com/${c.contest_code}`
  }));
}

export async function fetchAllContests() {
  const settled = await Promise.allSettled([
    fetchCodeforcesContests(),
    fetchLeetcodeContests(),
    fetchCodechefContests()
  ]);
  return settled
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
}

/* ---------------------------------------------------------------------- */
/* CodeChef — no official public API. Reads the public profile page,      */
/* including the embedded rating-history array it uses to draw its own   */
/* rating graph, which gives us the same real contest history CodeChef    */
/* shows on-site.                                                         */
/* ---------------------------------------------------------------------- */
export async function fetchCodechefStats(username) {
  const res = await fetch(`https://www.codechef.com/users/${encodeURIComponent(username)}`, {
    headers: BROWSER_HEADERS
  });
  if (res.status === 404) throw new Error(`CodeChef profile "${username}" not found`);
  if (!res.ok) throw new Error(`CodeChef returned an error (${res.status}) — it may be temporarily blocking automated requests`);
  const html = await res.text();

  // CodeChef embeds the data behind its own rating graph as a JS array
  // literal on the page, e.g.: var all_rating = [{"code":"START180",
  // "name":"Starters 180","rating":"1523","rank":"842","end_date":"2026-08-05 20:00:00", ...}, ...]
  // This is the most reliable field — it's structured data, not
  // layout-dependent HTML/CSS classes that change with redesigns — so we
  // try it FIRST and use it to derive rating too, falling back to several
  // different HTML patterns only if this blob isn't present.
  let contestHistory = [];
  const blobMatch = html.match(/var\s+all_rating\s*=\s*(\[[\s\S]*?\]);/);
  if (blobMatch) {
    try {
      const raw = JSON.parse(blobMatch[1]);
      contestHistory = raw.map((c) => ({
        name: c.name,
        rank: Number(c.rank),
        rating: Number(c.rating),
        date: new Date(c.end_date.replace(" ", "T") + "Z").toISOString(),
        url: c.code ? `https://www.codechef.com/${c.code}` : null
      }));
    } catch {
      contestHistory = [];
    }
  }

  const ratingMatch =
    html.match(/rating-number["'][^>]*>\s*([\d]+)/) ||
    html.match(/class="rating-star"[^>]*>[\s\S]*?<strong>\s*(\d+)\s*<\/strong>/) ||
    html.match(/"rating"\s*:\s*"?(\d+)"?/);
  const starsMatch = html.match(/(\d)\s*★/) || html.match(/star\">\s*(\d)/);
  const globalRankMatch =
    html.match(/Global Rank<\/[^>]+>\s*<[^>]*>\s*(\d+)/i) || html.match(/class="rank"[^>]*>\s*(\d+)/);
  const countryRankMatch = html.match(/Country Rank<\/[^>]+>\s*<[^>]*>\s*(\d+)/i);

  // CodeChef's "Problems Solved" panel wording/markup has changed over
  // different site versions, so try several real known variants rather
  // than one fixed pattern. If truly none of these match, we report the
  // count as "not detected" (null) rather than silently showing 0 solved,
  // which would misrepresent someone who has actually solved problems.
  const fullySolvedMatch =
    html.match(/Fully\s*Solved[^\d]{0,60}(\d+)/i) ||
    html.match(/"fully_solved"\s*:\s*"?(\d+)"?/i) ||
    html.match(/fullySolved["\s:]+(\d+)/i);
  const partiallySolvedMatch =
    html.match(/Partially\s*Solved[^\d]{0,60}(\d+)/i) ||
    html.match(/"partially_solved"\s*:\s*"?(\d+)"?/i) ||
    html.match(/partiallySolved["\s:]+(\d+)/i);
    // Some profile layouts show a single combined "problems solved" count
  // instead of a fully/partially split. Confirmed real format via a debug
  // snippet from an actual profile page: "Total Problems Solved: 103".
  const totalSolvedMatch =
    html.match(/Total\s*Problems?\s*Solved\s*:?\s*(\d+)/i) ||
    html.match(/(\d+)\s*Problems?\s*Solved/i);
    
  // If none of the patterns above matched, capture the real text around
  // every "solved" occurrence on the page (HTML stripped, whitespace
  // collapsed) so the exact current wording/markup can be seen and a
  // guaranteed-correct pattern written — instead of guessing blindly again.
  let debugSolvedSnippets = null;
  if (!fullySolvedMatch && !partiallySolvedMatch && !totalSolvedMatch) {
    const snippets = [];
    const solvedRe = /solved/gi;
    let m;
    while ((m = solvedRe.exec(html)) && snippets.length < 5) {
      const start = Math.max(0, m.index - 80);
      const end = Math.min(html.length, m.index + 80);
      const clean = html
        .slice(start, end)
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (clean) snippets.push(clean);
    }
    debugSolvedSnippets = snippets;
  }

  // Prefer the rating parsed directly from the page; fall back to the most
  // recent contest's rating from the structured blob if that pattern missed.
  const rating = ratingMatch
    ? Number(ratingMatch[1])
    : contestHistory.length
      ? contestHistory[contestHistory.length - 1].rating
      : null;

  const fullySolved = fullySolvedMatch ? Number(fullySolvedMatch[1]) : null;
  const partiallySolved = partiallySolvedMatch ? Number(partiallySolvedMatch[1]) : null;
  const totalSolved = fullySolved !== null || partiallySolved !== null
    ? (fullySolved || 0) + (partiallySolved || 0)
    : totalSolvedMatch
      ? Number(totalSolvedMatch[1])
      : null; // genuinely not found on the page — not the same as "0 solved"

  const foundSomething = rating !== null || contestHistory.length > 0 || totalSolved !== null;
  if (!foundSomething) {
    throw new Error(
      `Could not read any data from CodeChef profile "${username}". Double-check the username is correct and the profile is public — CodeChef occasionally changes its page layout, which can also cause this.`
    );
  }

  return {
    platform: "codechef",
    username,
    rating,
    stars: starsMatch ? Number(starsMatch[1]) : null,
    globalRank: globalRankMatch ? Number(globalRankMatch[1]) : null,
    countryRank: countryRankMatch ? Number(countryRankMatch[1]) : null,
    fullySolved,
    partiallySolved,
    totalSolved,
    _debugSolvedSnippets: debugSolvedSnippets,
    activity: [],
    contestHistory,
    profileUrl: `https://www.codechef.com/users/${username}`
  };
}
