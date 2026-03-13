-- Simple TM Setup for Supabase
-- Run this in your Supabase SQL Editor

-- Step 1: Create or enhance translation_memory table
CREATE TABLE IF NOT EXISTS translation_memory (
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

-- Step 2: Add missing columns if they don't exist
DO $$
BEGIN
    -- Add quality_score if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'translation_memory' AND column_name = 'quality_score') THEN
        ALTER TABLE translation_memory ADD COLUMN quality_score INTEGER DEFAULT 0;
    END IF;
    
    -- Add usage_count if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'translation_memory' AND column_name = 'usage_count') THEN
        ALTER TABLE translation_memory ADD COLUMN usage_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add last_used_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'translation_memory' AND column_name = 'last_used_at') THEN
        ALTER TABLE translation_memory ADD COLUMN last_used_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add domain if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'translation_memory' AND column_name = 'domain') THEN
        ALTER TABLE translation_memory ADD COLUMN domain VARCHAR(100);
    END IF;
    
    -- Add created_by if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'translation_memory' AND column_name = 'created_by') THEN
        ALTER TABLE translation_memory ADD COLUMN created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
    
    -- Add project_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'translation_memory' AND column_name = 'project_id') THEN
        ALTER TABLE translation_memory ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tm_languages ON translation_memory(source_language, target_language);
CREATE INDEX IF NOT EXISTS idx_tm_domain ON translation_memory(domain);
CREATE INDEX IF NOT EXISTS idx_tm_quality ON translation_memory(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_tm_usage ON translation_memory(usage_count DESC);

-- Step 4: Create fuzzy matching function
CREATE OR REPLACE FUNCTION find_tm_matches(
    p_source_text TEXT,
    p_source_language VARCHAR(10),
    p_target_language VARCHAR(10),
    p_min_match_percentage INTEGER DEFAULT 50,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    tm_id UUID,
    source_text TEXT,
    target_text TEXT,
    match_percentage INTEGER,
    quality_score INTEGER,
    usage_count INTEGER,
    domain VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tm.id,
        tm.source_text,
        tm.target_text,
        CASE 
            WHEN tm.source_text = p_source_text THEN 100
            WHEN tm.source_text ILIKE '%' || p_source_text || '%' THEN 85
            WHEN p_source_text ILIKE '%' || tm.source_text || '%' THEN 75
            ELSE 60
        END as match_percentage,
        COALESCE(tm.quality_score, 0),
        COALESCE(tm.usage_count, 0),
        tm.domain,
        tm.created_at
    FROM translation_memory tm
    WHERE 
        tm.source_language = p_source_language
        AND tm.target_language = p_target_language
        AND (
            tm.source_text = p_source_text OR
            tm.source_text ILIKE '%' || p_source_text || '%' OR
            p_source_text ILIKE '%' || tm.source_text || '%'
        )
    ORDER BY 
        CASE 
            WHEN tm.source_text = p_source_text THEN 100
            WHEN tm.source_text ILIKE '%' || p_source_text || '%' THEN 85
            WHEN p_source_text ILIKE '%' || tm.source_text || '%' THEN 75
            ELSE 60
        END DESC,
        COALESCE(tm.quality_score, 0) DESC,
        COALESCE(tm.usage_count, 0) DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create function to populate TM from existing segments
CREATE OR REPLACE FUNCTION populate_tm_from_segments()
RETURNS INTEGER AS $$
DECLARE
    segment_record RECORD;
    tm_count INTEGER := 0;
    tm_id UUID;
BEGIN
    FOR segment_record IN
        SELECT DISTINCT
            s.source_text,
            s.target_text,
            p.source_language,
            p.target_language,
            p.domain,
            p.id as project_id,
            s.translator_id as created_by,
            COALESCE(a.quality_rating, 3) as quality_score
        FROM segments s
        JOIN projects p ON s.project_id = p.id
        LEFT JOIN annotations a ON s.id = a.segment_id
        WHERE 
            s.target_text IS NOT NULL 
            AND s.target_text != ''
            AND LENGTH(s.source_text) > 5
            AND LENGTH(s.target_text) > 5
    LOOP
        -- Check if exact match exists
        SELECT id INTO tm_id
        FROM translation_memory
        WHERE 
            source_text = segment_record.source_text
            AND target_text = segment_record.target_text
            AND source_language = segment_record.source_language
            AND target_language = segment_record.target_language;
        
        IF tm_id IS NULL THEN
            INSERT INTO translation_memory (
                source_text,
                target_text,
                source_language,
                target_language,
                domain,
                project_id,
                created_by,
                quality_score,
                usage_count,
                last_used_at,
                created_at,
                updated_at
            ) VALUES (
                segment_record.source_text,
                segment_record.target_text,
                segment_record.source_language,
                segment_record.target_language,
                segment_record.domain,
                segment_record.project_id,
                segment_record.created_by,
                segment_record.quality_score,
                1,
                NOW(),
                NOW(),
                NOW()
            );
            tm_count := tm_count + 1;
        END IF;
    END LOOP;
    
    RETURN tm_count;
END;
$$ LANGUAGE plpgsql;

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

-- Success! TM system is now ready.
-- Next step: Run SELECT populate_tm_from_segments(); to import existing translations.