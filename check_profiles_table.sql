-- Check if profiles table exists and has the right structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check current profiles data
SELECT id, email, full_name, user_type
FROM profiles
LIMIT 10;

-- Add missing columns if they don't exist:
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language_pairs text[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS years_experience text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type text;

-- If you want to add created_at column:
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();