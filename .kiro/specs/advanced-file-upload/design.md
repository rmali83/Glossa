# Design Document: Advanced File Upload System

## Overview

The Advanced File Upload System is a comprehensive file management solution for the Glossa CAT translation platform. It enables users to upload multiple files (up to 200 files, 200MB each) in 80+ formats, automatically extract and segment translatable content, optionally pre-translate using AI, and manage files throughout the translation workflow.

The system is built on React with Supabase as the backend infrastructure, leveraging Supabase Storage for file persistence and PostgreSQL for metadata management. The architecture emphasizes streaming processing for memory efficiency, batch operations for performance, and robust error handling for production reliability.

### Key Capabilities

- Multi-file drag-and-drop upload with real-time progress tracking
- Support for 80+ file formats including documents, spreadsheets, presentations, subtitles, and localization files
- Automatic text extraction and sentence-level segmentation
- Optional AI pre-translation using existing translation services
- Resumable uploads with automatic retry on network failure
- File versioning and duplicate detection
- Format conversion and export capabilities
- Role-based access control with Supabase RLS
- Memory-optimized processing for large files

## Architecture

### System Components

The system follows a modular architecture with clear separation of concerns:

```
ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
Γöé                     React Frontend                           Γöé
Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ      Γöé
Γöé  Γöé   Upload UI  Γöé  Γöé  Progress    Γöé  Γöé   File       Γöé      Γöé
Γöé  Γöé   Component  Γöé  Γöé  Tracker     Γöé  Γöé   Preview    Γöé      Γöé
Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ      Γöé
ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
                            Γöé
                            Γû╝
ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
Γöé                   Service Layer                              Γöé
Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ      Γöé
Γöé  Γöé   Upload     Γöé  Γöé  Validation  Γöé  Γöé   Batch      Γöé      Γöé
Γöé  Γöé   Manager    Γöé  Γöé  Service     Γöé  Γöé   Processor  Γöé      Γöé
Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ      Γöé
Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ      Γöé
Γöé  Γöé   File       Γöé  Γöé  SegmentationΓöé  Γöé   Format     Γöé      Γöé
Γöé  Γöé   Parser     Γöé  Γöé  Engine      Γöé  Γöé   Converter  Γöé      Γöé
Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ      Γöé
ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
                            Γöé
                            Γû╝
ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
Γöé                  Supabase Backend                            Γöé
Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ      Γöé
Γöé  Γöé   Storage    Γöé  Γöé  PostgreSQL  Γöé  Γöé     RLS      Γöé      Γöé
Γöé  Γöé   Buckets    Γöé  Γöé  Database    Γöé  Γöé   Policies   Γöé      Γöé
Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ      Γöé
ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
```

### Data Flow

1. **Upload Phase**: User selects/drops files ΓåÆ Validation ΓåÆ Chunked upload to Supabase Storage
2. **Processing Phase**: File parsing ΓåÆ Text extraction ΓåÆ Sentence segmentation ΓåÆ Database storage
3. **Translation Phase**: Optional AI pre-translation ΓåÆ Segment population ΓåÆ CAT workspace integration
4. **Export Phase**: Segment retrieval ΓåÆ Format reconstruction ΓåÆ File download

### Technology Stack

- **Frontend**: React 19, React Router, Vite
- **Backend**: Supabase (Storage + PostgreSQL + Auth + RLS)
- **File Processing**: Browser-based parsing libraries (mammoth.js for DOCX, pdf.js for PDF, etc.)
- **AI Translation**: Existing aiTranslation.js service (MyMemory, LibreTranslate)
- **State Management**: React hooks and context
- **Upload Strategy**: Chunked uploads with resumability

## Components and Interfaces

### 1. Upload Manager (`src/services/uploadManager.js`)

Orchestrates the entire upload workflow from file selection to completion.

