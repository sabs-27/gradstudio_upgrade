-- RESTORE MISSING COURSES (Cloudflare & Singapore)

-- 1. Insert Cloudflare Course
INSERT INTO courses (id, title, icon_class, description, color_theme, display_order, is_active) VALUES
('cloudflare', 'Cloudflare', 'fa-brands fa-cloudflare', 'Cloudflare architecture and services', 'orange', 6, 1);

-- 2. Insert Singapore (Math) Course
INSERT INTO courses (id, title, icon_class, description, color_theme, display_order, is_active) VALUES
('singapore', 'Singapore Math', 'fa-solid fa-calculator', 'Math learning modules', 'blue', 7, 1);

-- 3. Insert Sections
INSERT INTO sections (id, course_id, title, display_order) VALUES
('cf-sec-001', 'cloudflare', 'Phase 1', 1),
('math-sec-001', 'singapore', 'Math Basics', 1);

-- 4. Insert Simulations (Cloudflare)
-- Assuming other sets exist or just set1 for now
INSERT INTO simulations (id, section_id, course_id, slug, title, description, icon_class, file_path, has_simulation, display_order, search_text) VALUES
('sim-cf-001', 'cf-sec-001', 'cloudflare', 'phase1-set1', 'Cloudflare Architecture (Set 1)', 'Architecture basics', 'fa-network-wired', 'simulations/Cloudflare/phase1-set1/index.html', 1, 1, 'cloudflare architecture phase1');

-- 5. Insert Simulations (Singapore Math)
INSERT INTO simulations (id, section_id, course_id, slug, title, description, icon_class, file_path, has_simulation, display_order, search_text) VALUES
('sim-math-001', 'math-sec-001', 'singapore', 'math1', 'Math Module 1', 'Singapore Math Level 1', 'fa-calculator', 'simulations/Singapore/math1.html', 1, 1, 'math singapore level 1'),
('sim-math-002', 'math-sec-001', 'singapore', 'math2', 'Math Module 2', 'Singapore Math Level 2', 'fa-calculator', 'simulations/Singapore/math2.html', 1, 2, 'math singapore level 2'),
('sim-math-003', 'math-sec-001', 'singapore', 'math3', 'Math Module 3', 'Singapore Math Level 3', 'fa-calculator', 'simulations/Singapore/math3.html', 1, 3, 'math singapore level 3'),
('sim-math-004', 'math-sec-001', 'singapore', 'math4', 'Math Module 4', 'Singapore Math Level 4', 'fa-calculator', 'simulations/Singapore/math4.html', 1, 4, 'math singapore level 4');

-- 6. Insert Tags
INSERT INTO tags (simulation_id, tag_name) VALUES
('sim-cf-001', 'cloudflare'),
('sim-cf-001', 'architecture'),
('sim-math-001', 'math'),
('sim-math-001', 'basics');

-- 7. Update Metadata
UPDATE metadata SET value = (SELECT COUNT(*) FROM simulations);
