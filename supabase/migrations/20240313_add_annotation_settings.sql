-- Add annotation settings to projects table
-- Allows admins to control which annotation features are visible per project

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS annotation_settings JSONB DEFAULT '{
  "error_types": true,
  "error_severity": false,
  "domain_classification": true,
  "quality_rating": true,
  "translation_effort": false,
  "post_editing_effort": false,
  "ai_quality_rating": false,
  "confidence_score": false,
  "context_audience": false,
  "cultural_adaptation": false,
  "reference_materials": false,
  "suggested_correction": false,
  "notes": true
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN projects.annotation_settings IS 'Controls which annotation features are visible to translators/reviewers. Admin can enable/disable per project.';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_annotation_settings ON projects USING GIN (annotation_settings);

-- Default settings explanation:
-- Enabled by default (basic features):
--   - error_types: Error type checkboxes (fluency, grammar, etc.)
--   - domain_classification: Domain/subdomain selection
--   - quality_rating: 1-5 star rating
--   - notes: Free text notes field
--
-- Disabled by default (advanced features):
--   - error_severity: Minor/Major/Critical severity levels
--   - translation_effort: Easy/Medium/Hard/Very Hard
--   - post_editing_effort: AI post-editing effort tracking
--   - ai_quality_rating: AI translation quality rating
--   - confidence_score: Translator confidence rating
--   - context_audience: Target audience tags
--   - cultural_adaptation: Cultural adaptation level
--   - reference_materials: Resources consulted checkboxes
--   - suggested_correction: Suggested better translation field