```javascript
class UploadManager {
  /**
   * Initialize upload for multiple files
   * @param {File[]} files - Array of File objects
   * @param {string} projectId - Target project UUID
   * @param {Object} options - Upload options (enableAI, etc.)
   * @returns {Promise<UploadResult[]>}
   */
  async uploadFiles(files, projectId, options = {})

  /**
   * Cancel an in-progress upload
   * @param {string} uploadId - Upload identifier
   */
  async cancelUpload(uploadId)

  /**
   * Resume a failed upload
   * @param {string} uploadId - Upload identifier
   * @returns {Promise<UploadResult>}
   */
  async resumeUpload(uploadId)

  /**
   * Get upload progress for a file
   * @param {string} uploadId - Upload identifier
   * @returns {UploadProgress}
   */
  getProgress(uploadId)
}
```

### 2. Validation Service (`src/services/validationService.js`)

Validates files before upload begins.

```javascript
class ValidationService {
  /**
   * Validate a single file
   * @param {File} file - File object to validate
   * @returns {ValidationResult}
   */
  validateFile(file)

  /**
   * Check file format support
   * @param {string} extension - File extension
   * @param {string} mimeType - MIME type
   * @returns {boolean}
   */
  isFormatSupported(extension, mimeType)

  /**
   * Calculate file hash for duplicate detection
   * @param {File} file - File object
   * @returns {Promise<string>} SHA-256 hash
   */
  async calculateHash(file)

  /**
   * Check for duplicate files in project
   * @param {string} hash - File hash
   * @param {string} projectId - Project UUID
   * @returns {Promise<DuplicateInfo|null>}
   */
  async checkDuplicate(hash, projectId)
}
```

### 3. File Parser (`src/services/fileParser.js`)

Extracts text content from various file formats.

```javascript
class FileParser {
  /**
   * Parse file and extract text
   * @param {File} file - File object
   * @param {string} fileType - File format
   * @returns {Promise<ParseResult>}
   */
  async parseFile(file, fileType)

  /**
   * Parse document formats (DOCX, PDF, etc.)
   * @param {File} file - File object
   * @returns {Promise<DocumentContent>}
   */
  async parseDocument(file)

  /**
   * Parse localization formats (JSON, XLIFF, PO, etc.)
   * @param {File} file - File object
   * @param {string} format - Localization format
   * @returns {Promise<LocalizationContent>}
   */
  async parseLocalizationFile(file, format)

  /**
   * Parse subtitle formats (SRT, VTT, etc.)
   * @param {File} file - File object
   * @param {string} format - Subtitle format
   * @returns {Promise<SubtitleContent>}
   */
  async parseSubtitleFile(file, format)

  /**
   * Extract text using streaming for large files
   * @param {File} file - File object
   * @param {Function} onChunk - Callback for each chunk
   * @returns {Promise<void>}
   */
  async parseWithStreaming(file, onChunk)
}
```

### 4. Segmentation Engine (`src/services/segmentationEngine.js`)

Splits extracted text into sentence-level translation units.

```javascript
class SegmentationEngine {
  /**
   * Segment text into sentences
   * @param {string} text - Extracted text
   * @param {string} language - Source language
   * @returns {Segment[]}
   */
  segmentText(text, language)

  /**
   * Segment localization content (key-value pairs)
   * @param {Object} content - Localization content
   * @returns {Segment[]}
   */
  segmentLocalizationContent(content)

  /**
   * Segment subtitle content (with timing)
   * @param {SubtitleEntry[]} entries - Subtitle entries
   * @returns {Segment[]}
   */
  segmentSubtitleContent(entries)

  /**
   * Store segments in database
   * @param {Segment[]} segments - Array of segments
   * @param {string} projectId - Project UUID
   * @param {string} fileId - File UUID
   * @returns {Promise<void>}
   */
  async storeSegments(segments, projectId, fileId)
}
```

### 5. Batch Processor (`src/services/batchProcessor.js`)

Manages concurrent file uploads and processing.

```javascript
class BatchProcessor {
  /**
   * Process multiple files with concurrency control
   * @param {File[]} files - Array of files
   * @param {Function} processor - Processing function
   * @param {number} concurrency - Max concurrent operations
   * @returns {Promise<ProcessResult[]>}
   */
  async processBatch(files, processor, concurrency = 5)

  /**
   * Add file to processing queue
   * @param {File} file - File to queue
   * @param {Function} processor - Processing function
   */
  enqueue(file, processor)

  /**
   * Get queue status
   * @returns {QueueStatus}
   */
  getQueueStatus()
}
```

