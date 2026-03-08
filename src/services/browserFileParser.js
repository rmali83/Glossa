/**
 * BrowserFileParser - Parse files in the browser
 * 
 * Extracts text content from various file formats using only browser-compatible libraries.
 * No Node.js dependencies.
 */

import Papa from 'papaparse';
import mammoth from 'mammoth';

class BrowserFileParser {
  /**
   * Parse a file and extract text content
   * @param {File} file - Browser File object
   * @returns {Promise<Object>} Parsed content
   */
  async parseFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    
    try {
      switch (extension) {
        case 'txt':
          return await this.parseTXT(file);
        case 'json':
          return await this.parseJSON(file);
        case 'csv':
          return await this.parseCSV(file);
        case 'docx':
          return await this.parseDOCX(file);
        default:
          return {
            success: false,
            error: `File type .${extension} parsing not yet implemented. Supported: TXT, JSON, CSV, DOCX`
          };
      }
    } catch (error) {
      console.error('Parse error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse TXT file
   */
  async parseTXT(file) {
    const text = await file.text();
    
    // Split into paragraphs (segments)
    const segments = text
      .split(/\n\n+/) // Split on double newlines
      .map(para => para.trim())
      .filter(para => para.length > 0);

    return {
      success: true,
      content: text,
      segments: segments,
      metadata: {
        format: 'txt',
        segmentCount: segments.length,
        wordCount: text.split(/\s+/).filter(w => w.length > 0).length
      }
    };
  }

  /**
   * Parse JSON file (localization format)
   */
  async parseJSON(file) {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Extract translatable strings
    const segments = this.extractJSONStrings(data);

    return {
      success: true,
      content: text,
      segments: segments,
      metadata: {
        format: 'json',
        segmentCount: segments.length,
        structure: 'key-value'
      }
    };
  }

  /**
   * Extract strings from JSON object recursively
   */
  extractJSONStrings(obj, prefix = '') {
    const segments = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'string' && value.trim().length > 0) {
        segments.push({
          key: fullKey,
          text: value
        });
      } else if (typeof value === 'object' && value !== null) {
        segments.push(...this.extractJSONStrings(value, fullKey));
      }
    }
    
    return segments;
  }

  /**
   * Parse CSV file
   */
  async parseCSV(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          // Assume first text column contains source text
          const textColumn = Object.keys(results.data[0] || {})[0];
          
          const segments = results.data
            .map(row => row[textColumn])
            .filter(text => text && text.trim().length > 0);

          resolve({
            success: true,
            content: JSON.stringify(results.data),
            segments: segments,
            metadata: {
              format: 'csv',
              segmentCount: segments.length,
              columns: Object.keys(results.data[0] || {})
            }
          });
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  /**
   * Parse DOCX file using mammoth
   */
  async parseDOCX(file) {
    try {
      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Extract text using mammoth
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      const text = result.value;
      
      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: 'DOCX file appears to be empty'
        };
      }

      // Split into paragraphs (segments)
      const segments = text
        .split(/\n\n+/) // Split on double newlines
        .map(para => para.trim())
        .filter(para => para.length > 0);

      return {
        success: true,
        content: text,
        segments: segments,
        metadata: {
          format: 'docx',
          segmentCount: segments.length,
          wordCount: text.split(/\s+/).filter(w => w.length > 0).length
        }
      };
    } catch (error) {
      console.error('DOCX parse error:', error);
      return {
        success: false,
        error: `Failed to parse DOCX: ${error.message}`
      };
    }
  }

  /**
   * Segment text into translation units
   * @param {string} text - Text to segment
   * @returns {string[]} Array of segments
   */
  segmentText(text) {
    // Simple sentence-based segmentation
    // Split on sentence boundaries
    const segments = text
      .split(/[.!?]+\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    return segments;
  }
}

// Export singleton instance
const browserFileParser = new BrowserFileParser();
export default browserFileParser;
