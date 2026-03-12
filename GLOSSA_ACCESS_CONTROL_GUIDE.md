# Glossa Platform - Access Control & User Management Guide

## Overview
This document explains the complete access control system, user roles, permissions, and onboarding flow for the Glossa translation platform.

---

## User Roles & Permissions

### 1. Admin (Agencies)
**Who**: rmali@live.com and users with `user_type = 'Agencies'`

**Can Do:**
- ✅ View all projects, users, and jobs
- ✅ Create and assign translation jobs
- ✅ Access Admin Dashboard
- ✅ View all datasets (annotations, post-edits, dataset_logs)
- ✅ Export datasets (CSV, JSON)
- ✅ Approve/reject translator applications
- ✅ Suspend users
- ✅ Delete projects
- ✅ Manage system settings
- ✅ View analytics and reports
- ✅ Upload files to CAT workspace

**Cannot Do:**
- ❌ Cannot directly translate (admin role, not translator)

---

### 2. Translator (Freelance Translator)
**Who**: Users with `user_type = 'Translator'` or `'Freelance Translator'`

**Can Do:**
- ✅ View assigned projects
- ✅ Translate segments in CAT workspace
- ✅ Use AI translation suggestions
- ✅ Add annotations (QA tab)
- ✅ Select domain/subdomain for translations
- ✅ Rate translation quality
- ✅ Mark error types (fluency, grammar, etc.)
- ✅ Confirm segments
- ✅ View their own profile
- ✅ Update their specializations
- ✅ View available jobs
- ✅ Apply for jobs

**Cannot Do:**
- ❌ Cannot view other translators' projects
- ❌ Cannot access Admin Dashboard
- ❌ Cannot view datasets
- ❌ Cannot create projects
- ❌ Cannot delete projects
- ❌ Cannot upload files (only admin can)

---

### 3. Reviewer
**Who**: Users with `user_type = 'Reviewer'`

**Can Do:**
- ✅ View assigned projects for review
- ✅ Review translated segments
- ✅ Add review comments
- ✅ Approve/reject translations
- ✅ Add annotations
- ✅ Mark quality issues

**Cannot Do:**
- ❌ Cannot access Admin Dashboard
- ❌ Cannot view datasets
- ❌ Cannot create projects

---

## User Onboarding Flow

### Step 1: User Registration
1. User visits Glossa homepage
2. Clicks "Join as Translator" or "Sign Up"
3. Fills registration form:
   - Email
   - Password
   - Full Name
   - User Type (Translator/Freelance Translator/Reviewer)

### Step 2: Email Verification
1. User receives verification email
2. Clicks verification link
3. Email is verified in Supabase Auth

### Step 3: Translator Onboarding (If user_type = Translator)
**Automatic redirect to TranslatorOnboarding.jsx**

User completes 5 sections:

#### Section 1: Personal Information
- Full Name
- Email (pre-filled)
- Phone Number
- Country
- City
- Profile Picture Upload

#### Section 2: Language Pairs
- Select source languages (multiple)
- Select target languages (multiple)
- System validates at least 1 pair

#### Section 3: Areas of Specialization
- Select Domain (dropdown with 23 options)
- Select Subdomain (dynamic based on domain)
- Add up to 5 specializations
- Format: "Domain: Subdomain" (e.g., "Legal: Contracts & Agreements")

#### Section 4: Experience & Rates
- Years of experience
- Hourly rate (USD)
- CAT tool experience (Yes/No)
- Portfolio/Website URL (optional)
- Brief bio

#### Section 5: Certifications & Documents
- Upload certifications (optional)
- Upload resume/CV (optional)
- Agree to terms & conditions

### Step 4: Admin Approval (REQUIRED)
**Current Status**: ⚠️ NOT IMPLEMENTED YET

**Recommended Flow:**
1. After onboarding, user status = 'pending_approval'
2. User sees message: "Your application is under review"
3. Admin receives notification
4. Admin reviews application in Admin Dashboard
5. Admin approves or rejects
6. User receives email notification
7. If approved: status = 'active', user can access dashboard
8. If rejected: status = 'rejected', user sees rejection message

**Currently**: Users can access dashboard immediately after onboarding (no approval required)

---

## Database Policies (RLS)

### Annotations Table
```sql
-- Translators can view annotations for their projects
SELECT: project_id IN (user's projects)

-- Translators can create annotations for their segments
INSERT: project_id IN (user's projects)

-- Translators can update their own annotations
UPDATE: annotator_id = auth.uid()

-- Admins can view all annotations
SELECT: user_type = 'Agencies' OR email = 'rmali@live.com'
```

### Post-Edits Table
```sql
-- Translators can view post-edits for their projects
SELECT: project_id IN (user's projects)

-- Translators can create post-edits for their segments
INSERT: project_id IN (user's projects)

-- Translators can update their own post-edits
UPDATE: editor_id = auth.uid()
```

### Dataset Logs Table
```sql
-- CURRENT: RLS DISABLED (for testing)
-- Allows anyone to insert/read

-- RECOMMENDED FOR PRODUCTION:
-- Admins can view all dataset logs
SELECT: user_type = 'Agencies' OR email = 'rmali@live.com'

-- Translators can insert dataset logs for their projects
INSERT: project_id IN (user's projects)

-- Admins can update dataset logs (mark as exported)
UPDATE: user_type = 'Agencies' OR email = 'rmali@live.com'
```

