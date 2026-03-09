# SDL Trados File Formats - Complete Analysis

## Trados Studio File Formats

### Currently Supported ✅
1. **SDLXLIFF** (.sdlxliff) - SDL Trados Studio bilingual format
   - Status: ✅ Supported
   - Parser: Uses XLIFF parser (XML-based)
   - Description: Main working format for Trados Studio

### Missing Trados Formats ❌

#### Core Trados Formats
2. **TTX** (.ttx) - Trados TagEditor format
   - Status: ❌ Not supported
   - Format: XML-based bilingual format
   - Used by: Trados TagEditor (legacy)
   - Priority: HIGH (still widely used)

3. **ITD** (.itd) - Trados Studio package format
   - Status: ❌ Not supported
   - Format: ZIP archive containing SDLXLIFF + resources
   - Used by: Trados Studio project packages
   - Priority: HIGH (common for project delivery)

4. **SDLPPX** (.sdlppx) - Trados Studio project package
   - Status: ❌ Not supported
   - Format: ZIP archive with project files
   - Used by: Trados Studio project sharing
   - Priority: MEDIUM

5. **SDLRPX** (.sdlrpx) - Trados Studio return package
   - Status: ❌ Not supported
   - Format: ZIP archive with translated files
   - Used by: Returning completed translations
   - Priority: MEDIUM

#### Translation Memory Formats
6. **SDLTM** (.sdltm) - Trados Studio translation memory
   - Status: ❌ Not supported
   - Format: SQLite database
   - Used by: Storing translation memories
   - Priority: LOW (not for translation, for reference)

7. **TMW** (.tmw) - Trados Workbench translation memory
   - Status: ❌ Not supported
   - Format: Binary database
   - Used by: Legacy Trados Workbench
   - Priority: LOW (legacy)

#### Terminology Formats
8. **SDLTB** (.sdltb) - Trados Studio termbase
   - Status: ❌ Not supported
   - Format: SQLite database
   - Used by: Terminology management
   - Priority: LOW (not for translation)

9. **MTF** (.mtf) - MultiTerm termbase
   - Status: ❌ Not supported
   - Format: Binary database
   - Used by: SDL MultiTerm
   - Priority: LOW (legacy)

## Detailed Format Specifications

### 1. SDLXLIFF (Already Supported ✅)
```xml
<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="en-US" target-language="fr-FR">
    <body>
      <trans-unit id="1">
        <source>Hello World</source>
        <target>Bonjour le monde</target>
      </trans-unit>
    </body>
  </file>
</xliff>
```

### 2. TTX (Needs Implementation)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE TRADOStag SYSTEM "TRADOStag.dtd">
<TRADOStag>
  <FrontMatter>
    <ToolSettings>...</ToolSettings>
  </FrontMatter>
  <Body>
    <Tu>
      <Tuv Lang="EN-US">
        <Seg>Hello World</Seg>
      </Tuv>
      <Tuv Lang="FR-FR">
        <Seg>Bonjour le monde</Seg>
      </Tuv>
    </Tu>
  </Body>
