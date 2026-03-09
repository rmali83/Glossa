# Database Schema Fix - File Upload Error

## Error Analysis

From the console screenshot, the error is:
```
Failed to load resources: the server responded with a status of 400
Database error: column "project_files" of relation "project_files" does not exist
```

This indicates the `project_files` table schema is incorrect or missing columns.

## Root Cause

The `project_files` table was not created with the correct schema, or the migration wasn't applied to the Supabase database.

## Solution

### Step 1: Apply Database Migration

Run this SQL in Supabase SQL Editor:

```sql
-- Fix project_files table schema
DROP TABLE IF EXISTS project_files CASCADE;

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

-- Create indexes
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_project_files_uploaded_by ON project_files(uploaded_by);
CREATE INDEX idx_project_files_upload_status ON project_files(upload_status);

-- Enable RLS
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own project files"
ON project_files FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Translators can view assigned project files"
ON project_files FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE translator_id = auth.uid() OR reviewer_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own project files"
ON project_files FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can update their own project files"
ON project_files FOR UPDATE
USING (
  project_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete their own project files"
ON project_files FOR DELETE
USING (
  project_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON project_files TO authenticated;
GRANT ALL ON project_files TO service_role;
```

### Step 2: Verify Storage Bucket

Make sure the `project-files` storage bucket exists:

1. Go to Supabase Dashboard → Storage
2. Check if `project-files` bucket exists
3. If not, create it with these settings:
   - Name: `project-files`
   - Public: No (private bucket)
   - File size limit: 52428800 (50 MB)

### Step 3: Verify Storage Policies

Run this SQL to create storage policies:

```sql
-- Storage policies for project-files bucket

-- Policy 1: Users can upload files to their own projects
CREATE POLICY "Users can upload project files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can view their own project files
CREATE POLICY "Users can view project files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can update their own project files
CREATE POLICY "Users can update project files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can delete their own project files
CREATE POLICY "Users can delete project files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Step 4: Test File Upload

After applying the migration:

1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Go to Admin → Create Job
4. Create draft project
5. Try uploading a file
6. Check browser console for errors

## Quick Fix Commands

### In Supabase SQL Editor:

```sql
-- 1. Check if table exists
SELECT * FROM information_schema.tables WHERE table_name = 'project_files';

-- 2. Check table columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'project_files';

-- 3. Check if storage bucket exists
SELECT * FROM storage.buckets WHERE name = 'project-files';

-- 4. Check storage policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

## Common Issues

### Issue 1: Table doesn't exist
**Solution:** Run the CREATE TABLE statement above

### Issue 2: Wrong column names
**Solution:** Drop and recreate table with correct schema

### Issue 3: RLS blocking inserts
**Solution:** Check RLS policies, ensure user has permission

### Issue 4: Storage bucket doesn't exist
**Solution:** Create bucket in Supabase Dashboard → Storage

### Issue 5: Storage policies missing
**Solution:** Run storage policy SQL statements

## Verification Steps

After applying fixes:

1. **Check table exists:**
```sql
SELECT COUNT(*) FROM project_files;
```

2. **Check RLS is enabled:**
```sql
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'project_files';
```

3. **Check policies exist:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'project_files';
```

4. **Test insert:**
```sql
INSERT INTO project_files (project_id, filename, file_size, file_type, storage_path)
VALUES (
  (SELECT id FROM projects LIMIT 1),
  'test.txt',
  1024,
  'txt',
  'test/path/test.txt'
);
```

## Migration File Location

The complete migration is saved in:
`supabase/migrations/20240309_fix_project_files_table.sql`

## Next Steps

1. Apply the migration in Supabase SQL Editor
2. Verify the table structure
3. Test file upload
4. If still failing, check browser console for specific error
5. Share the exact error message for further debugging

## Support

If the error persists after applying these fixes:
1. Take a screenshot of the browser console error
2. Check Supabase logs for detailed error messages
3. Verify the user is authenticated
4. Check if the project exists in the database
