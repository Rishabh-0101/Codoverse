import pg from "pg";

const { Pool } = pg;

// Resolved lazily (inside getPool(), not here at module-load time).
// Reading process.env at the top of a module is fragile: ES module
// imports are hoisted and evaluated before the importing file's own
// code runs, so a `dotenv.config()` call elsewhere can easily execute
// AFTER this module has already been loaded — leaving these vars
// looking empty even though .env has them. This exact bug was found
// by testing and cost real debugging time, so it's fixed at the root
// instead of just working around it in server.js.
function getConnectionString() {
  return (
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL
  );
}

// Reused across warm serverless invocations instead of opening a fresh
// connection per request. Kept small on purpose — serverless functions
// scale by running many instances, not by holding many connections each.
let pool;
function getPool() {
  if (!pool) {
    const connectionString = getConnectionString();
    if (!connectionString) {
      console.error(
        "No database connection string found. Set POSTGRES_URL (or DATABASE_URL) in your environment — " +
        "see .env.example and the deploy instructions."
      );
    }
    pool = new Pool({
      connectionString,
      max: 3,
      ssl: connectionString && !connectionString.includes("localhost")
        ? { rejectUnauthorized: false }
        : undefined
    });
    // Idle-client errors (a pooled connection dropping in the background,
    // e.g. a provider's connection pooler recycling it) are normal and
    // transient — log and move on instead of letting them become an
    // uncaught exception.
    pool.on("error", (err) => {
      console.error("Postgres pool idle-client error (harmless, will reconnect on next query):", err.message);
    });
  }
  return pool;
}

export async function query(text, params) {
  return getPool().query(text, params);
}

// Runs once per cold start (cached on the module) and is safe to call on
// every request — CREATE TABLE IF NOT EXISTS is a no-op once the schema
// already exists.
let schemaReady;
export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        handle TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        total_xp DOUBLE PRECISION DEFAULT 0,
        c_score DOUBLE PRECISION DEFAULT 0,
        global_rank INTEGER,
        country_rank INTEGER,
        streak INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      -- Per-user JSON blobs: platforms, settings, achievements,
      -- sheetsProgress, companyProgress, platformStats, lastRepoAnalysis.
      -- Keeping these as JSONB (instead of a table per feature) lets us
      -- keep every route's existing data shape unchanged while still
      -- being a real, durable, queryable Postgres store.
      CREATE TABLE IF NOT EXISTS user_blobs (
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        key TEXT NOT NULL,
        value JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ DEFAULT now(),
        PRIMARY KEY (user_id, key)
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
  }
  return schemaReady;
}

function rowToUser(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    handle: r.handle,
    email: r.email,
    passwordHash: r.password_hash,
    totalXp: Number(r.total_xp) || 0,
    cScore: Number(r.c_score) || 0,
    globalRank: r.global_rank,
    countryRank: r.country_rank,
    streak: r.streak || 0,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
  };
}

/* --------------------------------- users --------------------------------- */

export async function findUserByEmail(email) {
  await ensureSchema();
  const r = await query("SELECT * FROM users WHERE lower(email) = lower($1)", [email]);
  return rowToUser(r.rows[0]);
}

export async function findUserByHandle(handle) {
  await ensureSchema();
  const r = await query("SELECT * FROM users WHERE lower(handle) = lower($1)", [handle]);
  return rowToUser(r.rows[0]);
}

export async function getUserById(id) {
  await ensureSchema();
  const r = await query("SELECT * FROM users WHERE id = $1", [id]);
  return rowToUser(r.rows[0]);
}

