-- Automated Translation System Migration
-- Creates tables and functions for automated website translation

-- Create automated_sites table for monitoring websites
CREATE TABLE IF NOT EXISTS automated_sites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    domain VARCHAR(255) NOT NULL UNIQUE,
    source_language VARCHAR(10) NOT NULL,
    target_languages TEXT[] NOT NULL,
    scan_interval INTEGER DEFAULT 300000, -- 5 minutes in milliseconds
    last_scan TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disabled', 'error')),
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create content_changes table for tracking website changes
CREATE TABLE IF NOT EXISTS content_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id UUID REFERENCES automated_sites(id) ON DELETE CASCADE,
    selector VARCHAR(500) NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    content_text TEXT NOT NULL,
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('added', 'modified', 'deleted', 'current')),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed', 'archived'))
);

-- Create translation_deployments table for tracking deployments
CREATE TABLE IF NOT EXISTS translation_deployments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id UUID REFERENCES automated_sites(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    deployment_method VARCHAR(20) DEFAULT 'javascript' CHECK (deployment_method IN ('javascript', 'api', 'cdn', 'webhook')),
    deployment_url TEXT,
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'failed')),
    config JSONB DEFAULT '{}'
);

-- Create string_cache table for client-side translation caching
CREATE TABLE IF NOT EXISTS string_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    site_id UUID REFERENCES automated_sites(id) ON DELETE CASCADE,
    source_text TEXT NOT NULL,
    source_language VARCHAR(10) NOT NULL,
    target_text TEXT NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    selector VARCHAR(500),
    context JSONB DEFAULT '{}',
    hash VARCHAR(64) NOT NULL,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add automated_site_id to projects table for linking
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'automated_site_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN automated_site_id UUID REFERENCES automated_sites(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_automated_sites_domain ON automated_sites(domain);
CREATE INDEX IF NOT EXISTS idx_automated_sites_status ON automated_sites(status);
CREATE INDEX IF NOT EXISTS idx_automated_sites_last_scan ON automated_sites(last_scan);

CREATE INDEX IF NOT EXISTS idx_content_changes_site_id ON content_changes(site_id);
CREATE INDEX IF NOT EXISTS idx_content_changes_status ON content_changes(status);
CREATE INDEX IF NOT EXISTS idx_content_changes_detected_at ON content_changes(detected_at);
CREATE INDEX IF NOT EXISTS idx_content_changes_selector ON content_changes(selector);
CREATE INDEX IF NOT EXISTS idx_content_changes_hash ON content_changes(content_hash);

CREATE INDEX IF NOT EXISTS idx_translation_deployments_site_id ON translation_deployments(site_id);
CREATE INDEX IF NOT EXISTS idx_translation_deployments_language ON translation_deployments(language);
CREATE INDEX IF NOT EXISTS idx_translation_deployments_status ON translation_deployments(status);

