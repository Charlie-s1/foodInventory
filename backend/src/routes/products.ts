import type { FastifyInstance } from "fastify";
import db from "../db.js";
import { apiFetch, apiUsage } from "../apiLimiter.js";

db.exec(`
  CREATE TABLE IF NOT EXISTS product_cache (
    barcode TEXT PRIMARY KEY,
    found INTEGER NOT NULL,
    data TEXT,
    fetched_at INTEGER NOT NULL
  );
`);

const FOUND_TTL = 30 * 24 * 3600_000; // 30 days
const MISS_TTL = 24 * 3600_000; // 1 day
const BACKOFF_MS = 5 * 60_000; // pause after an unexpected response

type CacheRow = { found: number; data: string | null; fetched_at: number };
let backoffUntil = 0;

const getCache = db.prepare("SELECT found, data, fetched_at FROM product_cache WHERE barcode = ?");
const putCache = db.prepare(
  "INSERT OR REPLACE INTO product_cache (barcode, found, data, fetched_at) VALUES (?, ?, ?, ?)",
);

function staleOrBusy(row: CacheRow | undefined, retryAfterMs: number) {
  if (row?.found && row.data) {
    return { found: true, product: JSON.parse(row.data), cached: true, stale: true };
  }
  return { rateLimited: true as const, retryAfterMs };
}

async function lookup(barcode: string) {
  const row = getCache.get(barcode) as CacheRow | undefined;

  // 1. Fresh cache: no API call
  if (row && Date.now() - row.fetched_at < (row.found ? FOUND_TTL : MISS_TTL)) {
    return { found: !!row.found, product: row.data ? JSON.parse(row.data) : null, cached: true };
  }

  // 2. Paused after a bad response
  if (Date.now() < backoffUntil) return staleOrBusy(row, backoffUntil - Date.now());

  // 3. Rate limiter + the actual call to Open Food Facts
  let result;
  try {
    result = await apiFetch(barcode);
  } catch {
    return staleOrBusy(row, 10_000); // network error or timeout: don't cache
  }
  if (!result.okay) return staleOrBusy(row, result.retryAfterMs);

  const res = result.response;

  if (res.status === 404) {
    putCache.run(barcode, 0, null, Date.now());
    return { found: false, product: null, cached: false };
  }
  if (!res.ok) {
    backoffUntil = Date.now() + BACKOFF_MS;
    return staleOrBusy(row, BACKOFF_MS);
  }

  const json = (await res.json()) as {
    status?: string | number;
    product?: Record<string, unknown>;
  };
  const found = json.status !== "failure" && !!json.product;
  putCache.run(barcode, found ? 1 : 0, found ? JSON.stringify(json.product) : null, Date.now());
  return { found, product: found ? json.product! : null, cached: false };
}

const inflight = new Map<string, ReturnType<typeof lookup>>();

export async function productRoutes(app: FastifyInstance) {
  app.get<{ Params: { barcode: string } }>("/products/:barcode", async (req, reply) => {
    const { barcode } = req.params;
    if (!/^\d{8,14}$/.test(barcode)) {
      return reply.code(400).send({ error: "Invalid barcode" });
    }

    // Two simultaneous scans of the same barcode share one lookup
    let p = inflight.get(barcode);
    if (!p) {
      p = lookup(barcode).finally(() => inflight.delete(barcode));
      inflight.set(barcode, p);
    }
    const result = await p;

    if ("rateLimited" in result && result.retryAfterMs) {
      const secs = Math.max(1, Math.ceil(result.retryAfterMs / 1000));
      return reply
        .code(429)
        .header("Retry-After", String(secs))
        .send({ error: "Lookup busy, try again shortly", retryAfterSeconds: secs });
    }
    return result;
  });

  app.get("/products-usage", async () => apiUsage());
}
