# Implementation Plan: Advanced File Upload System

## Overview

This implementation plan breaks down the Advanced File Upload System into discrete, incremental coding tasks. The system enables multi-file uploads (up to 200 files, 200MB each) in 80+ formats, with automatic text extraction, sentence-level segmentation, optional AI pre-translation, and integration with the Glossa CAT translation platform.

The implementation follows a bottom-up approach: core services first, then UI components, then integration. Each task builds on previous work, with checkpoints to validate functionality.

## Tasks

- [x] 1. Set up database schema and storage infrastructure
  - Create `project_files` table with columns: id, project_id, filename, file_size, file_type, mime_type, file_hash, storage_path, storage_url, upload_status, parse_status, error_message, version, parent_file_id, metadata, uploaded_by, created_at, updated_at
  - Create indexes on project_id, file_hash, and status columns
  - Extend `segments` table with file_id, segment_key, metadata, and original_format columns
  - Create `upload_sessions` table for resumable uploads with chunk tracking
  - Create `file_processing_queue` table for async processing management
  - Create Supabase Storage bucket named "project-files" with versioning enabled
  - Implement RLS policies for project_files table (client, translator, admin access)
  - Configure storage bucket policies matching database RLS rules
  - _Requirements: 8.1, 8.2, 8.6, 9.1, 9.2, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 2. Implement core validation service
  - [x] 2.1 Create ValidationService class in `src/services/validationService.js`
    - Implement `validateFile(file)` method checking size (max 200MB), format support, and file integrity
    - Implement `isFormatSupported(extension, mimeType)` with support for 80+ formats
    - Implement MIME type detection and extension matching validation
    - Implement empty file detection (reject zero-byte files)
    - Implement `calculateHash(file)` using SHA-256 for duplicate detection
    - Implement `checkDuplicate(hash, projectId)` querying project_files table
    - Return structured ValidationResult with errors, warnings, and file info
    - _Requirements: 3.1-3.9, 4.1-4.7, 18.1-18.6, 28.1-28.7_

  - [x] 2.2 Write unit tests for ValidationService
    - Test file size validation (under/over 200MB limit)
    - Test format support detection for all 80+ formats
    - Test MIME type and extension mismatch detection
    - Test hash calculation and duplicate detection
    - Test empty file rejection
    - _Requirements: 4.1-4.7_

- [x] 3. Implement storage service with chunked uploads
  - [x] 3.1 Create StorageService class in `src/services/storageService.js`
    - Implement `uploadFile(file, projectId, fileId, onProgress)` for standard uploads
    - Implement `uploadChunked(file, path, onProgress)` for files >50MB with 1MB chunks
    - Implement chunk tracking in upload_sessions table
    - Implement `getSignedUrl(path, expiresIn)` with 1-hour default expiration
    - Implement `deleteFile(path)` for cleanup operations
    - Implement `getStorageUsage(userId)` calculating total storage per user
    - Use storage path structure: {project_id}/{file_id}/original/{filename}
    - _Requirements: 8.1-8.7, 13.4, 27.1-27.3, 30.1-30.7_

  - [x] 3.2 Write unit tests for StorageService
    - Test standard upload flow
    - Test chunked upload for large files
    - Test chunk resumption after failure
    - Test signed URL generation
    - Test storage usage calculation
    - _Requirements: 8.1-8.7, 30.1-30.7_

- [x] 4. Implement progress tracking system
  - [x] 4.1 Create ProgressTracker class in `src/services/progressTracker.js`
    - Implement `initializeProgress(uploadId, totalSize)` creating progress state
    - Implement `updateProgress(uploadId, loaded)` calculating percentage, speed (MB/s), and ETA
    - Implement `getProgress(uploadId)` returning ProgressInfo object
    - Implement `completeProgress(uploadId)` marking upload as complete
    - Implement `failProgress(uploadId, error)` storing error details
    - Update progress at least once per second
    - _Requirements: 5.1-5.7_

  - [x] 4.2 Write unit tests for ProgressTracker
    - Test progress calculation accuracy
    - Test speed and ETA calculations
    - Test state transitions (uploading ΓåÆ completed/failed)
    - _Requirements: 5.1-5.7_

