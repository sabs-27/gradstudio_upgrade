-- =====================================================
-- SOFT DELETE MIGRATION FOR COURSES TABLE
-- Adds support for recycle bin functionality
-- =====================================================

-- Add is_deleted column (0 = active, 1 = deleted)
ALTER TABLE courses ADD COLUMN is_deleted INTEGER DEFAULT 0;

-- Add deleted_at timestamp column
ALTER TABLE courses ADD COLUMN deleted_at TEXT;

-- Create index for faster queries on deleted items
CREATE INDEX idx_courses_deleted ON courses(is_deleted);

-- Update existing courses to ensure they're marked as not deleted
UPDATE courses SET is_deleted = 0 WHERE is_deleted IS NULL;
