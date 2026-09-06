import { Router } from "express";
import * as store from "../lib/store.js";
import { requireAuth } from "../middleware/auth.js";
import {
  fetchGithubStats,
  fetchCodeforcesStats,
  fetchLeetcodeStats,
  fetchCodechefStats,
  sanitizeUsername
} from "../services/platforms.js";

const router = Router();

function last119Dates() {
  const dates = [];
  const today = new Date();
  for (let i = 118; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

// Merge per-day activity levels (0-3) from every connected platform into one heatmap.
function mergeHeatmap(platformResults) {
  const dayTotals = {}; // date -> summed level across platforms
  for (const p of platformResults) {
    for (const day of p.activity || []) {
      dayTotals[day.date] = (dayTotals[day.date] || 0) + (day.level || 0);
    }
  }
  const days = last119Dates();
  return days.map((date) => {
    const total = dayTotals[date] || 0;
    if (total === 0) return 0;
    if (total >= 6) return 3;
    if (total >= 3) return 2;
    return 1;
  });
}

// Real per-platform contest count + total, and a real month-by-month
// breakdown (current month + previous 6) built entirely from actual
// contest-history dates and activity dates — nothing here is invented.
function buildContestSummary(results) {
  const platforms = ["leetcode", "codeforces", "codechef"];
  const totalContests = { total: 0 };
  for (const p of platforms) {
    const authoritative = p === "leetcode" ? results[p]?.totalContestsAttended : undefined;
    const count = authoritative ?? results[p]?.contestHistory?.length ?? 0;
    totalContests[p] = count;
    totalContests.total += count;
  }

  const now = new Date();
  const months = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push({ year: d.getUTCFullYear(), month: d.getUTCMonth() }); // month: 0-11
  }

  const inMonth = (isoDate, year, month) => {
    const d = new Date(isoDate);
    return d.getUTCFullYear() === year && d.getUTCMonth() === month;
  };

  const monthlyBreakdown = months.map(({ year, month }) => {
    const label = new Date(Date.UTC(year, month, 1)).toLocaleString("en-US", { month: "long", year: "numeric" });

    const perPlatform = {};
    let activeDaysThisMonth = 0;
    const activeDateSet = new Set();

    for (const p of platforms) {
      const history = (results[p]?.contestHistory || []).filter((c) => inMonth(c.date, year, month));
      const bestByDate = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
      const last = bestByDate[bestByDate.length - 1];
      perPlatform[p] = {
        contests: history.length,
        contestNames: history.map((c) => c.name),
        ratingAtMonthEnd: last ? last.rating : null,
        bestRank: history.length ? Math.min(...history.map((c) => c.rank)) : null
      };
    }

    // GitHub real contribution count for this month + merged active-day count
    // across every connected platform for this month.
    let githubContributions = 0;
    for (const p of ["github", "codeforces", "leetcode"]) {
      for (const day of results[p]?.activity || []) {
        if (inMonth(day.date, year, month) && (day.count || day.level) > 0) {
          activeDateSet.add(day.date);
          if (p === "github") githubContributions += day.count || 0;
        }
      }
    }
    activeDaysThisMonth = activeDateSet.size;

    return {
      month: label,
      year,
      monthIndex: month,
      perPlatform,
      totalContestsThisMonth: platforms.reduce((sum, p) => sum + perPlatform[p].contests, 0),
      activeDays: activeDaysThisMonth,
      githubContributions
    };
  });

  return { totalContests, monthlyBreakdown };
}

// Real per-platform "problems solved by difficulty" — LeetCode reports
// this directly; Codeforces problems don't have easy/medium/hard labels so
// we bucket by each solved problem's real difficulty rating (the standard
// community convention: <1200 easy, 1200-1899 medium, 1900+ hard);
// CodeChef's public profile doesn't expose per-problem difficulty at all,
// so that stays honestly "not available" rather than guessed.
function buildDifficultySummary(results) {
  const lc = results.leetcode;
  const cf = results.codeforces;
  const cc = results.codechef;

  const perPlatform = {
    leetcode: lc
      ? { easy: lc.easySolved, medium: lc.mediumSolved, hard: lc.hardSolved, total: lc.totalSolved, available: true }
      : { available: false },
    codeforces: cf
      ? {
          easy: cf.difficultyCounts.easy,
          medium: cf.difficultyCounts.medium,
          hard: cf.difficultyCounts.hard,
          unrated: cf.difficultyCounts.unrated,
          total: cf.solvedCount,
          available: true
        }
      : { available: false },
    codechef: cc
      ? {
          total: cc.totalSolved, // null means "couldn't be read from the page", not zero
          fullySolved: cc.fullySolved,
          partiallySolved: cc.partiallySolved,
          available: true,
          byDifficulty: false
        }
      : { available: false }
  };

  const totals = { easy: 0, medium: 0, hard: 0, total: 0 };
  if (perPlatform.leetcode.available) {
    totals.easy += perPlatform.leetcode.easy;
    totals.medium += perPlatform.leetcode.medium;
    totals.hard += perPlatform.leetcode.hard;
    totals.total += perPlatform.leetcode.total;
  }
  if (perPlatform.codeforces.available) {
    totals.easy += perPlatform.codeforces.easy;
    totals.medium += perPlatform.codeforces.medium;
    totals.hard += perPlatform.codeforces.hard;
    totals.total += perPlatform.codeforces.total;
  }
  if (perPlatform.codechef.available && perPlatform.codechef.total !== null) {
    // CodeChef counts into the grand total but not into easy/medium/hard,
    // since we have no honest way to bucket it — kept visibly separate.
    totals.total += perPlatform.codechef.total;
  }

  return { perPlatform, totals };
}

router.post("/", requireAuth, async (req, res) => {
  const user = await store.getUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const platforms = await store.getBlob(req.userId, "platforms", {});
  const jobs = [];
  const gh = sanitizeUsername("github", platforms.github);
  const cf = sanitizeUsername("codeforces", platforms.codeforces);
  const lc = sanitizeUsername("leetcode", platforms.leetcode);
  const cc = sanitizeUsername("codechef", platforms.codechef);
  if (gh) jobs.push(["github", fetchGithubStats(gh)]);
  if (cf) jobs.push(["codeforces", fetchCodeforcesStats(cf)]);
  if (lc) jobs.push(["leetcode", fetchLeetcodeStats(lc)]);
  if (cc) jobs.push(["codechef", fetchCodechefStats(cc)]);

  if (jobs.length === 0) {
    return res.status(400).json({ error: "Connect at least one platform first (GitHub, LeetCode, CodeChef or Codeforces)." });
  }

  const settled = await Promise.allSettled(jobs.map(([, p]) => p));
  const results = {};
  const errors = {};
  settled.forEach((outcome, i) => {
    const [key] = jobs[i];
    if (outcome.status === "fulfilled") results[key] = outcome.value;
    else errors[key] = outcome.reason.message || "Failed to fetch";
  });

  const platformList = Object.values(results);

  if (platformList.length === 0) {
    // Every connected platform failed — don't overwrite the dashboard with
    // an all-zero "synced" state. Report the errors instead.
    return res.status(502).json({
      error: "Could not fetch data from any connected platform.",
      errors
    });
  }

  // --- Real, derived numbers -------------------------------------------
  const heatmap = mergeHeatmap(platformList);

  let longest = 0, current = 0, activeDays = 0;
  for (const v of heatmap) {
    if (v > 0) { current++; longest = Math.max(longest, current); activeDays++; }
    else current = 0;
  }
  // current streak = trailing run of active days up to today
  let streak = 0;
  for (let i = heatmap.length - 1; i >= 0; i--) {
    if (heatmap[i] > 0) streak++;
    else break;
  }

  const totalSolved =
    (results.leetcode?.totalSolved || 0) +
    (results.codeforces?.solvedCount || 0) +
    (results.codechef?.totalSolved || 0);

  const totalXp = totalSolved * 10 + activeDays * 4 + (results.github?.totalContributions || 0);

  // C-Score: a single blended number out of contest ratings + solved volume + consistency,
  // scaled roughly like Codolio's score.
  const ratingSignal =
    ((results.codeforces?.rating || 0) + (results.leetcode?.contestRating || 0) + (results.codechef?.rating || 0)) / 3;
  const cScore = Math.round((ratingSignal * 0.5 + totalSolved * 0.8 + activeDays * 1.2) * 10) / 10;

  const commitsByWeekday = results.github?.commitsByWeekday || [0, 0, 0, 0, 0, 0, 0];
  const { totalContests, monthlyBreakdown } = buildContestSummary(results);
  const difficultySummary = buildDifficultySummary(results);

  // Persist everything. Note: there is no honest way to derive "code quality"
  // from profile stats alone — that only comes from actually running the AI
  // repo analyzer on real source code (see routes/analyze.js), so it isn't
  // computed or faked here.
  const platformStats = {
    syncedAt: new Date().toISOString(),
    results,
    errors,
    heatmap,
    commitsByWeekday,
    totalContests,
    monthlyBreakdown,
    difficultySummary
  };
  await store.setBlob(req.userId, "platformStats", platformStats);

  const updatedUser = await store.updateUser(req.userId, { totalXp, cScore, streak });

  // Rank the user among all real registered users by cScore (this is a genuine
  // ranking among actual Codoverse accounts — not a claim about ranking against
  // every LeetCode/Codeforces user worldwide, which no single app can determine).
  const allUsers = await store.listAllUsers();
  const ranked = [...allUsers].sort((a, b) => (b.cScore || 0) - (a.cScore || 0));
  const globalRank = ranked.findIndex((u) => u.id === updatedUser.id) + 1;
  const finalUser = await store.updateUser(req.userId, { globalRank, countryRank: globalRank }); // no country field collected yet

  res.json({
    syncedAt: platformStats.syncedAt,
    results,
    errors,
    totalContests,
    monthlyBreakdown,
    difficultySummary,
    user: {
      totalXp: finalUser.totalXp,
      cScore: finalUser.cScore,
      streak: finalUser.streak,
      globalRank: finalUser.globalRank,
      countryRank: finalUser.countryRank
    }
  });
});

export default router;