- [x] 5. Checkpoint - Validate core infrastructure
  - Ensure all tests pass, verify database schema is created correctly, test storage bucket access with RLS policies. Ask the user if questions arise.

- [x] 6. Implement file parser for document formats
  - [x] 6.1 Create FileParser class in `src/services/fileParser.js`
    - Implement `parseFile(file, fileType)` as main entry point
    - Implement `parseDocument(file)` for DOCX using mammoth.js library
    - Implement PDF parsing using pdf.js with multi-page support
    - Implement TXT parsing with encoding detection (UTF-8, UTF-16, ISO-8859-1)
    - Implement RTF parsing for text extraction
    - Implement ODT parsing (extract content.xml from ZIP)
    - Implement `parseWithStreaming(file, onChunk)` for files >10MB using 1MB chunks
    - Preserve formatting metadata in ParseResult for reconstruction
    - Handle parsing errors gracefully with descriptive error messages
    - _Requirements: 6.1-6.8, 13.1, 13.2, 25.1-25.7, 28.5, 28.6_

  - [x] 6.2 Write unit tests for document parsers
    - Test DOCX parsing with tables, headers, footers
    - Test PDF multi-page extraction
    - Test TXT encoding detection
    - Test streaming for large files
    - Test error handling for corrupted files
    - _Requirements: 6.1-6.8_

- [x] 7. Implement file parser for spreadsheet and presentation formats
  - [x] 7.1 Extend FileParser with spreadsheet and presentation support
    - Implement XLSX parsing using xlsx (SheetJS) library for cell extraction
    - Implement CSV parsing using papaparse with delimiter detection
    - Implement ODS parsing (extract content.xml from ZIP)
    - Implement PPTX parsing (extract slide text from ZIP/XML structure)
    - Implement ODP parsing (extract content.xml from ZIP)
    - _Requirements: 3.2, 3.3, 6.1-6.8_

  - [x] 7.2 Write unit tests for spreadsheet and presentation parsers
    - Test XLSX cell extraction from multiple sheets
    - Test CSV parsing with various delimiters
    - Test PPTX slide text extraction
    - _Requirements: 6.1-6.8_

- [-] 8. Implement file parser for web and markup formats
  - [x] 8.1 Extend FileParser with web and markup format support
    - Implement HTML parsing using DOMParser, extract text nodes
    - Implement XML parsing using DOMParser
    - Implement JSON parsing for string value extraction
    - Implement YAML parsing using js-yaml library
    - Implement Markdown parsing using marked or remark library
    - _Requirements: 3.4, 3.8, 6.1-6.8_

  - [x] 8.2 Write unit tests for web and markup parsers
    - Test HTML text extraction preserving structure
    - Test JSON string value extraction
    - Test Markdown parsing
    - _Requirements: 6.1-6.8_

- [x] 9. Implement file parser for localization formats
  - [x] 9.1 Extend FileParser with localization format support
    - Implement XLIFF parsing (extract source/target elements from XML)
    - Implement TMX parsing (translation memory exchange format)
    - Implement PO parsing (gettext format with msgid/msgstr)
    - Implement PROPERTIES parsing (Java key-value format)
    - Implement RESX parsing (.NET resources XML format)
    - Implement STRINGS parsing (iOS strings file format)
    - Implement Android XML string resources parsing
    - Preserve keys and metadata for reconstruction during export
    - Create one segment per translatable string
    - _Requirements: 3.6, 23.1-23.8_

  - [x] 9.2 Write unit tests for localization parsers
    - Test XLIFF source/target extraction
    - Test PO msgid/msgstr parsing
    - Test key preservation for all formats
    - Test round-trip property: parse ΓåÆ export ΓåÆ parse produces equivalent content
    - _Requirements: 23.1-23.8_

