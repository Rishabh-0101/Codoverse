import { Router } from "express";
import * as store from "../lib/store.js";
import { requireAuth } from "../middleware/auth.js";
import { catalog } from "../lib/catalog.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const progress = await store.getBlob(req.userId, "sheetsProgress", {});
  const sheets = catalog.sheetCatalog.map((s) => {
    const problems = s.problems.map((p) => ({ ...p, solved: !!progress[p.id] }));
    const solvedInList = problems.filter((p) => p.solved).length;
    return {
      id: s.id,
      name: s.name,
      subtitle: s.subtitle,
      tag: s.tag,
      total: s.total,
      sourceUrl: s.sourceUrl,
      problems,
      solvedInList,
      listedCount: problems.length
    };
  });
  res.json({ sheets });
});

router.put("/:sheetId/:problemId/toggle", requireAuth, async (req, res) => {
  const sheet = catalog.sheetCatalog.find((s) => s.id === req.params.sheetId);
  const problem = sheet?.problems.find((p) => p.id === req.params.problemId);
  if (!sheet || !problem) return res.status(404).json({ error: "Problem not found" });

  const progress = await store.getBlob(req.userId, "sheetsProgress", {});
  const current = !!progress[problem.id];
  progress[problem.id] = !current;
  await store.setBlob(req.userId, "sheetsProgress", progress);

  if (!current) {
    const achievements = await store.getBlob(req.userId, "achievements", []);
    const ach = achievements.find((a) => a.id === "sheet-starter");
    if (ach) {
      ach.unlocked = true;
      await store.setBlob(req.userId, "achievements", achievements);
    }
  }

  res.json({ problemId: problem.id, solved: !current });
});

export default router;
