# Browser-Compatible Upload System - Implementation Plan

## Phase 1: Simple File Upload (Start Here)

### Goal
Get basic file upload working with minimal dependencies - just upload files to Supabase Storage.

### Features
- Upload TXT files only (simplest format)
- Direct upload to Supabase Storage
- Progress tracking
- File validation (size, type)
- No complex parsing initially

### Implementation
1. Create `SimpleUploadManager` - handles upload only
2. Add upload button to CAT workspace
3. Upload modal with drag & drop
4. Store file metadata in database
5. Display uploaded files list

### Dependencies (All Browser-Compatible)
- `@supabase/supabase-js` - Already installed ✅
- Native File API - Built into browsers ✅
- Native Fetch API - Built into browsers ✅

### No Dependencies Needed
- ❌ jsdom (Node.js only)
- ❌ jschardet (Node.js only)
- ❌ mammoth (complex, add later)
- ❌ pdf.js (complex, add later)

## Phase 2: Add Text Parsing (After Phase 1 Works)

### Goal
Extract text from uploaded files for translation.

### Supported Formats
1. **TXT** - Use FileReader API (native)
2. **JSON** - Use JSON.parse (native)
3. **CSV** - Use papaparse (already installed)

### Implementation
1. Create `BrowserFileParser` class
2. Parse on upload
3. Create segments from parsed text
4. Store segments in database

## Phase 3: Add Document Formats (Optional)

### Goal
Support DOCX and PDF files.

### Approach
- **DOCX**: Use `mammoth` (already installed, browser-compatible)
- **PDF**: Use `pdfjs-dist` (already installed, needs configuration)

## Implementation Steps

### Step 1: Create Simple Upload Manager

```javascript
// src/services/simpleUploadManager.js
class SimpleUploadManager {
  async uploadFile(file, projectId) {
    // 1. Validate file
    // 2. Upload to Supabase Storage
    // 3. Create database record
    // 4. Return result
  }
}
```

### Step 2: Add Upload UI to CAT Workspace

```javascript
// src/pages/dashboard/CATProjectView.jsx
// Add upload button
// Add simple upload modal
// Handle file selection
// Show upload progress
```

### Step 3: Create File Metadata Record

```javascript
// Store in project_files table:
{
  project_id,
  filename,
  file_size,
  mime_type,
  storage_path,
  upload_status: 'completed',
  uploaded_by,
  created_at
}
```

### Step 4: Display Uploaded Files

```javascript
// Show list of uploaded files
// Allow download
// Show upload date and size
```

## Testing Strategy

1. **Test locally first** - http://localhost:5174
2. **Test one file at a time** - Start with small TXT file
3. **Check browser console** - Look for errors
4. **Verify in Supabase** - Check Storage and Database
5. **Test on Vercel** - Deploy after local testing works

## Success Criteria

### Phase 1 Complete When:
- ✅ Can upload TXT file via UI
- ✅ File appears in Supabase Storage
- ✅ File record in project_files table
- ✅ Can see uploaded files list
- ✅ Can download uploaded file
- ✅ No browser console errors
- ✅ Works on both local and Vercel

### Phase 2 Complete When:
- ✅ TXT content extracted and segmented
- ✅ JSON content parsed and segmented
- ✅ CSV content parsed and segmented
- ✅ Segments appear in translation workspace

### Phase 3 Complete When:
- ✅ DOCX files parsed correctly
- ✅ PDF files parsed correctly
- ✅ All formats work reliably

## Key Differences from Previous Implementation

### ❌ Old Approach (Failed)
- Imported Node.js libraries (jsdom, jschardet)
- Complex parsing for 20+ file formats
- All parsing done immediately on upload
- Heavy dependencies bundled in browser

### ✅ New Approach (Will Work)
- Only browser-compatible libraries
- Start with 1-3 simple formats
- Progressive enhancement
- Minimal dependencies

## Timeline

- **Phase 1**: 30-45 minutes (basic upload working)
- **Phase 2**: 30 minutes (text parsing)
- **Phase 3**: 1 hour (document formats)

**Total**: ~2-3 hours for complete system

## Ready to Start?

Let's begin with Phase 1 - Simple File Upload for TXT files only.

This will get upload working quickly and reliably, then we can add more features.