CREATE INDEX IF NOT EXISTS idx_string_cache_site_id ON string_cache(site_id);
CREATE INDEX IF NOT EXISTS idx_string_cache_hash ON string_cache(hash);
CREATE INDEX IF NOT EXISTS idx_string_cache_languages ON string_cache(source_language, target_language);
CREATE INDEX IF NOT EXISTS idx_string_cache_selector ON string_cache(selector);
CREATE INDEX IF NOT EXISTS idx_string_cache_usage ON string_cache(usage_count DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_automated_sites_updated_at
    BEFORE UPDATE ON automated_sites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_string_cache_updated_at
    BEFORE UPDATE ON string_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to find cached translations
CREATE OR REPLACE FUNCTION find_cached_translation(
    p_site_id UUID,
    p_source_text TEXT,
    p_source_language VARCHAR(10),
    p_target_language VARCHAR(10)
)
RETURNS TABLE (
    translation TEXT,
    selector VARCHAR(500),
    context JSONB,
    usage_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.target_text,
        sc.selector,
        sc.context,
        sc.usage_count
    FROM string_cache sc
    WHERE 
        sc.site_id = p_site_id
        AND sc.source_text = p_source_text
        AND sc.source_language = p_source_language
        AND sc.target_language = p_target_language
    ORDER BY sc.usage_count DESC, sc.updated_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to upsert cached translation
CREATE OR REPLACE FUNCTION upsert_cached_translation(
    p_site_id UUID,
    p_source_text TEXT,
    p_source_language VARCHAR(10),
    p_target_text TEXT,
    p_target_language VARCHAR(10),
    p_selector VARCHAR(500) DEFAULT NULL,
    p_context JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_hash VARCHAR(64);
    v_cache_id UUID;
BEGIN
    -- Generate hash for the source text
    v_hash := encode(digest(p_source_text, 'sha256'), 'hex');
    
    -- Try to update existing record
    UPDATE string_cache 
    SET 
        target_text = p_target_text,
        selector = COALESCE(p_selector, selector),
        context = p_context,
        usage_count = usage_count + 1,
        last_used_at = NOW(),
        updated_at = NOW()
    WHERE 
        site_id = p_site_id
        AND source_text = p_source_text
        AND source_language = p_source_language
        AND target_language = p_target_language
    RETURNING id INTO v_cache_id;
    
    -- If no existing record, insert new one
    IF v_cache_id IS NULL THEN
        INSERT INTO string_cache (
            site_id,
            source_text,
            source_language,
            target_text,
            target_language,
            selector,
            context,
            hash,
            usage_count
        ) VALUES (
            p_site_id,
            p_source_text,
            p_source_language,
            p_target_text,
            p_target_language,
            p_selector,
            p_context,
            v_hash,
            1
        ) RETURNING id INTO v_cache_id;
    END IF;
    
    RETURN v_cache_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get site translation statistics
CREATE OR REPLACE FUNCTION get_site_translation_stats(p_site_id UUID)
RETURNS TABLE (
    total_strings INTEGER,
    translated_strings INTEGER,
    languages TEXT[],
    last_deployment TIMESTAMP WITH TIME ZONE,
    cache_size INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT sc.source_text)::INTEGER as total_strings,
        COUNT(DISTINCT CASE WHEN sc.target_text IS NOT NULL AND sc.target_text != '' THEN sc.source_text END)::INTEGER as translated_strings,
        ARRAY_AGG(DISTINCT sc.target_language) as languages,
        MAX(td.deployed_at) as last_deployment,
        COUNT(*)::INTEGER as cache_size
    FROM string_cache sc
    LEFT JOIN translation_deployments td ON td.site_id = sc.site_id
    WHERE sc.site_id = p_site_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE automated_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE string_cache ENABLE ROW LEVEL SECURITY;

-- Policies for automated_sites
CREATE POLICY "Users can view their own automated sites" ON automated_sites
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own automated sites" ON automated_sites
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own automated sites" ON automated_sites
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own automated sites" ON automated_sites
    FOR DELETE USING (created_by = auth.uid());

-- Policies for content_changes
CREATE POLICY "Users can view content changes for their sites" ON content_changes
    FOR SELECT USING (
        site_id IN (
            SELECT id FROM automated_sites WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "System can insert content changes" ON content_changes
    FOR INSERT WITH CHECK (true); -- Allow system inserts

-- Policies for translation_deployments
CREATE POLICY "Users can view deployments for their sites" ON translation_deployments
    FOR SELECT USING (
        site_id IN (
            SELECT id FROM automated_sites WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "System can manage deployments" ON translation_deployments
    FOR ALL USING (true); -- Allow system management

-- Policies for string_cache
CREATE POLICY "Users can view cache for their sites" ON string_cache
    FOR SELECT USING (
        site_id IN (
            SELECT id FROM automated_sites WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "System can manage string cache" ON string_cache
    FOR ALL USING (true); -- Allow system management

-- Insert default configuration
INSERT INTO automated_sites (domain, source_language, target_languages, config, created_by)
VALUES (
    'example.com',
    'en',
    ARRAY['es', 'fr', 'de'],
    '{
        "excludeSelectors": [".no-translate", "code", "pre"],
        "scanInterval": 300000,
        "deploymentMethod": "javascript",
        "autoPublish": true
    }',
    NULL
) ON CONFLICT (domain) DO NOTHING;