### 6. Storage Service (`src/services/storageService.js`)

Handles Supabase Storage operations.

```javascript
class StorageService {
  /**
   * Upload file to Supabase Storage
   * @param {File} file - File object
   * @param {string} projectId - Project UUID
   * @param {string} fileId - File UUID
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<StorageResult>}
   */
  async uploadFile(file, projectId, fileId, onProgress)

  /**
   * Upload file with chunking for large files
   * @param {File} file - File object
   * @param {string} path - Storage path
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<StorageResult>}
   */
  async uploadChunked(file, path, onProgress)

  /**
   * Generate signed URL for file access
   * @param {string} path - Storage path
   * @param {number} expiresIn - Expiration in seconds
   * @returns {Promise<string>}
   */
  async getSignedUrl(path, expiresIn = 3600)

  /**
   * Delete file from storage
   * @param {string} path - Storage path
   * @returns {Promise<void>}
   */
  async deleteFile(path)

  /**
   * Get storage usage for user/project
   * @param {string} userId - User UUID
   * @returns {Promise<StorageUsage>}
   */
  async getStorageUsage(userId)
}
```

### 7. Format Converter (`src/services/formatConverter.js`)

Converts files between formats and reconstructs translated files.

```javascript
class FormatConverter {
  /**
   * Convert file to different format
   * @param {File} file - Source file
   * @param {string} targetFormat - Target format
   * @returns {Promise<Blob>}
   */
  async convertFormat(file, targetFormat)

  /**
   * Reconstruct file with translations
   * @param {string} fileId - File UUID
   * @param {Segment[]} segments - Translated segments
   * @param {string} originalFormat - Original file format
   * @returns {Promise<Blob>}
   */
  async reconstructFile(fileId, segments, originalFormat)

  /**
   * Pretty print localization file
   * @param {Object} content - Localization content
   * @param {string} format - File format
   * @returns {string}
   */
  prettyPrint(content, format)

  /**
   * Export to XLIFF format
   * @param {Segment[]} segments - Segments to export
   * @param {Object} metadata - File metadata
   * @returns {string}
   */
  exportToXLIFF(segments, metadata)

  /**
   * Export to TMX format
   * @param {Segment[]} segments - Segments to export
   * @param {Object} metadata - File metadata
   * @returns {string}
   */
  exportToTMX(segments, metadata)
}
```

### 8. Progress Tracker (`src/services/progressTracker.js`)

Tracks and reports upload/processing progress.

```javascript
class ProgressTracker {
  /**
   * Initialize progress tracking for upload
   * @param {string} uploadId - Upload identifier
   * @param {number} totalSize - Total file size
   */
  initializeProgress(uploadId, totalSize)

  /**
   * Update progress
   * @param {string} uploadId - Upload identifier
   * @param {number} loaded - Bytes loaded
   */
  updateProgress(uploadId, loaded)

  /**
   * Get progress information
   * @param {string} uploadId - Upload identifier
   * @returns {ProgressInfo}
   */
  getProgress(uploadId)

  /**
   * Mark upload as complete
   * @param {string} uploadId - Upload identifier
   */
  completeProgress(uploadId)

  /**
   * Mark upload as failed
   * @param {string} uploadId - Upload identifier
   * @param {Error} error - Error object
   */
  failProgress(uploadId, error)
}
```

### 9. Pre-Translation Service (`src/services/preTranslationService.js`)

Integrates with existing AI translation service for pre-translation.

```javascript
class PreTranslationService {
  /**
   * Pre-translate segments using AI
   * @param {Segment[]} segments - Segments to translate
   * @param {string} sourceLang - Source language
   * @param {string} targetLang - Target language
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<TranslationResult[]>}
   */
  async preTranslateSegments(segments, sourceLang, targetLang, onProgress)

  /**
   * Translate batch of segments
   * @param {Segment[]} batch - Segment batch (max 50)
   * @param {string} sourceLang - Source language
   * @param {string} targetLang - Target language
   * @returns {Promise<TranslationResult[]>}
   */
  async translateBatch(batch, sourceLang, targetLang)

  /**
   * Update segments with translations
   * @param {string} projectId - Project UUID
   * @param {TranslationResult[]} results - Translation results
   * @returns {Promise<void>}
   */
  async updateSegmentsWithTranslations(projectId, results)
}
```

