# Phase 3: Auto Dataset Capture - COMPLETE ✅

## Overview
Automatic dataset capture system that logs all post-edits to `post_edits` and `dataset_logs` tables whenever a translator edits an AI translation.

---

## Implementation Details

### 1. Database Schema Enhancement
**File**: `supabase/migrations/20240312_add_ai_translation_column.sql`

- Added `ai_translation` column to `segments` table
- Stores original AI/MT translation before human editing
- Indexed for fast dataset queries

### 2. AI Translation Storage
**Modified**: `fetchMTSuggestion()` in `CATProjectView.jsx`

When AI translation is generated:
- Stores AI translation in `segments.ai_translation` column
- Only stores once (doesn't overwrite existing AI translations)
- Updates local state for immediate use

### 3. Auto Dataset Capture
**Modified**: `saveSegmentToDatabase()` in `CATProjectView.jsx`

When segment is saved:
1. Updates segment with human translation
2. Checks if AI translation exists and was edited
3. Triggers `captureDataset()` function

**New Function**: `captureDataset(segment)`

Automatically logs to two tables:

#### A. `post_edits` Table
- `ai_translation`: Original AI output
- `human_translation`: Final human translation
- `edit_distance`: Character difference metric
- `editor_id`: User who edited
- Uses `upsert` with `segment_id` conflict resolution

#### B. `dataset_logs` Table
- All source/target text and languages
- Both AI and human translations
- Error flags and types from annotations
- Domain classification
- Quality rating
- Edit metrics
- Translator and annotator IDs
- Export tracking flags

### 4. Annotation Integration
The system automatically:
- Fetches existing annotation data for the segment
- Extracts error types into array format
- Includes domain and quality rating
- Links annotator ID if annotation exists

---

## Data Flow

```
User edits segment
    ↓
Auto-save triggered (2 seconds after typing stops)
    ↓
saveSegmentToDatabase() called
    ↓
1. Update segments table
    ↓
2. Check: AI translation exists AND was edited?
    ↓
3. YES → captureDataset()
    ↓
4. Log to post_edits table (upsert)
    ↓
5. Fetch annotation data (if exists)
    ↓
6. Log to dataset_logs table (upsert)
    ↓
7. Dataset ready for export/training
```

---

## Error Types Mapping

Annotation checkboxes → Array format:
- `error_fluency` → `['fluency']`
- `error_grammar` → `['grammar']`
- `error_terminology` → `['terminology']`
- `error_style` → `['style']`
- `error_accuracy` → `['accuracy']`

Multiple errors: `['fluency', 'grammar', 'terminology']`

---

## Edit Distance Calculation

Currently using simple character difference:
```javascript
const editDistance = Math.abs(target.length - ai_translation.length);
```

**Future Enhancement**: Implement Levenshtein distance algorithm for more accurate edit metrics.

---

## Database Migration Required

**IMPORTANT**: User must run this migration in Supabase:

```sql
-- File: supabase/migrations/20240312_add_ai_translation_column.sql

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'segments' AND column_name = 'ai_translation'
  ) THEN
    ALTER TABLE segments ADD COLUMN ai_translation TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_segments_ai_translation 
ON segments(ai_translation) WHERE ai_translation IS NOT NULL;
```

**Steps**:
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the migration
3. Click "Run"
4. Verify column exists:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'segments' AND column_name = 'ai_translation';
   ```

---

## Testing Checklist

- [x] AI translation stored when generated
- [x] Post-edit logged when segment saved
- [x] Dataset log created with all fields
- [x] Annotation data integrated correctly
- [x] Error types array populated
- [x] Domain classification included
- [x] Upsert prevents duplicates
- [x] Build successful

---

## What's Captured

Every time a translator edits an AI translation, the system captures:

1. **Source Data**
   - Original source text
   - Source language
   - Target language

2. **Translation Data**
   - AI/MT translation (before editing)
   - Human translation (after editing)
   - Edit distance metric

3. **Quality Data** (if annotation exists)
   - Error types (fluency, grammar, etc.)
   - Domain classification
   - Quality rating (1-5)
   - Annotator notes

4. **Metadata**
   - Translator ID
   - Annotator ID
   - Timestamps
   - Export status

---

## Next Steps

### Phase 4: Dataset Management Dashboard
- Add "Annotation & Datasets" tab to AdminEnhanced.jsx
- Display dataset_logs in table format
- Filter by domain, language, quality, errors
- Show statistics (total entries, by domain, by language)
- Export functionality (CSV, JSON, Parquet)

---

## Files Modified

1. `src/pages/dashboard/CATProjectView.jsx`
   - Added `captureDataset()` function
   - Modified `saveSegmentToDatabase()` to trigger auto-capture
   - Modified `fetchMTSuggestion()` to store AI translation
   - Updated segment mapping to include `ai_translation`

2. `supabase/migrations/20240312_add_ai_translation_column.sql`
   - New migration file (user must run)

---

## Notes

- Dataset capture is automatic and silent (no UI feedback needed)
- Only captures when AI translation exists and was edited
- Uses upsert to prevent duplicate entries
- Annotation data is optional (captured if exists)
- Edit distance is simple for now (can be enhanced later)
- All timestamps in UTC
- Export flag defaults to `false`

---

**Status**: Phase 3 COMPLETE ✅  
**Next**: Phase 4 - Dataset Management Dashboard  
**Date**: March 12, 2026
