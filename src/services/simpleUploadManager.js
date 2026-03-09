/**
 * SimpleUploadManager - Browser-compatible file upload
 * 
 * Handles file uploads to Supabase Storage with progress tracking.
 * No Node.js dependencies - works in all browsers.
 */

import { supabase } from '../lib/supabase';
import browserFileParser from './browserFileParser';
import segmentationEngine from './segmentationEngine';

class SimpleUploadManager {
  /**
   * Upload a file to Supabase Storage
   * @param {File} file - Browser File object
   * @param {string} projectId - Project ID
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(file, projectId, onProgress = null) {
    try {
      console.log('[Upload] Starting upload for:', file.name);
      
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Sanitize filename - remove special characters that cause issues in storage
      const sanitizedFilename = file.name
        .replace(/[[\]{}()|<>]/g, '') // Remove brackets and special chars
        .replace(/[^\w\s.-]/g, '_') // Replace other special chars with underscore
        .replace(/\s+/g, '_') // Replace spaces with underscore
        .replace(/_+/g, '_'); // Replace multiple underscores with single

      // Generate unique file path
      const timestamp = Date.now();
      const fileId = `${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
      const storagePath = `${projectId}/${fileId}/${sanitizedFilename}`;

      console.log('[Upload] Sanitized filename:', sanitizedFilename);
      console.log('[Upload] Storage path:', storagePath);

      // Upload to Supabase Storage
      if (onProgress) onProgress({ status: 'uploading', percentage: 0 });

      console.log('[Upload] Uploading to storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[Upload] Storage upload error:', uploadError);
        throw uploadError;
      }

      if (onProgress) onProgress({ status: 'uploading', percentage: 30 });

      // Get public URL (for private bucket, this returns signed URL)
      const { data: urlData } = supabase.storage
        .from('project-files')
        .getPublicUrl(storagePath);

      // Get current user from session
      console.log('[Upload] Getting user session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[Upload] Session error:', sessionError);
      }
      
      const userId = session?.user?.id || null;
      console.log('[Upload] User ID:', userId);

      // Create database record
      console.log('[Upload] Creating file record in database...');
      
      // Get file extension for file_type
      const fileExtension = sanitizedFilename.split('.').pop().toLowerCase();
      
      const { data: fileRecord, error: dbError } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          filename: file.name,
          file_size: file.size,
          file_type: fileExtension,
          mime_type: file.type || 'application/octet-stream',
          storage_path: storagePath,
          storage_url: urlData.publicUrl,
          upload_status: 'completed',
          uploaded_by: userId
        })
        .select()
        .single();

      if (dbError) {
        console.error('[Upload] Database error:', dbError);
        throw dbError;
      }

      console.log('[Upload] File record created:', fileRecord.id);
      if (onProgress) onProgress({ status: 'parsing', percentage: 50 });

      // Parse the file
      console.log('[Upload] Parsing file:', file.name);
      const parseResult = await browserFileParser.parseFile(file);
      
      if (!parseResult.success) {
        console.warn('[Upload] File parsing failed:', parseResult.error);
        // Update file record with parse error
        await supabase
          .from('project_files')
          .update({ 
            upload_status: 'parse_failed',
            error_message: parseResult.error 
          })
          .eq('id', fileRecord.id);

        if (onProgress) onProgress({ status: 'completed', percentage: 100 });
        
        return {
          success: true,
          file: fileRecord,
          message: `File uploaded but parsing failed: ${parseResult.error}`,
          parsed: false
        };
      }

      console.log('[Upload] Parse successful, segments found:', parseResult.segments?.length || 0);
      if (onProgress) onProgress({ status: 'segmenting', percentage: 70 });

      // Segment the parsed content
      console.log('[Upload] Segmenting content from:', file.name);
      const segmentResult = await segmentationEngine.processAndStore(
        parseResult,
        projectId,
        fileRecord.id
      );

      if (!segmentResult.success) {
        console.warn('[Upload] Segmentation failed:', segmentResult.error);
        // Update file record
        await supabase
          .from('project_files')
          .update({ 
            upload_status: 'segment_failed',
            error_message: segmentResult.error 
          })
          .eq('id', fileRecord.id);

        if (onProgress) onProgress({ status: 'completed', percentage: 100 });

        return {
          success: true,
          file: fileRecord,
          message: `File uploaded and parsed but segmentation failed: ${segmentResult.error}`,
          parsed: true,
          segmented: false
        };
      }

      // Update file record to parsed status
      await supabase
        .from('project_files')
        .update({ upload_status: 'parsed' })
        .eq('id', fileRecord.id);

      if (onProgress) onProgress({ status: 'completed', percentage: 100 });

      console.log(`[Upload] Successfully processed file: ${file.name} - ${segmentResult.segmentCount} segments created`);

      return {
        success: true,
        file: fileRecord,
        message: `File uploaded successfully - ${segmentResult.segmentCount} segments created`,
        parsed: true,
        segmented: true,
        segmentCount: segmentResult.segmentCount
      };

    } catch (error) {
      console.error('[Upload] Upload error:', error);
      console.error('[Upload] Error stack:', error.stack);
      if (onProgress) onProgress({ status: 'failed', percentage: 0, error: error.message });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload multiple files
   * @param {File[]} files - Array of File objects
   * @param {string} projectId - Project ID
   * @param {Function} onProgress - Progress callback for each file
   * @returns {Promise<Object[]>} Array of upload results
   */
  async uploadFiles(files, projectId, onProgress = null) {
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      const fileProgress = (progress) => {
        if (onProgress) {
          onProgress({
            fileIndex: i,
            filename: file.name,
            ...progress
          });
        }
      };

      const result = await this.uploadFile(file, projectId, fileProgress);
      results.push({
        filename: file.name,
        ...result
      });
    }

