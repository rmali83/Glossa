-- Apply this in your Supabase SQL Editor to set up the TM system

-- First, let's check if the translation_memory table already exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'translation_memory') THEN
        RAISE NOTICE 'translation_memory table already exists. Checking structure...';
        
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'translation_memory' AND column_name = 'quality_score') THEN
            ALTER TABLE translation_memory ADD COLUMN quality_score INTEGER DEFAULT 0;
            RAISE NOTICE 'Added quality_score column';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'translation_memory' AND column_name = 'usage_count') THEN
            ALTER TABLE translation_memory ADD COLUMN usage_count INTEGER DEFAULT 0;
            RAISE NOTICE 'Added usage_count column';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'translation_memory' AND column_name = 'last_used_at') THEN
            ALTER TABLE translation_memory ADD COLUMN last_used_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'Added last_used_at column';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'translation_memory' AND column_name = 'domain') THEN
            ALTER TABLE translation_memory ADD COLUMN domain VARCHAR(100);
            RAISE NOTICE 'Added domain column';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'translation_memory' AND column_name = 'created_by') THEN
            ALTER TABLE translation_memory ADD COLUMN created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added created_by column';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'translation_memory' AND column_name = 'project_id') THEN
            ALTER TABLE translation_memory ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added project_id column';
        END IF;
        
    ELSE
        RAISE NOTICE 'Creating new translation_memory table...';
        -- Run the full migration
    END IF;
END $$;

-- Now run the enhanced TM functions
-- Function to calculate text similarity (Levenshtein distance)
CREATE OR REPLACE FUNCTION levenshtein_similarity(text1 TEXT, text2 TEXT)
RETURNS INTEGER AS $$
DECLARE
    len1 INTEGER := length(text1);
    len2 INTEGER := length(text2);
    max_len INTEGER := GREATEST(len1, len2);
    distance INTEGER;
BEGIN
    -- Handle empty strings
    IF len1 = 0 THEN RETURN len2; END IF;
    IF len2 = 0 THEN RETURN len1; END IF;
    
    -- Calculate Levenshtein distance (simplified version)
    distance := levenshtein(text1, text2);
    
    -- Convert to similarity percentage
    IF max_len = 0 THEN
        RETURN 100;
    ELSE
        RETURN GREATEST(0, 100 - (distance * 100 / max_len));
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to find TM matches for a given source text
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
        levenshtein_similarity(p_source_text, tm.source_text) as match_percentage,
        COALESCE(tm.quality_score, 0),
        COALESCE(tm.usage_count, 0),
        tm.domain,
        tm.created_at
    FROM translation_memory tm
    WHERE 
        tm.source_language = p_source_language
        AND tm.target_language = p_target_language
        AND levenshtein_similarity(p_source_text, tm.source_text) >= p_min_match_percentage
    ORDER BY 
        levenshtein_similarity(p_source_text, tm.source_text) DESC,
        COALESCE(tm.quality_score, 0) DESC,
        COALESCE(tm.usage_count, 0) DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to populate TM from existing segments
CREATE OR REPLACE FUNCTION populate_tm_from_segments()
RETURNS INTEGER AS $$
DECLARE
    segment_record RECORD;
    tm_count INTEGER := 0;
    tm_id UUID;
BEGIN
    -- Insert completed segments into TM
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
            AND LENGTH(s.source_text) > 5  -- Skip very short segments
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
            -- Insert new entry
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tm_source_text ON translation_memory USING gin(to_tsvector('english', source_text));
CREATE INDEX IF NOT EXISTS idx_tm_languages ON translation_memory(source_language, target_language);
CREATE INDEX IF NOT EXISTS idx_tm_domain ON translation_memory(domain);
CREATE INDEX IF NOT EXISTS idx_tm_quality ON translation_memory(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_tm_usage ON translation_memory(usage_count DESC);

-- Populate TM from existing segments
SELECT populate_tm_from_segments() as entries_added;

RAISE NOTICE 'TM system setup complete! Run the populate function to import existing translations.';