-- Add dislikes to statistics
ALTER TABLE statistics ADD COLUMN dislikes INTEGER DEFAULT 0;

-- Track per-user dislikes
CREATE TABLE IF NOT EXISTS simulation_dislikes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (simulation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_simulation_dislikes_sim ON simulation_dislikes(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_dislikes_user ON simulation_dislikes(user_id);
