-- Fix RLS policies for segments table to allow all operations

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view assigned segments" ON public.segments;
DROP POLICY IF EXISTS "Users can update assigned segments" ON public.segments;
DROP POLICY IF EXISTS "Users can insert segments" ON public.segments;
DROP POLICY IF EXISTS "Users can delete segments" ON public.segments;

-- Create comprehensive policies

-- SELECT policy - users can view segments from their assigned projects
CREATE POLICY "Users can view assigned segments" 
ON public.segments FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = segments.project_id 
        AND (projects.translator_id = auth.uid() OR projects.reviewer_id = auth.uid() OR projects.created_by = auth.uid())
    )
);

-- INSERT policy - users can insert segments into their assigned projects
CREATE POLICY "Users can insert segments" 
ON public.segments FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = segments.project_id 
        AND (projects.translator_id = auth.uid() OR projects.reviewer_id = auth.uid() OR projects.created_by = auth.uid())
    )
);

-- UPDATE policy - users can update segments in their assigned projects
CREATE POLICY "Users can update segments" 
ON public.segments FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = segments.project_id 
        AND (projects.translator_id = auth.uid() OR projects.reviewer_id = auth.uid() OR projects.created_by = auth.uid())
    )
);

-- DELETE policy - only project creators can delete segments
CREATE POLICY "Users can delete segments" 
ON public.segments FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = segments.project_id 
        AND projects.created_by = auth.uid()
    )
);

-- Verify RLS is enabled
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
