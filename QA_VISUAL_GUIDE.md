# 🎨 QA System Visual Guide

## What You'll See in the CAT Workspace

---

## 1. Warning Badges Next to Target Field

When QA detects issues, color-coded badges appear in the top-right corner of the target text field:

```
┌─────────────────────────────────────────────────────┐
│ Target Language (Urdu)                              │
│ ┌───────────────────────────────────────────┐       │
│ │ یہ ہے ترجمہ                                │  ⚠️   │ ← Warning badge
│ │                                           │  ❌   │ ← Error badge
│ │                                           │       │
│ │                                           │       │
│ └───────────────────────────────────────────┘       │
│                                                     │
│ [Previous] [Next] [AI Translate]                    │
│ [Draft] [Confirm & Next]                            │
└─────────────────────────────────────────────────────┘
```

### Badge Colors:
- 🔴 **Red (❌)** = Error (must fix)
- 🟡 **Yellow (⚠️)** = Warning (should review)
- 🔵 **Blue (ℹ️)** = Info (optional)

---

## 2. Hover Tooltips

Hover your mouse over any warning badge to see details:

```
                                    ┌─────────────────────────┐
                                    │ ⚠️ Trailing space       │
                                    │    detected             │
                                    │                         │
                                    │ Remove space at end     │
                                    └─────────────────────────┘
                                              ↓
┌─────────────────────────────────────────────────────┐
│ Target Language (Urdu)                              │
│ ┌───────────────────────────────────────────┐       │
│ │ یہ ہے ترجمہ                                │  ⚠️ ← Hover here
│ │                                           │       │
│ └───────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

---

## 3. QA Tab (5th Tab in Right Panel)

Click the "QA" tab to see all issues:

```
┌─────────────────────────────────────────────────────┐
│ [TM/MT] [Glossary] [AI] [Annotate] [QA 3]          │ ← Issue count badge
├─────────────────────────────────────────────────────┤
│                                                     │
│  Quality Assurance                                  │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ ❌ 1 errors  ⚠️ 2 warnings  ℹ️ 0 info       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [Run QA Check]  [Fix 2]                           │
│                                                     │
│  WHITESPACE (2)                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ ⚠️ Trailing space detected                  │   │
│  │    Remove space at end                      │   │
│  │    🔧 Auto-fixable                          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ ⚠️ Double space detected                    │   │
│  │    Replace with single space                │   │
│  │    🔧 Auto-fixable                          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  NUMBERS (1)                                        │
│  ┌─────────────────────────────────────────────┐   │
│  │ ❌ Missing number: 5                        │   │
│  │    Add "5" to target                        │   │
│  │    5                                        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  💡 QA checks run automatically when you save.     │
│     Fix errors before confirming.                  │
└─────────────────────────────────────────────────────┘
```

---

## 4. Confirmation Dialog with Errors

When you click "Confirm & Next" with QA errors:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ⚠️ This segment has 2 QA error(s).                │
│                                                     │
│  Errors:                                            │
│  • Missing number: 5                                │
│  • Missing placeholder: {username}                  │
│                                                     │
│  Do you want to confirm anyway?                     │
│                                                     │
│           [Cancel]        [Confirm Anyway]          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

If you click **Cancel**, the system automatically switches to the QA tab to show you all issues.

---

## 5. Real-Time QA Execution

The QA system runs automatically as you type:

```
Time: 0s
┌─────────────────────────────────────────────────────┐
│ Target: "Hello world"                               │
│ No issues                                           │
└─────────────────────────────────────────────────────┘

Time: 1s (you stop typing)
┌─────────────────────────────────────────────────────┐
│ Target: "Hello world "                              │
│ ⚠️ Running QA check...                              │
└─────────────────────────────────────────────────────┘

