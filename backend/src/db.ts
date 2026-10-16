import Database from "better-sqlite3";
import { mkdirSync, readdirSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const dbPath = process.env.DB_PATH || "./data/database.db";
mkdirSync(dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const dir = join(dirname(fileURLToPath(import.meta.url)), "migrations");
const files = readdirSync(dir)
  .filter((f) => /^\d+.*\.sql$/.test(f))
  .sort();
const current = db.pragma("user_version", { simple: true }) as number;

for (const file of files) {
  const version = parseInt(file, 10);
  if (version <= current) continue;
  db.transaction(() => {
    db.exec(readFileSync(join(dir, file), "utf8"));
    db.pragma(`user_version = ${version}`);
  })();
  console.log(`Applied migration ${file}`);
}

export default db;
