-- Test script for MQM migration
-- Run this after applying the MQM migration to verify everything works

-- Test 1: Insert a sample annotation with MQM data
INSERT INTO annotations (
    segment_id, 
    project_id, 
    annotator_id,
    error_fluency,
    quality_rating,
    notes,
    mqm_errors,
    mqm_score
) VALUES (
    (SELECT id FROM segments LIMIT 1), -- Use first available segment
    (SELECT id FROM projects LIMIT 1), -- Use first available project  
    (SELECT id FROM auth.users LIMIT 1), -- Use first available user
    true,
    3,
    'Test annotation with MQM data',
    '[
        {
            "id": 1678901234567,
            "category": "Accuracy", 
            "subcategory": "Mistranslation",
            "severity": "major",
            "penalty": 5
        },
        {
            "id": 1678901234568,
            "category": "Fluency",
            "subcategory": "Grammar", 
            "severity": "minor",
            "penalty": 1
        }
    ]'::jsonb,
    94 -- 100 - 5 - 1 = 94
) ON CONFLICT (segment_id, annotator_id) DO UPDATE SET
    mqm_errors = EXCLUDED.mqm_errors,
    mqm_score = EXCLUDED.mqm_score,
    updated_at = NOW();

-- Test 2: Query MQM data
SELECT 
    id,
    segment_id,
    mqm_score,
    jsonb_array_length(mqm_errors) as error_count,
    mqm_errors
FROM annotations 
WHERE mqm_errors IS NOT NULL 
AND jsonb_array_length(mqm_errors) > 0
LIMIT 5;

-- Test 3: Aggregate MQM statistics
SELECT 
    COUNT(*) as total_annotations,
    COUNT(CASE WHEN mqm_score IS NOT NULL THEN 1 END) as mqm_annotations,
    AVG(mqm_score) as avg_mqm_score,
    MIN(mqm_score) as min_mqm_score,
    MAX(mqm_score) as max_mqm_score,
    COUNT(CASE WHEN mqm_score >= 85 THEN 1 END) as excellent_count,
    COUNT(CASE WHEN mqm_score >= 70 AND mqm_score < 85 THEN 1 END) as good_count,
    COUNT(CASE WHEN mqm_score < 70 THEN 1 END) as needs_improvement_count
FROM annotations;

-- Test 4: Query MQM errors by category
SELECT 
    error_category.value ->> 'category' as category,
    error_category.value ->> 'severity' as severity,
    COUNT(*) as error_count
FROM annotations,
     jsonb_array_elements(mqm_errors) as error_category
WHERE mqm_errors IS NOT NULL
GROUP BY 
    error_category.value ->> 'category',
    error_category.value ->> 'severity'
ORDER BY error_count DESC;

-- Test 5: Verify indexes are working
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM annotations 
WHERE mqm_score >= 85 
ORDER BY mqm_score DESC 
LIMIT 10;

-- Clean up test data (optional)
-- DELETE FROM annotations WHERE notes = 'Test annotation with MQM data';