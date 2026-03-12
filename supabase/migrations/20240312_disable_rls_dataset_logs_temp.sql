-- TEMPORARY: Disable RLS on dataset_logs to test data capture
-- This is for debugging only - we'll re-enable with proper policies later

ALTER TABLE public.dataset_logs DISABLE ROW LEVEL SECURITY;

-- Note: This allows anyone to insert/read dataset_logs
-- We will re-enable RLS once we confirm the data capture works
