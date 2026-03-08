-- =====================================================
-- CLOUDFLARE D1 DATABASE SCHEMA
-- Learning Platform - Complete Structure
-- =====================================================

-- 1. COURSES TABLE
-- Stores high-level course information (AWS, SQL, GCP, etc.)
CREATE TABLE courses (
    icon_class TEXT NOT NULL,               -- e.g., 'fa-brands fa-aws'
    description TEXT,                       -- Course overview
    color_theme TEXT,                       -- e.g., 'orange', 'blue'
    category TEXT,                          -- Category id (e.g., 'skill', 'role')
    display_order INTEGER DEFAULT 0,        -- Sort order in sidebar
         reports INTEGER DEFAULT 0,
         last_synced_at TEXT DEFAULT (datetime('now')),
    is_deleted BOOLEAN DEFAULT 0,           -- Soft delete flag
    is_locked BOOLEAN DEFAULT 1,            -- Lock entire course
    created_at TEXT DEFAULT (datetime('now')),

-- 2. SECTIONS TABLE
-- Course sections (e.g., "Cloud Foundations", "Compute Services")
CREATE TABLE sections (
    id TEXT PRIMARY KEY,                    -- e.g., 'aws-sec-001'
    course_id TEXT NOT NULL,                -- Foreign key to courses.id
    title TEXT NOT NULL,                    -- e.g., 'Cloud Foundations'
    display_order INTEGER DEFAULT 0,        -- Order within course
    is_locked BOOLEAN DEFAULT 1,            -- Lock entire section
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

    CREATE TABLE IF NOT EXISTS simulation_reports (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         simulation_id TEXT NOT NULL,
         user_id TEXT NOT NULL,
         created_at TEXT DEFAULT (datetime('now')),
         FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
         UNIQUE (simulation_id, user_id)
    );
-- 3. SIMULATIONS TABLE
    id TEXT PRIMARY KEY,                    -- e.g., 'sim-aws-001'
    section_id TEXT NOT NULL,               -- Foreign key to sections.id
    course_id TEXT NOT NULL,                -- Denormalized for faster queries
    slug TEXT UNIQUE NOT NULL,              -- e.g., 'ec2-basics'
    title TEXT NOT NULL,                    -- e.g., 'EC2 Basics'
    description TEXT,                       -- Short description
    file_path TEXT NOT NULL,                -- R2 path: 'simulations/aws/ec2-basics/index.html'
    has_simulation BOOLEAN DEFAULT 0,       -- 1 if interactive, 0 if text-only
    display_order INTEGER DEFAULT 0,        -- Order within section
    search_text TEXT,                       -- Lowercased searchable content
    upload_date TEXT DEFAULT (date('now')), -- When it was added
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Full-text search index on simulations
CREATE VIRTUAL TABLE simulations_fts USING fts5(
    id UNINDEXED,
    title,
    content_rowid=rowid

-- Triggers to keep FTS index in sync
CREATE TRIGGER simulations_fts_insert AFTER INSERT ON simulations BEGIN
    INSERT INTO simulations_fts(rowid, id, title, description, search_text)
    VALUES (new.rowid, new.id, new.title, new.description, new.search_text);
END;

CREATE TRIGGER simulations_fts_delete AFTER DELETE ON simulations BEGIN
    DELETE FROM simulations_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER simulations_fts_update AFTER UPDATE ON simulations BEGIN
    DELETE FROM simulations_fts WHERE rowid = old.rowid;
    INSERT INTO simulations_fts(rowid, id, title, description, search_text)
    VALUES (new.rowid, new.id, new.title, new.description, new.search_text);
END;
-- 4. TAGS TABLE
-- Flexible tagging system for filtering
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulation_id TEXT NOT NULL,
    tag_name TEXT NOT NULL,                 -- e.g., 'compute', 'storage', 'beginner'
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE
);

CREATE INDEX idx_tags_simulation ON tags(simulation_id);
CREATE INDEX idx_tags_name ON tags(tag_name);

-- 5. STATISTICS TABLE
-- View counts, likes, and dislikes
CREATE TABLE statistics (
    simulation_id TEXT PRIMARY KEY,
    FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE
-- 6. COMMENTS TABLE
-- User comments on simulations (future feature)
CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulation_id TEXT NOT NULL,
    author_name TEXT NOT NULL,              -- Anonymous names initially
    text TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE
);


-- 7. METADATA TABLE
-- System-level settings and counters
CREATE TABLE metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
-- Insert initial metadata
INSERT INTO metadata (key, value) VALUES 
    ('total_simulations', '0'),
    ('last_upload_date', date('now')),
    ('version', '1.0.0');

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_simulations_course ON simulations(course_id);
CREATE INDEX idx_simulations_section ON simulations(section_id);
CREATE INDEX idx_simulations_slug ON simulations(slug);
CREATE INDEX idx_simulations_upload_date ON simulations(upload_date DESC);
CREATE INDEX idx_sections_course ON sections(course_id);
-- VIEWS FOR COMMON QUERIES
-- =====================================================
CREATE VIEW v_course_overview AS
SELECT 
    c.id,
    c.title,
    c.icon_class,
    c.color_theme,
    COUNT(DISTINCT s.id) as section_count,
    COUNT(DISTINCT sim.id) as simulation_count,
    SUM(CASE WHEN sim.has_simulation = 1 THEN 1 ELSE 0 END) as interactive_count
FROM courses c
LEFT JOIN sections s ON c.id = s.course_id
LEFT JOIN simulations sim ON s.id = sim.section_id
WHERE c.is_active = 1
ORDER BY c.display_order;

-- View: Recent simulations across all courses
CREATE VIEW v_recent_simulations AS
SELECT 
    sim.id,
    sim.slug,
    sim.title,
    sim.course_id,
    c.title as course_title,
    c.icon_class as course_icon,
    sim.upload_date,
    COALESCE(st.views, 0) as views,
FROM simulations sim
JOIN courses c ON sim.course_id = c.id
LEFT JOIN statistics st ON sim.id = st.simulation_id
ORDER BY sim.upload_date DESC
LIMIT 10;

-- =====================================================
-- ADDITIVE EXTENSIONS (AUTH, PAYMENTS, ACCESS, ENGAGEMENT)
-- Backward-compatible: no existing tables or queries modified
-- =====================================================

-- 8. USERS TABLE
-- Email/password authentication
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);

-- 9. USER ACCESS TABLE
-- One-time lifetime access to all courses (₹99)
CREATE TABLE user_access (
    user_id TEXT PRIMARY KEY,
    has_full_access BOOLEAN DEFAULT 0,
    unlocked_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. PAYMENTS TABLE
-- Records payment attempts and outcomes
CREATE TABLE payments (
    id TEXT PRIMARY KEY,                 -- payment provider id
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL DEFAULT 99,  -- ₹99
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL,                -- pending | success | failed
    provider TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

-- 11. CONTENT LOCKING
-- Add is_locked flag to simulations (default locked)
ALTER TABLE simulations ADD COLUMN is_locked BOOLEAN DEFAULT 1;

-- 12. ENGAGEMENT TRACKING
-- Per-user views (deduped by simulation_id + user_id)
CREATE TABLE simulation_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulation_id TEXT NOT NULL,
    user_id TEXT,                        -- NULL for anonymous
    viewed_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE (simulation_id, user_id)
);

CREATE INDEX idx_simulation_views_sim ON simulation_views(simulation_id);
CREATE INDEX idx_simulation_views_user ON simulation_views(user_id);

-- Per-user likes (one like per user per simulation)
CREATE TABLE simulation_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (simulation_id, user_id)
);

CREATE INDEX idx_simulation_likes_sim ON simulation_likes(simulation_id);
CREATE INDEX idx_simulation_likes_user ON simulation_likes(user_id);

-- Per-user dislikes (one dislike per user per simulation)
CREATE TABLE simulation_dislikes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (simulation_id, user_id)
);

