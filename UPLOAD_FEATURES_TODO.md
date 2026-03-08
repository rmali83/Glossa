# Upload Features To Implement

## Current Status ✅
- [x] File upload to Supabase Storage
- [x] File validation (size, type)
- [x] Upload progress tracking
- [x] Drag & drop interface
- [x] Multiple file upload
- [x] Database records (project_files table)

## Missing Features from Spec 📋

### 1. File Parsing & Text Extraction
**Status:** Partially implemented (browserFileParser.js created but not integrated)

**What's Needed:**
- Parse TXT, JSON, CSV files ✅ (code exists)
- Parse DOCX files (need to integrate mammoth library)
- Parse PDF files (need to integrate pdfjs-dist library)
- Extract text content from all supported formats
- Handle parsing errors gracefully

**Files to Update:**
- `src/services/simpleUploadManager.js` - Add parsing after upload
- `src/services/browserFileParser.js` - Already created, needs integration

### 2. Text Segmentation
**Status:** Not implemented

**What's Needed:**
- Split extracted text into translation units (sentences)
- Create segment records in database
- Link segments to uploaded files
- Support different segmentation rules per format

**Files to Create:**
- `src/services/segmentationEngine.js` - Segment text into translation units

**Files to Update:**
- `src/services/simpleUploadManager.js` - Add segmentation after parsing

### 3. Integration with CAT Workspace
**Status:** Not implemented

**What's Needed:**
- After upload + parse + segment, refresh segments in workspace
- Display newly created segments for translation
- Link segments to source files

**Files to Update:**
- `src/pages/dashboard/CATProjectView.jsx` - Refresh segments after upload

### 4. Pre-Translation (Optional)
**Status:** Not implemented

**What's Needed:**
- Match segments against Translation Memory
- Apply AI translation if enabled
- Mark pre-translated segments

**Files to Update:**
- `src/services/simpleUploadManager.js` - Add pre-translation step

### 5. File Format Conversion
**Status:** Not implemented

**What's Needed:**
- Convert between formats (e.g., DOCX → TXT)
- Export translated content in original format

**Files to Create:**
- `src/services/formatConverter.js`

### 6. Advanced Features (Lower Priority)
- [ ] Resumable uploads for large files
- [ ] Duplicate file detection
- [ ] File versioning
- [ ] Batch processing queue
- [ ] Memory optimization for large files

## Implementation Priority

### Phase 1: Core Parsing & Segmentation (Do This Now)
1. Integrate browserFileParser into upload flow
2. Create segmentationEngine
3. Update simpleUploadManager to parse + segment
4. Refresh CAT workspace after upload

### Phase 2: Document Formats
1. Add DOCX parsing (mammoth)
2. Add PDF parsing (pdfjs-dist)
3. Test with real files

### Phase 3: Advanced Features
1. Pre-translation matching
2. Format conversion
3. File versioning

## Next Steps

Would you like me to:
1. **Implement Phase 1** - Add parsing & segmentation to current upload (30-45 min)
2. **Implement Phase 2** - Add DOCX/PDF support (1 hour)
3. **Implement Phase 3** - Add advanced features (2+ hours)

Or focus on specific features from the spec?
