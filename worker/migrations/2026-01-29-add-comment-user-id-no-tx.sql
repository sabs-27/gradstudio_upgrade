-- Add user_id to comments with FK to users, preserving existing data
PRAGMA foreign_keys=OFF;

CREATE TABLE comments_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  simulation_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  text TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  user_id TEXT,
  FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO comments_new (id, simulation_id, author_name, text, upvotes, created_at, user_id)
SELECT id, simulation_id, author_name, text, upvotes, created_at, NULL
FROM comments;

DROP TABLE comments;
ALTER TABLE comments_new RENAME TO comments;

CREATE INDEX idx_comments_simulation ON comments(simulation_id);
CREATE INDEX idx_comments_user ON comments(user_id);

PRAGMA foreign_keys=ON;
