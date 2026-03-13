-- Debug script to test MQM annotation saving
-- Run this in Supabase to test if the database accepts MQM data

-- First, let's see the current structure of the annotations table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'annotations' 
AND table_schema = 'public'
AND column_name IN ('mqm_errors', 'mqm_score')
ORDER BY ordinal_position;

-- Check if there are any constraints on MQM fields
SELECT constraint_name, constraint_type, check_clause
FROM information_schema.check_constraints cc
JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
WHERE ccu.table_name = 'annotations'
AND ccu.column_name IN ('mqm_errors', 'mqm_score');

-- Test inserting a simple MQM annotation
-- First get a valid segment and user
SELECT 
    s.id as segment_id,
    s.project_id,
    (SELECT id FROM auth.users LIMIT 1) as user_id
FROM segments s 
LIMIT 1;

-- Try to insert a test MQM annotation (replace the IDs with actual values from above)
-- INSERT INTO annotations (
--     segment_id,
--     project_id, 
--     annotator_id,
--     error_fluency,
--     quality_rating,
--     notes,
--     mqm_errors,
--     mqm_score
-- ) VALUES (
--     'your-segment-id-here',
--     'your-project-id-here',
--     'your-user-id-here',
--     true,
--     3,
--     'Debug test annotation',
--     '[{"id": 123, "category": "Accuracy", "subcategory": "Mistranslation", "severity": "major", "penalty": 5}]'::jsonb,
--     95
-- ) ON CONFLICT (segment_id, annotator_id) DO UPDATE SET
--     mqm_errors = EXCLUDED.mqm_errors,
--     mqm_score = EXCLUDED.mqm_score,
--     notes = EXCLUDED.notes,
--     updated_at = NOW();

-- Check if the insert worked
SELECT id, segment_id, mqm_score, mqm_errors, notes, created_at
FROM annotations 
WHERE notes = 'Debug test annotation'
LIMIT 1;