### 10. React Components

#### FileUploadZone Component (`src/components/FileUploadZone.jsx`)

```javascript
/**
 * Drag-and-drop file upload zone
 * @param {Object} props
 * @param {string} props.projectId - Target project UUID
 * @param {Function} props.onUploadComplete - Callback when upload completes
 * @param {Object} props.options - Upload options
 */
function FileUploadZone({ projectId, onUploadComplete, options })
```

#### UploadProgressList Component (`src/components/UploadProgressList.jsx`)

```javascript
/**
 * Display list of uploads with progress bars
 * @param {Object} props
 * @param {UploadProgress[]} props.uploads - Array of upload progress objects
 * @param {Function} props.onCancel - Cancel callback
 * @param {Function} props.onRetry - Retry callback
 */
function UploadProgressList({ uploads, onCancel, onRetry })
```

#### FilePreviewPanel Component (`src/components/FilePreviewPanel.jsx`)

```javascript
/**
 * Preview selected files before upload
 * @param {Object} props
 * @param {File[]} props.files - Selected files
 * @param {Function} props.onRemove - Remove file callback
 * @param {Function} props.onReorder - Reorder files callback
 */
function FilePreviewPanel({ files, onRemove, onReorder })
```

## Data Models

### Database Schema

#### project_files Table

```sql
CREATE TABLE public.project_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(200),
    file_hash VARCHAR(64), -- SHA-256 hash for duplicate detection
    storage_path TEXT NOT NULL,
    storage_url TEXT,
    upload_status VARCHAR(50) DEFAULT 'uploading',
    parse_status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    version INTEGER DEFAULT 1,
    parent_file_id UUID REFERENCES public.project_files(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_project_files_project_id ON public.project_files(project_id);
CREATE INDEX idx_project_files_hash ON public.project_files(file_hash);
CREATE INDEX idx_project_files_status ON public.project_files(upload_status, parse_status);
```

#### segments Table (Extended)

```sql
-- Extend existing segments table
ALTER TABLE public.segments ADD COLUMN IF NOT EXISTS file_id UUID REFERENCES public.project_files(id) ON DELETE CASCADE;
ALTER TABLE public.segments ADD COLUMN IF NOT EXISTS segment_key VARCHAR(500); -- For localization files
ALTER TABLE public.segments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb; -- For timing, formatting, etc.
ALTER TABLE public.segments ADD COLUMN IF NOT EXISTS original_format VARCHAR(100);

CREATE INDEX idx_segments_file_id ON public.segments(file_id);
```

#### upload_sessions Table

```sql
CREATE TABLE public.upload_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID REFERENCES public.project_files(id) ON DELETE CASCADE,
    upload_id VARCHAR(200) UNIQUE NOT NULL, -- For resumable uploads
    chunk_size INTEGER DEFAULT 1048576, -- 1MB chunks
    uploaded_chunks JSONB DEFAULT '[]'::jsonb, -- Array of uploaded chunk numbers
    total_chunks INTEGER,
    status VARCHAR(50) DEFAULT 'in_progress',
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_upload_sessions_upload_id ON public.upload_sessions(upload_id);
CREATE INDEX idx_upload_sessions_expires ON public.upload_sessions(expires_at);
```

#### file_processing_queue Table

```sql
CREATE TABLE public.file_processing_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID REFERENCES public.project_files(id) ON DELETE CASCADE,
    processing_type VARCHAR(50) NOT NULL, -- 'parse', 'segment', 'translate'
    priority INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'queued',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_processing_queue_status ON public.file_processing_queue(status, priority);
```

### TypeScript Interfaces

