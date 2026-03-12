-- Fix RLS policy for dataset_logs to allow user inserts
-- This allows translators to insert their own dataset logs

DROP POLICY IF EXISTS "System can insert dataset logs" ON public.dataset_logs;

CREATE POLICY "Users can insert dataset logs for their projects"
    ON public.dataset_logs FOR INSERT
    WITH CHECK (
        translator_id = auth.uid()
        OR project_id IN (
            SELECT id FROM public.projects 
            WHERE translator_id = auth.uid() 
            OR reviewer_id = auth.uid() 
            OR created_by = auth.uid()
        )
    );
