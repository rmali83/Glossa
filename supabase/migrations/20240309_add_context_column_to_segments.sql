-- Add context column to segments table for storing metadata
-- This column will store JSON data about segment type, page URL, and other metadata

-- Add context column if it doesn't exist
ALTER TABLE segments 
ADD COLUMN IF NOT EXISTS context JSONB DEFAULT '{}'::jsonb;

-- Add index for better query performance on context
CREATE INDEX IF NOT EXISTS idx_segments_context ON segments USING gin (context);

-- Add comment
COMMENT ON COLUMN segments.context IS 'JSON metadata about the segment including type, page URL, and other contextual information';
