-- Fix RLS policy for dataset_logs - Allow inserts for project participants
DROP POLICY IF EXISTS "Users can insert their own dataset logs" ON public.dataset_logs;

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
