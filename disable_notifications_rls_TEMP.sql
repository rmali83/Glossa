-- TEMPORARY: Disable RLS on notifications table to test email functionality
-- We'll re-enable it once we confirm emails work

-- Disable RLS on notifications table
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notifications';

-- This should show rowsecurity = false
