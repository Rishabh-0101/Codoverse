import { Router } from "express";
import nodemailer from "nodemailer";
import * as store from "../lib/store.js";
import { requireAuth } from "../middleware/auth.js";
import { catalog } from "../lib/catalog.js";

const router = Router();

router.get("/settings", requireAuth, async (req, res) => {
  const settings = await store.getBlob(req.userId, "settings", {});
  res.json({ settings });
});

router.put("/settings", requireAuth, async (req, res) => {
  const existing = await store.getBlob(req.userId, "settings", {});
  const updated = { ...existing, ...req.body };
  await store.setBlob(req.userId, "settings", updated);
  res.json({ settings: updated });
});

router.get("/help/faqs", requireAuth, async (req, res) => {
  res.json({ faqs: catalog.helpFaqs });
});

function getMailer() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

router.post("/help/feedback", requireAuth, async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: "Message is required" });
  const user = await store.getUserById(req.userId);

  await store.addFeedback({
    id: Date.now().toString(),
    userId: req.userId,
    message,
    createdAt: new Date().toISOString()
  });

  const to = process.env.FEEDBACK_EMAIL_TO;
  const mailer = getMailer();
  let emailed = false;
  if (mailer && to) {
    try {
      await mailer.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject: `Codoverse feedback from ${user?.name || "a user"}`,
        text: `From: ${user?.name} <${user?.email}>\n\n${message}`
      });
      emailed = true;
    } catch (err) {
      console.error("Feedback email failed:", err.message);
    }
  }

  res.json({ ok: true, emailed });
});

router.get("/export", requireAuth, async (req, res) => {
  const user = await store.getUserById(req.userId);
  const [platforms, notes, sheetsProgress, companyProgress, settings, achievements, platformStats] = await Promise.all([
    store.getBlob(req.userId, "platforms", {}),
    store.listNotes(req.userId),
    store.getBlob(req.userId, "sheetsProgress", {}),
    store.getBlob(req.userId, "companyProgress", {}),
    store.getBlob(req.userId, "settings", {}),
    store.getBlob(req.userId, "achievements", []),
    store.getBlob(req.userId, "platformStats", null)
  ]);

  const payload = {
    profile: user ? { name: user.name, handle: user.handle, email: user.email, createdAt: user.createdAt } : null,
    platforms,
    notes,
    sheetsProgress,
    companyProgress,
    settings,
    achievements,
    platformStats
  };

  if (req.query.download === "true") {
    res.setHeader("Content-Disposition", "attachment; filename=codoverse-data.json");
  }
  res.json(payload);
});

router.delete("/", requireAuth, async (req, res) => {
  await store.wipeUserData(req.userId);
  res.json({ ok: true });
});

export default router;