- [x] 10. Implement file parser for subtitle formats
  - [x] 10.1 Extend FileParser with subtitle format support
    - Implement SRT parsing (extract text and timing information)
    - Implement VTT parsing (WebVTT with cue identifiers)
    - Implement SUB parsing (MicroDVD format)
    - Implement SSA/ASS parsing (Advanced SubStation Alpha with styles)
    - Preserve timing information in segment metadata
    - Maintain subtitle sequence order
    - Create one segment per subtitle entry
    - _Requirements: 3.5, 24.1-24.8_

  - [x] 10.2 Write unit tests for subtitle parsers
    - Test SRT timing extraction
    - Test VTT cue parsing
    - Test timing preservation in metadata
    - Test invariant: number of segments equals number of subtitle entries
    - _Requirements: 24.1-24.8_

- [x] 11. Implement parser error recovery and partial extraction
  - [x] 11.1 Add error recovery to FileParser
    - Implement try-catch blocks around all parser methods
    - Implement partial content extraction when full parsing fails
    - Set parse_status to "partially_parsed" for partial success
    - Set parse_status to "parse_failed" when no content extracted
    - Log errors with file details to file_processing_queue table
    - Return ParseResult with success flag and error details
    - _Requirements: 6.6, 25.1-25.7_

  - [x] 11.2 Write unit tests for error recovery
    - Test partial extraction on corrupted files
    - Test error logging
    - Test status updates
    - _Requirements: 25.1-25.7_

- [x] 12. Checkpoint - Validate file parsing
  - Ensure all parser tests pass, test parsing for each supported format, verify error handling works correctly. Ask the user if questions arise.

- [x] 13. Implement segmentation engine
  - [x] 13.1 Create SegmentationEngine class in `src/services/segmentationEngine.js`
    - Implement `segmentText(text, language)` with sentence boundary detection
    - Implement punctuation-based splitting (., !, ? followed by whitespace and capital)
    - Implement abbreviation handling (Dr., Mr., etc.) to avoid false breaks
    - Implement number handling (preserve decimal points, numbered lists)
    - Implement quote handling (keep quotes with sentences)
    - Implement `segmentLocalizationContent(content)` creating one segment per key-value pair
    - Implement `segmentSubtitleContent(entries)` creating one segment per subtitle with timing metadata
    - Assign sequential segment numbers starting from 1
    - Preserve paragraph breaks and formatting markers
    - _Requirements: 7.1-7.8, 23.7, 24.4_

  - [x] 13.2 Implement segment storage
    - Implement `storeSegments(segments, projectId, fileId)` inserting into segments table
    - Process segments in batches of 100 to optimize performance
    - Include file_id, segment_key (for localization), and metadata (for timing/formatting)
    - Set segment status to "pending" for untranslated segments
    - _Requirements: 7.6, 9.2, 13.3_

  - [x] 13.3 Write unit tests for SegmentationEngine
    - Test sentence boundary detection for English text
    - Test abbreviation handling
    - Test localization content segmentation
    - Test subtitle segmentation with timing preservation
    - Test round-trip property: concatenating segments produces original text
    - Test invariant: segment count > 0 when source text is non-empty
    - _Requirements: 7.1-7.8_

