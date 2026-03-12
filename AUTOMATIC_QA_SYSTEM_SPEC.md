# Glossa CAT - Automatic QA Verification System
## Professional Translation Quality Assurance

---

## Overview
Implement a comprehensive automatic QA system similar to SDL Trados Studio, memoQ, and Smartcat with 60+ quality checks.

---

## QA Check Categories

### 1. Segment Completeness Checks (5 checks)

| Check | Severity | Description |
|-------|----------|-------------|
| Untranslated segment | Error | Target is empty or same as source |
| Empty target segment | Error | Target field is completely empty |
| Source copied to target | Warning | Exact copy without translation |
| Partial translation | Warning | Target significantly shorter than expected |
| Repeated segment inconsistency | Warning | Same source translated differently |

### 2. Number Verification (7 checks)

| Check | Severity | Description |
|-------|----------|-------------|
| Missing numbers | Error | Numbers in source not in target |
| Extra numbers | Error | Numbers in target not in source |
| Number mismatch | Error | Different number values |
| Decimal mismatch | Error | Decimal separator changed (. vs ,) |
| Percentage mismatch | Error | Percentage values don't match |
| Currency value mismatch | Error | Currency amounts differ |
| Measurement mismatch | Warning | Units or measurements differ |

**Example:**
```
Source: "50% discount on $100"
Target: "40% discount on $90" ❌ Error
```

### 3. Tag Verification (6 checks)

| Check | Severity | Description |
|-------|----------|-------------|
| Missing tag | Error | Tag in source not in target |
| Extra tag | Error | Tag in target not in source |
| Incorrect tag order | Error | Tags in wrong sequence |
| Broken tag structure | Error | Malformed tag syntax |
| Tag mismatch | Error | Different tag types |
| Inline tag misplaced | Warning | Tag position changed |

**Example:**
```
Source: "Click <b>here</b> to continue"
Target: "Click here to continue" ❌ Missing tag
```

### 4. Whitespace Checks (6 checks)

| Check | Severity | Description |
|-------|----------|-------------|
| Leading space | Warning | Space at start of target |
| Trailing space | Warning | Space at end of target |
| Double spaces | Warning | Multiple consecutive spaces |
| Multiple spaces | Warning | More than 2 spaces |
| Tab characters | Info | Tab character detected |
| Missing space after punctuation | Warning | No space after period/comma |

**Example:**
```
Source: "Hello world"
Target: "Hello world " ⚠️ Trailing space
```

### 5. Punctuation Checks (6 checks)

| Check | Severity | Description |
|-------|----------|-------------|
| Missing punctuation | Warning | Punctuation in source missing |
| Extra punctuation | Warning | Extra punctuation in target |
| Different punctuation | Info | Different punctuation used |
| Wrong quotation marks | Warning | Incorrect quote style |
| Wrong apostrophe | Warning | Incorrect apostrophe type |
| Inconsistent punctuation | Warning | Punctuation style varies |

**Example:**
```
Source: "Hello, world!"
Target: "Hello world" ⚠️ Missing punctuation
```

### 6. Capitalization Checks (5 checks)

| Check | Severity | Description |
|-------|----------|-------------|
| Capitalization mismatch | Warning | Different capitalization pattern |
| Sentence start error | Warning | Sentence doesn't start with capital |
| Brand name error | Error | Brand name not capitalized |
| All caps mismatch | Warning | ALL CAPS not preserved |
| Title case error | Info | Title case not followed |

**Example:**
```
Source: "Microsoft Office"
Target: "microsoft office" ❌ Brand name error
```

### 7. Terminology Checks (5 checks)

| Check | Severity | Description |
|-------|----------|-------------|
| Glossary term missing | Error | Required term not used |
| Wrong glossary term | Error | Incorrect term used |
| Inconsistent terminology | Warning | Term used differently |
| Forbidden term used | Error | Blacklisted term detected |
| Terminology spelling | Warning | Term spelled incorrectly |

**Example:**
```
Glossary: "software" → "برنامج"
Source: "Install the software"
Target: "Install the برمجية" ⚠️ Wrong term
```

### 8. Length Checks (4 checks)

| Check | Severity | Description |
|-------|----------|-------------|
| Target too long | Warning | Exceeds character limit |
| Target too short | Info | Significantly shorter |
| Character limit exceeded | Error | Hard limit exceeded |
| UI overflow risk | Warning | May not fit in UI |

