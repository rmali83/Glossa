-- Add job-related fields to projects table
-- This allows projects to function as job postings with payment and deadline info

-- Add pay rate per word (in cents or smallest currency unit)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS pay_rate_per_word DECIMAL(10, 4) DEFAULT 0;

-- Add total word count (calculated from uploaded files)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS total_words INTEGER DEFAULT 0;

-- Add deadline for job completion
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;

-- Add job status (draft, posted, in_progress, completed, cancelled)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS job_status VARCHAR(50) DEFAULT 'draft';

-- Add total payment amount (calculated: total_words * pay_rate_per_word)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS total_payment DECIMAL(10, 2) DEFAULT 0;

-- Add job description/instructions
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS job_description TEXT;

-- Add specialization/category
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS specialization VARCHAR(100);

-- Add difficulty level
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(50) DEFAULT 'standard';

-- Create index for job queries
CREATE INDEX IF NOT EXISTS idx_projects_job_status ON public.projects(job_status);
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON public.projects(deadline);

COMMENT ON COLUMN public.projects.pay_rate_per_word IS 'Payment per word in smallest currency unit (e.g., cents)';
COMMENT ON COLUMN public.projects.total_words IS 'Total word count from all uploaded files';
COMMENT ON COLUMN public.projects.deadline IS 'Job completion deadline';
COMMENT ON COLUMN public.projects.job_status IS 'Job posting status: draft, posted, in_progress, completed, cancelled';
COMMENT ON COLUMN public.projects.total_payment IS 'Total payment amount (total_words * pay_rate_per_word)';
