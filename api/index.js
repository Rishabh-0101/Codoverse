// Must be imported before any routes are defined. Patches Express so that
// a rejected promise inside an `async (req, res) => {...}` handler is
// forwarded to the error-handling middleware below (clean JSON 500)
// instead of hanging the request forever — Express 4 does not do this
// automatically, and this exact gap was caught in testing.
import "express-async-errors";
import express from "express";
import cors from "cors";

import authRoutes from "../server/routes/auth.js";
import oauthRoutes from "../server/routes/oauth.js";
import profileRoutes from "../server/routes/profile.js";
import platformsRoutes from "../server/routes/platforms.js";
import notesRoutes from "../server/routes/notes.js";
import sheetsRoutes from "../server/routes/sheets.js";
import companyRoutes from "../server/routes/company.js";
import discoverRoutes from "../server/routes/discover.js";
import contestHistoryRoutes from "../server/routes/contestHistory.js";
import accountRoutes from "../server/routes/account.js";
import analyzeRoutes from "../server/routes/analyze.js";
import syncRoutes from "../server/routes/sync.js";
import publicRoutes from "../server/routes/public.js";
import compareRoutes from "../server/routes/compare.js";

// Without these, a single unexpected error anywhere (e.g. a network hiccup
// talking to GitHub/LeetCode/Codeforces/CodeChef during sync) can crash the
// whole function instance instead of just failing that one request.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection (server stays up):", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception (server stays up):", err);
});

const app = express();
app.use(cors());
app.use(express.json());

app.get(["/api/health", "/health"], (req, res) => res.json({ ok: true, name: "Codoverse API" }));

app.use(["/api/auth", "/auth"], authRoutes);
app.use(["/api/auth", "/auth"], oauthRoutes);
app.use(["/api/profile", "/profile"], profileRoutes);
app.use(["/api/platforms", "/platforms"], platformsRoutes);
app.use(["/api/notes", "/notes"], notesRoutes);
app.use(["/api/sheets", "/sheets"], sheetsRoutes);
app.use(["/api/company-kit", "/company-kit"], companyRoutes);
app.use(["/api/discover", "/discover"], discoverRoutes);
app.use(["/api/contest-history", "/contest-history"], contestHistoryRoutes);
app.use(["/api/account", "/account"], accountRoutes);
app.use(["/api/analyze-repo", "/analyze-repo"], analyzeRoutes);
app.use(["/api/sync", "/sync"], syncRoutes);
app.use(["/api/public", "/public"], publicRoutes);
app.use(["/api/compare", "/compare"], compareRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server" });
});

// Vercel calls this file's default export directly as the request handler
// for every /api/* path (see vercel.json rewrites) — Express's own router
// then does the real routing based on req.url, exactly like it would on a
// normal server.
export default app;
