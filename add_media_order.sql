-- Add order column to media table for image ordering
-- Run this in your Supabase Dashboard SQL Editor

ALTER TABLE media ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Update existing media to have sequential order based on creation time
WITH ordered_media AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY post_id ORDER BY created_at) - 1 as new_order
  FROM media
)
UPDATE media
SET "order" = ordered_media.new_order
FROM ordered_media
WHERE media.id = ordered_media.id;
