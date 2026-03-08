-- Add file-related columns to segments table for upload integration
-- This allows segments to be linked to uploaded files

-- Add file_id column to link segments to uploaded files
ALTER TABLE public.segments 
ADD COLUMN IF NOT EXISTS file_id UUID REFERENCES public.project_files(id) ON DELETE SET NULL;

-- Add segment_key for localization formats (JSON, PO, etc.)
ALTER TABLE public.segments 
ADD COLUMN IF NOT EXISTS segment_key TEXT;

-- Add metadata for storing timing info (subtitles), formatting, etc.
ALTER TABLE public.segments 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add original_format to track source file type
ALTER TABLE public.segments 
ADD COLUMN IF NOT EXISTS original_format VARCHAR(50);

-- Create index for fast file-based queries
CREATE INDEX IF NOT EXISTS idx_segments_file_id ON public.segments(file_id);

-- Make segment_number nullable since it's auto-generated from index
ALTER TABLE public.segments 
ALTER COLUMN segment_number DROP NOT NULL;

COMMENT ON COLUMN public.segments.file_id IS 'Links segment to uploaded file';
COMMENT ON COLUMN public.segments.segment_key IS 'Key for localization formats (e.g., "app.title")';
COMMENT ON COLUMN public.segments.metadata IS 'JSON metadata for timing, formatting, etc.';
COMMENT ON COLUMN public.segments.original_format IS 'Source file format (txt, json, csv, etc.)';
