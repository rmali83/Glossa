# Annotation & Dataset Capture - Database Schema

## Overview
This document describes the database schema for the Annotation & Dataset Capture system in Glossa CAT.

## Architecture

```
projects (existing)
  └── segments (existing)
       ├── annotations (NEW)
       ├── post_edits (NEW)
       └── dataset_logs (NEW)
```

---

## Table: `annotations`

**Purpose**: Store quality annotations and error tags per segment

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `segment_id` | UUID | Reference to segments table |
| `project_id` | UUID | Reference to projects table |
| `error_fluency` | BOOLEAN | Fluency/naturalness error flag |
| `error_grammar` | BOOLEAN | Grammar error flag |
| `error_terminology` | BOOLEAN | Terminology error flag |
| `error_style` | BOOLEAN | Style/tone error flag |
| `error_accuracy` | BOOLEAN | Accuracy/meaning error flag |
| `error_other` | BOOLEAN | Other error types |
| `domain` | TEXT | Domain classification (Legal, Medical, etc.) |
| `quality_rating` | INTEGER | Quality rating 1-5 |
| `notes` | TEXT | Additional annotator notes |
| `annotator_id` | UUID | User who created annotation |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Indexes
- `segment_id` - Fast lookup by segment
- `project_id` - Fast lookup by project
- `annotator_id` - Track annotator performance
- `domain` - Filter by domain
- `created_at` - Time-based queries

### Constraints
- Unique constraint on `(segment_id, annotator_id)` - One annotation per user per segment

---

## Table: `post_edits`

**Purpose**: Track what changed from AI translation to human translation

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `segment_id` | UUID | Reference to segments table |
| `project_id` | UUID | Reference to projects table |
| `ai_translation` | TEXT | Original AI/MT output |
| `human_translation` | TEXT | Final human-edited translation |
| `edit_distance` | INTEGER | Levenshtein distance (optional) |
| `edit_time_seconds` | INTEGER | Time spent editing (optional) |
| `editor_id` | UUID | User who edited |
| `created_at` | TIMESTAMP | Creation timestamp |

### Indexes
- `segment_id` - Fast lookup by segment
- `project_id` - Fast lookup by project
- `editor_id` - Track editor performance
- `created_at` - Time-based queries

### Constraints
- Unique constraint on `segment_id` - One edit record per segment

---

## Table: `dataset_logs`

**Purpose**: Aggregated training data for AI model fine-tuning

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `segment_id` | UUID | Reference to segments table |
| `project_id` | UUID | Reference to projects table |
| `source_text` | TEXT | Original source text |
| `source_language` | TEXT | Source language code |
| `target_language` | TEXT | Target language code |
| `ai_translation` | TEXT | Original AI/MT output |
| `human_translation` | TEXT | Final human translation |
| `has_errors` | BOOLEAN | Whether segment has errors |
| `error_types` | TEXT[] | Array of error types |
| `domain` | TEXT | Domain classification |
| `quality_rating` | INTEGER | Quality rating 1-5 |
| `annotation_notes` | TEXT | Annotation notes |
| `edit_distance` | INTEGER | Edit distance metric |
| `edit_time_seconds` | INTEGER | Time spent editing |
| `translator_id` | UUID | Translator user ID |
| `annotator_id` | UUID | Annotator user ID |
| `created_at` | TIMESTAMP | Creation timestamp |
| `exported` | BOOLEAN | Export tracking flag |
| `export_date` | TIMESTAMP | When exported |

### Indexes
- `project_id` - Filter by project
- `source_language` - Filter by source language
- `target_language` - Filter by target language
- `domain` - Filter by domain
- `has_errors` - Filter error/clean data
- `quality_rating` - Filter by quality
- `created_at` - Time-based queries
- `exported` - Track export status

### Constraints
- Unique constraint on `segment_id` - One dataset entry per segment

---

## Row Level Security (RLS)

### Annotations
- **SELECT**: Users can view annotations for projects they're involved in
- **INSERT**: Users can create annotations for their project segments
- **UPDATE**: Users can only update their own annotations

### Post-edits
- **SELECT**: Users can view post-edits for their projects
- **INSERT**: Users can create post-edits for their segments
- **UPDATE**: Users can only update their own post-edits

### Dataset Logs
- **SELECT**: Admin only (Agencies or rmali@live.com)
- **INSERT**: System can insert (no user restriction)
- **UPDATE**: Admin only

---

## Data Flow

### 1. Translation Workflow
```
Segment created → AI translation generated → Translator edits → Save
```

### 2. Annotation Workflow
```
Translator/Reviewer opens segment → Adds error tags → Selects domain → Saves annotation
```

### 3. Dataset Capture (Automatic)
```
On segment save:
  1. Check if post_edit exists → Update or create
  2. Check if annotation exists → Include in dataset_logs
  3. Create/update dataset_logs entry with all data
```

### 4. Export Workflow
```
Admin opens Dataset Management → Filters data → Exports CSV/JSON/Parquet → Marks as exported
```

---

## Export Format Examples

### CSV Export
```csv
source_text,source_language,target_language,ai_translation,human_translation,domain,quality_rating,error_types,has_errors
"Hello world","en","es","Hola mundo","Hola mundo","General",5,"[]",false
"Legal document","en","es","Documento legal","Documento jurídico","Legal",4,"[terminology]",true
```

### JSON Export
```json
[
  {
    "source_text": "Hello world",
    "source_language": "en",
    "target_language": "es",
    "ai_translation": "Hola mundo",
    "human_translation": "Hola mundo",
    "domain": "General",
    "quality_rating": 5,
    "error_types": [],
    "has_errors": false
  }
]
```

### Parquet Export
Binary columnar format optimized for ML training pipelines.

---

## Migration Instructions

### Run Migration in Supabase

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20240312_add_annotation_dataset_tables.sql`
3. Paste and run
4. Verify tables created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('annotations', 'post_edits', 'dataset_logs');
   ```

### Verify RLS Policies
```sql
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('annotations', 'post_edits', 'dataset_logs');
```

---

## Next Steps

- ✅ Phase 1: Database Schema (COMPLETE)
- ⏳ Phase 2: Add Annotation UI to CAT Workspace
- ⏳ Phase 3: Auto Dataset Capture on Save
- ⏳ Phase 4: Dataset Management Dashboard
- ⏳ Phase 5: Export Functionality

---

## Notes

- All timestamps are in UTC
- Error types are stored as arrays for flexible querying
- Domain field is free-text but should use standard values
- Quality ratings use 1-5 scale (1=poor, 5=excellent)
- Edit distance uses Levenshtein algorithm (optional)
- Export tracking prevents duplicate exports
