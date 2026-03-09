-- Fix segments table schema
-- Add missing created_by column and ensure all required columns exist

-- Add created_by column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'segments' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE segments ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Ensure all required columns exist
DO $$ 
BEGIN
  -- Add file_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'segments' AND column_name = 'file_id'
  ) THEN
    ALTER TABLE segments ADD COLUMN file_id UUID REFERENCES project_files(id) ON DELETE SET NULL;
  END IF;

  -- Add file_name if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'segments' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE segments ADD COLUMN file_name TEXT;
  END IF;

  -- Add segment_index if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'segments' AND column_name = 'segment_index'
  ) THEN
    ALTER TABLE segments ADD COLUMN segment_index INTEGER;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_segments_created_by ON segments(created_by);
CREATE INDEX IF NOT EXISTS idx_segments_file_id ON segments(file_id);
CREATE INDEX IF NOT EXISTS idx_segments_project_id ON segments(project_id);

-- Update RLS policies to work without created_by requirement
DROP POLICY IF EXISTS "Users can view their own segments" ON segments;
DROP POLICY IF EXISTS "Users can insert their own segments" ON segments;
DROP POLICY IF EXISTS "Users can update their own segments" ON segments;
DROP POLICY IF EXISTS "Users can delete their own segments" ON segments;
DROP POLICY IF EXISTS "Translators can view assigned segments" ON segments;
DROP POLICY IF EXISTS "Translators can update assigned segments" ON segments;

-- Create new RLS policies based on project ownership
CREATE POLICY "Users can view segments from their projects"
ON segments FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Translators can view assigned project segments"
ON segments FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE translator_id = auth.uid() OR reviewer_id = auth.uid()
  )
);

CREATE POLICY "Users can insert segments to their projects"
ON segments FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can update segments in their projects"
ON segments FOR UPDATE
USING (
  project_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Translators can update assigned project segments"
ON segments FOR UPDATE
USING (
  project_id IN (
    SELECT id FROM projects WHERE translator_id = auth.uid()
  )
);

CREATE POLICY "Users can delete segments from their projects"
ON segments FOR DELETE
USING (
  project_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON segments TO authenticated;
GRANT ALL ON segments TO service_role;
