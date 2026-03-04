-- ============================================
-- Migration: Phase 3 — Revise campaigns table
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Add new platforms array column
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS platforms TEXT[] DEFAULT '{}';

-- Step 2: Migrate existing platform data to platforms array
UPDATE campaigns SET platforms = ARRAY[platform] WHERE platform IS NOT NULL AND platforms = '{}';

-- Step 3: Drop removed columns
ALTER TABLE campaigns DROP COLUMN IF EXISTS platform;
ALTER TABLE campaigns DROP COLUMN IF EXISTS content_type;
ALTER TABLE campaigns DROP COLUMN IF EXISTS landing_type;
ALTER TABLE campaigns DROP COLUMN IF EXISTS landing_url;
ALTER TABLE campaigns DROP COLUMN IF EXISTS impressions;
ALTER TABLE campaigns DROP COLUMN IF EXISTS unique_viewers;
ALTER TABLE campaigns DROP COLUMN IF EXISTS link_clicks;
ALTER TABLE campaigns DROP COLUMN IF EXISTS follows;
ALTER TABLE campaigns DROP COLUMN IF EXISTS video_views;
ALTER TABLE campaigns DROP COLUMN IF EXISTS watch_time;

-- Step 4: Add GIN index on platforms array
CREATE INDEX IF NOT EXISTS idx_campaigns_platforms ON campaigns USING GIN(platforms);

-- Step 5: Drop old single-platform index (if exists)
DROP INDEX IF EXISTS idx_campaigns_platform;
