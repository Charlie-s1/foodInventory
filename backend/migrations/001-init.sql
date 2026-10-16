CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

CREATE TABLE households (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
ALTER TABLE households ADD COLUMN is_dev BOOLEAN DEFAULT 0;
INSERT INTO households (name, created_at, is_dev) 
VALUES ('Dev Household', unixepoch() * 1000, 1);

CREATE TABLE household_members (
  household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  PRIMARY KEY (household_id, user_id)
);
CREATE INDEX idx_members_user ON household_members(user_id);

CREATE TABLE locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  parent_id INTEGER,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (id, household_id)
  FOREIGN KEY (parent_id, household_id) REFERENCES locations(id, household_id)
);
CREATE UNIQUE INDEX idx_locations_sibling_name ON locations(household_id, COALESCE(parent_id, 0), name);
CREATE INDEX idx_locations_parent ON locations(parent_id);

-- Global cache of Open Food Facts data, shared by every household
CREATE TABLE products (
  barcode TEXT PRIMARY KEY,
  found INTEGER NOT NULL,
  data TEXT,
  fetched_at INTEGER NOT NULL
);

CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  location_id INTEGER,
  barcode TEXT,
  name TEXT,
  brand TEXT,
  icon TEXT,
  quantity REAL NOT NULL DEFAULT 1,
  unit TEXT,
  category TEXT,
  expires_at INTEGER,
  added_at INTEGER NOT NULL,
  added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  CHECK (barcode IS NOT NULL OR name IS NOT NULL),
  FOREIGN KEY (location_id, household_id) REFERENCES locations(id, household_id)
);
CREATE INDEX idx_items_household ON items(household_id);
CREATE INDEX idx_items_expiry ON items(household_id, expires_at);

-- Log of outgoing Open Food Facts calls, used by the rate limiter
CREATE TABLE api_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  barcode TEXT,
  status INTEGER
);
CREATE INDEX idx_api_requests_ts ON api_requests(ts);