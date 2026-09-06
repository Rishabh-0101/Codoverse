import { Router } from "express";
import fetch from "node-fetch";
import { nanoid } from "nanoid";
import * as store from "../lib/store.js";
import { makeToken, seedNewAccountData } from "./auth.js";

const router = Router();
// Read lazily (not at module-load time) — see the comment in
// api/lib/store.js for why a top-level `process.env` read is fragile.
function frontendUrl() {
  return process.env.FRONTEND_URL || "http://localhost:5173";
}

async function findOrCreateUser({ email, name }) {
  let user = await store.findUserByEmail(email);
  if (!user) {
    user = {
      id: nanoid(),
      name: name || email.split("@")[0],
      handle: (name || email.split("@")[0]).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16) + Math.floor(Math.random() * 100),
      email,
      passwordHash: null, // OAuth-only account — no password login
      totalXp: 0,
      cScore: 0,
      globalRank: null,
      countryRank: null,
      streak: 0,
      createdAt: new Date().toISOString()
    };
    await store.createUser(user);
    await seedNewAccountData(user.id);
  }
  return user;
}

/* ------------------------------- GitHub -------------------------------- */
router.get("/github", (req, res) => {
  if (!process.env.GITHUB_OAUTH_CLIENT_ID) {
    return res.status(500).send("GitHub sign-in isn't configured yet. Add GITHUB_OAUTH_CLIENT_ID / SECRET as environment variables.");
  }
  const redirectUri = process.env.GITHUB_OAUTH_CALLBACK_URL || "http://localhost:3000/api/auth/github/callback";
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_OAUTH_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user user:email`;
  res.redirect(url);
});

router.get("/github/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const redirectUri = process.env.GITHUB_OAUTH_CALLBACK_URL || "http://localhost:3000/api/auth/github/callback";

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
        client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error(tokenData.error_description || "GitHub did not return an access token");

    const ghHeaders = { Authorization: `Bearer ${tokenData.access_token}`, "User-Agent": "codoverse-app" };
    const profile = await fetch("https://api.github.com/user", { headers: ghHeaders }).then((r) => r.json());
    let email = profile.email;
    if (!email) {
      const emails = await fetch("https://api.github.com/user/emails", { headers: ghHeaders }).then((r) => r.json());
      email = Array.isArray(emails) ? (emails.find((e) => e.primary)?.email || emails[0]?.email) : null;
    }
    if (!email) throw new Error("Could not get an email address from your GitHub account. Make sure your email is public or verified.");

    const user = await findOrCreateUser({ email, name: profile.name || profile.login });

    // Auto-fill their GitHub username as a connected platform if not set yet.
    const platforms = await store.getBlob(user.id, "platforms", {});
    if (!platforms.github) {
      await store.setBlob(user.id, "platforms", { ...platforms, github: profile.login });
    }

    const jwtToken = makeToken(user.id);
    res.redirect(`${frontendUrl()}/oauth/callback?token=${jwtToken}`);
  } catch (err) {
    console.error("GitHub OAuth failed:", err);
    res.redirect(`${frontendUrl()}/login?error=${encodeURIComponent(err.message)}`);
  }
});

/* ------------------------------- Google -------------------------------- */
router.get("/google", (req, res) => {
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID) {
    return res.status(500).send("Google sign-in isn't configured yet. Add GOOGLE_OAUTH_CLIENT_ID / SECRET as environment variables.");
  }
  const redirectUri = process.env.GOOGLE_OAUTH_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback";
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account"
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const redirectUri = process.env.GOOGLE_OAUTH_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback";

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error(tokenData.error_description || "Google did not return an access token");

    const profile = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    }).then((r) => r.json());

    if (!profile.email) throw new Error("Could not get an email address from your Google account");

    const user = await findOrCreateUser({ email: profile.email, name: profile.name });
    const jwtToken = makeToken(user.id);
    res.redirect(`${frontendUrl()}/oauth/callback?token=${jwtToken}`);
  } catch (err) {
    console.error("Google OAuth failed:", err);
    res.redirect(`${frontendUrl()}/login?error=${encodeURIComponent(err.message)}`);
  }
});

export default router;
