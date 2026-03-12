-- PRODUCTION: Re-enable RLS on dataset_logs with proper policies
-- Run this when ready to secure the dataset_logs table

-- Enable RLS
ALTER TABLE public.dataset_logs ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Admins can view all dataset logs" ON public.dataset_logs;
DROP POLICY IF EXISTS "Users can insert dataset logs for their projects" ON public.dataset_logs;
DROP POLICY IF EXISTS "Admins can update dataset logs" ON public.dataset_logs;
DROP POLICY IF EXISTS "Authenticated users can insert dataset logs" ON public.dataset_logs;

-- Policy 1: Admins can view all dataset logs
CREATE POLICY "Admins can view all dataset logs"
    ON public.dataset_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND user_type = 'Agencies'
        )
    );

-- Policy 2: Users can insert dataset logs for their projects
CREATE POLICY "Users can insert dataset logs for their projects"
    ON public.dataset_logs FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE translator_id = auth.uid() 
            OR reviewer_id = auth.uid() 
            OR created_by = auth.uid()
        )
    );

-- Policy 3: Admins can update dataset logs (for marking as exported)
CREATE POLICY "Admins can update dataset logs"
    ON public.dataset_logs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND user_type = 'Agencies'
        )
    );

-- Verify policies
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'dataset_logs';
