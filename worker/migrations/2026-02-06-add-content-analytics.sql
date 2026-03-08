-- Content Analytics Tables

-- 1. Content Views (Granular tracking)
CREATE TABLE IF NOT EXISTS content_views (
    id TEXT PRIMARY KEY,
    sim_id TEXT NOT NULL,
    user_id TEXT, -- Nullable for anonymous
    ip TEXT,
    device_type TEXT, -- desktop, mobile, tablet
    browser TEXT,
    referrer TEXT,
    duration_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (sim_id) REFERENCES simulations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_views_sim ON content_views(sim_id);
CREATE INDEX IF NOT EXISTS idx_content_views_date ON content_views(created_at);
CREATE INDEX IF NOT EXISTS idx_content_views_user ON content_views(user_id);

-- 2. Content Shares
CREATE TABLE IF NOT EXISTS content_shares (
    id TEXT PRIMARY KEY,
    sim_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    platform TEXT, -- 'link', 'twitter', 'whatsapp', 'email', etc.
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (sim_id) REFERENCES simulations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_shares_sim ON content_shares(sim_id);

-- 3. Content Reports (Detailed)
-- We previously had a simple simulation_reports table in 2026-01-28-add-reports.sql
-- We will Use a new table 'content_reports' for the detailed report system requested.
-- The old table (simulation_reports) was just id, sim_id, user_id (simple unique constraint).
-- The new requirement asks for reason, description, status, resolution.

CREATE TABLE IF NOT EXISTS content_reports (
    id TEXT PRIMARY KEY,
    sim_id TEXT NOT NULL,
    reported_by TEXT NOT NULL, -- user_id
    reason TEXT NOT NULL, -- inappropriate, misleading, broken, other
    description TEXT,
    status TEXT DEFAULT 'pending', -- pending, resolved, dismissed
    resolved_by TEXT, -- admin user_id
    resolution_action TEXT, -- dismiss, remove_content, warn_user
    resolution_note TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT,
    FOREIGN KEY (sim_id) REFERENCES simulations(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_sim ON content_reports(sim_id);
