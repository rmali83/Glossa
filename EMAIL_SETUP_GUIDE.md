# Email Notification Setup Guide

## Current Status

✅ **Working:**
- Notifications are created in database when jobs are posted
- Admin sees confirmation message
- Notification includes job details and link to workspace

❌ **Not Working:**
- Actual emails are not sent to translators
- Translators don't receive email notifications

## Why Emails Aren't Sent

The current implementation only stores notifications in the database. To send actual emails, you need to integrate an email service.

## Solution Options

### Option 1: Resend (Recommended - Easiest & Free)

**Why Resend:**
- Free tier: 3,000 emails/month
- Simple API
- No credit card required for free tier
- Great for transactional emails
- Official Supabase integration

**Setup Steps:**

1. **Sign up for Resend:**
   - Go to https://resend.com
   - Sign up with your email
   - Verify your email address

2. **Get API Key:**
   - Go to API Keys section
   - Create new API key
   - Copy the key (starts with `re_`)

3. **Add to Supabase:**
   - Go to Supabase Dashboard → Project Settings → Secrets
   - Add new secret: `RESEND_API_KEY` = your API key

4. **Create Supabase Edge Function:**

Create file: `supabase/functions/send-email/index.ts`

\`\`\`typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const { notificationId } = await req.json()
    
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Get notification details
    const { data: notification } = await supabaseClient
      .from('notifications')
      .select(\`
        *,
        user:user_id (email, raw_user_meta_data)
      \`)
      .eq('id', notificationId)
      .single()
    
    if (!notification) {
      throw new Error('Notification not found')
    }
    
    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${RESEND_API_KEY}\`
      },
      body: JSON.stringify({
        from: 'Glossa CAT <noreply@glossa.agency>',
        to: [notification.user.email],
        subject: notification.title,
        html: \`
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">\${notification.title}</h2>
            <p style="font-size: 16px; line-height: 1.6;">\${notification.message}</p>
            \${notification.link ? \`
              <a href="https://glossa-one.vercel.app\${notification.link}" 
                 style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px;">
                Open Workspace
              </a>
            \` : ''}
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              This is an automated message from Glossa CAT. Please do not reply to this email.
            </p>
          </div>
        \`
      })
    })
    
    const data = await res.json()
    
    if (!res.ok) {
      throw new Error(data.message || 'Failed to send email')
    }
    
    return new Response(
      JSON.stringify({ success: true, emailId: data.id }),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
\`\`\`

5. **Deploy Edge Function:**
\`\`\`bash
supabase functions deploy send-email
\`\`\`

6. **Update CreateJob.jsx to call Edge Function:**

Add this after creating notification:

\`\`\`javascript
// Send email via Edge Function
try {
  await supabase.functions.invoke('send-email', {
    body: { notificationId: notificationData.id }
  });
} catch (emailError) {
  console.error('Failed to send email:', emailError);
}
\`\`\`

### Option 2: SendGrid (Popular Choice)

**Why SendGrid:**
- Free tier: 100 emails/day
- Reliable delivery
- Email templates
- Analytics

**Setup Steps:**

1. Sign up at https://sendgrid.com
2. Get API key from Settings → API Keys
3. Add to Supabase secrets: `SENDGRID_API_KEY`
4. Create Edge Function similar to Resend but use SendGrid API

**SendGrid API Example:**
\`\`\`javascript
await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${SENDGRID_API_KEY}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: translatorEmail }] }],
    from: { email: 'noreply@glossa.agency', name: 'Glossa CAT' },
    subject: notification.title,
    content: [{ type: 'text/html', value: emailHtml }]
  })
})
\`\`\`

### Option 3: Database Trigger (Automatic)

**Pros:**
- Automatic email sending when notification is created
- No need to modify frontend code

**Cons:**
- Requires Supabase Edge Function
- More complex setup

**Setup:**

1. Create Edge Function (as above)
2. Create database trigger:

\`\`\`sql
CREATE OR REPLACE FUNCTION send_notification_email()
RETURNS TRIGGER AS $$
DECLARE
  v_response json;
BEGIN
  -- Call Edge Function to send email
  SELECT content::json INTO v_response
  FROM http((
    'POST',
    current_setting('app.settings.supabase_url') || '/functions/v1/send-email',
    ARRAY[http_header('Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key'))],
    'application/json',
    json_build_object('notificationId', NEW.id)::text
  )::http_request);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_notification_created
AFTER INSERT ON notifications
FOR EACH ROW
EXECUTE FUNCTION send_notification_email();
\`\`\`

## Quick Test (Without Email Service)

To test notifications are working, check the database:

\`\`\`sql
-- See all notifications
SELECT 
  n.title,
  n.message,
  n.type,
  n.link,
  u.email as recipient_email,
  n.created_at
FROM notifications n
JOIN auth.users u ON n.user_id = u.id
ORDER BY n.created_at DESC;
\`\`\`

## Temporary Solution: Manual Email

Until you set up automated emails, you can:

1. **Check notifications in database**
2. **Manually email translators** with job details
3. **Or build an in-app notification system** (bell icon in navbar)

## In-App Notification System (Alternative)

Instead of emails, you can show notifications in the app:

1. **Add notification bell icon** to navbar
2. **Show unread count** badge
3. **Dropdown with recent notifications**
4. **Click to mark as read**

This is often better than email for real-time updates!

## Recommended Approach

**For Production:**
1. Use **Resend** for emails (easiest setup)
2. Add **in-app notifications** (better UX)
3. Let users choose email preferences

**For Testing:**
1. Check database to verify notifications are created
2. Use in-app notifications for now
3. Add email later when needed

## Cost Comparison

| Service | Free Tier | Paid Plans |
|---------|-----------|------------|
| Resend | 3,000/month | $20/month for 50k |
| SendGrid | 100/day | $15/month for 40k |
| Mailgun | 5,000/month | $35/month for 50k |
| AWS SES | 62,000/month | $0.10 per 1,000 |

## Next Steps

1. **Choose email service** (Resend recommended)
2. **Sign up and get API key**
3. **Create Supabase Edge Function**
4. **Deploy and test**
5. **Update CreateJob.jsx** to call function

Or:

1. **Build in-app notifications** (no email needed)
2. **Add notification bell** to navbar
3. **Show notifications** in dropdown

## Support

If you need help setting up:
1. Choose which option you prefer
2. I can provide complete code for that option
3. We can test it together

The notification system is working - we just need to connect it to an email service!
