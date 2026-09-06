import { Router } from "express";
import { nanoid } from "nanoid";
import * as store from "../lib/store.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const notes = await store.listNotes(req.userId);
  res.json({ notes });
});

router.post("/", requireAuth, async (req, res) => {
  const { title, content } = req.body || {};
  if (!title) return res.status(400).json({ error: "Title is required" });
  const note = {
    id: nanoid(),
    userId: req.userId,
    title,
    content: content || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await store.createNote(note);
  res.status(201).json({ note });
});

router.put("/:id", requireAuth, async (req, res) => {
  const { title, content } = req.body || {};
  const note = await store.updateNote(req.params.id, req.userId, { title, content });
  if (!note) return res.status(404).json({ error: "Note not found" });
  res.json({ note });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const ok = await store.deleteNote(req.params.id, req.userId);
  if (!ok) return res.status(404).json({ error: "Note not found" });
  res.json({ ok: true });
});

export default router;