**Example:**
```
Source: "OK" (2 chars)
Target: "موافق جداً" (10 chars) ⚠️ Too long for button
```

### 9. Placeholder & Variable Checks (4 checks)

| Check | Severity | Description |
|-------|----------|-------------|
| Missing placeholder | Error | {variable} not in target |
| Extra placeholder | Error | Placeholder added in target |
| Placeholder order changed | Warning | Order differs from source |
| Variable modified | Error | Variable name changed |

**Example:**
```
Source: "Hello {username}, you have {count} messages"
Target: "Hello {user}, you have messages" ❌ Missing placeholders
```

### 10. URL & Email Checks (3 checks)

| Check | Severity | Description |
|-------|----------|-------------|
| URL modified | Error | URL changed or broken |
| Email modified | Error | Email address changed |
| Broken hyperlink | Error | Link syntax broken |

**Example:**
```
Source: "Visit https://example.com"
Target: "Visit https://example.co" ❌ URL modified
```

### 11. Date & Time Checks (3 checks)

| Check | Severity | Description |
|-------|----------|-------------|
| Date format mismatch | Warning | Date format changed |
| Incorrect time format | Warning | Time format differs |
| Missing date value | Error | Date removed |

**Example:**
```
Source: "12/05/2024"
Target: "05/12/2024" ⚠️ Date format mismatch
```

### 12. Locale Formatting Checks (3 checks)

| Check | Severity | Description |
|-------|----------|-------------|
| Currency format incorrect | Warning | Wrong currency format |
| Number format incorrect | Warning | Wrong number format |
| Measurement units incorrect | Warning | Units not localized |

**Example:**
```
Source: "$1,000.50"
Target: "1000,50$" ⚠️ Currency format incorrect
```

### 13. Consistency Checks (4 checks)

| Check | Severity | Description |
|-------|----------|-------------|
| Same source different translation | Warning | Inconsistent translation |
| Repeated phrase inconsistency | Warning | Phrase translated differently |
| Terminology inconsistency | Warning | Term used inconsistently |
| Number formatting inconsistency | Info | Number format varies |

### 14. Spelling Checks (4 checks)

| Check | Severity | Description |
|-------|----------|-------------|
| Misspelled words | Warning | Spelling error detected |
| Typographical errors | Warning | Typo detected |
| Incorrect characters | Error | Wrong character set |
| Diacritic errors | Warning | Missing or wrong diacritics |

### 15. Language Detection Checks (2 checks)

| Check | Severity | Description |
|-------|----------|-------------|
| Target language mismatch | Error | Wrong language detected |
| Mixed language text | Warning | Multiple languages in target |

**Example:**
```
Target Language: Urdu
Target: "یہ ہے example" ⚠️ Mixed language (Urdu + English)
```

### 16. Forbidden Content Checks (3 checks)

| Check | Severity | Description |
|-------|----------|-------------|
| Offensive words | Error | Inappropriate content |
| Forbidden terms | Error | Blacklisted terms |
| Restricted brand terms | Warning | Unauthorized brand usage |

---

## QA Severity Levels

### Error (Red) ❌
- **Color**: `#ef4444`
- **Icon**: ❌
- **Underline**: Red wavy
- **Action**: Must fix before confirming
- **Examples**: Missing numbers, broken tags, wrong terminology

### Warning (Yellow) ⚠️
- **Color**: `#f59e0b`
- **Icon**: ⚠️
- **Underline**: Yellow wavy
- **Action**: Should review
- **Examples**: Trailing space, capitalization, length issues

### Info (Blue) ℹ️
- **Color**: `#3b82f6`
- **Icon**: ℹ️
- **Underline**: Blue dotted
- **Action**: Optional review
- **Examples**: Different punctuation, target too short

---

## UI Implementation

### 1. QA Panel in CAT Workspace

Add 5th tab: "QA" (Quality Assurance)

```
┌─────────────────────────────────────┐
│ [TM/MT] [Glossary] [AI] [Annotation] [QA] │
├─────────────────────────────────────┤
│ Quality Checks (3 issues)           │
│                                     │
│ ❌ Missing number (Error)           │
│    Source: "50% discount"           │
│    Target: "discount"               │
│    → Add "50%" to target            │
│                                     │
│ ⚠️ Trailing space (Warning)         │
│    Extra space at end               │
│    → Remove trailing space          │
│                                     │
│ ℹ️ Target shorter (Info)            │
│    Target is 30% shorter            │
│    → Review translation             │
│                                     │
│ [Run QA Check] [Fix All Warnings]  │
└─────────────────────────────────────┘
```

