ALTER TABLE courses ADD COLUMN parent_course_id TEXT DEFAULT NULL;
UPDATE courses SET parent_course_id = 'java1' WHERE id = 'java-2' AND (parent_course_id IS NULL OR parent_course_id = '');
UPDATE courses SET parent_course_id = 'linux' WHERE id = 'linux-2' AND (parent_course_id IS NULL OR parent_course_id = '');

CREATE TABLE IF NOT EXISTS carousel_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    icon_class TEXT,
    color_hex TEXT DEFAULT '#3b82f6',
    target_type TEXT,
    target_id TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    content_type TEXT DEFAULT 'standard',
    image_url TEXT,
    iframe_url TEXT,
    content_html TEXT,
    width TEXT DEFAULT '300px',
    full_bleed INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS carousels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    header TEXT,
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO carousels (id, name, header, display_order) VALUES (1, 'Carousel 1', 'Free Interactive Demos', 1);
INSERT OR IGNORE INTO carousels (id, name, header, display_order) VALUES (2, 'Carousel 2', 'Apple Style Carousel', 2);

ALTER TABLE carousel_cards ADD COLUMN content_type TEXT DEFAULT 'standard';
ALTER TABLE carousel_cards ADD COLUMN image_url TEXT;
ALTER TABLE carousel_cards ADD COLUMN iframe_url TEXT;
ALTER TABLE carousel_cards ADD COLUMN content_html TEXT;
ALTER TABLE carousel_cards ADD COLUMN width TEXT DEFAULT '300px';
ALTER TABLE carousel_cards ADD COLUMN height_px TEXT DEFAULT 'auto';
ALTER TABLE carousel_cards ADD COLUMN full_bleed INTEGER DEFAULT 0;
ALTER TABLE carousel_cards ADD COLUMN carousel_id INTEGER DEFAULT 1;

CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO metadata (key, value) VALUES ('carousel_1_header', 'Free Interactive Demos');
