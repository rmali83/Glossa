-- Add ai_translation column to segments table for dataset capture
-- This stores the original AI/MT translation before human editing

DO $$ 
BEGIN
  -- Add ai_translation column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'segments' AND column_name = 'ai_translation'
  ) THEN
    ALTER TABLE segments ADD COLUMN ai_translation TEXT;
  END IF;
END $$;

-- Add index for dataset queries
CREATE INDEX IF NOT EXISTS idx_segments_ai_translation ON segments(ai_translation) WHERE ai_translation IS NOT NULL;

-- Add comment
COMMENT ON COLUMN segments.ai_translation IS 'Original AI/MT translation output before human editing';
