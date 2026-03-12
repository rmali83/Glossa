-- Simplest RLS policy - Allow all authenticated users to insert dataset logs
DROP POLICY IF EXISTS "Users can insert dataset logs for their projects" ON public.dataset_logs;

CREATE POLICY "Authenticated users can insert dataset logs"
    ON public.dataset_logs FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
