-- Check Translation Memory table structure and fix issues
-- Run this in Supabase SQL Editor to diagnose and fix the TM setup

-- Step 1: Check if translation_memory table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'translation_memory' 
ORDER BY ordinal_position;

-- Step 2: Check if the table exists at all
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'translation_memory'
) as table_exists;

-- Step 3: If table doesn't exist, create it with correct structure
DO $
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'translation_memory') THEN
        CREATE TABLE translation_memory (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            source_text TEXT NOT NULL,
            target_text TEXT NOT NULL,
            source_language VARCHAR(10) NOT NULL,
            target_language VARCHAR(10) NOT NULL,
            domain VARCHAR(100),
            project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
            created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
            quality_score INTEGER DEFAULT 0,
            usage_count INTEGER DEFAULT 0,
            last_used_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created translation_memory table';
    ELSE
        RAISE NOTICE 'translation_memory table already exists';
    END IF;
END $;

-- Step 4: Add missing columns if they don't exist
DO $
BEGIN
    -- Add quality_score if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'translation_memory' AND column_name = 'quality_score') THEN
        ALTER TABLE translation_memory ADD COLUMN quality_score INTEGER DEFAULT 0;
        RAISE NOTICE 'Added quality_score column';
    END IF;
    
    -- Add usage_count if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'translation_memory' AND column_name = 'usage_count') THEN
        ALTER TABLE translation_memory ADD COLUMN usage_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added usage_count column';
    END IF;
    
    -- Add last_used_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'translation_memory' AND column_name = 'last_used_at') THEN
        ALTER TABLE translation_memory ADD COLUMN last_used_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_used_at column';
    END IF;
    
    -- Add domain if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'translation_memory' AND column_name = 'domain') THEN
        ALTER TABLE translation_memory ADD COLUMN domain VARCHAR(100);
        RAISE NOTICE 'Added domain column';
    END IF;
    
    -- Add created_by if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'translation_memory' AND column_name = 'created_by') THEN
        ALTER TABLE translation_memory ADD COLUMN created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added created_by column';
    END IF;
    
    -- Add project_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'translation_memory' AND column_name = 'project_id') THEN
        ALTER TABLE translation_memory ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added project_id column';
    END IF;
END $;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tm_languages ON translation_memory(source_language, target_language);
CREATE INDEX IF NOT EXISTS idx_tm_domain ON translation_memory(domain);
CREATE INDEX IF NOT EXISTS idx_tm_quality ON translation_memory(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_tm_usage ON translation_memory(usage_count DESC);

-- Step 6: Enable RLS
ALTER TABLE translation_memory ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
DROP POLICY IF EXISTS "Users can read translation memory" ON translation_memory;
CREATE POLICY "Users can read translation memory" ON translation_memory
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their TM entries" ON translation_memory;
CREATE POLICY "Users can insert their TM entries" ON translation_memory
    FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

DROP POLICY IF EXISTS "Users can update their TM entries" ON translation_memory;
CREATE POLICY "Users can update their TM entries" ON translation_memory
    FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

-- Step 8: Show final table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'translation_memory' 
ORDER BY ordinal_position;

RAISE NOTICE 'Translation Memory table setup complete!';