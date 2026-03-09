# RTL/LTR Text Direction Support

## Feature Overview

Added automatic text direction (RTL/LTR) support for all languages in the CAT workspace. The system now automatically detects the language and applies the correct text direction and alignment.

## Supported RTL Languages

The following languages are automatically displayed with Right-to-Left (RTL) text direction:

### Arabic Languages
- Arabic
- Arabic (Egyptian)
- Arabic (Gulf)
- Arabic (Levantine)
- Arabic (Maghrebi)

### Middle Eastern Languages
- Hebrew
- Persian (Farsi)
- Dari
- Urdu
- Pashto

### Other RTL Languages
- Kurdish
- Kurdish (Sorani)
- Yiddish
- Sindhi
- Dhivehi (Maldivian)

## All Other Languages (LTR)

All other languages use Left-to-Right (LTR) text direction by default, including:
- English, Spanish, French, German, Italian, Portuguese
- Chinese, Japanese, Korean
- Russian, Polish, Czech, Romanian
- And 90+ other languages

## Implementation

### 1. Language Direction Mapping (`src/data/languageDirections.js`)

Created a comprehensive language direction system with helper functions:

```javascript
// Check if language is RTL
isRTL('Arabic') // returns true
isRTL('English') // returns false

// Get text direction
getTextDirection('Hebrew') // returns 'rtl'
getTextDirection('Spanish') // returns 'ltr'

// Get text alignment
getTextAlign('Urdu') // returns 'right'
getTextAlign('French') // returns 'left'
```

### 2. CAT Workspace Integration

Updated `CATProjectView.jsx` to automatically apply text direction based on project languages:

**Source Text:**
```jsx
<div 
  dir={getTextDirection(project?.source_language)}
  style={{ textAlign: getTextAlign(project?.source_language) }}
>
  {sourceText}
</div>
```

**Target Text (Translation Editor):**
```jsx
<textarea 
  dir={getTextDirection(project?.target_language)}
  style={{ textAlign: getTextAlign(project?.target_language) }}
  value={targetText}
/>
```

**Segment List:**
```jsx
<p 
  dir={getTextDirection(project?.source_language)}
  style={{ textAlign: getTextAlign(project?.source_language) }}
>
  {segmentText}
</p>
```

## How It Works

### Automatic Detection

1. **Project Created** with source and target languages
2. **CAT Workspace Opens** and reads project languages
3. **System Checks** if languages are RTL or LTR
4. **Text Direction Applied** automatically to:
   - Source text display
   - Target text editor (textarea)
   - Segment list on the left
   - All text elements

### Example Scenarios

**Scenario 1: English → Arabic**
- Source (English): LTR, left-aligned
- Target (Arabic): RTL, right-aligned
- Cursor starts on the right in Arabic editor

**Scenario 2: Arabic → English**
- Source (Arabic): RTL, right-aligned
- Target (English): LTR, left-aligned
- Cursor starts on the left in English editor

**Scenario 3: Hebrew → Spanish**
- Source (Hebrew): RTL, right-aligned
- Target (Spanish): LTR, left-aligned

**Scenario 4: English → Spanish**
- Source (English): LTR, left-aligned
- Target (Spanish): LTR, left-aligned

## Visual Changes

### RTL Languages (Arabic, Hebrew, Urdu, etc.)

**Before:**
```
Text starts from left → wrong direction
```

**After:**
```
                    ← correct direction from right Text
```

### Text Alignment

**RTL Languages:**
- Text aligns to the right
- Cursor starts on the right
- Text flows right-to-left
- Numbers and English words maintain LTR within RTL text

**LTR Languages:**
- Text aligns to the left
- Cursor starts on the left
- Text flows left-to-right
- Standard behavior

## Browser Support

### HTML `dir` Attribute
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ All modern browsers

### CSS `text-align`
- ✅ Universal support
- ✅ Works with all browsers

## Benefits

### For Translators

1. **Natural Reading Direction**
   - RTL languages display correctly
   - No need to manually adjust alignment
   - Comfortable reading experience

2. **Proper Cursor Behavior**
   - Cursor starts on correct side
   - Text flows in natural direction
   - Editing feels natural

3. **Mixed Content Support**
   - RTL text with LTR numbers works correctly
   - English words in Arabic text display properly
   - Bidirectional text handled by browser

### For Agencies

1. **Professional Appearance**
   - Correct text direction for all languages
   - No visual issues with RTL languages
   - Better client satisfaction

2. **No Manual Configuration**
   - Automatic detection
   - Works out of the box
   - No settings needed

## Testing

### Test RTL Languages

1. **Create project:** English → Arabic
2. **Open workspace**
3. **Check source text:** Should be left-aligned (English)
4. **Check target editor:** Should be right-aligned (Arabic)
5. **Type Arabic text:** Cursor should start on right
6. **Segment list:** Arabic text should be right-aligned

### Test LTR Languages

1. **Create project:** Spanish → French
2. **Open workspace**
3. **Check both:** Should be left-aligned
4. **Type text:** Normal left-to-right behavior

### Test Mixed Direction

1. **Create project:** Arabic → English
2. **Source (Arabic):** Right-aligned, RTL
3. **Target (English):** Left-aligned, LTR
4. **Both work correctly** in their respective directions

## Edge Cases Handled

### 1. Language Name Variations
- "Arabic" matches "Arabic (Egyptian)"
- "Kurdish" matches "Kurdish (Sorani)"
- Case-insensitive matching

### 2. Null/Undefined Languages
- Defaults to LTR if language not specified
- No errors if project language is missing

### 3. Bidirectional Text (BiDi)
- Browser handles mixed RTL/LTR automatically
- Numbers in Arabic text display correctly
- English words in Arabic text work properly

## Future Enhancements

### Potential Additions

1. **User Preference Override**
   - Allow users to manually set text direction
   - Useful for special cases

2. **More RTL Languages**
   - Add regional variants
   - Support historical languages

3. **BiDi Algorithm Customization**
   - Fine-tune bidirectional text handling
   - Custom rules for specific languages

4. **Visual Indicators**
   - Show RTL/LTR icon in editor
   - Display current text direction

## Files Modified

1. **`src/data/languageDirections.js`** (NEW)
   - Language direction mapping
   - Helper functions
   - RTL language list

2. **`src/pages/dashboard/CATProjectView.jsx`**
   - Import direction helpers
   - Apply `dir` attribute to source text
   - Apply `dir` attribute to target textarea
   - Apply `dir` attribute to segment list
   - Apply `textAlign` style to all text elements

## Deployment

- ✅ Code committed (commit: 68e2f97)
- ✅ Build successful
- ⏳ Vercel deploying (2-3 minutes)

## Summary

The CAT workspace now automatically detects and applies the correct text direction for all languages:

- ✅ **RTL languages** (Arabic, Hebrew, Urdu, etc.) display right-to-left
- ✅ **LTR languages** (English, Spanish, etc.) display left-to-right
- ✅ **Automatic detection** based on project languages
- ✅ **No manual configuration** required
- ✅ **Professional appearance** for all language pairs

Translators working with RTL languages will now have a natural, comfortable editing experience!