### 2. Inline Highlighting in Editor

```
Target text field:
┌─────────────────────────────────────┐
│ Hello world ⚠️                      │
│             └─ Trailing space       │
│                                     │
│ Visit example.co ❌                 │
│       └─ URL modified               │
└─────────────────────────────────────┘
```

### 3. QA Summary Badge

```
┌─────────────────────────────────────┐
│ Segment #5                          │
│ Status: Draft                       │
│ QA: ❌ 2 errors ⚠️ 3 warnings      │
└─────────────────────────────────────┘
```

### 4. Confirm Button Behavior

```javascript
if (hasQAErrors) {
    showConfirmDialog(
        "This segment has 2 QA errors. Confirm anyway?",
        ["Fix Errors", "Confirm Anyway", "Cancel"]
    );
}
```

---

## Database Schema

### Add QA Results Table

```sql
CREATE TABLE qa_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id UUID REFERENCES segments(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    check_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'error', 'warning', 'info'
    message TEXT NOT NULL,
    source_text TEXT,
    target_text TEXT,
    suggestion TEXT,
    position_start INTEGER,
    position_end INTEGER,
    auto_fixable BOOLEAN DEFAULT false,
    fixed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_qa_results_segment ON qa_results(segment_id);
CREATE INDEX idx_qa_results_severity ON qa_results(severity);
```

---

## Implementation Plan

### Phase 1: Core QA Engine (Week 1)
**File**: `src/services/qaEngine.js`

```javascript
export const runQAChecks = (sourceText, targetText, options) => {
    const issues = [];
    
    // Run all checks
    issues.push(...checkNumbers(sourceText, targetText));
    issues.push(...checkWhitespace(sourceText, targetText));
    issues.push(...checkPunctuation(sourceText, targetText));
    // ... more checks
    
    return issues;
};
```

**Implement:**
- ✅ Number verification (7 checks)
- ✅ Whitespace checks (6 checks)
- ✅ Punctuation checks (6 checks)
- ✅ Capitalization checks (5 checks)
- ✅ Placeholder checks (4 checks)

### Phase 2: Advanced Checks (Week 2)
**Implement:**
- ✅ Tag verification (6 checks)
- ✅ URL/Email checks (3 checks)
- ✅ Date/Time checks (3 checks)
- ✅ Length checks (4 checks)
- ✅ Consistency checks (4 checks)

### Phase 3: UI Integration (Week 3)
**Files:**
- `src/components/QAPanel.jsx`
- `src/components/QAHighlighter.jsx`
- Update `CATProjectView.jsx`

**Implement:**
- ✅ QA tab in right panel
- ✅ Inline highlighting
- ✅ Issue tooltips
- ✅ Auto-fix buttons
- ✅ QA summary badges

### Phase 4: Glossary & Terminology (Week 4)
**Implement:**
- ✅ Glossary integration
- ✅ Terminology checks (5 checks)
- ✅ Forbidden terms
- ✅ Brand name validation

### Phase 5: Advanced Features (Week 5)
**Implement:**
- ✅ Spelling checks (4 checks)
- ✅ Language detection (2 checks)
- ✅ Locale formatting (3 checks)
- ✅ Forbidden content (3 checks)

---

## Code Structure

```
src/
├── services/
│   ├── qaEngine.js              # Main QA engine
│   ├── qaChecks/
│   │   ├── numberChecks.js      # Number verification
│   │   ├── whitespaceChecks.js  # Whitespace checks
│   │   ├── punctuationChecks.js # Punctuation checks
│   │   ├── tagChecks.js         # Tag verification
│   │   ├── placeholderChecks.js # Placeholder checks
│   │   ├── urlChecks.js         # URL/Email checks
│   │   ├── dateChecks.js        # Date/Time checks
│   │   ├── lengthChecks.js      # Length checks
│   │   ├── consistencyChecks.js # Consistency checks
│   │   ├── spellingChecks.js    # Spelling checks
│   │   ├── languageChecks.js    # Language detection
│   │   └── terminologyChecks.js # Terminology checks
│   └── qaAutoFix.js             # Auto-fix utilities
├── components/
│   ├── QAPanel.jsx              # QA results panel
│   ├── QAHighlighter.jsx        # Inline highlighting
│   ├── QABadge.jsx              # QA summary badge
│   └── QATooltip.jsx            # Issue tooltips
└── utils/
    └── qaHelpers.js             # Helper functions
```

