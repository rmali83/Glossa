-- Add MQM (Multidimensional Quality Metrics) fields to annotations table
-- This migration adds support for MQM evaluation system

-- Add MQM fields
ALTER TABLE annotations
ADD COLUMN IF NOT EXISTS mqm_errors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS mqm_score INTEGER DEFAULT 100 CHECK (mqm_score >= 0 AND mqm_score <= 100);

-- Add comments for documentation
COMMENT ON COLUMN annotations.mqm_errors IS 'Array of MQM errors with category, subcategory, severity, and penalty points';
COMMENT ON COLUMN annotations.mqm_score IS 'MQM score (0-100): starts at 100, deducts penalty points for errors';

-- Create index for faster MQM queries
CREATE INDEX IF NOT EXISTS idx_annotations_mqm_score ON annotations (mqm_score);
CREATE INDEX IF NOT EXISTS idx_annotations_mqm_errors ON annotations USING GIN (mqm_errors);

-- Example MQM error structure (for documentation):
-- mqm_errors format:
-- [
--   {
--     "id": 1678901234567,
--     "category": "Accuracy",
--     "subcategory": "Mistranslation", 
--     "severity": "major",
--     "penalty": 5
--   }
-- ]

-- MQM Categories and Subcategories (for reference):
-- Accuracy: Addition, Omission, Mistranslation, Untranslated, Do not translate
-- Fluency: Inconsistency, Grammar, Register, Spelling, Typography, Locale convention  
-- Terminology: Inconsistent use, Wrong term
-- Style: Awkward, Unnatural
-- Locale Convention: Address format, Date format, Currency, Telephone format, Time format, Name format
-- Other: Non-translation, Client style, Verity

-- MQM Severity Levels:
-- Minor: -1 point
-- Major: -5 points  
-- Critical: -10 points

-- MQM Score Ranges:
-- 85-100: Excellent
-- 70-84: Good
-- 0-69: Needs Improvement