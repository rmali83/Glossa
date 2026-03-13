-- Enhanced User Management System Migration
-- Adds certification levels, skills tracking, and performance metrics

-- Add certification and skills columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS certification_level VARCHAR(50) DEFAULT 'Junior',
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS specializations TEXT[],
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS performance_score DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS total_words_translated INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_projects_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_quality_score DECIMAL(3,2) DEFAULT 0.0;

-- Create user_certifications table for tracking certifications
CREATE TABLE IF NOT EXISTS user_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    certification_name VARCHAR(200) NOT NULL,
    issuing_organization VARCHAR(200),
    issue_date DATE,
    expiry_date DATE,
    credential_id VARCHAR(100),
    credential_url TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_skills table for detailed skill tracking
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    skill_category VARCHAR(50), -- 'language', 'tool', 'domain', 'technical'
    proficiency_level INTEGER CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
    years_experience INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, skill_name)
);

-- Create user_performance_metrics table for detailed tracking
CREATE TABLE IF NOT EXISTS user_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    words_translated INTEGER DEFAULT 0,
    segments_completed INTEGER DEFAULT 0,
    projects_completed INTEGER DEFAULT 0,
    average_quality_score DECIMAL(3,2) DEFAULT 0.0,
    error_rate DECIMAL(5,2) DEFAULT 0.0,
    productivity_score DECIMAL(3,2) DEFAULT 0.0,
    client_satisfaction DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, metric_date)
);

-- Create user_availability table for scheduling
CREATE TABLE IF NOT EXISTS user_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
    start_time TIME,
    end_time TIME,
    timezone VARCHAR(50),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_notifications_preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    project_assignments BOOLEAN DEFAULT true,
    deadline_reminders BOOLEAN DEFAULT true,
    quality_feedback BOOLEAN DEFAULT true,
    payment_updates BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_certifications_user_id ON user_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_certifications_verified ON user_certifications(verified);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_category ON user_skills(skill_category);
CREATE INDEX IF NOT EXISTS idx_user_performance_user_id ON user_performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_performance_date ON user_performance_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_user_availability_user_id ON user_availability(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_certification_level ON profiles(certification_level);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_performance_score ON profiles(performance_score DESC);

-- Enable RLS on new tables
ALTER TABLE user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_certifications
CREATE POLICY "Users can view their own certifications"
    ON user_certifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own certifications"
    ON user_certifications FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all certifications"
    ON user_certifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type = 'Agencies'
        )
    );

-- RLS Policies for user_skills
CREATE POLICY "Users can view their own skills"
    ON user_skills FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own skills"
    ON user_skills FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all skills"
    ON user_skills FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type = 'Agencies'
        )
    );

-- RLS Policies for user_performance_metrics
CREATE POLICY "Users can view their own performance"
    ON user_performance_metrics FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "System can insert performance metrics"
    ON user_performance_metrics FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view all performance metrics"
    ON user_performance_metrics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type = 'Agencies'
        )
    );

-- RLS Policies for user_availability
CREATE POLICY "Users can manage their own availability"
    ON user_availability FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all availability"
    ON user_availability FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type = 'Agencies'
        )
    );

-- RLS Policies for user_notification_preferences
CREATE POLICY "Users can manage their own notification preferences"
    ON user_notification_preferences FOR ALL
    USING (user_id = auth.uid());

-- Create function to update user performance metrics
CREATE OR REPLACE FUNCTION update_user_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update daily metrics when annotation is created/updated
    INSERT INTO user_performance_metrics (
        user_id,
        metric_date,
        segments_completed,
        average_quality_score
    ) VALUES (
        NEW.annotator_id,
        CURRENT_DATE,
        1,
        COALESCE(NEW.quality_rating, 0)
    )
    ON CONFLICT (user_id, metric_date)
    DO UPDATE SET
        segments_completed = user_performance_metrics.segments_completed + 1,
        average_quality_score = (
            (user_performance_metrics.average_quality_score * (user_performance_metrics.segments_completed - 1) + COALESCE(NEW.quality_rating, 0))
            / user_performance_metrics.segments_completed
        );

    -- Update profile aggregate metrics
    UPDATE profiles SET
        total_projects_completed = (
            SELECT COUNT(DISTINCT project_id) 
            FROM annotations 
            WHERE annotator_id = NEW.annotator_id
        ),
        average_quality_score = (
            SELECT AVG(quality_rating) 
            FROM annotations 
            WHERE annotator_id = NEW.annotator_id 
            AND quality_rating IS NOT NULL
        ),
        last_active_at = NOW()
    WHERE id = NEW.annotator_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for performance tracking
DROP TRIGGER IF EXISTS trigger_update_user_performance ON annotations;
CREATE TRIGGER trigger_update_user_performance
    AFTER INSERT OR UPDATE ON annotations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_performance_metrics();

-- Create function to calculate user certification level
CREATE OR REPLACE FUNCTION calculate_certification_level(user_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    avg_quality DECIMAL(3,2);
    total_projects INTEGER;
    total_words INTEGER;
    certification VARCHAR(50);
BEGIN
    SELECT 
        COALESCE(average_quality_score, 0),
        COALESCE(total_projects_completed, 0),
        COALESCE(total_words_translated, 0)
    INTO avg_quality, total_projects, total_words
    FROM profiles
    WHERE id = user_id;

    -- Certification logic
    IF avg_quality >= 4.5 AND total_projects >= 50 AND total_words >= 100000 THEN
        certification := 'Expert';
    ELSIF avg_quality >= 4.0 AND total_projects >= 20 AND total_words >= 50000 THEN
        certification := 'Senior';
    ELSIF avg_quality >= 3.5 AND total_projects >= 5 AND total_words >= 10000 THEN
        certification := 'Intermediate';
    ELSE
        certification := 'Junior';
    END IF;

    -- Update the profile
    UPDATE profiles 
    SET certification_level = certification
    WHERE id = user_id;

    RETURN certification;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE user_certifications IS 'Stores professional certifications for users';
COMMENT ON TABLE user_skills IS 'Detailed skill tracking with proficiency levels';
COMMENT ON TABLE user_performance_metrics IS 'Daily performance metrics for users';
COMMENT ON TABLE user_availability IS 'User availability schedule for project assignment';
COMMENT ON TABLE user_notification_preferences IS 'User notification preferences';

COMMENT ON COLUMN profiles.certification_level IS 'Auto-calculated certification: Junior, Intermediate, Senior, Expert';
COMMENT ON COLUMN profiles.performance_score IS 'Overall performance score (0.0-5.0)';
COMMENT ON COLUMN profiles.is_active IS 'Whether user account is active';
COMMENT ON COLUMN profiles.last_active_at IS 'Last time user was active on platform';