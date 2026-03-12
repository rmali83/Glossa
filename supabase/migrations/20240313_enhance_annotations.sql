-- Enhanced Annotation Features
-- Add new columns to annotations table

-- Add severity levels for each error type
ALTER TABLE annotations
ADD COLUMN IF NOT EXISTS error_fluency_severity VARCHAR(20),
ADD COLUMN IF NOT EXISTS error_grammar_severity VARCHAR(20),
ADD COLUMN IF NOT EXISTS error_terminology_severity VARCHAR(20),
ADD COLUMN IF NOT EXISTS error_style_severity VARCHAR(20),
ADD COLUMN IF NOT EXISTS error_accuracy_severity VARCHAR(20);

-- Add effort tracking
ALTER TABLE annotations
ADD COLUMN IF NOT EXISTS translation_effort VARCHAR(50),
ADD COLUMN IF NOT EXISTS post_editing_effort VARCHAR(50);

-- Add AI translation quality
ALTER TABLE annotations
ADD COLUMN IF NOT EXISTS ai_translation_quality INTEGER CHECK (ai_translation_quality >= 1 AND ai_translation_quality <= 5),
ADD COLUMN IF NOT EXISTS ai_helpfulness VARCHAR(50);

-- Add confidence score
ALTER TABLE annotations
ADD COLUMN IF NOT EXISTS confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 5),
ADD COLUMN IF NOT EXISTS uncertain_about TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN annotations.error_fluency_severity IS 'Severity: minor, major, critical';
COMMENT ON COLUMN annotations.translation_effort IS 'Effort: easy, medium, hard, very_hard';
COMMENT ON COLUMN annotations.post_editing_effort IS 'PE Effort: no_editing, light_editing, heavy_editing, complete_retranslation';
COMMENT ON COLUMN annotations.ai_translation_quality IS 'AI quality rating 1-5 stars';
COMMENT ON COLUMN annotations.ai_helpfulness IS 'AI helpfulness: very_helpful, helpful, somewhat_helpful, not_helpful';
COMMENT ON COLUMN annotations.confidence_score IS 'Translator confidence 1-5 stars';
COMMENT ON COLUMN annotations.uncertain_about IS 'Array of uncertainty areas: terminology, grammar, cultural, technical';
