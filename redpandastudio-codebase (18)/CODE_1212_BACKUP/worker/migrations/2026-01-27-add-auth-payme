-- Additive migration for auth, payments, access control, and engagement
-- Safe to run on existing dev DB

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- USER ACCESS (lifetime)
CREATE TABLE IF NOT EXISTS user_access (
    user_id TEXT PRIMARY KEY,
    has_full_access BOOLEAN DEFAULT 0,
    unlocked_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL DEFAULT 99,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL,
    provider TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- CONTENT LOCKING
ALTER TABLE simulations ADD COLUMN is_locked BOOLEAN DEFAULT 1;

-- ENGAGEMENT: VIEWS
CREATE TABLE IF NOT EXISTS simulation_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulation_id TEXT NOT NULL,
    user_id TEXT,
    viewed_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE (simulation_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_simulation_views_sim ON simulation_views(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_views_user ON simulation_views(user_id);

-- ENGAGEMENT: LIKES
CREATE TABLE IF NOT EXISTS simulation_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (simulation_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_simulation_likes_sim ON simulation_likes(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_likes_user ON simulation_likes(user_id);

-- COMMENTS: link to users (nullable)
ALTER TABLE comments ADD COLUMN user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
