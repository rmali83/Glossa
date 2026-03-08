/**
 * SegmentationEngine - Split text into translation units
 * 
 * Handles sentence-level segmentation with support for:
 * - Sentence boundary detection
 * - Abbreviation handling
 * - Localization formats (key-value pairs)
 * - Subtitle formats (with timing)
 */

import { supabase } from '../lib/supabase';

class SegmentationEngine {
  /**
   * Common abbreviations that shouldn't trigger sentence breaks
   */
  abbreviations = [
    'Dr', 'Mr', 'Mrs', 'Ms', 'Prof', 'Sr', 'Jr',
    'etc', 'vs', 'e.g', 'i.e', 'Inc', 'Ltd', 'Co',
    'St', 'Ave', 'Blvd', 'Rd', 'No', 'Vol', 'Fig'
  ];

  /**
   * Segment plain text into sentences
   * @param {string} text - Text to segment
   * @param {string} language - Source language (optional)
   * @returns {Array<Object>} Array of segment objects
   */
  segmentText(text, language = 'en') {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // Split on sentence boundaries: . ! ? followed by space and capital letter
    // But preserve abbreviations
    const segments = [];
    let currentSegment = '';
    const sentences = text.split(/([.!?]+\s+)/);

    for (let i = 0; i < sentences.length; i++) {
      const part = sentences[i];
      currentSegment += part;

      // Check if this is a sentence boundary
      if (/[.!?]+\s+$/.test(part)) {
        // Check if previous word is an abbreviation
        const words = currentSegment.trim().split(/\s+/);
        const lastWord = words[words.length - 1];
        const isAbbreviation = this.abbreviations.some(abbr => 
          lastWord.toLowerCase().startsWith(abbr.toLowerCase() + '.')
        );

        if (!isAbbreviation) {
          // This is a real sentence boundary
          const trimmed = currentSegment.trim();
          if (trimmed.length > 0) {
            segments.push({
              text: trimmed,
              type: 'sentence'
            });
          }
          currentSegment = '';
        }
      }
    }

    // Add remaining text as final segment
    if (currentSegment.trim().length > 0) {
      segments.push({
        text: currentSegment.trim(),
        type: 'sentence'
      });
    }

    return segments;
  }

  /**
   * Segment localization content (key-value pairs)
   * @param {Object|Array} content - Parsed localization content
   * @returns {Array<Object>} Array of segment objects with keys
   */
  segmentLocalizationContent(content) {
    const segments = [];

    if (Array.isArray(content)) {
      // Array of key-value objects (from JSON parser)
      content.forEach(item => {
        if (item.key && item.text) {
          segments.push({
            text: item.text,
            key: item.key,
            type: 'localization'
          });
        }
      });
    } else if (typeof content === 'object') {
      // Flat object
      Object.entries(content).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim().length > 0) {
          segments.push({
            text: value,
            key: key,
            type: 'localization'
          });
        }
      });
    }

    return segments;
  }

  /**
   * Segment subtitle content (with timing information)
   * @param {Array<Object>} entries - Subtitle entries with text and timing
   * @returns {Array<Object>} Array of segment objects with timing metadata
   */
  segmentSubtitleContent(entries) {
    return entries.map(entry => ({
      text: entry.text,
      type: 'subtitle',
      metadata: {
        startTime: entry.startTime,
        endTime: entry.endTime,
        index: entry.index
      }
    }));
  }

  /**
   * Store segments in database
   * @param {Array<Object>} segments - Segments to store
   * @param {string} projectId - Project ID
   * @param {string} fileId - File ID
   * @returns {Promise<Object>} Result with success flag and created segments
   */
  async storeSegments(segments, projectId, fileId) {
    if (!segments || segments.length === 0) {
      return {
        success: false,
        error: 'No segments to store',
        segments: []
      };
    }

    try {
      // Get current user - use getSession instead of getUser to avoid RLS issues
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        console.warn('Could not get user session, proceeding without user ID');
      }

      const userId = session?.user?.id || null;

      // Prepare segment records for database
      const segmentRecords = segments.map((seg, index) => ({
        project_id: projectId,
        file_id: fileId,
        source_text: seg.text,
        target_text: '',
        status: 'Draft',
        segment_key: seg.key || null,
        metadata: seg.metadata ? JSON.stringify(seg.metadata) : null,
        original_format: seg.type || 'text',
        created_by: userId
      }));

      // Insert in batches of 100
      const batchSize = 100;
      const insertedSegments = [];

      for (let i = 0; i < segmentRecords.length; i += batchSize) {
        const batch = segmentRecords.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('segments')
          .insert(batch)
          .select();

        if (error) {
          console.error('Error inserting segment batch:', error);
          throw error;
        }

        if (data) {
          insertedSegments.push(...data);
        }
      }

      console.log(`Successfully stored ${insertedSegments.length} segments`);

      return {
        success: true,
        segments: insertedSegments,
        count: insertedSegments.length
      };

    } catch (error) {
      console.error('Error storing segments:', error);
      return {
        success: false,
        error: error.message,
        segments: []
      };
    }
  }

  /**
   * Process parsed file content and create segments
   * @param {Object} parseResult - Result from file parser
   * @param {string} projectId - Project ID
   * @param {string} fileId - File ID
   * @returns {Promise<Object>} Result with success flag and segment count
   */
  async processAndStore(parseResult, projectId, fileId) {
    if (!parseResult.success) {
      return {
        success: false,
        error: 'Parse result was not successful',
        segmentCount: 0
      };
    }

    let segments = [];

    // Handle different content types
    if (parseResult.segments && Array.isArray(parseResult.segments)) {
      // Parser already provided segments (JSON, CSV, localization formats)
      if (parseResult.metadata?.format === 'json' || 
          parseResult.metadata?.format === 'csv') {
        // These are already segmented by the parser
        segments = parseResult.segments.map(seg => {
          if (typeof seg === 'string') {
            return { text: seg, type: 'text' };
          } else if (seg.key && seg.text) {
            return { text: seg.text, key: seg.key, type: 'localization' };
          }
          return seg;
        });
      } else {
        segments = parseResult.segments.map(seg => ({ text: seg, type: 'text' }));
      }
    } else if (parseResult.content) {
      // Plain text content - needs segmentation
      segments = this.segmentText(parseResult.content);
    }

    // Store segments in database
    const result = await this.storeSegments(segments, projectId, fileId);

    return {
      success: result.success,
      error: result.error,
      segmentCount: result.count || 0,
      segments: result.segments
    };
  }
}

// Export singleton instance
const segmentationEngine = new SegmentationEngine();
export default segmentationEngine;
