# Website Translation Formats - Status

## Currently Supported Website Formats ✅

### Basic Web Formats (4)
- ✅ **HTML** (.html, .htm) - HyperText Markup Language
- ✅ **XML** (.xml) - Extensible Markup Language
- ✅ **JSON** (.json) - JavaScript Object Notation (i18n files)
- ✅ **YAML** (.yaml, .yml) - YAML configuration files

### Localization Formats (4)
- ✅ **PO** (.po) - GNU gettext (used by WordPress, Django, etc.)
- ✅ **PROPERTIES** (.properties) - Java properties files
- ✅ **INI** (.ini) - Configuration files
- ✅ **STRINGS** (.strings) - iOS localization

## Missing Website Translation Formats ❌

### JavaScript Framework Formats
- ❌ **JS** (.js) - JavaScript i18n files (e.g., `export default { "key": "value" }`)
- ❌ **JSX** (.jsx) - React components with translatable strings
- ❌ **TSX** (.tsx) - TypeScript React components
- ❌ **VUE** (.vue) - Vue.js single-file components
- ❌ **SVELTE** (.svelte) - Svelte components

### Modern Web Localization Formats
- ❌ **I18NEXT_JSON** - i18next JSON format (nested keys)
- ❌ **CHROME_JSON** - Chrome extension i18n format
- ❌ **FLUTTER_ARB** (.arb) - Flutter localization
- ❌ **TOML** (.toml) - Tom's Obvious Minimal Language
- ❌ **JSON5** (.json5) - JSON for Humans (with comments)
- ❌ **HJSON** (.hjson) - Human JSON

### Mobile Web Formats
- ❌ **ANDROID_XML** (.xml) - Android string resources
- ❌ **IOS_XLIFF** (.xliff) - iOS localization XLIFF
- ❌ **IOS_STRINGSDICT** (.stringsdict) - iOS plural strings
- ❌ **PLIST** (.plist) - Apple property list

### CMS & Platform Formats
- ❌ **PHP** (.php) - PHP localization arrays
- ❌ **WORDPRESS_PO** (.po) - WordPress specific PO files
- ❌ **DRUPAL_PO** (.po) - Drupal translation files
- ❌ **JOOMLA_INI** (.ini) - Joomla language files

### Framework-Specific Formats
- ❌ **ANGULAR_JSON** - Angular i18n JSON
- ❌ **REACT_INTL** - React Intl message descriptors
- ❌ **NEXT_I18N** - Next.js i18n JSON files
- ❌ **NUXT_I18N** - Nuxt.js i18n files

### Other Web Formats
- ❌ **RESJSON** (.resjson) - Windows JavaScript resources
- ❌ **RESW** (.resw) - Windows Store app resources
- ❌ **QT_TS** (.ts) - Qt Linguist format (for Qt WebAssembly)

## Priority Implementation Plan

### Phase 1: High Priority (Common Web Formats)
1. **JS/JSX/TSX** - JavaScript/React files with i18n
2. **VUE** - Vue.js single-file components
3. **I18NEXT_JSON** - Very popular i18n library
4. **CHROME_JSON** - Chrome extension localization
5. **ANDROID_XML** - Android app localization
6. **IOS_XLIFF** - iOS app localization

### Phase 2: Medium Priority (Framework-Specific)
1. **ANGULAR_JSON** - Angular framework
2. **NEXT_I18N** - Next.js framework
3. **NUXT_I18N** - Nuxt.js framework
4. **FLUTTER_ARB** - Flutter framework
5. **PHP** - PHP localization arrays
6. **TOML** - Configuration format

### Phase 3: Lower Priority (Specialized)
1. **SVELTE** - Svelte components
2. **JSON5/HJSON** - JSON variants
3. **PLIST** - Apple property lists
4. **QT_TS** - Qt framework
5. **RESJSON/RESW** - Windows formats

## Implementation Details

### JS/JSX/TSX Parser (Needed)
```javascript
// Parse JavaScript i18n files
async parseJS(file) {
  const text = await file.text();
  
  // Extract i18n objects
  // Example: export default { "hello": "Hello", "world": "World" }
  // Example: const messages = { "key": "value" }
  
  // Use regex or AST parser to extract translatable strings
  const segments = extractI18nStrings(text);
  
  return { success: true, content: text, segments };
}
```

### VUE Parser (Needed)
```javascript
// Parse Vue single-file components
async parseVUE(file) {
  const text = await file.text();
  
  // Extract from <template> section
  // Extract from <i18n> section
  // Extract from $t() calls in <script>
  
  const segments = extractVueTranslations(text);
  
  return { success: true, content: text, segments };
}
```

### I18NEXT_JSON Parser (Needed)
```javascript
// Parse i18next nested JSON
async parseI18NEXT(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  
  // Handle nested keys: { "common": { "hello": "Hello" } }
  // Flatten to: "common.hello" = "Hello"
  
  const segments = flattenI18nextJSON(data);
  
  return { success: true, content: text, segments };
}
```

### CHROME_JSON Parser (Needed)
```javascript
// Parse Chrome extension i18n format
async parseCHROME_JSON(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  
  // Format: { "key": { "message": "value", "description": "..." } }
  const segments = Object.entries(data).map(([key, obj]) => ({
    key,
    text: obj.message,
    description: obj.description
  }));
  
  return { success: true, content: text, segments };
}
```

### ANDROID_XML Parser (Needed)
```javascript
// Parse Android string resources
async parseANDROID_XML(file) {
  const text = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/xml');
  
  // Extract <string name="key">value</string>
  const strings = doc.querySelectorAll('string');
  const segments = Array.from(strings).map(str => ({
    key: str.getAttribute('name'),
    text: str.textContent
  }));
  
  return { success: true, content: text, segments };
}
```

## Required Libraries

### For JS/JSX/TSX Parsing
- **@babel/parser** - Parse JavaScript/TypeScript AST
- **@babel/traverse** - Traverse AST to find i18n calls
- Or use regex for simple cases

### For VUE Parsing
- **vue-template-compiler** - Parse Vue SFC
- Or use regex to extract sections

### For Other Formats
- Most can use existing libraries (DOMParser, JSON.parse)
- Some need custom regex-based parsers

## Browser Compatibility Note

All parsers must work in browser environment:
- ✅ Use browser-compatible libraries only
- ✅ No Node.js-specific dependencies
- ✅ Use DOMParser for XML-based formats
- ✅ Use JSON.parse for JSON-based formats
- ✅ Use regex for text-based formats

## Testing Requirements

Each format needs test files:
- Sample input file
- Expected output segments
- Edge cases (nested keys, special characters, etc.)

## Summary

**Currently Supported:** 8 website translation formats
**Missing:** 25+ website translation formats
**Total Needed:** 33+ website translation formats

**Next Steps:**
1. Add JS/JSX/TSX parser (most common)
2. Add VUE parser (popular framework)
3. Add I18NEXT_JSON parser (popular library)
4. Add CHROME_JSON parser (extensions)
5. Add ANDROID_XML parser (mobile apps)
6. Add IOS_XLIFF parser (mobile apps)

This will cover 90% of website translation use cases.