- [x] 14. Implement batch processor for concurrent operations
  - [x] 14.1 Create BatchProcessor class in `src/services/batchProcessor.js`
    - Implement `processBatch(files, processor, concurrency)` with default concurrency of 5
    - Implement queue management for files exceeding concurrent limit
    - Implement `enqueue(file, processor)` adding files to queue
    - Implement `getQueueStatus()` returning active and queued file counts
    - Process files in FIFO order
    - Start next queued file when concurrent upload completes
    - Continue processing remaining files when one fails
    - _Requirements: 12.1-12.7, 29.1-29.7_

  - [x] 14.2 Write unit tests for BatchProcessor
    - Test concurrent limit enforcement
    - Test queue management
    - Test FIFO processing order
    - Test error isolation (one failure doesn't stop others)
    - _Requirements: 12.1-12.7_

- [x] 15. Implement upload manager orchestration
  - [x] 15.1 Create UploadManager class in `src/services/uploadManager.js`
    - Implement `uploadFiles(files, projectId, options)` as main orchestration method
    - Validate file count (max 200 files) and display error if exceeded
    - Validate each file using ValidationService
    - Calculate and display total size of all selected files
    - Check storage quota before upload using StorageService
    - Use BatchProcessor for concurrent uploads (5 concurrent)
    - For each file: upload to storage ΓåÆ create project_files record ΓåÆ parse ΓåÆ segment
    - Update upload_status through states: "uploading" ΓåÆ "completed" ΓåÆ "parsed"
    - Handle duplicate detection and display warning with option to proceed
    - Implement `cancelUpload(uploadId)` aborting operation and cleaning up
    - Implement `resumeUpload(uploadId)` for failed uploads
    - Implement `getProgress(uploadId)` delegating to ProgressTracker
    - _Requirements: 1.1-1.6, 9.1-9.7, 15.1-15.7, 18.3-18.5, 21.1-21.7, 27.4-27.6, 30.1-30.7_

  - [x] 15.2 Write integration tests for UploadManager
    - Test full upload workflow (validation ΓåÆ upload ΓåÆ parse ΓåÆ segment)
    - Test file count limit enforcement
    - Test storage quota checking
    - Test duplicate detection workflow
    - Test upload cancellation and cleanup
    - Test upload resumption
    - _Requirements: 1.1-1.6, 21.1-21.7, 30.1-30.7_

- [x] 16. Checkpoint - Validate upload workflow
  - Ensure upload manager tests pass, test end-to-end upload with real files, verify database records are created correctly. Ask the user if questions arise.

- [x] 17. Implement pre-translation service
  - [x] 17.1 Create PreTranslationService class in `src/services/preTranslationService.js`
    - Import existing `translateText` function from `src/services/aiTranslation.js`
    - Implement `preTranslateSegments(segments, sourceLang, targetLang, onProgress)` method
    - Process segments in batches of 50 for optimal performance
    - Implement `translateBatch(batch, sourceLang, targetLang)` using Promise.all for parallel translation
    - Implement `updateSegmentsWithTranslations(projectId, results)` updating target_text field
    - Set segment status to "draft" for AI-translated segments
    - Handle translation failures gracefully (leave target_text empty, log error)
    - Report progress via onProgress callback
    - _Requirements: 11.1-11.8_

  - [x] 17.2 Write unit tests for PreTranslationService
    - Test batch processing (50 segments per batch)
    - Test progress reporting
    - Test error handling for failed translations
    - Test segment status updates
    - _Requirements: 11.1-11.8_

- [x] 18. Implement format converter and export functionality
  - [x] 18.1 Create FormatConverter class in `src/services/formatConverter.js`
    - Implement `convertFormat(file, targetFormat)` for DOCX Γåö PDF Γåö TXT Γåö HTML conversions
    - Implement `reconstructFile(fileId, segments, originalFormat)` replacing source with translated text
    - Implement `prettyPrint(content, format)` for JSON (2-space indent), XLIFF, PO formats
    - Implement `exportToXLIFF(segments, metadata)` creating valid XLIFF output
    - Implement `exportToTMX(segments, metadata)` creating valid TMX output
    - Preserve formatting metadata during reconstruction
    - Preserve timing information for subtitle exports
    - Preserve keys for localization file exports
    - Sort keys alphabetically in JSON/PROPERTIES when requested
    - Validate exported files against format specifications
    - _Requirements: 14.1-14.7, 19.1-19.7, 23.6, 23.8, 24.7, 26.1-26.7_

  - [x] 18.2 Write unit tests for FormatConverter
    - Test format conversion between supported formats
    - Test file reconstruction with translations
    - Test pretty printing for each format
    - Test XLIFF and TMX export validity
    - Test round-trip property: parse ΓåÆ export ΓåÆ parse produces valid file
    - _Requirements: 14.1-14.7, 19.1-19.7, 26.1-26.7_

- [x] 19. Implement download manager
  - [x] 19.1 Create DownloadManager class in `src/services/downloadManager.js`
    - Implement download functionality for projects with status "completed"
    - Retrieve segments for file from database
    - Use FormatConverter to reconstruct file with translations
    - Generate filename using pattern: {original_filename}_{target_language}.{extension}
    - Support export to DOCX, PDF, TXT, XLIFF, and TMX formats
    - Implement bulk download creating ZIP archive of all project files
    - Complete file generation within 60 seconds for projects up to 10,000 segments
    - Trigger browser download with generated file
    - _Requirements: 14.1-14.7_

  - [x] 19.2 Write unit tests for DownloadManager
    - Test single file download
    - Test bulk ZIP download
    - Test filename generation
    - Test performance for large projects
    - _Requirements: 14.1-14.7_

- [x] 20. Implement file versioning and replacement
  - [x] 20.1 Add versioning support to UploadManager
    - Implement "Replace File" functionality in UploadManager
    - Store new version with incremented version number in project_files table
    - Set parent_file_id to reference previous version
    - Store new version in storage path: {project_id}/{file_id}/versions/v{N}_{filename}
    - Re-parse and re-segment new file version
    - Compare segments between versions to identify changes
    - Preserve existing translations for matching segments
    - Mark changed segments with status "needs_review"
    - Provide UI to view and restore previous versions
    - _Requirements: 17.1-17.7_

  - [x] 20.2 Write unit tests for file versioning
    - Test version number increment
    - Test parent_file_id linkage
    - Test segment comparison logic
    - Test translation preservation for unchanged segments
    - _Requirements: 17.1-17.7_

- [x] 21. Checkpoint - Validate translation and export features
  - Ensure pre-translation works with AI service, test file export in all supported formats, verify versioning and replacement functionality. Ask the user if questions arise.

- [x] 22. Create FileUploadZone React component
  - [x] 22.1 Create `src/components/FileUploadZone.jsx`
    - Implement drag-and-drop zone with visual indicator on drag-over
    - Implement traditional file selection button as alternative
    - Accept projectId, onUploadComplete, and options props
    - Display drop zone with clear instructions
    - Handle file drop events and add files to upload queue
    - Handle file selection from button click
    - Display error messages for validation failures
    - Show file count and size limits (200 files, 200MB each)
    - Integrate with UploadManager for file processing
    - _Requirements: 2.1-2.5, 22.1-22.7_

  - [x] 22.2 Write component tests for FileUploadZone
    - Test drag-and-drop interaction
    - Test file selection button
    - Test visual feedback on drag-over
    - Test error message display
    - _Requirements: 2.1-2.5_

- [x] 23. Create FilePreviewPanel React component
  - [x] 23.1 Create `src/components/FilePreviewPanel.jsx`
    - Display list of selected files before upload
    - Show filename, size, type, and modification date for each file
    - Provide "Remove" button to deselect files
    - Display first 500 characters for TXT/CSV files
    - Display thumbnail preview for images and PDFs
    - Allow drag-to-reorder files in upload queue
    - Display total file count and combined size
    - Accept files, onRemove, and onReorder props
    - _Requirements: 22.1-22.7_

  - [x] 23.2 Write component tests for FilePreviewPanel
    - Test file list rendering
    - Test remove functionality
    - Test reorder functionality
    - Test preview display for different file types
    - _Requirements: 22.1-22.7_

- [x] 24. Create UploadProgressList React component
  - [x] 24.1 Create `src/components/UploadProgressList.jsx`
    - Display list of uploads with progress bars
    - Show percentage, upload speed (MB/s), and ETA for each file
    - Display overall progress for batch uploads
    - Show success indicator when upload completes
    - Show error indicator with retry button when upload fails
    - Provide cancel button for each file during upload
    - Update progress at least once per second
    - Accept uploads, onCancel, and onRetry props
    - Integrate with ProgressTracker for real-time updates
    - _Requirements: 5.1-5.7, 15.1, 15.6_

  - [x] 24.2 Write component tests for UploadProgressList
    - Test progress bar rendering
    - Test speed and ETA display
    - Test cancel button functionality
    - Test retry button functionality
    - Test real-time progress updates
    - _Requirements: 5.1-5.7_

- [x] 25. Create upload options panel component
  - [x] 25.1 Create `src/components/UploadOptionsPanel.jsx`
    - Display checkbox for "Enable AI Pre-Translation"
    - Display source and target language selectors
    - Display storage quota usage and remaining space
    - Display concurrent upload limit setting (admin only)
    - Accept projectId and onChange props
    - Integrate with project settings to get source/target languages
    - Show warning when storage quota reaches 90%
    - _Requirements: 11.1, 11.2, 27.4, 27.5, 29.5_

  - [x] 25.2 Write component tests for UploadOptionsPanel
    - Test AI pre-translation checkbox
    - Test language selector interaction
    - Test storage quota display
    - Test quota warning display
    - _Requirements: 11.1, 27.4, 27.5_

- [x] 26. Integrate upload system with CAT project view
  - [x] 26.1 Add upload functionality to `src/pages/dashboard/CATProjectView.jsx`
    - Import FileUploadZone, FilePreviewPanel, UploadProgressList, and UploadOptionsPanel components
    - Add "Upload Files" button to project view
    - Display upload modal/panel when button clicked
    - Pass projectId to FileUploadZone component
    - Handle onUploadComplete callback to refresh project data
    - Update project status to "ready" when upload completes
    - Display notification for assigned translator when files ready
    - Show uploaded files list in project view
    - Provide "Replace File" option for existing files
    - Provide "Download" button for completed translations
    - _Requirements: 20.1-20.7_

  - [x] 26.2 Write integration tests for CAT project upload
    - Test upload button display
    - Test modal/panel opening
    - Test project status update after upload
    - Test file list display
    - _Requirements: 20.1-20.7_

- [x] 27. Implement upload history and audit trail
  - [x] 27.1 Create upload history view component
    - Create `src/components/UploadHistoryView.jsx`
    - Display all uploads for a project with timestamps, user, file size, status
    - Show upload duration and processing time
    - Implement filtering by date range, user, and status
    - Show all uploads for admins, only own uploads for clients
    - Provide "Retry Failed" button to reprocess failed files
    - Display summary of successful and failed uploads
    - _Requirements: 16.1-16.7, 25.6, 25.7_

  - [x] 27.2 Write component tests for UploadHistoryView
    - Test history list rendering
    - Test filtering functionality
    - Test role-based visibility (admin vs client)
    - Test retry button functionality
    - _Requirements: 16.1-16.7_

- [x] 28. Checkpoint - Validate UI components
  - Ensure all component tests pass, test upload flow through UI, verify progress tracking works correctly, test error handling in UI. Ask the user if questions arise.

- [x] 29. Implement memory optimization and monitoring
  - [x] 29.1 Add memory monitoring to BatchProcessor
    - Implement `checkMemoryUsage()` function using performance.memory API
    - Pause new file processing when memory usage exceeds 80%
    - Resume processing when memory drops below 70%
    - Log memory warnings to console
    - _Requirements: 13.5_

  - [x] 29.2 Optimize FileParser for memory efficiency
    - Ensure streaming is used for files >10MB
    - Release file chunks immediately after processing
    - Add explicit null assignments after processing
    - Add setTimeout(0) between batches to allow garbage collection
    - _Requirements: 13.1, 13.2, 13.3, 13.6_

  - [x] 29.3 Write performance tests
    - Test memory usage with large files (>100MB)
    - Test concurrent upload memory footprint
    - Test garbage collection effectiveness
    - _Requirements: 13.1-13.6_

- [x] 30. Implement error handling and logging
  - [x] 30.1 Add comprehensive error handling to all services
    - Wrap all async operations in try-catch blocks
    - Log errors to file_processing_queue table with timestamps and user IDs
    - Display user-friendly error messages for common failures
    - Implement specific error messages for network loss, quota exceeded, corrupted files, parsing failures, segmentation failures
    - Provide "Report Issue" button capturing error details
    - _Requirements: 15.1-15.7_

  - [x] 30.2 Write error handling tests
    - Test network failure handling
    - Test quota exceeded handling
    - Test corrupted file handling
    - Test error logging
    - _Requirements: 15.1-15.7_

- [x] 31. Implement storage quota management
  - [x] 31.1 Add quota tracking to StorageService
    - Implement `getStorageUsage(userId)` calculating total file sizes
    - Implement `getUserQuota(userId)` retrieving quota from user settings
    - Implement `checkStorageQuota(userId, fileSize)` before uploads
    - Send warning notification when quota reaches 90%
    - Prevent uploads when quota exceeded
    - Display quota information in upload UI
    - Update quota calculations hourly via scheduled function
    - _Requirements: 27.1-27.7_

  - [x] 31.2 Write tests for quota management
    - Test quota calculation accuracy
    - Test quota enforcement
    - Test warning notifications
    - _Requirements: 27.1-27.7_

- [x] 32. Implement CAT workspace integration
  - [x] 32.1 Create integration functions in UploadManager
    - Implement `integrateWithCAT(projectId, fileId)` function
    - Update project status to "ready" when parsing completes
    - Create notification for assigned translator
    - Ensure segments are queryable by CAT workspace
    - Include file metadata (filename, file_id) with segments
    - Enable file-based navigation in CAT workspace
    - _Requirements: 20.1-20.7_

  - [x] 32.2 Write integration tests
    - Test project status update
    - Test notification creation
    - Test segment availability in CAT workspace
    - Test file metadata association
    - _Requirements: 20.1-20.7_

- [x] 33. Add file format conversion UI
  - [x] 33.1 Create format conversion component
    - Create `src/components/FileFormatConverter.jsx`
    - Display "Convert Format" option in file menu
    - Show supported target formats based on source format
    - Use FormatConverter service for conversion
    - Display progress during conversion
    - Notify user when conversion completes
    - Display error message if conversion fails
    - Complete conversion within 30 seconds for files up to 20MB
    - _Requirements: 19.1-19.7_

  - [x] 33.2 Write component tests for format converter
    - Test format selection UI
    - Test conversion progress display
    - Test completion notification
    - Test error handling
    - _Requirements: 19.1-19.7_

- [x] 34. Final checkpoint - End-to-end testing
  - Test complete upload workflow: select files ΓåÆ validate ΓåÆ upload ΓåÆ parse ΓåÆ segment ΓåÆ pre-translate ΓåÆ view in CAT workspace
  - Test file replacement and versioning
  - Test download and export in all formats
  - Test error recovery and resumable uploads
  - Test concurrent uploads with memory monitoring
  - Test RLS policies with different user roles
  - Verify all requirements are met
  - Ensure all tests pass, ask the user if questions arise.

- [x] 35. Documentation and cleanup
  - Add JSDoc comments to all service classes and methods
  - Add inline comments explaining complex logic
  - Update README with upload system usage instructions
  - Document supported file formats and limitations
  - Document storage quota management
  - Remove any debug logging or console.log statements
  - Optimize imports and remove unused dependencies

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and catch issues early
- The implementation uses JavaScript/TypeScript with React and Supabase
- All file processing happens client-side using browser-compatible libraries
- Memory optimization is critical for handling large files and concurrent uploads
- RLS policies ensure data security and role-based access control
- The system integrates seamlessly with existing CAT workspace functionality