```typescript
interface UploadOptions {
  enableAI: boolean;
  sourceLang: string;
  targetLang: string;
  chunkSize?: number;
  concurrency?: number;
}

interface UploadResult {
  fileId: string;
  filename: string;
  status: 'success' | 'failed' | 'cancelled';
  error?: string;
  storagePath?: string;
  segmentCount?: number;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  fileInfo: {
    name: string;
    size: number;
    type: string;
    mimeType: string;
  };
}

interface ParseResult {
  success: boolean;
  content: string | LocalizationContent | SubtitleContent;
  metadata: {
    format: string;
    encoding?: string;
    pageCount?: number;
    wordCount?: number;
  };
  error?: string;
}

interface Segment {
  segmentNumber: number;
  sourceText: string;
  targetText?: string;
  segmentKey?: string; // For localization files
  metadata?: {
    timing?: { start: string; end: string }; // For subtitles
    formatting?: any; // For preserving document formatting
    context?: string;
  };
}

interface ProgressInfo {
  uploadId: string;
  filename: string;
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  estimatedTimeRemaining: number; // seconds
  status: 'uploading' | 'processing' | 'completed' | 'failed';
}

interface StorageResult {
  path: string;
  url: string;
  size: number;
}

interface LocalizationContent {
  format: 'json' | 'xliff' | 'po' | 'properties' | 'resx';
  entries: Array<{
    key: string;
    value: string;
    context?: string;
    metadata?: any;
  }>;
}

interface SubtitleContent {
  format: 'srt' | 'vtt' | 'sub' | 'ssa' | 'ass';
  entries: Array<{
    index: number;
    start: string;
    end: string;
    text: string;
    style?: any;
  }>;
}
```

### Supabase Storage Structure

```
project-files/
Γö£ΓöÇΓöÇ {project_id}/
Γöé   Γö£ΓöÇΓöÇ {file_id}/
Γöé   Γöé   Γö£ΓöÇΓöÇ original/
Γöé   Γöé   Γöé   ΓööΓöÇΓöÇ {filename}
Γöé   Γöé   ΓööΓöÇΓöÇ versions/
Γöé   Γöé       Γö£ΓöÇΓöÇ v1_{filename}
Γöé   Γöé       Γö£ΓöÇΓöÇ v2_{filename}
Γöé   Γöé       ΓööΓöÇΓöÇ ...
```

### Row Level Security Policies

```sql
-- RLS for project_files table
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- Clients can view their own uploaded files
CREATE POLICY "Clients can view own files"
ON public.project_files FOR SELECT
USING (uploaded_by = auth.uid());

-- Translators can view files in assigned projects
CREATE POLICY "Translators can view assigned project files"
ON public.project_files FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = project_files.project_id
        AND projects.translator_id = auth.uid()
    )
);

-- Admins can view all files
CREATE POLICY "Admins can view all files"
ON public.project_files FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE users.id = auth.uid()
        AND users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Clients can insert files to their projects
CREATE POLICY "Clients can upload files"
ON public.project_files FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = project_files.project_id
        AND projects.created_by = auth.uid()
    )
);

-- Users can update their own files
CREATE POLICY "Users can update own files"
ON public.project_files FOR UPDATE
USING (uploaded_by = auth.uid());

-- Storage bucket policies
-- Applied through Supabase dashboard or SQL
```


## File Format Support Strategy

### Document Formats

- **DOCX**: Use `mammoth.js` for text extraction with formatting preservation
- **PDF**: Use `pdf.js` (Mozilla) for text extraction, handle multi-page documents
- **TXT**: Direct text reading with encoding detection (UTF-8, UTF-16, ISO-8859-1)
- **RTF**: Use `rtf.js` or convert to plain text
- **ODT**: Parse as ZIP, extract content.xml, parse XML
- **PAGES**: Limited support, extract text from preview if available

### Spreadsheet Formats

- **XLSX**: Use `xlsx` (SheetJS) library for cell extraction
- **CSV**: Parse with `papaparse`, handle various delimiters and encodings
- **ODS**: Parse as ZIP, extract content.xml
- **NUMBERS**: Limited support, attempt conversion

### Presentation Formats

- **PPTX**: Parse as ZIP, extract slide text from XML
- **KEY**: Limited support
- **ODP**: Parse as ZIP, extract content.xml

### Web Formats

- **HTML**: Use DOMParser, extract text nodes, preserve structure
- **XML**: Parse with DOMParser, extract text content
- **JSON**: Parse and extract string values
- **YAML**: Use `js-yaml` library

