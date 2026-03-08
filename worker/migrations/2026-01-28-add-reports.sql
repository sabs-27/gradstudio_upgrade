-- Add reports to statistics
ALTER TABLE statistics ADD COLUMN reports INTEGER DEFAULT 0;

-- Track per-user reports
CREATE TABLE IF NOT EXISTS simulation_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (simulation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_simulation_reports_sim ON simulation_reports(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_reports_user ON simulation_reports(user_id);