Time: 1.1s (QA complete)
┌─────────────────────────────────────────────────────┐
│ Target: "Hello world "                         ⚠️   │
│ Warning: Trailing space detected                    │
└─────────────────────────────────────────────────────┘
```

---

## 6. Auto-Fix in Action

Click "Fix All" to automatically fix simple issues:

**Before:**
```
Target: " Hello  world "
Issues:
⚠️ Leading space detected
⚠️ Double space detected
⚠️ Trailing space detected
```

**After clicking "Fix All":**
```
Target: "Hello world"
✅ No issues
```

---

## 7. Tab Badge Indicators

The QA tab badge shows the issue count and severity:

```
[QA 3]  ← 3 issues total (yellow = warnings only)
[QA 2]  ← 2 issues total (red = at least 1 error)
[QA]    ← No issues (no badge)
```

---

## 8. Multiple Warning Badges

When there are more than 3 issues:

```
┌─────────────────────────────────────────────────────┐
│ Target Language (Urdu)                              │
│ ┌───────────────────────────────────────────┐       │
│ │ یہ ہے ترجمہ                                │  ⚠️   │
│ │                                           │  ❌   │
│ │                                           │  ℹ️   │
│ │                                           │ +2    │ ← More issues
│ └───────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

---

## 9. Issue Categories

Issues are grouped by category in the QA tab:

- **COMPLETENESS** - Empty target, source copied
- **NUMBERS** - Missing/extra numbers
- **WHITESPACE** - Spaces, tabs
- **PLACEHOLDERS** - {var}, %s, $var, etc.
- **TAGS** - HTML/XML tags
- **URLS** - URLs and emails
- **LENGTH** - Too long/short
- **PUNCTUATION** - Missing punctuation
- **CAPITALIZATION** - Capitalization errors

---

## 10. Example Error Messages

### Missing Number
```
❌ Missing number: 5
   Add "5" to target
   5
```

### Trailing Space
```
⚠️ Trailing space detected
   Remove space at end
   🔧 Auto-fixable
```

### Missing Placeholder
```
❌ Missing placeholder: {username}
   Add "{username}" to target
   {username}
```

### Modified URL
```
❌ URL modified or missing: https://glossa.com
   Verify URL is correct
   https://glossa.com
```

### Source Copied
```
⚠️ Source text copied to target without translation
   Translate the text
```

---

## User Workflow Summary

1. **Type translation** → QA runs automatically after 1 second
2. **See warning badges** → Hover to see details
3. **Click QA tab** → See all issues grouped by category
4. **Click "Fix All"** → Auto-fix simple issues
5. **Manually fix errors** → Update translation
6. **Click "Confirm & Next"** → System checks for errors
7. **If errors exist** → Warning dialog appears
8. **Fix or proceed** → Your choice

---

## Tips for Translators

✅ **Watch for badges** - They appear automatically as you type
✅ **Hover for details** - Quick way to see what's wrong
✅ **Use QA tab** - See all issues at once
✅ **Use "Fix All"** - Quick fix for whitespace issues
✅ **Fix errors first** - Red badges should be fixed before confirming
✅ **Warnings are optional** - Yellow badges are suggestions, not requirements

---

## Tips for Reviewers

✅ **Check QA tab** - See if translator fixed all issues
✅ **Look for patterns** - Repeated errors indicate training needs
✅ **Use for quality metrics** - Track error rates over time
✅ **Provide feedback** - Help translators understand QA checks

---

## Keyboard Shortcuts

- **Ctrl+Enter** - Confirm & Next (with QA check)
- **Alt+↓** - Next segment
- **Alt+↑** - Previous segment

---

## Mobile/Responsive View

On smaller screens:
- Warning badges stack vertically
- QA tab is accessible via tab navigation
- Tooltips adjust position automatically
- All functionality remains available

---

## Accessibility

- All badges have proper ARIA labels
- Tooltips are keyboard accessible
- Color is not the only indicator (icons + text)
- Screen reader friendly

---

## Performance

- QA checks run in <100ms
- No lag or delay in typing
- Debounced to avoid excessive checks
- All processing is client-side (no API calls)

---

This visual guide shows exactly what users will see when using the QA system in the Glossa CAT workspace!
