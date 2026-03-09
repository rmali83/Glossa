# Email Setup - Next Steps (Starting from Step 4)

## ✅ What's Already Done

I've completed the following for you:

1. ✅ Created Edge Function file: `supabase/functions/send-email/index.ts`
2. ✅ Updated `CreateJob.jsx` to call the Edge Function when posting jobs
3. ✅ Code is ready to send emails once you complete the setup

---

## 📋 What You Need to Do

Follow these steps in order:

### Step 4.1: Install Supabase CLI

Open PowerShell and run ONE of these commands:

**Option A - Using Scoop (Recommended for Windows):**
```powershell
scoop install supabase
```

**Option B - Using npm:**
```powershell
npm install -g supabase
```

**Verify installation:**
```powershell
supabase --version
```

---

### Step 4.2: Login to Supabase CLI

```powershell
supabase login
```

- This will open your browser
- Click "Authorize" to allow CLI access
- Return to PowerShell

---

### Step 4.3: Link Your Project

You need your Supabase project reference ID:

1. Go to: https://supabase.com/dashboard
2. Open your Glossa project
3. Look at the URL - it will be like: `https://supabase.com/dashboard/project/abcdefghijklmnop`
4. Copy the ID part (e.g., `abcdefghijklmnop`)

Then run:
```powershell
supabase link --project-ref YOUR_PROJECT_ID
```

Replace `YOUR_PROJECT_ID` with the actual ID you copied.

---

### Step 5: Deploy the Edge Function

```powershell
supabase functions deploy send-email
```

**Expected output:**
```
Deploying function send-email...
Function send-email deployed successfully!
```

---

### Step 6: Add Resend API Key to Supabase

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your Glossa project
3. Click "Project Settings" (gear icon) in left sidebar
4. Click "Edge Functions"
5. Scroll to "Secrets" section
6. Click "Add new secret"
7. Enter:
   - Name: `RESEND_API_KEY`
   - Value: Your Resend API key (starts with `re_`)
8. Click "Save"

**Important:** You should have already obtained your Resend API key from Step 2 of the guide. If you don't have it:
- Go to https://resend.com/dashboard
- Click "API Keys"
- Create a new key or copy your existing one

---

### Step 7: Build and Deploy Your App

```powershell
npm run build
git add .
git commit -m "feat: Add email notifications via Resend Edge Function"
git push origin main
```

Wait 2-3 minutes for Vercel to deploy.

---

### Step 8: Test Email Sending

1. Go to: https://glossa-one.vercel.app
2. Login as Admin
3. Go to "Create New Job"
4. Fill in job details
5. **Important:** Assign a translator (use your own email for testing)
6. Upload a file
7. Click "Post Job"
8. Check the translator's email inbox

**You should receive an email with:**
- Subject: "New Translation Job Assigned"
- Job details (words, languages, payment)
- "Open Workspace" button

---

## 🔍 Troubleshooting

### Issue: "supabase: command not found"

**Solution:**
- If using Scoop, make sure Scoop is installed first: https://scoop.sh
- If using npm, try: `npm install -g supabase --force`
- Restart PowerShell after installation

### Issue: "Project not found" when linking

**Solution:**
- Double-check your project reference ID
- Make sure you're logged in: `supabase login`
- Try logging out and back in: `supabase logout` then `supabase login`

### Issue: "RESEND_API_KEY not found" error

**Solution:**
- Verify the secret is added in Supabase Dashboard → Project Settings → Edge Functions → Secrets
- Make sure the name is exactly: `RESEND_API_KEY` (case-sensitive)
- Redeploy the function: `supabase functions deploy send-email`

### Issue: Email not received

**Solution:**
- Check spam/junk folder
- Verify the translator's email address is correct in the database
- Check Resend dashboard (https://resend.com/dashboard) → Logs to see if email was sent
- Check browser console for errors
- Make sure you've exceeded the free tier limit (3,000 emails/month)

### Issue: "Failed to send email" in console

**Solution:**
- Check Resend API key is valid
- Check Resend dashboard for error details
- Verify your Resend account is active
- Check if you need to verify your domain (for production use)

---

## 📊 Verification Checklist

Before testing, make sure:

- [ ] Supabase CLI installed and working
- [ ] Logged into Supabase CLI
- [ ] Project linked successfully
- [ ] Edge function deployed (check Supabase Dashboard → Edge Functions)
- [ ] `RESEND_API_KEY` secret added to Supabase
- [ ] Code committed and pushed to GitHub
- [ ] Vercel deployment completed
- [ ] Resend account active with API key

---

## 🎯 Expected Behavior After Setup

When you post a job:

1. **Admin sees:** "Job posted successfully! Translator has been notified."
2. **Database:** Notification record created in `notifications` table
3. **Email:** Translator receives beautiful HTML email with job details
4. **Translator:** Can click "Open Workspace" button in email to start working

---

## 📝 Files Modified

- ✅ `supabase/functions/send-email/index.ts` (created)
- ✅ `src/pages/dashboard/CreateJob.jsx` (updated to call Edge Function)

---

## 🚀 Next Steps After Email Works

Once emails are working, you can:

1. **Customize email template** - Edit `supabase/functions/send-email/index.ts`
2. **Add more notification types** - Job completed, review requested, etc.
3. **Verify your domain** - Use `notifications@glossa.agency` instead of `noreply@glossa.agency`
4. **Add email preferences** - Let users control email frequency

---

## 💡 Quick Reference

**Deploy Edge Function:**
```powershell
supabase functions deploy send-email
```

**View Edge Function logs:**
```powershell
supabase functions logs send-email
```

**Test Edge Function locally:**
```powershell
supabase functions serve send-email
```

---

## 📞 Need Help?

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the full guide: `EMAIL_SETUP_STEP_BY_STEP.md`
3. Check Supabase Edge Functions docs: https://supabase.com/docs/guides/functions
4. Check Resend docs: https://resend.com/docs
5. Ask me for help with specific error messages!

---

Good luck! The setup should take about 10-15 minutes. 🎉
