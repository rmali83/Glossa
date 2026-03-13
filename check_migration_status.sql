-- Check migration status and database readiness for MQM
-- Run this to verify all migrations have been applied correctly

-- 1. Check if annotations table exists and has all required columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'annotations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if MQM-specific columns exist
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'annotations' 
            AND column_name = 'mqm_errors'
        ) THEN '✅ mqm_errors column exists'
        ELSE '❌ mqm_errors column missing'
    END as mqm_errors_status,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'annotations' 
            AND column_name = 'mqm_score'
        ) THEN '✅ mqm_score column exists'
        ELSE '❌ mqm_score column missing'
    END as mqm_score_status;

-- 3. Check if MQM indexes exist
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'annotations' 
AND (indexname LIKE '%mqm%' OR indexdef LIKE '%mqm%');

-- 4. Check if MQM functions exist
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%mqm%'
ORDER BY routine_name;

-- 5. Check current annotation data
SELECT 
    COUNT(*) as total_annotations,
    COUNT(CASE WHEN mqm_score IS NOT NULL THEN 1 END) as annotations_with_mqm,
    COUNT(CASE WHEN mqm_errors IS NOT NULL AND jsonb_array_length(mqm_errors) > 0 THEN 1 END) as annotations_with_errors,
    AVG(mqm_score) as avg_mqm_score
FROM annotations;

-- 6. Check if we can insert MQM data (test)
-- This will show if constraints and data types are working
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.check_constraints 
            WHERE constraint_name LIKE '%mqm_score%'
        ) THEN '✅ MQM score constraints exist'
        ELSE '❌ MQM score constraints missing'
    END as constraint_status;

-- 7. Test MQM functions (if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_mqm_statistics') THEN
        RAISE NOTICE '✅ Testing get_mqm_statistics function...';
        PERFORM get_mqm_statistics();
        RAISE NOTICE '✅ get_mqm_statistics function works';
    ELSE
        RAISE NOTICE '❌ get_mqm_statistics function not found';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error testing MQM functions: %', SQLERRM;
END $$;

-- 8. Show sample MQM data structure (if any exists)
SELECT 
    id,
    segment_id,
    mqm_score,
    jsonb_pretty(mqm_errors) as mqm_errors_formatted,
    created_at
FROM annotations 
WHERE mqm_errors IS NOT NULL 
AND jsonb_array_length(mqm_errors) > 0
LIMIT 3;

-- 9. Migration readiness summary
SELECT 
    '🎯 MIGRATION STATUS SUMMARY' as status,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.columns 
            WHERE table_name = 'annotations' 
            AND column_name IN ('mqm_errors', 'mqm_score')
        ) = 2 THEN '✅ READY FOR PRODUCTION'
        ELSE '❌ MIGRATION NEEDED'
    END as readiness;