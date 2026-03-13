-- Translation Memory System Migration
-- Creates tables and functions for TM functionality

-- Create translation_memory table
CREATE TABLE IF NOT EXISTS translation_memory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_text TEXT NOT NULL,
    target_text TEXT NOT NULL,
    source_language VARCHAR(10) NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    domain VARCHAR(100),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    quality_score INTEGER DEFAULT 0, -- 0-5 quality rating
    usage_count INTEGER DEFAULT 0, -- How many times this TM entry has been used
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast TM matching
CREATE INDEX IF NOT EXISTS idx_tm_source_text ON translation_memory USING gin(to_tsvector('english', source_text));
CREATE INDEX IF NOT EXISTS idx_tm_languages ON translation_memory(source_language, target_language);
CREATE INDEX IF NOT EXISTS idx_tm_domain ON translation_memory(domain);
CREATE INDEX IF NOT EXISTS idx_tm_quality ON translation_memory(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_tm_usage ON translation_memory(usage_count DESC);

-- Create tm_matches table for storing fuzzy match results (cache)
CREATE TABLE IF NOT EXISTS tm_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_text TEXT NOT NULL,
    tm_entry_id UUID REFERENCES translation_memory(id) ON DELETE CASCADE,
    match_percentage INTEGER NOT NULL, -- 0-100
    edit_distance INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tm_matches_source ON tm_matches(source_text);
CREATE INDEX IF NOT EXISTS idx_tm_matches_percentage ON tm_matches(match_percentage DESC);

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
    -- For production, you might want to use a more sophisticated algorithm
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
        tm.quality_score,
        tm.usage_count,
        tm.domain,
        tm.created_at
    FROM translation_memory tm
    WHERE 
        tm.source_language = p_source_language
        AND tm.target_language = p_target_language
        AND levenshtein_similarity(p_source_text, tm.source_text) >= p_min_match_percentage
    ORDER BY 
        levenshtein_similarity(p_source_text, tm.source_text) DESC,
        tm.quality_score DESC,
        tm.usage_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to add/update TM entry
CREATE OR REPLACE FUNCTION upsert_tm_entry(
    p_source_text TEXT,
    p_target_text TEXT,
    p_source_language VARCHAR(10),
    p_target_language VARCHAR(10),
    p_domain VARCHAR(100) DEFAULT NULL,
    p_project_id UUID DEFAULT NULL,
    p_created_by UUID DEFAULT NULL,
    p_quality_score INTEGER DEFAULT 0
)
RETURNS UUID AS $$
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
            usage_count = usage_count + 1,
            last_used_at = NOW(),
            updated_at = NOW(),
            quality_score = GREATEST(quality_score, p_quality_score)
        WHERE id = tm_id;
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
            last_used_at
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
            NOW()
        ) RETURNING id INTO tm_id;
    END IF;
    
    RETURN tm_id;
END;
$$ LANGUAGE plpgsql;

-- Function to populate TM from existing segments
CREATE OR REPLACE FUNCTION populate_tm_from_segments()
RETURNS INTEGER AS $$
DECLARE
    segment_record RECORD;
    tm_count INTEGER := 0;
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
            AND s.status = 'completed'
            AND LENGTH(s.source_text) > 5  -- Skip very short segments
            AND LENGTH(s.target_text) > 5
    LOOP
        PERFORM upsert_tm_entry(
            segment_record.source_text,
            segment_record.target_text,
            segment_record.source_language,
            segment_record.target_language,
            segment_record.domain,
            segment_record.project_id,
            segment_record.created_by,
            segment_record.quality_score
        );
        tm_count := tm_count + 1;
    END LOOP;
    
    RETURN tm_count;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for translation_memory
ALTER TABLE translation_memory ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all TM entries (for matching)
CREATE POLICY "Users can read translation memory" ON translation_memory
    FOR SELECT USING (true);

-- Policy: Users can insert TM entries they create
CREATE POLICY "Users can insert their TM entries" ON translation_memory
    FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- Policy: Users can update TM entries they created
CREATE POLICY "Users can update their TM entries" ON translation_memory
    FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

-- Create RLS policies for tm_matches
ALTER TABLE tm_matches ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read and manage their TM matches
CREATE POLICY "Users can manage TM matches" ON tm_matches
    FOR ALL USING (true);

-- Add helpful comments
COMMENT ON TABLE translation_memory IS 'Stores translation memory entries for fuzzy matching and reuse';
COMMENT ON TABLE tm_matches IS 'Caches fuzzy match results for performance';
COMMENT ON FUNCTION find_tm_matches IS 'Finds fuzzy matches for a source text with similarity scoring';
COMMENT ON FUNCTION upsert_tm_entry IS 'Adds or updates a translation memory entry';
COMMENT ON FUNCTION populate_tm_from_segments IS 'Populates TM from existing completed segments';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Translation Memory system created successfully!';
    RAISE NOTICE 'Tables: translation_memory, tm_matches';
    RAISE NOTICE 'Functions: find_tm_matches, upsert_tm_entry, populate_tm_from_segments';
    RAISE NOTICE 'Next: Run populate_tm_from_segments() to import existing translations';
END $$;