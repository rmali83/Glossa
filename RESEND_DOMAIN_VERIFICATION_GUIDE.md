# Resend Domain Verification Guide

## Why Verify Your Domain?

Without domain verification, Resend only allows sending emails to your own email address (rmali@live.com). After verification, you can send to ANY email address.

---

## Step 1: Add Domain to Resend

1. Go to: https://resend.com/domains
2. Click "Add Domain" button
3. Enter your domain: `glossa.agency`
4. Click "Add Domain"

---

## Step 2: Get DNS Records

After adding the domain, Resend will show you DNS records to add. You'll need to add these records:

### Record 1: SPF (TXT Record)
- **Type:** TXT
- **Name:** `@` or `glossa.agency`
- **Value:** `v=spf1 include:_spf.resend.com ~all`

### Record 2: DKIM (TXT Record)
- **Type:** TXT
- **Name:** `resend._domainkey` or `resend._domainkey.glossa.agency`
- **Value:** (Resend will provide this - it's a long string starting with `v=DKIM1`)

### Record 3: DMARC (TXT Record) - Optional but Recommended
- **Type:** TXT
- **Name:** `_dmarc` or `_dmarc.glossa.agency`
- **Value:** `v=DMARC1; p=none; rua=mailto:dmarc@glossa.agency`

---

## Step 3: Add DNS Records to Your Domain Provider

You need to add these DNS records where your domain is hosted. Common providers:

### If using Namecheap:
1. Go to: https://www.namecheap.com/myaccount/login/
2. Click "Domain List"
3. Click "Manage" next to glossa.agency
4. Click "Advanced DNS" tab
5. Click "Add New Record"
6. Add each record from Step 2

### If using GoDaddy:
1. Go to: https://dcc.godaddy.com/domains
2. Click on glossa.agency
3. Click "DNS" tab
4. Click "Add" button
5. Add each record from Step 2

### If using Cloudflare:
1. Go to: https://dash.cloudflare.com
2. Select glossa.agency
3. Click "DNS" tab
4. Click "Add record"
5. Add each record from Step 2

### If using Google Domains:
1. Go to: https://domains.google.com
2. Click on glossa.agency
3. Click "DNS" in left menu
4. Scroll to "Custom records"
5. Add each record from Step 2

---

## Step 4: Verify Domain in Resend

1. After adding DNS records, wait 5-10 minutes for DNS propagation
2. Go back to: https://resend.com/domains
3. Click "Verify" button next to glossa.agency
4. If verification fails, wait another 10-15 minutes and try again
5. DNS can take up to 24 hours to fully propagate

---

## Step 5: Update Edge Function

Once domain is verified, update the "from" email address in the Edge Function:

Change from:
```typescript
from: 'Glossa CAT <onboarding@resend.dev>'
```

To:
```typescript
from: 'Glossa CAT <notifications@glossa.agency>'
```

I'll help you update this after verification is complete.

---

## Troubleshooting

### Issue: "Domain not verified"
**Solution:**
- Wait longer (DNS can take up to 24 hours)
- Check DNS records are correct using: https://mxtoolbox.com/SuperTool.aspx
- Make sure there are no typos in the DNS records

### Issue: "DKIM record not found"
**Solution:**
- Make sure the DKIM record name is exactly: `resend._domainkey`
- Some providers require the full name: `resend._domainkey.glossa.agency`
- Check with your DNS provider's documentation

### Issue: "SPF record conflicts"
**Solution:**
- If you already have an SPF record, you need to merge them
- Example: `v=spf1 include:_spf.resend.com include:_spf.google.com ~all`
- Don't create multiple SPF records

---

## Quick DNS Check

After adding records, verify they're working:

1. Go to: https://mxtoolbox.com/SuperTool.aspx
2. Enter: `glossa.agency`
3. Select "TXT Lookup"
4. Click "TXT Lookup"
5. You should see your SPF record

For DKIM:
1. Go to: https://mxtoolbox.com/SuperTool.aspx
2. Enter: `resend._domainkey.glossa.agency`
3. Select "TXT Lookup"
4. You should see the DKIM record

---

## Alternative: Use Subdomain (Easier)

If you don't want to modify your main domain DNS, you can use a subdomain:

1. In Resend, add domain: `mail.glossa.agency`
2. Add DNS records for the subdomain
3. Use: `notifications@mail.glossa.agency`

This keeps your main domain DNS clean.

---

## What Domain Provider Do You Use?

Let me know which provider hosts your domain (Namecheap, GoDaddy, Cloudflare, etc.) and I can give you specific instructions for that provider.

---

## Current Status

- ✅ Resend account created
- ✅ API key added to Supabase
- ✅ Edge Function deployed
- ✅ Notification system working
- ⏳ Domain verification (in progress)
- ⏳ Email sending to any recipient (after verification)

---

## Next Steps

1. Add domain to Resend
2. Get DNS records from Resend
3. Add DNS records to your domain provider
4. Wait for verification (5 minutes to 24 hours)
5. Update Edge Function with new "from" address
6. Test sending emails to any recipient!

---

Let me know when you've added the domain to Resend and I'll help with the next steps!