### Projects Table
```sql
-- Users can view their own projects
SELECT: translator_id = auth.uid() OR reviewer_id = auth.uid() OR created_by = auth.uid()

-- Admins can view all projects
SELECT: user_type = 'Agencies' OR email = 'rmali@live.com'

-- Admins can create projects
INSERT: user_type = 'Agencies' OR email = 'rmali@live.com'

-- Admins can update projects
UPDATE: user_type = 'Agencies' OR email = 'rmali@live.com'

-- Admins can delete projects
DELETE: user_type = 'Agencies' OR email = 'rmali@live.com'
```

---

## Admin Authentication & Authorization

### How Admin is Identified
1. **Email Check**: `email = 'rmali@live.com'`
2. **User Type Check**: `user_type = 'Agencies'` in profiles table

### Admin Access Control in Code
```javascript
// In React components
const { user } = useAuth();
const isAdmin = user?.user_metadata?.user_type === 'Agencies' || 
                user?.email === 'rmali@live.com';

// Show/hide admin features
{isAdmin && (
    <Link to="/dashboard/admin">Admin Control</Link>
)}
```

### Admin-Only Features
- Admin Dashboard (`/dashboard/admin`)
- Dataset Management Tab
- User Management
- Job Creation
- File Upload in CAT workspace
- Delete All Projects button
- Export functionality

---

## Recommended: User Approval System

### Step 1: Add Status Column to Profiles
```sql
ALTER TABLE profiles ADD COLUMN status VARCHAR(50) DEFAULT 'pending_approval';
-- Values: 'pending_approval', 'active', 'rejected', 'suspended'
```

### Step 2: Update Onboarding to Set Status
```javascript
// In TranslatorOnboarding.jsx
await supabase.from('profiles').update({
    ...profileData,
    status: 'pending_approval'
}).eq('id', user.id);
```

### Step 3: Add Approval UI in Admin Dashboard
```javascript
// In AdminEnhanced.jsx - Users Tab
<button onClick={() => approveUser(userId)}>
    Approve
</button>
<button onClick={() => rejectUser(userId)}>
    Reject
</button>
```

### Step 4: Restrict Dashboard Access
```javascript
// In Dashboard.jsx or ProtectedRoute
if (userProfile.status !== 'active') {
    return <PendingApprovalPage />;
}
```

### Step 5: Send Email Notifications
```javascript
// When admin approves
await sendEmail({
    to: user.email,
    subject: 'Welcome to Glossa - Application Approved!',
    body: 'Your translator application has been approved...'
});

// When admin rejects
await sendEmail({
    to: user.email,
    subject: 'Glossa Application Update',
    body: 'Thank you for your interest. Unfortunately...'
});
```

---

## Current Implementation Status

### ✅ Implemented
- User registration & authentication
- Translator onboarding flow
- Role-based access control (admin vs translator)
- Admin dashboard with user management
- Annotation system with domain/subdomain
- Dataset capture and export
- RLS policies for most tables

### ⚠️ Partially Implemented
- User approval system (no approval required currently)
- Email notifications (setup exists but not for approvals)

### ❌ Not Implemented
- Pending approval page
- Admin approval workflow
- Rejection workflow
- Status-based access control

---

## Security Best Practices

### 1. Re-enable RLS on dataset_logs
Currently disabled for testing. For production:
```sql
ALTER TABLE public.dataset_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all dataset logs"
    ON public.dataset_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND user_type = 'Agencies'
        )
    );

CREATE POLICY "Users can insert dataset logs for their projects"
    ON public.dataset_logs FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE translator_id = auth.uid() 
            OR reviewer_id = auth.uid() 
            OR created_by = auth.uid()
        )
    );
```

### 2. Implement User Approval
Prevent unapproved users from accessing dashboard

### 3. Add Rate Limiting
Prevent abuse of API endpoints

### 4. Add Audit Logging
Track who accessed what and when

### 5. Implement Session Management
Auto-logout after inactivity

---

## Quick Reference

### Admin Capabilities
| Feature | Admin | Translator | Reviewer |
|---------|-------|------------|----------|
| View All Projects | ✅ | ❌ | ❌ |
| Create Projects | ✅ | ❌ | ❌ |
| Translate | ❌ | ✅ | ❌ |
| Review | ❌ | ❌ | ✅ |
| Add Annotations | ✅ | ✅ | ✅ |
| View Datasets | ✅ | ❌ | ❌ |
| Export Datasets | ✅ | ❌ | ❌ |
| Approve Users | ✅ | ❌ | ❌ |
| Upload Files | ✅ | ❌ | ❌ |

### User Onboarding Status
| Step | Status | Required |
|------|--------|----------|
| Registration | ✅ Implemented | Yes |
| Email Verification | ✅ Implemented | Yes |
| Translator Onboarding | ✅ Implemented | Yes (for translators) |
| Admin Approval | ❌ Not Implemented | Recommended |
| Dashboard Access | ✅ Immediate | Should be after approval |

---

## Next Steps

1. **Implement User Approval System**
   - Add status column
   - Create approval UI
   - Add pending approval page
   - Send email notifications

2. **Re-enable RLS on dataset_logs**
   - Test with proper policies
   - Ensure translators can insert
   - Ensure admins can view all

3. **Add Email Notifications**
   - Approval emails
   - Rejection emails
   - Job assignment emails

4. **Enhance Security**
   - Add rate limiting
   - Add audit logging
   - Implement session management

---

**Last Updated**: March 12, 2026  
**Version**: 1.0  
**Author**: Glossa Development Team
