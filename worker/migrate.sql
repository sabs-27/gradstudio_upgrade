
CREATE TABLE IF NOT EXISTS courses_new (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    icon_class TEXT,
    category TEXT DEFAULT 'skill',
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    type TEXT DEFAULT 'course',
    parent_course_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO courses_new (id, title, icon_class, category, display_order, is_active, created_at, updated_at)
SELECT id, title, icon_class, category, display_order, is_active, created_at, updated_at
FROM courses;

DROP TABLE courses;

ALTER TABLE courses_new RENAME TO courses;