    return results;
  }

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   */
  validateFile(file) {
    // Check file exists
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    // Check file size (50 MB limit for Supabase free plan)
    const maxSize = 50 * 1024 * 1024; // 50 MB in bytes
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `File too large. Maximum size is 50 MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)} MB.` 
      };
    }

    // Check file size minimum
    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }

    // Allowed file types
    const allowedTypes = [
      'text/plain',
      'application/json',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
      'application/vnd.ms-excel', // XLS
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
      'application/vnd.oasis.opendocument.text', // ODT
      'application/rtf',
      'text/html',
      'application/xml',
      'text/xml',
      'application/x-xliff+xml',
      'application/x-tmx+xml',
      'application/x-subrip', // SRT
      'text/vtt',
      'text/x-gettext-translation', // PO
      'text/x-java-properties',
      'application/x-yaml',
      'text/yaml'
    ];

    const allowedExtensions = [
      '.txt', '.json', '.csv', '.docx', '.pdf',
      '.xlsx', '.xls', '.pptx', '.odt', '.rtf',
      '.html', '.htm', '.xml', 
      '.xliff', '.xlf', '.sdlxliff', '.ttx', '.itd', '.sdlppx', '.sdlrpx',
      '.tmx', '.mxf',
      '.srt', '.vtt', 
      '.po', '.properties', '.resx', '.strings',
      '.yaml', '.yml', '.ini',
      '.md', '.markdown',
      '.js', '.jsx', '.ts', '.tsx',
      '.vue', '.php', '.toml', '.arb'
    ];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    const isAllowedType = allowedTypes.includes(file.type) || 
                          allowedExtensions.includes(fileExtension);

    if (!isAllowedType) {
      return { 
        valid: false, 
        error: `File type not supported. Allowed: TXT, JSON, CSV, DOCX, HTML, XML, XLIFF, TMX, SRT, VTT, PO, PROPERTIES, MARKDOWN` 
      };
    }

    return { valid: true };
  }

  /**
   * Get uploaded files for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<Object[]>} Array of file records
   */
  async getProjectFiles(projectId) {
    try {
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, files: data || [] };
    } catch (error) {
      console.error('Error fetching files:', error);
      return { success: false, error: error.message, files: [] };
    }
  }

  /**
   * Download a file from storage
   * @param {string} storagePath - Path in storage bucket
   * @param {string} filename - Original filename
   * @returns {Promise<void>}
   */
  async downloadFile(storagePath, filename) {
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .download(storagePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  /**
   * Delete a file from storage and database
   * @param {string} fileId - File record ID
   * @param {string} storagePath - Path in storage bucket
   * @returns {Promise<Object>} Delete result
   */
  async deleteFile(fileId, storagePath) {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([storagePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const simpleUploadManager = new SimpleUploadManager();
export default simpleUploadManager;
