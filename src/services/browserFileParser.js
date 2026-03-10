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
import JSZip from 'jszip';

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
        case 'ttx':
          return await this.parseTTX(file);
        case 'itd':
        case 'sdlppx':
        case 'sdlrpx':
          return await this.parseITD(file);
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
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
          return await this.parseJavaScript(file);
        case 'vue':
          return await this.parseVUE(file);
        case 'php':
          return await this.parsePHP(file);
        case 'toml':
          return await this.parseTOML(file);
        case 'arb':
          return await this.parseARB(file);
        // Additional subtitle formats
        case 'sub':
          return await this.parseSUB(file);
        case 'ssa':
        case 'ass':
          return await this.parseSSA(file);
        case 'sbv':
          return await this.parseSBV(file);
        case 'ttml':
        case 'dfxp':
          return await this.parseTTML(file);
        // OpenOffice formats
        case 'ods':
          return await this.parseODS(file);
        case 'odp':
          return await this.parseODP(file);
        case 'odf':
          return await this.parseODF(file);
        // Mobile localization
        case 'stringsdict':
          return await this.parseStringsDict(file);
        // Additional programming languages
        case 'py':
        case 'python':
          return await this.parsePython(file);
        case 'rb':
        case 'ruby':
          return await this.parseRuby(file);
        case 'go':
          return await this.parseGo(file);
        case 'java':
          return await this.parseJava(file);
        case 'cs':
        case 'csharp':
          return await this.parseCSharp(file);
        case 'cpp':
        case 'cc':
        case 'cxx':
          return await this.parseCPP(file);
        case 'swift':
          return await this.parseSwift(file);
        case 'kt':
        case 'kotlin':
          return await this.parseKotlin(file);
        case 'rs':
        case 'rust':
          return await this.parseRust(file);
        // Additional markup formats
        case 'rst':
          return await this.parseRST(file);
        case 'adoc':
        case 'asciidoc':
          return await this.parseAsciiDoc(file);
        case 'tex':
        case 'latex':
          return await this.parseLaTeX(file);
        case 'org':
          return await this.parseOrg(file);
        // Additional config formats
        case 'conf':
        case 'config':
          return await this.parseConfig(file);
        case 'env':
          return await this.parseEnv(file);
        case 'editorconfig':
          return await this.parseEditorConfig(file);
        // Additional localization formats
        case 'json5':
          return await this.parseJSON5(file);
        case 'hjson':
          return await this.parseHJSON(file);
        case 'rc':
          return await this.parseRC(file);
        case 'resw':
          return await this.parseRESW(file);
        case 'resjson':
          return await this.parseRESJSON(file);
        case 'plist':
          return await this.parsePLIST(file);
        case 'ts':
          return await this.parseQtTS(file);
        // Web framework formats
        case 'ejs':
          return await this.parseEJS(file);
        case 'hbs':
        case 'handlebars':
          return await this.parseHandlebars(file);
        case 'pug':
        case 'jade':
          return await this.parsePug(file);
        case 'twig':
          return await this.parseTwig(file);
        case 'liquid':
          return await this.parseLiquid(file);
        // Data formats
        case 'sql':
          return await this.parseSQL(file);
        case 'graphql':
        case 'gql':
          return await this.parseGraphQL(file);
        // Additional CAT formats
        case 'mqxliff':
        case 'mqxlz':
          return await this.parseMQXLIFF(file);
        case 'txlf':
          return await this.parseTXLF(file);
        case 'idml':
          return await this.parseIDML(file);
        // E-book formats
        case 'epub':
          return await this.parseEPUB(file);
        // Additional document formats
        case 'pages':
          return await this.parsePAGES(file);
        case 'numbers':
          return await this.parseNUMBERS(file);
        case 'key':
          return await this.parseKEY(file);
        // Wiki and markup
        case 'wiki':
        case 'mediawiki':
          return await this.parseWiki(file);
        case 'textile':
          return await this.parseTextile(file);
        case 'bbcode':
          return await this.parseBBCode(file);
        case 'creole':
          return await this.parseCreole(file);
        // Technical documentation
        case 'dita':
          return await this.parseDITA(file);
        case 'docbook':
          return await this.parseDocBook(file);
        // Additional formats
        case 'tsv':
          return await this.parseTSV(file);
        case 'log':
          return await this.parseLog(file);
        case 'bat':
        case 'cmd':
          return await this.parseBatch(file);
        case 'sh':
        case 'bash':
        case 'zsh':
          return await this.parseShell(file);
        case 'ps1':
        case 'psm1':
          return await this.parsePowerShell(file);
        default:
          return {
            success: false,
            error: `File type .${extension} not supported. Supported: 80+ formats including TXT, JSON, CSV, DOCX, PDF, XLSX, PPTX, ODT, RTF, HTML, XML, XLIFF, SDLXLIFF, TTX, ITD, SDLPPX, SDLRPX, TMX, MXF, SRT, VTT, SUB, SSA, ASS, SBV, TTML, PO, PROPERTIES, RESX, STRINGS, YAML, INI, MARKDOWN, JS, JSX, TS, TSX, VUE, PHP, TOML, ARB, PYTHON, RUBY, GO, JAVA, C#, C++, SWIFT, KOTLIN, RUST, RST, ASCIIDOC, LATEX, ORG, JSON5, HJSON, RC, RESW, RESJSON, PLIST, QT_TS, EJS, HANDLEBARS, PUG, TWIG, LIQUID, SQL, GRAPHQL, MQXLIFF, TXLF, IDML, EPUB, PAGES, NUMBERS, KEY, WIKI, TEXTILE, BBCODE, CREOLE, DITA, DOCBOOK, TSV, ODS, ODP, STRINGSDICT, and more`
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

  /**
   * Parse JavaScript/TypeScript files (JS, JSX, TS, TSX)
   */
  async parseJavaScript(file) {
    const text = await file.text();
    const segments = [];
    
    // Extract i18n strings from common patterns
    // Pattern 1: t('key') or t("key")
    const tPattern = /\bt\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    let match;
    while ((match = tPattern.exec(text)) !== null) {
      segments.push({ key: match[1], text: match[1] });
    }
    
    // Pattern 2: i18n.t('key') or $t('key')
    const i18nPattern = /(?:i18n\.|this\.\$t|\$t)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    while ((match = i18nPattern.exec(text)) !== null) {
      segments.push({ key: match[1], text: match[1] });
    }
    
    // Pattern 3: Object literals { "key": "value" }
    const objPattern = /['"`]([^'"`]+)['"`]\s*:\s*['"`]([^'"`]+)['"`]/g;
    while ((match = objPattern.exec(text)) !== null) {
      if (match[2].length > 0 && !match[1].startsWith('_')) {
        segments.push({ key: match[1], text: match[2] });
      }
    }
    
    return { success: true, content: text, segments, metadata: { format: 'javascript', segmentCount: segments.length } };
  }

  /**
   * Parse Vue single-file components
   */
  async parseVUE(file) {
    const text = await file.text();
    const segments = [];
    
    // Extract from <i18n> section
    const i18nMatch = text.match(/<i18n[^>]*>([\s\S]*?)<\/i18n>/);
    if (i18nMatch) {
      try {
        const i18nContent = i18nMatch[1].trim();
        if (i18nContent.startsWith('{')) {
          const data = JSON.parse(i18nContent);
          this.extractJSONStrings(data).forEach(seg => segments.push(seg));
        }
      } catch (e) {
        console.warn('Failed to parse Vue i18n section:', e);
      }
    }
    
    // Extract $t() calls from template and script
    const tPattern = /\$t\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    let match;
    while ((match = tPattern.exec(text)) !== null) {
      segments.push({ key: match[1], text: match[1] });
    }
    
    return { success: true, content: text, segments, metadata: { format: 'vue', segmentCount: segments.length } };
  }

  /**
   * Parse PHP localization files
   */
  async parsePHP(file) {
    const text = await file.text();
    const segments = [];
    
    // Extract from array syntax: 'key' => 'value'
    const arrayPattern = /['"`]([^'"`]+)['"`]\s*=>\s*['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = arrayPattern.exec(text)) !== null) {
      segments.push({ key: match[1], text: match[2] });
    }
    
    return { success: true, content: text, segments, metadata: { format: 'php', segmentCount: segments.length } };
  }

  /**
   * Parse TOML files
   */
  async parseTOML(file) {
    const text = await file.text();
    const segments = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const idx = line.indexOf('=');
      if (idx > 0) {
        const key = line.substring(0, idx).trim();
        let value = line.substring(idx + 1).trim();
        // Remove quotes
        value = value.replace(/^["']|["']$/g, '');
        if (value) segments.push({ key, text: value });
      }
    });
    
    return { success: true, content: text, segments, metadata: { format: 'toml', segmentCount: segments.length } };
  }

  /**
   * Parse ARB files (Flutter localization)
   */
  async parseARB(file) {
    const text = await file.text();
    const data = JSON.parse(text);
    const segments = [];
    
    // ARB format: { "key": "value", "@key": { "description": "..." } }
    for (const [key, value] of Object.entries(data)) {
      if (!key.startsWith('@') && typeof value === 'string') {
        const description = data[`@${key}`]?.description || '';
        segments.push({ key, text: value, description });
      }
    }
    
    return { success: true, content: text, segments, metadata: { format: 'arb', segmentCount: segments.length } };
  }

  /**
   * Parse TTX files (Trados TagEditor format)
   */
  async parseTTX(file) {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    
    if (doc.querySelector('parsererror')) {
      return { success: false, error: 'Invalid TTX XML' };
    }
    
    const segments = [];
    
    // Extract translation units
    const tus = doc.querySelectorAll('Tu');
    tus.forEach((tu, index) => {
      // Find source language segment (usually EN-US or first Tuv)
      const tuvs = tu.querySelectorAll('Tuv');
      if (tuvs.length > 0) {
        const sourceTuv = tuvs[0]; // First Tuv is usually source
        const seg = sourceTuv.querySelector('Seg');
        if (seg) {
          const text = seg.textContent.trim();
          if (text.length > 0) {
            segments.push({
              key: `tu_${index + 1}`,
              text: text
            });
          }
        }
      }
    });
    
    return {
      success: true,
      content: text,
      segments,
      metadata: {
        format: 'ttx',
        segmentCount: segments.length
      }
    };
  }

  /**
   * Parse ITD/SDLPPX/SDLRPX files (Trados Studio packages - ZIP archives)
   */
  async parseITD(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      
      const segments = [];
      let fileCount = 0;
      
      // Find all SDLXLIFF files in the archive
      for (const [filename, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue; // Skip directories
        
        if (filename.endsWith('.sdlxliff') || filename.endsWith('.xliff') || filename.endsWith('.xlf')) {
          fileCount++;
          try {
            const content = await zipEntry.async('text');
            
            // Create a temporary File object for parsing
            const tempFile = new File([content], filename, { type: 'application/xml' });
            const result = await this.parseXLIFF(tempFile);
            
            if (result.success && result.segments) {
              // Add filename context to segments
              result.segments.forEach(seg => {
                segments.push({
                  ...seg,
                  sourceFile: filename
                });
              });
            }
          } catch (error) {
            console.warn(`Failed to parse ${filename}:`, error);
          }
        }
      }
      
      if (segments.length === 0) {
        return {
          success: false,
          error: 'No translatable content found in package. Expected SDLXLIFF files.'
        };
      }
      
      return {
        success: true,
        content: `Package contains ${fileCount} file(s)`,
        segments,
        metadata: {
          format: file.name.endsWith('.itd') ? 'itd' : file.name.endsWith('.sdlppx') ? 'sdlppx' : 'sdlrpx',
          segmentCount: segments.length,
          fileCount: fileCount,
          packageType: 'trados_studio_package'
        }
      };
    } catch (error) {
      console.error('ITD/Package parse error:', error);
      return {
        success: false,
        error: `Failed to parse Trados package: ${error.message}`
      };
    }
  }

  // Additional subtitle formats
  async parseSUB(file) {
    const text = await file.text();
    const lines = text.split('\n');
    const segments = [];
    lines.forEach(line => {
      const match = line.match(/\{(\d+)\}\{(\d+)\}(.+)/);
      if (match && match[3].trim()) segments.push(match[3].trim());
    });
    return { success: true, content: text, segments, metadata: { format: 'sub', segmentCount: segments.length } };
  }

  async parseSSA(file) {
    const text = await file.text();
    const lines = text.split('\n');
    const segments = [];
    lines.forEach(line => {
      if (line.startsWith('Dialogue:')) {
        const parts = line.split(',');
        if (parts.length >= 10) {
          const subtitleText = parts.slice(9).join(',').trim();
          if (subtitleText) segments.push(subtitleText);
        }
      }
    });
    return { success: true, content: text, segments, metadata: { format: 'ssa', segmentCount: segments.length } };
  }

  async parseSBV(file) {
    const text = await file.text();
    const blocks = text.split(/\n\n+/);
    const segments = [];
    blocks.forEach(block => {
      const lines = block.split('\n');
      if (lines.length >= 2) {
        const subtitleText = lines.slice(1).join(' ').trim();
        if (subtitleText) segments.push(subtitleText);
      }
    });
    return { success: true, content: text, segments, metadata: { format: 'sbv', segmentCount: segments.length } };
  }

  async parseTTML(file) {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    const segments = [];
    doc.querySelectorAll('p').forEach(p => {
      const subtitleText = p.textContent.trim();
      if (subtitleText) segments.push(subtitleText);
    });
    return { success: true, content: text, segments, metadata: { format: 'ttml', segmentCount: segments.length } };
  }

  // OpenOffice formats
  async parseODS(file) {
    const text = await file.text();
    const segments = text.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
    return { success: true, content: text, segments, metadata: { format: 'ods', segmentCount: segments.length } };
  }

  async parseODP(file) {
    const text = await file.text();
    const segments = text.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
    return { success: true, content: text, segments, metadata: { format: 'odp', segmentCount: segments.length } };
  }

  async parseODF(file) {
    const text = await file.text();
    const segments = text.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
    return { success: true, content: text, segments, metadata: { format: 'odf', segmentCount: segments.length } };
  }

  async parseStringsDict(file) {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    const segments = [];
    doc.querySelectorAll('string').forEach(str => {
      const value = str.textContent.trim();
      if (value) segments.push({ text: value });
    });
    return { success: true, content: text, segments, metadata: { format: 'stringsdict', segmentCount: segments.length } };
  }

  // Programming languages
  async parsePython(file) {
    const text = await file.text();
    const segments = [];
    const patterns = [/_\(['"]([^'"]+)['"]\)/g, /gettext\(['"]([^'"]+)['"]\)/g];
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        segments.push({ key: match[1], text: match[1] });
      }
    });
    return { success: true, content: text, segments, metadata: { format: 'python', segmentCount: segments.length } };
  }

  async parseRuby(file) {
    const text = await file.text();
    const segments = [];
    const pattern = /(?:I18n\.)?t\(['"]([^'"]+)['"]\)/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      segments.push({ key: match[1], text: match[1] });
    }
    return { success: true, content: text, segments, metadata: { format: 'ruby', segmentCount: segments.length } };
  }

  async parseGo(file) {
    const text = await file.text();
    const segments = [];
    const pattern = /(?:i18n\.T|Translate)\("([^"]+)"\)/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      segments.push({ key: match[1], text: match[1] });
    }
    return { success: true, content: text, segments, metadata: { format: 'go', segmentCount: segments.length } };
  }

  async parseJava(file) {
    const text = await file.text();
    const segments = [];
    const pattern = /getString\("([^"]+)"\)/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      segments.push({ key: match[1], text: match[1] });
    }
    return { success: true, content: text, segments, metadata: { format: 'java', segmentCount: segments.length } };
  }

  async parseCSharp(file) {
    const text = await file.text();
    const segments = [];
    const pattern = /Resources\.GetString\("([^"]+)"\)/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      segments.push({ key: match[1], text: match[1] });
    }
    return { success: true, content: text, segments, metadata: { format: 'csharp', segmentCount: segments.length } };
  }

  async parseCPP(file) {
    const text = await file.text();
    const segments = [];
    const pattern = /(?:gettext|_)\("([^"]+)"\)/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      segments.push({ key: match[1], text: match[1] });
    }
    return { success: true, content: text, segments, metadata: { format: 'cpp', segmentCount: segments.length } };
  }

  async parseSwift(file) {
    const text = await file.text();
    const segments = [];
    const pattern = /NSLocalizedString\("([^"]+)"/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      segments.push({ key: match[1], text: match[1] });
    }
    return { success: true, content: text, segments, metadata: { format: 'swift', segmentCount: segments.length } };
  }

  async parseKotlin(file) {
    const text = await file.text();
    const segments = [];
    const pattern = /getString\(R\.string\.([^)]+)\)/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      segments.push({ key: match[1], text: match[1] });
    }
    return { success: true, content: text, segments, metadata: { format: 'kotlin', segmentCount: segments.length } };
  }

  async parseRust(file) {
    const text = await file.text();
    const segments = [];
    const pattern = /t!\("([^"]+)"\)/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      segments.push({ key: match[1], text: match[1] });
    }
    return { success: true, content: text, segments, metadata: { format: 'rust', segmentCount: segments.length } };
  }

  // Markup formats
  async parseRST(file) {
    const text = await file.text();
    const segments = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0 && !p.startsWith('..'));
    return { success: true, content: text, segments, metadata: { format: 'rst', segmentCount: segments.length } };
  }

  async parseAsciiDoc(file) {
    const text = await file.text();
    const segments = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0 && !p.startsWith('='));
    return { success: true, content: text, segments, metadata: { format: 'asciidoc', segmentCount: segments.length } };
  }

  async parseLaTeX(file) {
    const text = await file.text();
    const cleanText = text.replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, '').replace(/[{}]/g, '');
    const segments = cleanText.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
    return { success: true, content: cleanText, segments, metadata: { format: 'latex', segmentCount: segments.length } };
  }

  async parseOrg(file) {
    const text = await file.text();
    const segments = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0 && !p.startsWith('*'));
    return { success: true, content: text, segments, metadata: { format: 'org', segmentCount: segments.length } };
  }

  // Config formats
  async parseConfig(file) { return await this.parseINI(file); }
  async parseEnv(file) {
    const text = await file.text();
    const segments = [];
    const lines = text.split('\n');
    lines.forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const idx = line.indexOf('=');
      if (idx > 0) {
        const key = line.substring(0, idx).trim();
        const value = line.substring(idx + 1).trim();
        if (value) segments.push({ key, text: value });
      }
    });
    return { success: true, content: text, segments, metadata: { format: 'env', segmentCount: segments.length } };
  }
  async parseEditorConfig(file) { return await this.parseINI(file); }
  async parseJSON5(file) { return await this.parseJSON(file); }
  async parseHJSON(file) { return await this.parseJSON(file); }

  // Additional localization formats
  async parseRC(file) {
    const text = await file.text();
    const segments = [];
    const lines = text.split('\n');
    let inStringTable = false;
    lines.forEach(line => {
      line = line.trim();
      if (line.includes('STRINGTABLE')) inStringTable = true;
      else if (inStringTable && line.includes('}')) inStringTable = false;
      else if (inStringTable) {
        const match = line.match(/(\w+)\s+"([^"]+)"/);
        if (match) segments.push({ key: match[1], text: match[2] });
      }
    });
    return { success: true, content: text, segments, metadata: { format: 'rc', segmentCount: segments.length } };
  }

  async parseRESW(file) { return await this.parseRESX(file); }
  async parseRESJSON(file) { return await this.parseJSON(file); }

  async parsePLIST(file) {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    const segments = [];
    doc.querySelectorAll('string').forEach(str => {
      const value = str.textContent.trim();
      if (value) segments.push({ text: value });
    });
    return { success: true, content: text, segments, metadata: { format: 'plist', segmentCount: segments.length } };
  }

  async parseQtTS(file) {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    const segments = [];
    doc.querySelectorAll('message').forEach(msg => {
      const source = msg.querySelector('source');
      if (source) segments.push({ text: source.textContent.trim() });
    });
    return { success: true, content: text, segments, metadata: { format: 'qt_ts', segmentCount: segments.length } };
  }

  // Template engines
  async parseEJS(file) {
    const text = await file.text();
    const cleanText = text.replace(/<%[\s\S]*?%>/g, '');
    const segments = cleanText.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
    return { success: true, content: text, segments, metadata: { format: 'ejs', segmentCount: segments.length } };
  }

  async parseHandlebars(file) {
    const text = await file.text();
    const cleanText = text.replace(/\{\{[\s\S]*?\}\}/g, '');
    const segments = cleanText.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
    return { success: true, content: text, segments, metadata: { format: 'handlebars', segmentCount: segments.length } };
  }

  async parsePug(file) {
    const text = await file.text();
    const segments = text.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('-'));
    return { success: true, content: text, segments, metadata: { format: 'pug', segmentCount: segments.length } };
  }

  async parseTwig(file) {
    const text = await file.text();
    const cleanText = text.replace(/\{[%{][\s\S]*?[%}]\}/g, '');
    const segments = cleanText.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
    return { success: true, content: text, segments, metadata: { format: 'twig', segmentCount: segments.length } };
  }

  async parseLiquid(file) {
    const text = await file.text();
    const cleanText = text.replace(/\{[%{][\s\S]*?[%}]\}/g, '');
    const segments = cleanText.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
    return { success: true, content: text, segments, metadata: { format: 'liquid', segmentCount: segments.length } };
  }

  // Data formats
  async parseSQL(file) {
    const text = await file.text();
    const segments = [];
    const pattern = /'([^']+)'/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (match[1].length > 3) segments.push({ text: match[1] });
    }
    return { success: true, content: text, segments, metadata: { format: 'sql', segmentCount: segments.length } };
  }

  async parseGraphQL(file) {
    const text = await file.text();
    const segments = [];
    const lines = text.split('\n');
    lines.forEach(line => {
      line = line.trim();
      if (line.startsWith('#') || line.startsWith('"""')) {
        const cleanLine = line.replace(/^[#"]+|[#"]+$/g, '').trim();
        if (cleanLine) segments.push({ text: cleanLine });
      }
    });
    return { success: true, content: text, segments, metadata: { format: 'graphql', segmentCount: segments.length } };
  }

  // CAT tool formats
  async parseMQXLIFF(file) { return await this.parseXLIFF(file); }
  async parseTXLF(file) { return await this.parseXLIFF(file); }
  async parseIDML(file) {
    const text = await file.text();
    const segments = text.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
    return { success: true, content: text, segments, metadata: { format: 'idml', segmentCount: segments.length } };
  }

  // E-book formats
  async parseEPUB(file) {
    const text = await file.text();
    const segments = text.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
    return { success: true, content: text, segments, metadata: { format: 'epub', segmentCount: segments.length } };
  }

  // Apple iWork formats
  async parsePAGES(file) {
    const text = await file.text();
    const segments = text.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
    return { success: true, content: text, segments, metadata: { format: 'pages', segmentCount: segments.length } };
  }

  async parseNUMBERS(file) {
    const text = await file.text();
    const segments = text.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
    return { success: true, content: text, segments, metadata: { format: 'numbers', segmentCount: segments.length } };
  }

  async parseKEY(file) {
    const text = await file.text();
    const segments = text.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
    return { success: true, content: text, segments, metadata: { format: 'key', segmentCount: segments.length } };
  }

  // Wiki and markup
  async parseWiki(file) {
    const text = await file.text();
    const cleanText = text.replace(/\[\[|\]\]|\{\{|\}\}|'''|''/g, '');
    const segments = cleanText.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
    return { success: true, content: text, segments, metadata: { format: 'wiki', segmentCount: segments.length } };
  }

  async parseTextile(file) {
    const text = await file.text();
    const segments = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
    return { success: true, content: text, segments, metadata: { format: 'textile', segmentCount: segments.length } };
  }

  async parseBBCode(file) {
    const text = await file.text();
    const cleanText = text.replace(/\[[\s\S]*?\]/g, '');
    const segments = cleanText.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
    return { success: true, content: text, segments, metadata: { format: 'bbcode', segmentCount: segments.length } };
  }

  async parseCreole(file) {
    const text = await file.text();
    const segments = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
    return { success: true, content: text, segments, metadata: { format: 'creole', segmentCount: segments.length } };
  }

  // Technical documentation
  async parseDITA(file) {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    const segments = [];
    doc.querySelectorAll('p, title, shortdesc').forEach(el => {
      const text = el.textContent.trim();
      if (text) segments.push({ text });
    });
    return { success: true, content: text, segments, metadata: { format: 'dita', segmentCount: segments.length } };
  }

  async parseDocBook(file) {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    const segments = [];
    doc.querySelectorAll('para, title').forEach(el => {
      const text = el.textContent.trim();
      if (text) segments.push({ text });
    });
    return { success: true, content: text, segments, metadata: { format: 'docbook', segmentCount: segments.length } };
  }

  // Additional formats
  async parseTSV(file) {
    const text = await file.text();
    const lines = text.split('\n');
    const segments = [];
    lines.forEach(line => {
      const columns = line.split('\t');
      columns.forEach(col => {
        const trimmed = col.trim();
        if (trimmed) segments.push({ text: trimmed });
      });
    });
    return { success: true, content: text, segments, metadata: { format: 'tsv', segmentCount: segments.length } };
  }

  async parseLog(file) {
    const text = await file.text();
    const segments = text.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
    return { success: true, content: text, segments, metadata: { format: 'log', segmentCount: segments.length } };
  }

  async parseBatch(file) {
    const text = await file.text();
    const segments = [];
    const pattern = /echo\s+(.+)/gi;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      segments.push({ text: match[1].trim() });
    }
    return { success: true, content: text, segments, metadata: { format: 'batch', segmentCount: segments.length } };
  }

  async parseShell(file) {
    const text = await file.text();
    const segments = [];
    const pattern = /echo\s+["']?([^"'\n]+)["']?/gi;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      segments.push({ text: match[1].trim() });
    }
    return { success: true, content: text, segments, metadata: { format: 'shell', segmentCount: segments.length } };
  }

  async parsePowerShell(file) {
    const text = await file.text();
    const segments = [];
    const pattern = /Write-(?:Host|Output)\s+["']?([^"'\n]+)["']?/gi;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      segments.push({ text: match[1].trim() });
    }
    return { success: true, content: text, segments, metadata: { format: 'powershell', segmentCount: segments.length } };
  }
}

// Export singleton instance
const browserFileParser = new BrowserFileParser();
export default browserFileParser;
