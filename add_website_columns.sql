-- Add new columns to projects table for website translation features
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS website_technology VARCHAR(50),
ADD COLUMN IF NOT EXISTS domain_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS url_structure VARCHAR(20) DEFAULT 'subdirectories';

-- Update existing projects to have default values
UPDATE projects 
SET 
  website_technology = 'custom',
  domain_url = 'https://example.com',
  url_structure = 'subdirectories'
WHERE website_technology IS NULL;