---

## Example QA Check Implementation

```javascript
// src/services/qaChecks/numberChecks.js

export const checkNumbers = (source, target) => {
    const issues = [];
    
    // Extract numbers from source and target
    const sourceNumbers = extractNumbers(source);
    const targetNumbers = extractNumbers(target);
    
    // Check for missing numbers
    sourceNumbers.forEach(num => {
        if (!targetNumbers.includes(num)) {
            issues.push({
                type: 'missing_number',
                severity: 'error',
                message: `Missing number: ${num}`,
                suggestion: `Add "${num}" to target`,
                autoFixable: false
            });
        }
    });
    
    // Check for extra numbers
    targetNumbers.forEach(num => {
        if (!sourceNumbers.includes(num)) {
            issues.push({
                type: 'extra_number',
                severity: 'error',
                message: `Extra number: ${num}`,
                suggestion: `Remove "${num}" from target`,
                autoFixable: false
            });
        }
    });
    
    return issues;
};

const extractNumbers = (text) => {
    const regex = /\d+([.,]\d+)?%?/g;
    return text.match(regex) || [];
};
```

---

## Auto-Fix Capabilities

Some issues can be auto-fixed:

| Check | Auto-Fixable | Action |
|-------|--------------|--------|
| Trailing space | ✅ Yes | Remove space |
| Leading space | ✅ Yes | Remove space |
| Double spaces | ✅ Yes | Replace with single space |
| Missing space after punctuation | ✅ Yes | Add space |
| Capitalization (sentence start) | ✅ Yes | Capitalize first letter |
| Missing numbers | ❌ No | Manual fix required |
| Wrong terminology | ⚠️ Suggest | Suggest correct term |

---

## Settings & Configuration

Add QA settings in project configuration:

```javascript
{
    qaSettings: {
        enabled: true,
        autoRunOnSave: true,
        blockConfirmOnErrors: true,
        checks: {
            numbers: { enabled: true, severity: 'error' },
            whitespace: { enabled: true, severity: 'warning' },
            punctuation: { enabled: true, severity: 'warning' },
            tags: { enabled: true, severity: 'error' },
            // ... more checks
        },
        lengthLimits: {
            enabled: true,
            maxLength: 1000,
            warnAt: 80 // % of max
        }
    }
}
```

---

## Performance Considerations

- Run QA checks asynchronously
- Cache results per segment
- Only re-run when target changes
- Debounce QA checks (500ms after typing stops)
- Use Web Workers for heavy checks

---

## Testing Strategy

1. **Unit Tests**: Each QA check function
2. **Integration Tests**: Full QA engine
3. **UI Tests**: QA panel and highlighting
4. **Performance Tests**: Large documents
5. **Localization Tests**: Multiple languages

---

## Future Enhancements

1. **Machine Learning QA**
   - AI-powered quality scoring
   - Context-aware checks
   - Translation fluency analysis

2. **Custom Rules**
   - User-defined QA rules
   - Project-specific checks
   - Client-specific requirements

3. **QA Reports**
   - Export QA results
   - QA statistics dashboard
   - Translator QA scores

4. **Integration**
   - Import QA rules from other CAT tools
   - Export QA reports to clients
   - API for external QA tools

---

## Estimated Timeline

- **Phase 1**: 1 week (Core checks)
- **Phase 2**: 1 week (Advanced checks)
- **Phase 3**: 1 week (UI integration)
- **Phase 4**: 1 week (Glossary integration)
- **Phase 5**: 1 week (Advanced features)

**Total**: 5 weeks for complete implementation

---

## Priority Implementation Order

### High Priority (Implement First)
1. ✅ Number verification
2. ✅ Whitespace checks
3. ✅ Tag verification
4. ✅ Placeholder checks
5. ✅ Segment completeness

### Medium Priority
6. ✅ Punctuation checks
7. ✅ Capitalization checks
8. ✅ URL/Email checks
9. ✅ Length checks
10. ✅ Consistency checks

### Low Priority (Nice to Have)
11. ✅ Spelling checks
12. ✅ Language detection
13. ✅ Locale formatting
14. ✅ Forbidden content

---

**Status**: Specification Complete  
**Next Step**: Begin Phase 1 implementation  
**Date**: March 12, 2026
