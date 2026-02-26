-- 1. UPDATE EXISTING PROJECTS TABLE
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS source_language VARCHAR(50);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS target_language VARCHAR(50);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS translator_id UUID REFERENCES auth.users(id);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES auth.users(id);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'assigned';

-- 2. CAT SEGMENTS TABLE
CREATE TABLE IF NOT EXISTS public.segments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    segment_number INTEGER NOT NULL,
    source_text TEXT NOT NULL,
    target_text TEXT DEFAULT '',
    status VARCHAR(50) DEFAULT 'Draft', 
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for fast loading of segments inside the CAT Tool editor
CREATE INDEX IF NOT EXISTS idx_segments_project_id ON public.segments(project_id);

-- 3. REVIEWER COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.segment_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    segment_id UUID REFERENCES public.segments(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id),
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. TRANSLATION MEMORY (TM) TABLE
CREATE TABLE IF NOT EXISTS public.translation_memory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_language VARCHAR(50) NOT NULL,
    target_language VARCHAR(50) NOT NULL,
    source_text TEXT NOT NULL,
    target_text TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Force columns in case table existed earlier without them
ALTER TABLE public.translation_memory ADD COLUMN IF NOT EXISTS source_language VARCHAR(50);
ALTER TABLE public.translation_memory ADD COLUMN IF NOT EXISTS target_language VARCHAR(50);
ALTER TABLE public.translation_memory ADD COLUMN IF NOT EXISTS source_text TEXT;
ALTER TABLE public.translation_memory ADD COLUMN IF NOT EXISTS target_text TEXT;
ALTER TABLE public.translation_memory ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_tm_languages ON public.translation_memory(source_language, target_language);

-- 5. GLOSSARY TABLE
CREATE TABLE IF NOT EXISTS public.glossary_terms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    term VARCHAR(255) NOT NULL,
    translation VARCHAR(255) NOT NULL,
    source_language VARCHAR(50),
    target_language VARCHAR(50),
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Force columns in case table existed earlier without them
ALTER TABLE public.glossary_terms ADD COLUMN IF NOT EXISTS term VARCHAR(255);
ALTER TABLE public.glossary_terms ADD COLUMN IF NOT EXISTS translation VARCHAR(255);
ALTER TABLE public.glossary_terms ADD COLUMN IF NOT EXISTS source_language VARCHAR(50);
ALTER TABLE public.glossary_terms ADD COLUMN IF NOT EXISTS target_language VARCHAR(50);

-- 6. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    link VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. ENABLE RLS POLICIES
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view assigned segments" ON public.segments;
DROP POLICY IF EXISTS "Users can update assigned segments" ON public.segments;

CREATE POLICY "Users can view assigned segments" 
ON public.segments FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = segments.project_id 
        AND (projects.translator_id = auth.uid() OR projects.reviewer_id = auth.uid() OR projects.created_by = auth.uid())
    )
);

CREATE POLICY "Users can update assigned segments" 
ON public.segments FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = segments.project_id 
        AND (projects.translator_id = auth.uid() OR projects.reviewer_id = auth.uid() OR projects.created_by = auth.uid())
    )
);
