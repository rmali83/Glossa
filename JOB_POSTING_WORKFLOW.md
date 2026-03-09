# Job Posting Workflow Implementation

## What's Been Done ✅

### 1. Removed Upload Button from CAT Workspace
- Upload button now only shows for admins
- Translators can't upload files in CAT workspace

### 2. Created Admin Job Creation Page
**Route:** `/dashboard/admin/create-job`

**Features:**
- Job title and description
- Source/target language selection
- Pay rate per word
- Deadline picker
- Specialization (General, Legal, Medical, Technical, Marketing, Literary)
- Difficulty level (Easy, Standard, Complex, Expert)
- File upload with automatic word count
- Payment calculation (words × rate)
- Post job button

**Workflow:**
1. Admin fills job details
2. Clicks "Create Draft & Upload Files"
3. Uploads files (TXT, JSON, CSV, DOCX, HTML, XML, XLIFF, TMX, SRT, VTT, PO, PROPERTIES, MARKDOWN)
4. System calculates total words from uploaded files
5. Shows payment summary
6. Admin clicks "Post Job"
7. Job status changes to "posted"

### 3. Updated Admin Dashboard
- Added "+ Create New Job" button at the top
- Button navigates to job creation page

### 4. Database Schema Updates
**New columns in `projects` table:**
- `pay_rate_per_word` - Payment per word (decimal)
- `total_words` - Total word count from files
- `deadline` - Job completion deadline
- `job_status` - Job status (draft, posted, in_progress, completed, cancelled)
- `total_payment` - Total payment amount
- `job_description` - Job instructions
- `specialization` - Job category
- `difficulty_level` - Complexity level

## What Needs to Be Done Next 🚧

### 1. Apply Database Migration
Run this in Supabase SQL Editor:
```sql
-- Copy contents of supabase/migrations/20240308_add_job_fields_to_projects.sql
```

### 2. Update Jobs Page for Translators
**Current:** Shows basic project list
**Needed:** Show job marketplace with:
- Job cards with details (title, languages, word count, pay rate, deadline)
- Total payment display
- Specialization badges
- Difficulty indicators
- "View Details" button
- "Open in CAT" button
- "Download Files" button

### 3. Create Job Details Page
**Route:** `/dashboard/jobs/:jobId`

**Features:**
- Full job description
- File list with download links
- Payment breakdown
- Deadline countdown
- "Accept Job" button
- "Open in CAT Workspace" button

### 4. Add Job Assignment Logic
- When translator clicks "Accept Job"
- Update project `translator_id`
- Change `job_status` to "in_progress"
- Send notification to admin

### 5. Update CAT Workspace
- Show job details at top (payment, deadline, word count)
- Show progress (words translated / total words)
- Earnings tracker

## Current File Structure

```
src/
├── pages/
│   └── dashboard/
│       ├── Admin.jsx (✅ Updated with Create Job button)
│       ├── CreateJob.jsx (✅ NEW - Job creation page)
│       ├── Jobs.jsx (❌ Needs update - show job marketplace)
│       └── CATProjectView.jsx (✅ Updated - upload only for admins)
├── components/
│   └── SimpleUploadModal.jsx (✅ Works with job creation)
└── services/
    ├── simpleUploadManager.js (✅ Handles file upload)
    ├── browserFileParser.js (✅ Parses 13 formats)
    └── segmentationEngine.js (✅ Creates segments)

supabase/
└── migrations/
    ├── 20240308_add_file_columns_to_segments.sql (✅ Applied)
    └── 20240308_add_job_fields_to_projects.sql (❌ Needs to be applied)
```

## Testing Instructions

### For Admin:
1. Go to `/dashboard/admin`
2. Click "+ Create New Job"
3. Fill in job details
4. Click "Create Draft & Upload Files"
5. Upload files (try DOCX, XLIFF, or TXT)
6. See word count and payment calculation
7. Click "Post Job"

### For Translator (After Jobs page is updated):
1. Go to `/dashboard/jobs`
2. See list of available jobs
3. Click on a job to see details
4. Download files or open in CAT
5. Accept job
6. Translate in CAT workspace

## Next Steps Priority

1. **Apply database migration** (5 minutes)
2. **Update Jobs page** to show job marketplace (30 minutes)
3. **Create Job Details page** (30 minutes)
4. **Add job assignment logic** (15 minutes)
5. **Update CAT workspace** with job info (15 minutes)

Total estimated time: ~1.5 hours

Would you like me to continue with updating the Jobs page?
