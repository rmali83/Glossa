-- Add helper functions for MQM statistics and analysis

-- Function to get MQM statistics for a project
CREATE OR REPLACE FUNCTION get_mqm_statistics(project_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    total_annotations BIGINT,
    mqm_annotations BIGINT,
    avg_mqm_score NUMERIC,
    min_mqm_score INTEGER,
    max_mqm_score INTEGER,
    excellent_count BIGINT,
    good_count BIGINT,
    needs_improvement_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_annotations,
        COUNT(CASE WHEN a.mqm_score IS NOT NULL THEN 1 END) as mqm_annotations,
        ROUND(AVG(a.mqm_score), 2) as avg_mqm_score,
        MIN(a.mqm_score) as min_mqm_score,
        MAX(a.mqm_score) as max_mqm_score,
        COUNT(CASE WHEN a.mqm_score >= 85 THEN 1 END) as excellent_count,
        COUNT(CASE WHEN a.mqm_score >= 70 AND a.mqm_score < 85 THEN 1 END) as good_count,
        COUNT(CASE WHEN a.mqm_score < 70 THEN 1 END) as needs_improvement_count
    FROM annotations a
    WHERE (project_uuid IS NULL OR a.project_id = project_uuid);
END;
$$ LANGUAGE plpgsql;

-- Function to get MQM error breakdown by category
CREATE OR REPLACE FUNCTION get_mqm_error_breakdown(project_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    category TEXT,
    subcategory TEXT,
    severity TEXT,
    error_count BIGINT,
    total_penalty INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        error_data.value ->> 'category' as category,
        error_data.value ->> 'subcategory' as subcategory,
        error_data.value ->> 'severity' as severity,
        COUNT(*) as error_count,
        SUM((error_data.value ->> 'penalty')::INTEGER) as total_penalty
    FROM annotations a,
         jsonb_array_elements(a.mqm_errors) as error_data
    WHERE a.mqm_errors IS NOT NULL
    AND (project_uuid IS NULL OR a.project_id = project_uuid)
    GROUP BY 
        error_data.value ->> 'category',
        error_data.value ->> 'subcategory',
        error_data.value ->> 'severity'
    ORDER BY error_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get translator MQM performance
CREATE OR REPLACE FUNCTION get_translator_mqm_performance(project_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    annotator_id UUID,
    annotator_email TEXT,
    total_annotations BIGINT,
    avg_mqm_score NUMERIC,
    excellent_count BIGINT,
    good_count BIGINT,
    needs_improvement_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.annotator_id,
        u.email as annotator_email,
        COUNT(*) as total_annotations,
        ROUND(AVG(a.mqm_score), 2) as avg_mqm_score,
        COUNT(CASE WHEN a.mqm_score >= 85 THEN 1 END) as excellent_count,
        COUNT(CASE WHEN a.mqm_score >= 70 AND a.mqm_score < 85 THEN 1 END) as good_count,
        COUNT(CASE WHEN a.mqm_score < 70 THEN 1 END) as needs_improvement_count
    FROM annotations a
    LEFT JOIN auth.users u ON a.annotator_id = u.id
    WHERE a.mqm_score IS NOT NULL
    AND (project_uuid IS NULL OR a.project_id = project_uuid)
    GROUP BY a.annotator_id, u.email
    ORDER BY avg_mqm_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate MQM score from errors array
CREATE OR REPLACE FUNCTION calculate_mqm_score(errors JSONB)
RETURNS INTEGER AS $$
DECLARE
    total_penalty INTEGER := 0;
    error_record JSONB;
BEGIN
    -- Start with perfect score
    total_penalty := 0;
    
    -- Sum up all penalty points
    FOR error_record IN SELECT jsonb_array_elements(errors)
    LOOP
        total_penalty := total_penalty + COALESCE((error_record ->> 'penalty')::INTEGER, 0);
    END LOOP;
    
    -- Return score (100 - penalties, minimum 0)
    RETURN GREATEST(0, 100 - total_penalty);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_mqm_statistics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_mqm_error_breakdown(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_translator_mqm_performance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_mqm_score(JSONB) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_mqm_statistics(UUID) IS 'Get MQM statistics for all projects or a specific project';
COMMENT ON FUNCTION get_mqm_error_breakdown(UUID) IS 'Get breakdown of MQM errors by category, subcategory, and severity';
COMMENT ON FUNCTION get_translator_mqm_performance(UUID) IS 'Get MQM performance metrics per translator';
COMMENT ON FUNCTION calculate_mqm_score(JSONB) IS 'Calculate MQM score from errors array (100 - total penalties)';