### Subtitle Formats

- **SRT**: Custom parser for timestamp and text extraction
- **VTT**: Parse WebVTT format with cue identifiers
- **SUB**: Parse MicroDVD format
- **SSA/ASS**: Parse Advanced SubStation Alpha format with styles

### Localization Formats

- **XLIFF**: XML parser for source/target elements
- **TMX**: XML parser for translation memory exchange
- **PO**: Custom parser for gettext format
- **PROPERTIES**: Key-value parser for Java properties
- **RESX**: XML parser for .NET resources
- **STRINGS**: iOS strings file parser
- **ANDROID_XML**: Android string resources parser
- **IOS_STRINGS**: Parse .strings format

### CAT Tool Formats

- **SDLXLIFF**: Extended XLIFF parser
- **MXF**: Memsource format parser
- **TTX**: Trados TagEditor format

### Markup Formats

- **MARKDOWN**: Parse with `marked` or `remark`, extract text
- **LATEX**: Custom parser for LaTeX commands
- **RESTRUCTUREDTEXT**: Parse RST format

### Parser Selection Logic

```javascript
function selectParser(fileType, mimeType) {
  const parserMap = {
    'docx': 'mammoth',
    'pdf': 'pdfjs',
    'txt': 'text',
    'xlsx': 'sheetjs',
    'csv': 'papaparse',
    'html': 'domparser',
    'xml': 'domparser',
    'json': 'json',
    'srt': 'subtitle',
    'vtt': 'subtitle',
    'xliff': 'xliff',
    'po': 'gettext',
    // ... more mappings
  };
  
  return parserMap[fileType] || 'fallback';
}
```

## Segmentation Strategy

### Sentence Boundary Detection

Use language-specific rules for sentence segmentation:

1. **Punctuation-based**: Split on `.`, `!`, `?` followed by whitespace and capital letter
2. **Abbreviation handling**: Maintain list of common abbreviations (Dr., Mr., etc.)
3. **Number handling**: Don't split on decimal points or numbered lists
4. **Quote handling**: Keep quotes with their sentences
5. **Language-specific rules**: Different rules for CJK languages (Chinese, Japanese, Korean)

### Segmentation Rules

```javascript
class SegmentationRules {
  // English segmentation
  segmentEnglish(text) {
    // Use regex with lookahead/lookbehind
    // Handle abbreviations, numbers, quotes
  }
  
  // CJK segmentation
  segmentCJK(text) {
    // Split on πÇé∩╝ü∩╝ƒ
    // Handle different punctuation
  }
  
  // Arabic segmentation
  segmentArabic(text) {
    // RTL text handling
    // Arabic punctuation
  }
}
```

### Localization File Segmentation

For localization files, each key-value pair becomes a segment:

```javascript
// JSON example
{
  "welcome": "Welcome to our app",
  "login": "Log in"
}
// Creates 2 segments with keys preserved
```

### Subtitle Segmentation

Each subtitle entry becomes a segment with timing metadata:

```javascript
// SRT example
{
  segmentNumber: 1,
  sourceText: "Hello, world!",
  metadata: {
    timing: { start: "00:00:01,000", end: "00:00:03,000" }
  }
}
```

## Upload Strategy

### Chunked Upload Implementation

For files larger than 50MB, implement chunked uploads:

1. **Chunk Size**: 1MB chunks (configurable)
2. **Parallel Chunks**: Upload 3 chunks concurrently
3. **Chunk Tracking**: Store uploaded chunk numbers in database
4. **Resumability**: Resume from last uploaded chunk on failure
5. **Reassembly**: Supabase Storage handles chunk reassembly

```javascript
async function uploadChunked(file, path, onProgress) {
  const chunkSize = 1024 * 1024; // 1MB
  const totalChunks = Math.ceil(file.size / chunkSize);
  
  // Create upload session
  const sessionId = await createUploadSession(file, totalChunks);
  
  // Upload chunks
  for (let i = 0; i < totalChunks; i++) {
    const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
    await uploadChunk(sessionId, i, chunk);
    onProgress((i + 1) / totalChunks * 100);
  }
  
  // Finalize upload
  await finalizeUpload(sessionId);
}
```

