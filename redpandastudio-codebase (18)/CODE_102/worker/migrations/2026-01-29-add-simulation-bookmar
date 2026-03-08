-- Per-user bookmarks for simulations
CREATE TABLE IF NOT EXISTS simulation_bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  simulation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (simulation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_simulation_bookmarks_sim ON simulation_bookmarks(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_bookmarks_user ON simulation_bookmarks(user_id);