export async function createUser(user) {
  await ensureSchema();
  await query(
    `INSERT INTO users (id, name, handle, email, password_hash, total_xp, c_score, global_rank, country_rank, streak, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      user.id,
      user.name,
      user.handle,
      user.email,
      user.passwordHash || null,
      user.totalXp || 0,
      user.cScore || 0,
      user.globalRank || null,
      user.countryRank || null,
      user.streak || 0,
      user.createdAt || new Date().toISOString()
    ]
  );
  return user;
}

export async function updateUser(id, patch) {
  await ensureSchema();
  const fields = {
    name: "name",
    handle: "handle",
    totalXp: "total_xp",
    cScore: "c_score",
    globalRank: "global_rank",
    countryRank: "country_rank",
    streak: "streak"
  };
  const sets = [];
  const values = [];
  let i = 1;
  for (const [jsKey, col] of Object.entries(fields)) {
    if (patch[jsKey] !== undefined) {
      sets.push(`${col} = $${i}`);
      values.push(patch[jsKey]);
      i++;
    }
  }
  if (sets.length === 0) return getUserById(id);
  values.push(id);
  await query(`UPDATE users SET ${sets.join(", ")} WHERE id = $${i}`, values);
  return getUserById(id);
}

export async function deleteUser(id) {
  await ensureSchema();
  await query("DELETE FROM users WHERE id = $1", [id]);
}

// Used for the leaderboard and for re-ranking everyone by cScore after a sync.
export async function listAllUsers() {
  await ensureSchema();
  const r = await query("SELECT * FROM users");
  return r.rows.map(rowToUser);
}

/* ------------------------------ user blobs ------------------------------- */
// Generic per-user JSON storage: getBlob(userId, "platforms", {}) etc.

export async function getBlob(userId, key, fallback = {}) {
  await ensureSchema();
  const r = await query("SELECT value FROM user_blobs WHERE user_id = $1 AND key = $2", [userId, key]);
  return r.rows[0] ? r.rows[0].value : fallback;
}

export async function setBlob(userId, key, value) {
  await ensureSchema();
  await query(
    `INSERT INTO user_blobs (user_id, key, value, updated_at)
     VALUES ($1,$2,$3, now())
     ON CONFLICT (user_id, key) DO UPDATE SET value = $3, updated_at = now()`,
    [userId, key, JSON.stringify(value)]
  );
  return value;
}

/* --------------------------------- notes --------------------------------- */

export async function listNotes(userId) {
  await ensureSchema();
  const r = await query("SELECT * FROM notes WHERE user_id = $1 ORDER BY updated_at DESC", [userId]);
  return r.rows.map((n) => ({
    id: n.id,
    userId: n.user_id,
    title: n.title,
    content: n.content,
    createdAt: n.created_at instanceof Date ? n.created_at.toISOString() : n.created_at,
    updatedAt: n.updated_at instanceof Date ? n.updated_at.toISOString() : n.updated_at
  }));
}

export async function createNote(note) {
  await ensureSchema();
  await query(
    "INSERT INTO notes (id, user_id, title, content, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6)",
    [note.id, note.userId, note.title, note.content || "", note.createdAt, note.updatedAt]
  );
  return note;
}

export async function updateNote(id, userId, patch) {
  await ensureSchema();
  const r = await query("SELECT * FROM notes WHERE id = $1 AND user_id = $2", [id, userId]);
  if (!r.rows[0]) return null;
  const title = patch.title !== undefined ? patch.title : r.rows[0].title;
  const content = patch.content !== undefined ? patch.content : r.rows[0].content;
  const updatedAt = new Date().toISOString();
  await query("UPDATE notes SET title = $1, content = $2, updated_at = $3 WHERE id = $4", [
    title,
    content,
    updatedAt,
    id
  ]);
  return { id, userId, title, content, createdAt: r.rows[0].created_at, updatedAt };
}

export async function deleteNote(id, userId) {
  await ensureSchema();
  const r = await query("DELETE FROM notes WHERE id = $1 AND user_id = $2", [id, userId]);
  return r.rowCount > 0;
}

/* -------------------------------- feedback -------------------------------- */

export async function addFeedback(entry) {
  await ensureSchema();
  await query("INSERT INTO feedback (id, user_id, message, created_at) VALUES ($1,$2,$3,$4)", [
    entry.id,
    entry.userId,
    entry.message,
    entry.createdAt
  ]);
  return entry;
}

/* --------------------------- account deletion ----------------------------- */

export async function wipeUserData(userId) {
  await ensureSchema();
  // notes/feedback/user_blobs all cascade-delete via the foreign key when
  // the user row itself is deleted.
  await deleteUser(userId);
}