CREATE INDEX idx_simulation_dislikes_sim ON simulation_dislikes(simulation_id);
CREATE INDEX idx_simulation_dislikes_user ON simulation_dislikes(user_id);

-- 13. COMMENT USER LINK
-- Link comments to users (nullable for anonymous)
ALTER TABLE comments ADD COLUMN user_id TEXT;
CREATE INDEX idx_comments_user ON comments(user_id);

-- 14. CAROUSELS & CAROUSEL CARDS
-- Supports multiple dynamic carousels on the homepage

CREATE TABLE IF NOT EXISTS carousels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                     -- Internal name
    header TEXT,                            -- Display header (e.g. 'Featured Courses')
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS carousel_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carousel_id INTEGER NOT NULL,           -- Link to carousels table
    title TEXT NOT NULL,
    description TEXT,
    icon_class TEXT,                        -- FontAwesome class
    color_hex TEXT DEFAULT '#3b82f6',       -- Accent color
    target_type TEXT,                       -- 'course' | 'simulation' | 'external' | 'none'
    target_id TEXT,                         -- courseId, simulation slug, or URL
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    content_type TEXT DEFAULT 'standard',   -- 'standard' | 'image' | 'html' | 'iframe'
    image_url TEXT,
    iframe_url TEXT,
    content_html TEXT,
    width TEXT DEFAULT '300px',
    height_px TEXT DEFAULT 'auto',
    full_bleed INTEGER DEFAULT 0,           -- 1 if image should fill entire card
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (carousel_id) REFERENCES carousels(id) ON DELETE CASCADE
);

CREATE INDEX idx_carousel_cards_carousel ON carousel_cards(carousel_id);
CREATE INDEX idx_carousel_cards_active ON carousel_cards(is_active);
CREATE INDEX idx_carousels_active ON carousels(is_active);