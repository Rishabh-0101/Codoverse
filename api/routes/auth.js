import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import * as store from "../lib/store.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function makeToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "dev_secret_change_me", { expiresIn: "30d" });
}

function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    handle: u.handle,
    email: u.email,
    avatarInitials: u.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase(),
    totalXp: u.totalXp,
    cScore: u.cScore,
    globalRank: u.globalRank,
    countryRank: u.countryRank,
    streak: u.streak,
    createdAt: u.createdAt
  };
}

const DEFAULT_ACHIEVEMENTS = [
  { id: "first-steps", name: "First Steps", desc: "Created your Codoverse account", unlocked: true },
  { id: "streak-3", name: "3 Day Streak", desc: "Solve a problem 3 days in a row", unlocked: false },
  { id: "sheet-starter", name: "Sheet Starter", desc: "Start your first DSA sheet", unlocked: false },
  { id: "repo-scanner", name: "Repo Scanner", desc: "Run the AI repo analyzer once", unlocked: false }
];

export async function seedNewAccountData(userId) {
  await store.setBlob(userId, "platforms", { github: "", leetcode: "", codechef: "", codeforces: "" });
  await store.setBlob(userId, "settings", { pushNotifications: true, weeklyDigest: true, publicProfile: true });
  await store.setBlob(userId, "achievements", DEFAULT_ACHIEVEMENTS);
}

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, handle } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }
    const exists = await store.findUserByEmail(email);
    if (exists) return res.status(409).json({ error: "An account with this email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: nanoid(),
      name,
      handle: handle || name.toLowerCase().replace(/\s+/g, "").slice(0, 16) + Math.floor(Math.random() * 100),
      email,
      passwordHash,
      totalXp: 0,
      cScore: 0,
      globalRank: null,
      countryRank: null,
      streak: 0,
      createdAt: new Date().toISOString()
    };
    await store.createUser(user);
    await seedNewAccountData(user.id);

    const token = makeToken(user.id);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("signup failed:", err);
    res.status(500).json({ error: "Could not create account. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const user = await store.findUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    if (!user.passwordHash) {
      return res.status(401).json({ error: "This account was created with GitHub/Google sign-in. Use that button instead." });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });

    const token = makeToken(user.id);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("login failed:", err);
    res.status(500).json({ error: "Could not log in right now. Please try again." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await store.getUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: publicUser(user) });
});

export default router;
export { publicUser, makeToken };
