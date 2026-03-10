-- Add segment_number column to segments table
-- This column is required for ordering segments within a project

-- Add the column if it doesn't exist
ALTER TABLE public.segments 
ADD COLUMN IF NOT EXISTS segment_number INTEGER;

-- Set default values for existing rows (ordered by created_at)
WITH numbered_segments AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at) as row_num
  FROM public.segments
  WHERE segment_number IS NULL
)
UPDATE public.segments s
SET segment_number = ns.row_num
FROM numbered_segments ns
WHERE s.id = ns.id;

-- Make it NOT NULL after setting values
ALTER TABLE public.segments 
ALTER COLUMN segment_number SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_segments_project_segment_number 
ON public.segments(project_id, segment_number);

-- Add comment
COMMENT ON COLUMN public.segments.segment_number IS 'Sequential number of segment within the project for ordering';
