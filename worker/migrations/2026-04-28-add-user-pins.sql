-- Account-backed pinned courses/modules for GradStudio Learn
CREATE TABLE IF NOT EXISTS user_pins (
  user_id TEXT NOT NULL,
  item_key TEXT NOT NULL,
  type TEXT NOT NULL,
  course_id TEXT NOT NULL,
  lesson_index INTEGER DEFAULT 0,
  title TEXT,
  meta TEXT,
  saved_at INTEGER,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_user_pins_user ON user_pins(user_id);
