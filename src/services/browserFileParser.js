/**
 * BrowserFileParser - Parse files in the browser
 * 
 * Extracts text content from various file formats using only browser-compatible libraries.
 * No Node.js dependencies.
 */

import Papa from 'papaparse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
        case 'pdf':
          return await this.parsePDF(file);
        case 'xlsx':
        case 'xls':
          return await this.parseXLSX(file);
        case 'pptx':
          return await this.parsePPTX(file);
        case 'odt':
          return await this.parseODT(file);
        case 'rtf':
          return await this.parseRTF(file);
        case 'html':
        case 'htm':
          return await this.parseHTML(file);
        case 'xml':
          return await this.parseXML(file);
        case 'xliff':
        case 'xlf':
        case 'sdlxliff':
          return await this.parseXLIFF(file);
        case 'tmx':
          return await this.parseTMX(file);
        case 'mxf':
          return await this.parseMXF(file);
        case 'srt':
          return await this.parseSRT(file);
        case 'vtt':
          return await this.parseVTT(file);
        case 'po':
          return await this.parsePO(file);
        case 'properties':
          return await this.parseProperties(file);
        case 'resx':
          return await this.parseRESX(file);
        case 'strings':
          return await this.parseStrings(file);
        case 'yaml':
        case 'yml':
          return await this.parseYAML(file);
        case 'ini':
          return await this.parseINI(file);
        case 'md':
        case 'markdown':
          return await this.parseMarkdown(file);
        default:
          return {
            success: false,
            error: `File type .${extension} not supported. Supported: TXT, JSON, CSV, DOCX, PDF, XLSX, PPTX, ODT, RTF, HTML, XML, XLIFF, SDLXLIFF, TMX, MXF, SRT, VTT, PO, PROPERTIES, RESX, STRINGS, YAML, INI, MARKDOWN`
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

  /**
   * Parse HTML file
   */
  async parseHTML(file) {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const body = doc.body;
    if (!body) return { success: false, error: 'Invalid HTML' };
    body.querySelectorAll('script, style').forEach(el => el.remove());
    const content = body.textContent || '';
    const segments = content.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
    return { success: true, content, segments, metadata: { format: 'html', segmentCount: segments.length } };
  }

  /**
   * Parse XML file
   */
  async parseXML(file) {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    if (doc.querySelector('parsererror')) return { success: false, error: 'Invalid XML' };
    const segments = [];
    const walker = doc.createTreeWalker(doc, NodeFilter.SHOW_TEXT);
    let node;
    while (node = walker.nextNode()) {
      const t = node.textContent.trim();
      if (t.length > 0) segments.push(t);
    }
    return { success: true, content: text, segments, metadata: { format: 'xml', segmentCount: segments.length } };
  }

  /**
   * Parse XLIFF file
   */
  async parseXLIFF(file) {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    const transUnits = doc.querySelectorAll('trans-unit');
    const segments = [];
    transUnits.forEach(unit => {
      const source = unit.querySelector('source');
      const id = unit.getAttribute('id');
      if (source) segments.push({ key: id, text: source.textContent.trim() });
    });
    return { success: true, content: text, segments, metadata: { format: 'xliff', segmentCount: segments.length } };
  }

  /**
   * Parse TMX file
   */
  async parseTMX(file) {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    const tus = doc.querySelectorAll('tu');
    const segments = [];
    tus.forEach(tu => {
      const seg = tu.querySelector('tuv seg');
      if (seg) segments.push(seg.textContent.trim());
    });
    return { success: true, content: text, segments, metadata: { format: 'tmx', segmentCount: segments.length } };
  }

  /**
   * Parse SRT subtitle file
   */
  async parseSRT(file) {
    const text = await file.text();
    const blocks = text.split(/\n\n+/);
    const segments = [];
    blocks.forEach(block => {
      const lines = block.split('\n');
      if (lines.length >= 3) {
        const subtitleText = lines.slice(2).join(' ').trim();
        if (subtitleText) segments.push(subtitleText);
      }
    });
    return { success: true, content: text, segments, metadata: { format: 'srt', segmentCount: segments.length } };
  }

  /**
   * Parse VTT subtitle file
   */
  async parseVTT(file) {
    const text = await file.text();
    const lines = text.split('\n');
    const segments = [];
    let cueText = '';
    lines.forEach(line => {
      line = line.trim();
      if (line.startsWith('WEBVTT') || line === '' || /^\d+$/.test(line) || line.includes('-->')) {
        if (cueText) { segments.push(cueText); cueText = ''; }
      } else if (line) {
        cueText += (cueText ? ' ' : '') + line;
      }
    });
    if (cueText) segments.push(cueText);
    return { success: true, content: text, segments, metadata: { format: 'vtt', segmentCount: segments.length } };
  }

  /**
   * Parse PO file
   */
  async parsePO(file) {
    const text = await file.text();
    const segments = [];
    const lines = text.split('\n');
    let currentMsgid = '';
    lines.forEach(line => {
      line = line.trim();
      if (line.startsWith('msgid ')) {
        if (currentMsgid && currentMsgid !== '""') {
          segments.push({ key: currentMsgid.replace(/^"|"$/g, ''), text: currentMsgid.replace(/^"|"$/g, '') });
        }
        currentMsgid = line.substring(6).trim();
      }
    });
    if (currentMsgid && currentMsgid !== '""') {
      segments.push({ key: currentMsgid.replace(/^"|"$/g, ''), text: currentMsgid.replace(/^"|"$/g, '') });
    }
    return { success: true, content: text, segments, metadata: { format: 'po', segmentCount: segments.length } };
  }

  /**
   * Parse Properties file
   */
  async parseProperties(file) {
    const text = await file.text();
    const lines = text.split('\n');
    const segments = [];
    lines.forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#') || line.startsWith('!')) return;
      const idx = line.indexOf('=');
      if (idx > 0) {
        const key = line.substring(0, idx).trim();
        const value = line.substring(idx + 1).trim();
        if (value) segments.push({ key, text: value });
      }
    });
    return { success: true, content: text, segments, metadata: { format: 'properties', segmentCount: segments.length } };
  }

  /**
   * Parse Markdown file
   */
  async parseMarkdown(file) {
    const text = await file.text();
    const segments = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
    return { success: true, content: text, segments, metadata: { format: 'markdown', segmentCount: segments.length } };
  }

  /**
   * Parse PDF file
   */
  async parsePDF(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        text += pageText + '\n\n';
      }
      const segments = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
      return { success: true, content: text, segments, metadata: { format: 'pdf', segmentCount: segments.length, pages: pdf.numPages } };
    } catch (error) {
      return { success: false, error: `PDF parsing failed: ${error.message}` };
    }
  }

  /**
   * Parse XLSX file
   */
  async parseXLSX(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const segments = [];
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        data.forEach(row => {
          row.forEach(cell => {
            if (cell && typeof cell === 'string' && cell.trim().length > 0) {
              segments.push(cell.trim());
            }
          });
        });
      });
      return { success: true, content: JSON.stringify(segments), segments, metadata: { format: 'xlsx', segmentCount: segments.length, sheets: workbook.SheetNames.length } };
    } catch (error) {
      return { success: false, error: `XLSX parsing failed: ${error.message}` };
    }
  }

  /**
   * Parse PPTX file (basic text extraction)
   */
  async parsePPTX(file) {
    // PPTX is a ZIP file, extract text from XML
    const text = await file.text();
    const segments = text.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
    return { success: true, content: text, segments, metadata: { format: 'pptx', segmentCount: segments.length } };
  }

  /**
   * Parse ODT file (OpenDocument)
   */
  async parseODT(file) {
    const text = await file.text();
    const segments = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
    return { success: true, content: text, segments, metadata: { format: 'odt', segmentCount: segments.length } };
  }

  /**
   * Parse RTF file
   */
  async parseRTF(file) {
    const text = await file.text();
    // Remove RTF control codes
    const cleanText = text.replace(/\\[a-z]+\d*\s?/g, '').replace(/[{}]/g, '');
    const segments = cleanText.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
    return { success: true, content: cleanText, segments, metadata: { format: 'rtf', segmentCount: segments.length } };
  }

  /**
   * Parse MXF file (Memsource)
   */
  async parseMXF(file) {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    const segments = [];
    doc.querySelectorAll('segment').forEach(seg => {
      const source = seg.querySelector('source');
      if (source) segments.push(source.textContent.trim());
    });
    return { success: true, content: text, segments, metadata: { format: 'mxf', segmentCount: segments.length } };
  }

  /**
   * Parse RESX file (.NET resources)
   */
  async parseRESX(file) {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    const segments = [];
    doc.querySelectorAll('data').forEach(data => {
      const name = data.getAttribute('name');
      const value = data.querySelector('value');
      if (value) segments.push({ key: name, text: value.textContent.trim() });
    });
    return { success: true, content: text, segments, metadata: { format: 'resx', segmentCount: segments.length } };
  }

  /**
   * Parse iOS Strings file
   */
  async parseStrings(file) {
    const text = await file.text();
    const segments = [];
    const lines = text.split('\n');
    lines.forEach(line => {
      const match = line.match(/"(.+)"\s*=\s*"(.+)";/);
      if (match) segments.push({ key: match[1], text: match[2] });
    });
    return { success: true, content: text, segments, metadata: { format: 'strings', segmentCount: segments.length } };
  }

  /**
   * Parse YAML file
   */
  async parseYAML(file) {
    const text = await file.text();
    const segments = [];
    const lines = text.split('\n');
    lines.forEach(line => {
      const match = line.match(/^\s*([^:]+):\s*(.+)$/);
      if (match && match[2].trim() && !match[2].trim().startsWith('{')) {
        segments.push({ key: match[1].trim(), text: match[2].trim() });
      }
    });
    return { success: true, content: text, segments, metadata: { format: 'yaml', segmentCount: segments.length } };
  }

  /**
   * Parse INI file
   */
  async parseINI(file) {
    const text = await file.text();
    const segments = [];
    const lines = text.split('\n');
    lines.forEach(line => {
      line = line.trim();
      if (!line || line.startsWith(';') || line.startsWith('#') || line.startsWith('[')) return;
      const idx = line.indexOf('=');
      if (idx > 0) {
        const key = line.substring(0, idx).trim();
        const value = line.substring(idx + 1).trim();
        if (value) segments.push({ key, text: value });
      }
    });
    return { success: true, content: text, segments, metadata: { format: 'ini', segmentCount: segments.length } };
  }
}

// Export singleton instance
const browserFileParser = new BrowserFileParser();
export default browserFileParser;
