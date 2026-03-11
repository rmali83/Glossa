-- =====================================================
-- Phase 1: Annotation & Dataset Capture System
-- =====================================================
-- This migration adds tables for:
-- 1. Annotations (error tagging & quality control)
-- 2. Post-edits (track human corrections)
-- 3. Dataset logs (aggregated training data)
-- =====================================================

-- =====================================================
-- Table: annotations
-- Purpose: Store quality annotations and error tags per segment
-- =====================================================
CREATE TABLE IF NOT EXISTS public.annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id UUID NOT NULL REFERENCES public.segments(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Error Type Flags
    error_fluency BOOLEAN DEFAULT FALSE,
    error_grammar BOOLEAN DEFAULT FALSE,
    error_terminology BOOLEAN DEFAULT FALSE,
    error_style BOOLEAN DEFAULT FALSE,
    error_accuracy BOOLEAN DEFAULT FALSE,
    error_other BOOLEAN DEFAULT FALSE,
    
    -- Domain Classification
    domain TEXT, -- e.g., 'Legal', 'Medical', 'Technical', 'General', 'Marketing'
    
    -- Quality Rating (1-5 scale)
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    
    -- Additional Notes
    notes TEXT,
    
    -- Metadata
    annotator_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT unique_segment_annotation UNIQUE (segment_id, annotator_id)
);

-- Create indexes for annotations
CREATE INDEX idx_annotations_segment_id ON public.annotations(segment_id);
CREATE INDEX idx_annotations_project_id ON public.annotations(project_id);
CREATE INDEX idx_annotations_annotator_id ON public.annotations(annotator_id);
CREATE INDEX idx_annotations_domain ON public.annotations(domain);
CREATE INDEX idx_annotations_created_at ON public.annotations(created_at);

-- =====================================================
-- Table: post_edits
-- Purpose: Track what changed from AI translation to human translation
-- =====================================================
CREATE TABLE IF NOT EXISTS public.post_edits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id UUID NOT NULL REFERENCES public.segments(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Translation Versions
    ai_translation TEXT, -- Original AI/MT output
    human_translation TEXT NOT NULL, -- Final human-edited translation
    
    -- Edit Metrics
    edit_distance INTEGER, -- Levenshtein distance between AI and human
    edit_time_seconds INTEGER, -- Time spent editing (optional)
    
    -- Metadata
    editor_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT unique_segment_edit UNIQUE (segment_id)
);

-- Create indexes for post_edits
CREATE INDEX idx_post_edits_segment_id ON public.post_edits(segment_id);
CREATE INDEX idx_post_edits_project_id ON public.post_edits(project_id);
CREATE INDEX idx_post_edits_editor_id ON public.post_edits(editor_id);
CREATE INDEX idx_post_edits_created_at ON public.post_edits(created_at);

-- =====================================================
-- Table: dataset_logs
-- Purpose: Aggregated training data for AI model fine-tuning
-- =====================================================
CREATE TABLE IF NOT EXISTS public.dataset_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id UUID NOT NULL REFERENCES public.segments(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Source & Target
    source_text TEXT NOT NULL,
    source_language TEXT NOT NULL,
    target_language TEXT NOT NULL,
    
    -- Translation Versions
    ai_translation TEXT, -- Original AI/MT output
    human_translation TEXT NOT NULL, -- Final human translation
    
    -- Annotations (denormalized for easy export)
    has_errors BOOLEAN DEFAULT FALSE,
    error_types TEXT[], -- Array of error types: ['fluency', 'grammar', etc.]
    domain TEXT,
    quality_rating INTEGER,
    annotation_notes TEXT,
    
    -- Edit Metrics
    edit_distance INTEGER,
    edit_time_seconds INTEGER,
    
    -- Metadata
    translator_id UUID REFERENCES auth.users(id),
    annotator_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Export tracking
    exported BOOLEAN DEFAULT FALSE,
    export_date TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for filtering and export
    CONSTRAINT unique_dataset_segment UNIQUE (segment_id)
);

-- Create indexes for dataset_logs
CREATE INDEX idx_dataset_logs_project_id ON public.dataset_logs(project_id);
CREATE INDEX idx_dataset_logs_source_language ON public.dataset_logs(source_language);
CREATE INDEX idx_dataset_logs_target_language ON public.dataset_logs(target_language);
CREATE INDEX idx_dataset_logs_domain ON public.dataset_logs(domain);
CREATE INDEX idx_dataset_logs_has_errors ON public.dataset_logs(has_errors);
CREATE INDEX idx_dataset_logs_quality_rating ON public.dataset_logs(quality_rating);
CREATE INDEX idx_dataset_logs_created_at ON public.dataset_logs(created_at);
CREATE INDEX idx_dataset_logs_exported ON public.dataset_logs(exported);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_logs ENABLE ROW LEVEL SECURITY;

-- Annotations Policies
CREATE POLICY "Users can view annotations for their projects"
    ON public.annotations FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE translator_id = auth.uid() 
            OR reviewer_id = auth.uid() 
            OR created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create annotations for their segments"
    ON public.annotations FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE translator_id = auth.uid() 
            OR reviewer_id = auth.uid() 
            OR created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update their own annotations"
    ON public.annotations FOR UPDATE
    USING (annotator_id = auth.uid());

-- Post-edits Policies
CREATE POLICY "Users can view post-edits for their projects"
    ON public.post_edits FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE translator_id = auth.uid() 
            OR reviewer_id = auth.uid() 
            OR created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create post-edits for their segments"
    ON public.post_edits FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE translator_id = auth.uid() 
            OR reviewer_id = auth.uid() 
            OR created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update their own post-edits"
    ON public.post_edits FOR UPDATE
    USING (editor_id = auth.uid());

-- Dataset Logs Policies (Admin only for export)
CREATE POLICY "Admins can view all dataset logs"
    ON public.dataset_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND user_type = 'Agencies'
        )
        OR auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE email = 'rmali@live.com'
        )
    );

CREATE POLICY "System can insert dataset logs"
    ON public.dataset_logs FOR INSERT
    WITH CHECK (true); -- Allow system to insert

CREATE POLICY "Admins can update dataset logs"
    ON public.dataset_logs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND user_type = 'Agencies'
        )
        OR auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE email = 'rmali@live.com'
        )
    );

-- =====================================================
-- Trigger: Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_annotations_updated_at
    BEFORE UPDATE ON public.annotations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE public.annotations IS 'Stores quality annotations and error tags for translation segments';
COMMENT ON TABLE public.post_edits IS 'Tracks changes from AI translation to human-edited translation';
COMMENT ON TABLE public.dataset_logs IS 'Aggregated training data for AI model fine-tuning and export';

COMMENT ON COLUMN public.annotations.error_fluency IS 'Flag for fluency/naturalness errors';
COMMENT ON COLUMN public.annotations.error_grammar IS 'Flag for grammatical errors';
COMMENT ON COLUMN public.annotations.error_terminology IS 'Flag for terminology/domain-specific errors';
COMMENT ON COLUMN public.annotations.error_style IS 'Flag for style/tone errors';
COMMENT ON COLUMN public.annotations.quality_rating IS 'Overall quality rating from 1 (poor) to 5 (excellent)';

COMMENT ON COLUMN public.dataset_logs.error_types IS 'Array of error type strings for easy filtering';
COMMENT ON COLUMN public.dataset_logs.exported IS 'Flag to track if this entry has been exported for training';
