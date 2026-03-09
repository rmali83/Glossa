# Fix: Segments Table and Email Notifications

## Issues

1. **Error opening project**: "Failed to create segments: Could not find the 'created_by' column of 'segments' in the schema cache"
2. **No email notifications received by translator**

## Solutions

### Issue 1: Fix Segments Table

The `segments` table is missing the `created_by` column.

**Run this SQL in Supabase SQL Editor:**

```sql
-- Add created_by column to segments table
ALTER TABLE segments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add other missing columns
ALTER TABLE segments ADD COLUMN IF NOT EXISTS file_id UUID REFERENCES project_files(id) ON DELETE SET NULL;
ALTER TABLE segments ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE segments ADD COLUMN IF NOT EXISTS segment_index INTEGER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_segments_created_by ON segments(created_by);
CREATE INDEX IF NOT EXISTS idx_segments_file_id ON segments(file_id);
CREATE INDEX IF NOT EXISTS idx_segments_project_id ON segments(project_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their own segments" ON segments;
DROP POLICY IF EXISTS "Translators can view assigned segments" ON segments;

CREATE POLICY "Users can view segments from their projects"
ON segments FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Translators can view assigned project segments"
ON segments FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE translator_id = auth.uid() OR reviewer_id = auth.uid()
  )
);

CREATE POLICY "Users can insert segments to their projects"
ON segments FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Translators can update assigned project segments"
ON segments FOR UPDATE
USING (
  project_id IN (
    SELECT id FROM projects WHERE translator_id = auth.uid()
  )
);

GRANT ALL ON segments TO authenticated;
GRANT ALL ON segments TO service_role;
```

### Issue 2: Create Notifications Table

The `notifications` table doesn't exist yet.

**Run this SQL in Supabase SQL Editor:**

```sql
-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;
```

## Quick Fix - All in One

Copy and paste this complete SQL script:

```sql
-- ============================================
-- COMPLETE FIX FOR SEGMENTS AND NOTIFICATIONS
-- ============================================

-- 1. Fix segments table
ALTER TABLE segments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE segments ADD COLUMN IF NOT EXISTS file_id UUID REFERENCES project_files(id) ON DELETE SET NULL;
ALTER TABLE segments ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE segments ADD COLUMN IF NOT EXISTS segment_index INTEGER;

CREATE INDEX IF NOT EXISTS idx_segments_created_by ON segments(created_by);
CREATE INDEX IF NOT EXISTS idx_segments_file_id ON segments(file_id);
CREATE INDEX IF NOT EXISTS idx_segments_project_id ON segments(project_id);

-- Update segments RLS policies
DROP POLICY IF EXISTS "Users can view their own segments" ON segments;
DROP POLICY IF EXISTS "Translators can view assigned segments" ON segments;
DROP POLICY IF EXISTS "Users can insert their own segments" ON segments;
DROP POLICY IF EXISTS "Translators can update assigned segments" ON segments;

CREATE POLICY "Users can view segments from their projects"
ON segments FOR SELECT
USING (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

CREATE POLICY "Translators can view assigned project segments"
ON segments FOR SELECT
USING (project_id IN (SELECT id FROM projects WHERE translator_id = auth.uid() OR reviewer_id = auth.uid()));

CREATE POLICY "Users can insert segments to their projects"
ON segments FOR INSERT
WITH CHECK (project_id IN (SELECT id FROM projects WHERE created_by = auth.uid()));

CREATE POLICY "Translators can update assigned project segments"
ON segments FOR UPDATE
USING (project_id IN (SELECT id FROM projects WHERE translator_id = auth.uid()));

GRANT ALL ON segments TO authenticated;
GRANT ALL ON segments TO service_role;

-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;
```

## Verification Steps

### 1. Verify segments table:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'segments' 
ORDER BY ordinal_position;
```

Should show: `created_by`, `file_id`, `file_name`, `segment_index`

### 2. Verify notifications table:
```sql
SELECT * FROM notifications LIMIT 1;
```

Should return empty result (no error)

### 3. Test notification creation:
```sql
INSERT INTO notifications (user_id, title, message, type)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Test Notification',
  'This is a test',
  'info'
);

SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1;
```

Should show the test notification

## About Email Notifications

Currently, notifications are stored in the database but **actual emails are not sent yet**.

To enable email sending, you need to:

1. **Set up Supabase Edge Function** or use an email service (SendGrid, Mailgun, Resend)
2. **Create email templates** for job assignments
3. **Trigger emails** when notifications are created

### Quick Email Setup (Future):

**Option 1: Supabase Edge Function**
```typescript
// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { to, subject, html } = await req.json()
  
  // Use SendGrid, Mailgun, or Resend API
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'noreply@glossa.agency' },
      subject,
      content: [{ type: 'text/html', value: html }]
    })
  })
  
  return new Response(JSON.stringify({ success: true }))
})
```

**Option 2: Database Trigger**
```sql
CREATE OR REPLACE FUNCTION send_notification_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Edge Function to send email
  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-email',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := json_build_object(
      'to', (SELECT email FROM auth.users WHERE id = NEW.user_id),
      'subject', NEW.title,
      'html', NEW.message
    )::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_notification_created
AFTER INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION send_notification_email();
```

## Testing After Fix

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** (Ctrl+F5)
3. **Create a new job** with translator assignment
4. **Upload a file**
5. **Post the job**
6. **Check notifications table:**
```sql
SELECT * FROM notifications ORDER BY created_at DESC;
```
7. **Open the project** - should work without errors
8. **Check segments:**
```sql
SELECT COUNT(*) FROM segments WHERE project_id = 'YOUR_PROJECT_ID';
```

## Migration Files

Complete migrations are saved in:
- `supabase/migrations/20240309_fix_segments_table.sql`
- `supabase/migrations/20240309_create_notifications_table.sql`

## Summary

**To fix both issues:**
1. Run the "All in One" SQL script above in Supabase SQL Editor
2. Refresh your browser
3. Try creating and opening a project again
4. Notifications will be stored in database (email sending needs additional setup)

The segments table will now have the `created_by` column, and notifications will be stored when jobs are posted!
