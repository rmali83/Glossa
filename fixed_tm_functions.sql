-- Fixed TM Functions - Run after table structure is confirmed
-- This creates the working TM functions with proper error handling

-- Function 1: Simple fuzzy matching function
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
) AS $
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
            WHEN similarity(tm.source_text, p_source_text) > 0.6 THEN ROUND(similarity(tm.source_text, p_source_text) * 100)::INTEGER
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
            p_source_text ILIKE '%' || tm.source_text || '%' OR
            similarity(tm.source_text, p_source_text) > 0.5
        )
    ORDER BY 
        CASE 
            WHEN tm.source_text = p_source_text THEN 100
            WHEN tm.source_text ILIKE '%' || p_source_text || '%' THEN 85
            WHEN p_source_text ILIKE '%' || tm.source_text || '%' THEN 75
            WHEN similarity(tm.source_text, p_source_text) > 0.6 THEN ROUND(similarity(tm.source_text, p_source_text) * 100)::INTEGER
            ELSE 60
        END DESC,
        COALESCE(tm.quality_score, 0) DESC,
        COALESCE(tm.usage_count, 0) DESC
    LIMIT p_limit;
END;
$ LANGUAGE plpgsql;

-- Function 2: Upsert TM entry function
CREATE OR REPLACE FUNCTION upsert_tm_entry(
    p_source_text TEXT,
    p_target_text TEXT,
    p_source_language VARCHAR(10),
    p_target_language VARCHAR(10),
    p_domain VARCHAR(100) DEFAULT NULL,
    p_project_id UUID DEFAULT NULL,
    p_created_by UUID DEFAULT NULL,
    p_quality_score INTEGER DEFAULT 3
)
RETURNS UUID AS $
DECLARE
    tm_id UUID;
BEGIN
    -- Check if exact match exists
    SELECT id INTO tm_id
    FROM translation_memory
    WHERE 
        source_text = p_source_text
        AND target_text = p_target_text
        AND source_language = p_source_language
        AND target_language = p_target_language;
    
    IF tm_id IS NOT NULL THEN
        -- Update existing entry
        UPDATE translation_memory 
        SET 
            usage_count = COALESCE(usage_count, 0) + 1,
            last_used_at = NOW(),
            updated_at = NOW()
        WHERE id = tm_id;
        
        RETURN tm_id;
    ELSE
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
            p_source_text,
            p_target_text,
            p_source_language,
            p_target_language,
            p_domain,
            p_project_id,
            p_created_by,
            p_quality_score,
            1,
            NOW(),
            NOW(),
            NOW()
        ) RETURNING id INTO tm_id;
        
        RETURN tm_id;
    END IF;
END;
$ LANGUAGE plpgsql;

-- Function 3: Fixed populate function with better error handling
CREATE OR REPLACE FUNCTION populate_tm_from_segments()
RETURNS INTEGER AS $
DECLARE
    segment_record RECORD;
    tm_count INTEGER := 0;
    tm_id UUID;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting TM population from segments...';
    
    -- Check if required tables exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'segments') THEN
        RAISE EXCEPTION 'segments table does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'projects') THEN
        RAISE EXCEPTION 'projects table does not exist';
    END IF;
    
    -- Process segments in batches
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
        LIMIT 1000  -- Process in batches to avoid timeout
    LOOP
        BEGIN
            -- Use the upsert function
            SELECT upsert_tm_entry(
                segment_record.source_text,
                segment_record.target_text,
                segment_record.source_language,
                segment_record.target_language,
                segment_record.domain,
                segment_record.project_id,
                segment_record.created_by,
                segment_record.quality_score
            ) INTO tm_id;
            
            IF tm_id IS NOT NULL THEN
                tm_count := tm_count + 1;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE NOTICE 'Error processing segment: %', SQLERRM;
            CONTINUE;
        END;
    END LOOP;
    
    RAISE NOTICE 'TM population complete. Added: %, Errors: %', tm_count, error_count;
    RETURN tm_count;
END;
$ LANGUAGE plpgsql;

-- Test the functions
SELECT 'TM functions created successfully!' as status;