### Resumable Upload Flow

```
1. Client starts upload ΓåÆ Create upload_session record
2. Upload chunks ΓåÆ Update uploaded_chunks array
3. Network failure ΓåÆ Store progress
4. Client reconnects ΓåÆ Query uploaded_chunks
5. Resume from last chunk ΓåÆ Continue upload
6. Complete ΓåÆ Mark session as complete
```

### Concurrent Upload Management

```javascript
class ConcurrentUploadManager {
  constructor(maxConcurrent = 5) {
    this.maxConcurrent = maxConcurrent;
    this.activeUploads = new Set();
    this.queue = [];
  }
  
  async addUpload(file, processor) {
    if (this.activeUploads.size < this.maxConcurrent) {
      await this.startUpload(file, processor);
    } else {
      this.queue.push({ file, processor });
    }
  }
  
  async startUpload(file, processor) {
    this.activeUploads.add(file.name);
    try {
      await processor(file);
    } finally {
      this.activeUploads.delete(file.name);
      this.processQueue();
    }
  }
  
  processQueue() {
    if (this.queue.length > 0 && this.activeUploads.size < this.maxConcurrent) {
      const { file, processor } = this.queue.shift();
      this.startUpload(file, processor);
    }
  }
}
```

## Memory Optimization

### Streaming for Large Files

```javascript
async function parseWithStreaming(file) {
  const chunkSize = 1024 * 1024; // 1MB
  let offset = 0;
  
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    const text = await chunk.text();
    
    // Process chunk
    await processChunk(text);
    
    // Release memory
    chunk = null;
    offset += chunkSize;
  }
}
```

### Batch Processing for Segments

```javascript
async function storeSegmentsBatch(segments, batchSize = 100) {
  for (let i = 0; i < segments.length; i += batchSize) {
    const batch = segments.slice(i, i + batchSize);
    await supabase.from('segments').insert(batch);
    
    // Allow garbage collection
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

### Memory Monitoring

```javascript
function checkMemoryUsage() {
  if (performance.memory) {
    const used = performance.memory.usedJSHeapSize;
    const limit = performance.memory.jsHeapSizeLimit;
    const percentage = (used / limit) * 100;
    
    if (percentage > 80) {
      // Pause processing, trigger garbage collection
      return 'high';
    }
  }
  return 'normal';
}
```

## Integration Points

### CAT Workspace Integration

After file processing completes:

1. Update project status to "ready"
2. Create notification for assigned translator
3. Segments automatically appear in CAT workspace via existing segments table
4. File metadata available for context

```javascript
async function integrateWithCAT(projectId, fileId) {
  // Update project
  await supabase
    .from('projects')
    .update({ status: 'ready', updated_at: new Date() })
    .eq('id', projectId);
  
  // Create notification
  const project = await getProject(projectId);
  if (project.translator_id) {
    await supabase.from('notifications').insert({
      user_id: project.translator_id,
      title: 'New files ready for translation',
      message: `Files have been uploaded and are ready for translation`,
      type: 'info',
      link: `/cat/${projectId}`
    });
  }
}
```

### AI Translation Integration

Use existing `aiTranslation.js` service:

```javascript
import { translateText } from '../services/aiTranslation.js';

async function preTranslateSegments(segments, sourceLang, targetLang, onProgress) {
  const batchSize = 50;
  const results = [];
  
  for (let i = 0; i < segments.length; i += batchSize) {
    const batch = segments.slice(i, i + batchSize);
    
    const translations = await Promise.all(
      batch.map(segment => 
        translateText(segment.sourceText, sourceLang, targetLang)
      )
    );
    
    results.push(...translations);
    onProgress((i + batchSize) / segments.length * 100);
  }
  
  return results;
}
```

### Storage Quota Integration

```javascript
async function checkStorageQuota(userId, fileSize) {
  const usage = await getStorageUsage(userId);
  const quota = await getUserQuota(userId);
  
  if (usage + fileSize > quota) {
    throw new Error('Storage quota exceeded');
  }
  
  if ((usage + fileSize) / quota > 0.9) {
    // Send warning notification
    await sendQuotaWarning(userId, usage, quota);
  }
}
```

