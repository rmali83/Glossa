# Email Notification Setup - Step by Step Guide

## Overview

This guide will help you set up email notifications so translators receive actual emails when jobs are assigned to them.

We'll use **Resend** because it's:
- ✅ Free (3,000 emails/month)
- ✅ Easy to set up
- ✅ No credit card required
- ✅ Works with Supabase

---

## Step 1: Sign Up for Resend

### 1.1 Go to Resend Website
- Open your browser
- Go to: https://resend.com
- Click "Sign Up" or "Get Started"

### 1.2 Create Account
- Enter your email address
- Create a password
- Click "Create Account"

### 1.3 Verify Email
- Check your email inbox
- Click the verification link
- You'll be redirected to Resend dashboard

**✅ Checkpoint:** You should now be logged into Resend dashboard

---

## Step 2: Get Your API Key

### 2.1 Navigate to API Keys
- In Resend dashboard, look for "API Keys" in the left sidebar
- Click on "API Keys"

### 2.2 Create New API Key
- Click "Create API Key" button
- Give it a name: `Glossa CAT Notifications`
- Select permission: "Sending access"
- Click "Create"

### 2.3 Copy API Key
- **IMPORTANT:** Copy the API key immediately
- It starts with `re_`
- Example: `re_123abc456def789ghi`
- Save it somewhere safe (you won't see it again!)

**✅ Checkpoint:** You have your Resend API key copied

---

## Step 3: Add API Key to Supabase

### 3.1 Go to Supabase Dashboard
- Open: https://supabase.com/dashboard
- Log in to your account
- Select your Glossa project

### 3.2 Navigate to Project Settings
- Click "Project Settings" (gear icon) in the left sidebar
- Click "Edge Functions" in the settings menu

### 3.3 Add Secret
- Scroll down to "Secrets" section
- Click "Add new secret"
- Name: `RESEND_API_KEY`
- Value: Paste your Resend API key (the one starting with `re_`)
- Click "Save"

**✅ Checkpoint:** API key is saved in Supabase

---

## Step 4: Create Supabase Edge Function

### 4.1 Install Supabase CLI (if not installed)

**On Windows (PowerShell):**
```powershell
# Using Scoop
scoop install supabase

# OR using npm
npm install -g supabase
```

**On Mac:**
```bash
brew install supabase/tap/supabase
```

**On Linux:**
```bash
brew install supabase/tap/supabase
```

### 4.2 Login to Supabase CLI
```bash
supabase login
```
- This will open a browser
- Authorize the CLI
- Return to terminal

### 4.3 Link Your Project
```bash
# Get your project reference ID from Supabase dashboard URL
# Example: https://supabase.com/dashboard/project/abcdefghijklmnop
# The ID is: abcdefghijklmnop

supabase link --project-ref YOUR_PROJECT_ID
```

### 4.4 Create Edge Function Folder
```bash
# In your Glossa project folder
mkdir -p supabase/functions/send-email
```

### 4.5 Create Edge Function File

Create file: `supabase/functions/send-email/index.ts`

```typescript
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
    const { data: notification, error: notifError } = await supabaseClient
      .from('notifications')
      .select(`
        *,
        user:user_id (email, raw_user_meta_data)
      `)
      .eq('id', notificationId)
      .single()
    
    if (notifError || !notification) {
      throw new Error('Notification not found')
    }
    
    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Glossa CAT <noreply@glossa.agency>',
        to: [notification.user.email],
        subject: notification.title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Glossa CAT</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
              <h2 style="color: #667eea; margin-top: 0;">${notification.title}</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">${notification.message}</p>
              ${notification.link ? `
                <a href="https://glossa-one.vercel.app${notification.link}" 
                   style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 600;">
                  Open Workspace →
                </a>
              ` : ''}
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                This is an automated message from Glossa CAT. Please do not reply to this email.
              </p>
            </div>
          </div>
        `
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
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

**✅ Checkpoint:** Edge function file created

---

## Step 5: Deploy Edge Function

### 5.1 Deploy to Supabase
```bash
# In your Glossa project folder
supabase functions deploy send-email
```

### 5.2 Verify Deployment
- Go to Supabase Dashboard
- Click "Edge Functions" in left sidebar
- You should see "send-email" function listed
- Status should be "Active"

**✅ Checkpoint:** Edge function deployed successfully

---

## Step 6: Update CreateJob.jsx

### 6.1 Open CreateJob.jsx
File location: `src/pages/dashboard/CreateJob.jsx`

### 6.2 Find the Notification Creation Code
Look for this section (around line 120-140):

```javascript
// Create notification in database
await supabase.from('notifications').insert({
  user_id: formData.translator_id,
  title: 'New Translation Job Assigned',
  message: `You have been assigned to "${formData.name}"...`,
  type: 'job_assigned',
  link: `/dashboard/cat/${projectId}`
});
```

### 6.3 Add Email Sending Code
Replace the notification section with this:

```javascript
// Create notification in database
const { data: notificationData, error: notifError } = await supabase
  .from('notifications')
  .insert({
    user_id: formData.translator_id,
    title: 'New Translation Job Assigned',
    message: `You have been assigned to "${formData.name}". ${totalWords} words, ${formData.source_language} → ${formData.target_language}. Payment: $${totalPayment.toFixed(2)}`,
    type: 'job_assigned',
    link: `/dashboard/cat/${projectId}`
  })
  .select()
  .single();

if (notifError) {
  console.error('Error creating notification:', notifError);
} else if (notificationData) {
  // Send email via Edge Function
  try {
    const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
      body: { notificationId: notificationData.id }
    });
    
    if (emailError) {
      console.error('Error sending email:', emailError);
    } else {
      console.log('Email sent successfully:', emailData);
    }
  } catch (emailError) {
    console.error('Failed to send email:', emailError);
  }
}
```

**✅ Checkpoint:** Code updated to send emails

---

## Step 7: Test Email Sending

### 7.1 Build and Deploy
```bash
npm run build
git add .
git commit -m "feat: Add email sending via Resend"
git push origin main
```

### 7.2 Wait for Vercel Deployment
- Wait 2-3 minutes for Vercel to deploy
- Check: https://glossa-one.vercel.app

### 7.3 Create Test Job
1. Go to Admin Dashboard
2. Click "Create New Job"
3. Fill in job details
4. Assign a translator (use your own email for testing)
5. Upload a file
6. Click "Post Job"

### 7.4 Check Email
- Check the translator's email inbox
- You should receive an email with:
  - Subject: "New Translation Job Assigned"
  - Job details
  - "Open Workspace" button

**✅ Checkpoint:** Email received successfully!

---

## Step 8: Verify Email Domain (Optional but Recommended)

### 8.1 Add Your Domain to Resend
- Go to Resend Dashboard
- Click "Domains" in sidebar
- Click "Add Domain"
- Enter your domain: `glossa.agency`

### 8.2 Add DNS Records
Resend will show you DNS records to add:
- TXT record for verification
- MX records for receiving
- DKIM records for authentication

### 8.3 Update Email Address
After domain verification, change the "from" address in Edge Function:
```typescript
from: 'Glossa CAT <notifications@glossa.agency>'
```

**✅ Checkpoint:** Domain verified (optional)

---

## Troubleshooting

### Issue 1: "RESEND_API_KEY not found"
**Solution:** 
- Check Supabase Dashboard → Project Settings → Edge Functions → Secrets
- Make sure `RESEND_API_KEY` is added
- Redeploy edge function: `supabase functions deploy send-email`

### Issue 2: "Notification not found"
**Solution:**
- Check if notification was created in database
- Run SQL: `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1;`
- Make sure notification ID is being passed correctly

### Issue 3: "Failed to send email"
**Solution:**
- Check Resend dashboard for error logs
- Verify API key is correct
- Check if you've exceeded free tier limit (3,000/month)

### Issue 4: Email not received
**Solution:**
- Check spam folder
- Verify email address is correct
- Check Resend dashboard → Logs to see if email was sent
- Wait a few minutes (emails can be delayed)

### Issue 5: Edge Function not deploying
**Solution:**
```bash
# Login again
supabase login

# Link project again
supabase link --project-ref YOUR_PROJECT_ID

# Deploy with verbose output
supabase functions deploy send-email --debug
```

---

## Testing Checklist

- [ ] Resend account created
- [ ] API key obtained and saved
- [ ] API key added to Supabase secrets
- [ ] Edge function file created
- [ ] Edge function deployed successfully
- [ ] CreateJob.jsx updated
- [ ] Code committed and pushed
- [ ] Vercel deployed
- [ ] Test job created
- [ ] Email received

---

## Summary

You've successfully set up email notifications! Now when you:

1. **Create a job** in Admin panel
2. **Assign a translator**
3. **Post the job**

The translator will receive:
- ✅ Database notification (stored)
- ✅ Email notification (sent via Resend)
- ✅ Link to open workspace

---

## Next Steps

### Optional Enhancements:

1. **Add Email Templates**
   - Create different templates for different notification types
   - Add company branding

2. **Add Email Preferences**
   - Let users choose email frequency
   - Allow users to disable emails

3. **Add More Notification Types**
   - Job completed
   - Review requested
   - Payment received

4. **Monitor Email Delivery**
   - Check Resend dashboard regularly
   - Set up webhooks for delivery status

---

## Support

If you need help:
1. Check Resend documentation: https://resend.com/docs
2. Check Supabase Edge Functions docs: https://supabase.com/docs/guides/functions
3. Ask me for help with specific errors!

Good luck! 🚀
