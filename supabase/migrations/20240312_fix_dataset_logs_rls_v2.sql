-- Fix RLS policies for dataset_logs - Remove auth.users check
-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can view all dataset logs" ON public.dataset_logs;
DROP POLICY IF EXISTS "System can insert dataset logs" ON public.dataset_logs;
DROP POLICY IF EXISTS "Users can insert dataset logs for their projects" ON public.dataset_logs;
DROP POLICY IF EXISTS "Admins can update dataset logs" ON public.dataset_logs;

-- Create new simplified policies
CREATE POLICY "Admins can view all dataset logs"
    ON public.dataset_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND user_type = 'Agencies'
        )
    );

CREATE POLICY "Users can insert their own dataset logs"
    ON public.dataset_logs FOR INSERT
    WITH CHECK (translator_id = auth.uid());

CREATE POLICY "Admins can update dataset logs"
    ON public.dataset_logs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND user_type = 'Agencies'
        )
    );