</TRADOStag>
```

### 3. ITD (Needs Implementation)
- ZIP archive structure:
```
project.itd
├── en-US_fr-FR/
│   ├── file1.sdlxliff
│   ├── file2.sdlxliff
├── ProjectFiles/
│   ├── file1.docx
│   ├── file2.pdf
└── project.sdlproj
```

### 4. SDLPPX (Needs Implementation)
- ZIP archive structure:
```
project.sdlppx
├── ProjectFiles/
│   ├── source files
├── Reports/
├── project.sdlproj
└── project.sdltm
```

## Implementation Priority

### Phase 1: HIGH PRIORITY (Essential for Trados Users)
1. **TTX** - Legacy but still widely used
2. **ITD** - Common project package format

### Phase 2: MEDIUM PRIORITY (Nice to Have)
3. **SDLPPX** - Project packages
4. **SDLRPX** - Return packages

### Phase 3: LOW PRIORITY (Reference Only)
5. **SDLTM** - Translation memory (read-only reference)
6. **SDLTB** - Termbase (read-only reference)

## Implementation Plan

### 1. Add TTX Parser
```javascript
async parseTTX(file) {
  const text = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/xml');
  
  // Extract translation units
  const tus = doc.querySelectorAll('Tu');
  const segments = [];
  
  tus.forEach(tu => {
    const sourceTuv = tu.querySelector('Tuv[Lang*="EN"]');
    const seg = sourceTuv?.querySelector('Seg');
    if (seg) {
      segments.push(seg.textContent.trim());
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
```

### 2. Add ITD Parser (ZIP Archive)
```javascript
// Requires jszip library
async parseITD(file) {
  const JSZip = await import('jszip');
  const zip = await JSZip.loadAsync(file);
  
  const segments = [];
  
  // Find all SDLXLIFF files in the archive
  for (const [filename, zipEntry] of Object.entries(zip.files)) {
    if (filename.endsWith('.sdlxliff')) {
      const content = await zipEntry.async('text');
      const result = await this.parseXLIFF(
        new File([content], filename, { type: 'application/xml' })
      );
      if (result.success) {
        segments.push(...result.segments);
      }
    }
  }
  
  return {
    success: true,
    segments,
    metadata: {
      format: 'itd',
      segmentCount: segments.length,
      fileCount: Object.keys(zip.files).length
    }
  };
}
```

### 3. Add SDLPPX Parser (Similar to ITD)
```javascript
async parseSDLPPX(file) {
  // Similar to ITD parser
  // Extract SDLXLIFF files from ProjectFiles folder
  // Parse each file and combine segments
}
```

## Required Libraries

### For ZIP Archive Support (ITD, SDLPPX, SDLRPX)
- **jszip** - Browser-compatible ZIP library
- Install: `npm install jszip`
- Size: ~100KB minified
- Browser compatible: ✅ Yes

### For XML Parsing (TTX)
- **DOMParser** - Already available in browser
- No additional library needed

## Browser Compatibility

All Trados parsers can work in browser:
- ✅ TTX: Uses DOMParser (native)
- ✅ ITD: Uses jszip (browser-compatible)
- ✅ SDLPPX: Uses jszip (browser-compatible)
- ✅ SDLXLIFF: Already working with DOMParser

## Testing Requirements

### Test Files Needed
1. Sample TTX file from Trados TagEditor
2. Sample ITD package from Trados Studio
3. Sample SDLPPX project package
4. Sample SDLRPX return package

### Expected Behavior
- TTX: Extract source segments from <Seg> elements
- ITD: Extract all segments from all SDLXLIFF files in archive
- SDLPPX: Extract project files and parse each
- SDLRPX: Extract translated files

## Comparison with Other CAT Tools

### Currently Supported CAT Formats
- ✅ XLIFF - Universal standard
- ✅ SDLXLIFF - Trados Studio
- ✅ TMX - Translation Memory eXchange
- ✅ MXF - Memsource

### Missing CAT Formats
- ❌ TTX - Trados TagEditor
- ❌ ITD - Trados packages
- ❌ MQXLIFF - MemoQ
- ❌ TXLF - Wordfast
- ❌ XLIFF 2.0 - New XLIFF standard
- ❌ IDML - Adobe InDesign
- ❌ INDD - Adobe InDesign (binary)

## Recommendations

### Immediate Action (Add These Now)
1. **TTX** - Easy to implement, high demand
2. Install **jszip** library for archive support
3. **ITD** - Important for Trados users

### Future Additions
1. SDLPPX - Project packages
2. MQXLIFF - MemoQ format
3. IDML - Adobe InDesign
4. XLIFF 2.0 - New standard

## Summary

**Currently Supported Trados Formats:** 1 (SDLXLIFF)
**Missing Trados Formats:** 8 (TTX, ITD, SDLPPX, SDLRPX, SDLTM, TMW, SDLTB, MTF)
**High Priority:** 2 (TTX, ITD)
**Requires New Library:** jszip (for ITD, SDLPPX, SDLRPX)

**Next Steps:**
1. Install jszip library
2. Add TTX parser (XML-based, easy)
3. Add ITD parser (ZIP archive)
4. Test with real Trados files
5. Add SDLPPX parser (similar to ITD)

This will make Glossa CAT fully compatible with SDL Trados Studio workflows!
