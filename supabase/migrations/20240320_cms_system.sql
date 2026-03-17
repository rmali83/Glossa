-- CMS System Migration
-- Creates tables for Content Management System with multilingual support

-- Create contents table (main content records)
CREATE TABLE IF NOT EXISTS contents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('blog', 'page', 'article')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create content_translations table (multilingual content)
CREATE TABLE IF NOT EXISTS content_translations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_id, language)
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content_categories junction table
CREATE TABLE IF NOT EXISTS content_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(content_id, category_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contents_type ON contents(type);
CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status);
CREATE INDEX IF NOT EXISTS idx_contents_created_at ON contents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contents_updated_at ON contents(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_translations_content_id ON content_translations(content_id);
CREATE INDEX IF NOT EXISTS idx_content_translations_language ON content_translations(language);
CREATE INDEX IF NOT EXISTS idx_content_translations_slug ON content_translations(slug);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

CREATE INDEX IF NOT EXISTS idx_content_categories_content_id ON content_categories(content_id);
CREATE INDEX IF NOT EXISTS idx_content_categories_category_id ON content_categories(category_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_contents_updated_at
    BEFORE UPDATE ON contents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_translations_updated_at
    BEFORE UPDATE ON content_translations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;

-- Policies for contents
CREATE POLICY "Users can view all contents" ON contents
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own contents" ON contents
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own contents" ON contents
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own contents" ON contents
    FOR DELETE USING (created_by = auth.uid());

-- Policies for content_translations
CREATE POLICY "Users can view all content translations" ON content_translations
    FOR SELECT USING (true);

CREATE POLICY "Users can manage translations for their contents" ON content_translations
    FOR ALL USING (
        content_id IN (
            SELECT id FROM contents WHERE created_by = auth.uid()
        )
    );

-- Policies for categories
CREATE POLICY "Users can view all categories" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage categories" ON categories
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Policies for content_categories
CREATE POLICY "Users can view all content categories" ON content_categories
    FOR SELECT USING (true);

CREATE POLICY "Users can manage categories for their contents" ON content_categories
    FOR ALL USING (
        content_id IN (
            SELECT id FROM contents WHERE created_by = auth.uid()
        )
    );

-- Insert default categories
INSERT INTO categories (name) VALUES 
    ('General'),
    ('News'),
    ('Tutorial'),
    ('Documentation'),
    ('Blog')
ON CONFLICT (name) DO NOTHING;

-- Function to get content with default language translation
CREATE OR REPLACE FUNCTION get_content_with_translation(
    p_content_id UUID,
    p_language VARCHAR(10) DEFAULT 'en'
)
RETURNS TABLE (
    id UUID,
    type VARCHAR(20),
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    title TEXT,
    body TEXT,
    slug TEXT,
    language VARCHAR(10)
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.type,
        c.status,
        c.created_at,
        c.updated_at,
        COALESCE(ct.title, ct_default.title) as title,
        COALESCE(ct.body, ct_default.body) as body,
        COALESCE(ct.slug, ct_default.slug) as slug,
        COALESCE(ct.language, ct_default.language) as language
    FROM contents c
    LEFT JOIN content_translations ct ON c.id = ct.content_id AND ct.language = p_language
    LEFT JOIN content_translations ct_default ON c.id = ct_default.content_id AND ct_default.language = 'en'
    WHERE c.id = p_content_id;
END;
$ LANGUAGE plpgsql;

-- Function to get all contents with their default language translations
CREATE OR REPLACE FUNCTION get_all_contents_with_translations()
RETURNS TABLE (
    id UUID,
    type VARCHAR(20),
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    title TEXT,
    language VARCHAR(10),
    available_languages TEXT[]
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.type,
        c.status,
        c.created_at,
        c.updated_at,
        ct.title,
        ct.language,
        ARRAY_AGG(DISTINCT ct_all.language) as available_languages
    FROM contents c
    LEFT JOIN content_translations ct ON c.id = ct.content_id AND ct.language = 'en'
    LEFT JOIN content_translations ct_all ON c.id = ct_all.content_id
    GROUP BY c.id, c.type, c.status, c.created_at, c.updated_at, ct.title, ct.language
    ORDER BY c.updated_at DESC;
END;
$ LANGUAGE plpgsql;