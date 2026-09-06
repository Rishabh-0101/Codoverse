// Only for running the API locally on your own machine (`npm run dev:api`).
// On Vercel, api/index.js is used directly as a serverless function and
// this file is never executed (Vercel injects real env vars natively,
// so dotenv is never needed there).
import dotenv from "dotenv";
dotenv.config();

// IMPORTANT: this must be a dynamic import, done AFTER dotenv.config().
// A normal top-level `import app from "./api/index.js"` gets hoisted by
// the JS engine and would load api/index.js (and everything it imports,
// including the database module) BEFORE dotenv.config() above ever runs —
// so process.env.POSTGRES_URL would still be empty at that point no
// matter what's in .env. This was a real bug, found by testing.
const { default: app } = await import("./api/index.js");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Codoverse API running locally on http://localhost:${PORT}`));
