import db from "./db.js";

const limit = 10;
const windowMs = 60 * 1000; // 1 minute
const keepMs = 24 * 3600 * 1000; // 1 day

db.exec(`
  CREATE TABLE IF NOT EXISTS api_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL,
    barcode TEXT,
    status INTEGER
  ); 
  CREATE INDEX IF NOT EXISTS idx_api_requests_ts ON api_requests(ts);`);

const acquire = db.transaction((barcode: string) => {
  const now = Date.now();
  const { n, oldest } = db
    .prepare("SELECT COUNT(*) AS n, MIN(ts) AS oldest FROM api_requests WHERE ts > ?")
    .get(now - windowMs) as { n: number; oldest: number | null };

  if (n >= limit) {
    return { okay: false as const, retryAfterMs: (oldest ?? now) + windowMs - now };
  }

  const info = db.prepare("INSERT INTO api_requests (ts,barcode) VALUES (?,?)").run(now, barcode);
  return { okay: true as const, id: info.lastInsertRowid as number };
});

export type ApiResults = { okay: true; response: Response } | { okay: false; retryAfterMs: number };

export async function apiFetch(barcode: string): Promise<ApiResults> {
  const slot = acquire(barcode);
  if (!slot.okay) {
    return slot;
  }

  const res = await fetch(`https://world.openfoodfacts.org/api/v3/product/${barcode}`);
  db.prepare("UPDATE api_requests SET status=? WHERE id=?").run(res.status, slot.id);
  return { okay: true, response: res };
}

export function apiUsage() {
  const now = Date.now();
  const lastMinute = db
    .prepare("SELECT COUNT(*) AS n FROM api_requests WHERE ts > ?")
    .get(now - windowMs) as { n: number };
  const lastHour = db
    .prepare("SELECT COUNT(*) AS n FROM api_requests WHERE ts > ?")
    .get(now - 3600 * 1000) as { n: number };
  const errors = db
    .prepare(
      "SELECT COUNT(*) AS n FROM api_requests WHERE status >= 400 AND status !=404 AND ts > ?",
    )
    .get(now - 3600_000) as { n: number };
  return { limit: limit, lastMinute: lastMinute.n, lastHour: lastHour.n, errors: errors.n };
}

setInterval(() => {
  db.prepare("DELETE FROM api_requests WHERE ts < ?").run(Date.now() - keepMs);
}, 3600 * 1000).unref();
