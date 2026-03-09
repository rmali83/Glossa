-- Fix project_files table schema
-- This migration ensures the project_files table has all required columns

-- Drop the table if it exists and recreate with correct schema
DROP TABLE IF EXISTS project_files CASCADE;

-- Create project_files table with all required columns
CREATE TABLE project_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  storage_url TEXT,
  upload_status TEXT DEFAULT 'uploading',
  uploaded_by UUID REFERENCES auth.users(id),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_project_files_uploaded_by ON project_files(uploaded_by);
CREATE INDEX idx_project_files_upload_status ON project_files(upload_status);

-- Enable Row Level Security
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own project files" ON project_files;
DROP POLICY IF EXISTS "Users can insert their own project files" ON project_files;
DROP POLICY IF EXISTS "Users can update their own project files" ON project_files;
DROP POLICY IF EXISTS "Users can delete their own project files" ON project_files;
DROP POLICY IF EXISTS "Translators can view assigned project files" ON project_files;

-- Create RLS policies for project_files

-- Policy 1: Users can view files from their own projects
CREATE POLICY "Users can view their own project files"
ON project_files FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  )
);

-- Policy 2: Translators can view files from assigned projects
CREATE POLICY "Translators can view assigned project files"
ON project_files FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE translator_id = auth.uid() OR reviewer_id = auth.uid()
  )
);

-- Policy 3: Users can insert files to their own projects
CREATE POLICY "Users can insert their own project files"
ON project_files FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  )
);

-- Policy 4: Users can update their own project files
CREATE POLICY "Users can update their own project files"
ON project_files FOR UPDATE
USING (
  project_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  )
);

-- Policy 5: Users can delete their own project files
CREATE POLICY "Users can delete their own project files"
ON project_files FOR DELETE
USING (
  project_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_project_files_updated_at ON project_files;

CREATE TRIGGER update_project_files_updated_at
BEFORE UPDATE ON project_files
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON project_files TO authenticated;
GRANT ALL ON project_files TO service_role;
