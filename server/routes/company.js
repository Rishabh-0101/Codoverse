import { Router } from "express";
import * as store from "../lib/store.js";
import { requireAuth } from "../middleware/auth.js";
import { getCompanyProblems, listCompanies, COMPANY_LABELS } from "../lib/companyData.js";

const router = Router();

// Lightweight summary for the tab bar: real total question counts per
// company (however many exist in the live dataset — no cap), plus how
// many the user has personally marked solved so far.
router.get("/", requireAuth, async (req, res) => {
  const progress = await store.getBlob(req.userId, "companyProgress", {});
  const result = {};
  for (const companyId of listCompanies()) {
    let total = 0;
    try {
      total = (await getCompanyProblems(companyId)).length;
    } catch (err) {
      console.error(`company summary fetch failed for ${companyId}:`, err.message);
    }
    const solved = Object.keys(progress).filter(
      (key) => key.startsWith(`${companyId}:`) && progress[key]
    ).length;
    result[companyId] = { label: COMPANY_LABELS[companyId], total, solved };
  }
  res.json({ companies: result });
});

// Full, unlimited real question list for one company, fetched fresh from
// the live dataset (only capped by however many real questions exist).
router.get("/:companyId", requireAuth, async (req, res) => {
  const { companyId } = req.params;
  if (!listCompanies().includes(companyId)) {
    return res.status(404).json({ error: "Unknown company" });
  }
  try {
    const progress = await store.getBlob(req.userId, "companyProgress", {});
    const problems = await getCompanyProblems(companyId);
    const withProgress = problems.map((p) => ({
      ...p,
      problemId: `${companyId}:${p.id}`,
      solved: !!progress[`${companyId}:${p.id}`]
    }));
    res.json({ company: companyId, label: COMPANY_LABELS[companyId], problems: withProgress });
  } catch (err) {
    console.error("company problems fetch failed:", err.message);
    res.status(502).json({ error: "Could not load real question data right now. Try again shortly." });
  }
});

router.put("/:problemId/toggle", requireAuth, async (req, res) => {
  const progress = await store.getBlob(req.userId, "companyProgress", {});
  const current = !!progress[req.params.problemId];
  progress[req.params.problemId] = !current;
  await store.setBlob(req.userId, "companyProgress", progress);
  res.json({ problemId: req.params.problemId, solved: !current });
});

export default router;
