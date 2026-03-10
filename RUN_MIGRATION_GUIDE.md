# Database Migration Guide - Add Context Column

## Issue
The website translation feature needs a `context` column in the `segments` table to store metadata about each segment (type, page URL, etc.).

## Error Message
```
Could not find the 'context' column of 'segments' in the schema cache
```

## Solution

### Option 1: Run Migration via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste this SQL:

```sql
-- Add context column to segments table for storing metadata
ALTER TABLE segments 
ADD COLUMN IF NOT EXISTS context JSONB DEFAULT '{}'::jsonb;

-- Add index for better query performance on context
CREATE INDEX IF NOT EXISTS idx_segments_context ON segments USING gin (context);

-- Add comment
COMMENT ON COLUMN segments.context IS 'JSON metadata about the segment including type, page URL, and other contextual information';
```

6. Click "Run" or press Ctrl+Enter
7. You should see "Success. No rows returned"

### Option 2: Run Migration via Supabase CLI

If you have Supabase CLI installed:

```bash
# Navigate to your project directory
cd C:\Glossa

# Run the migration
supabase db push

# Or apply specific migration
supabase migration up
```

### Option 3: Manual SQL Execution

If you have direct database access:

```sql
ALTER TABLE segments ADD COLUMN IF NOT EXISTS context JSONB DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_segments_context ON segments USING gin (context);
```

## Verification

After running the migration, verify it worked:

```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'segments' AND column_name = 'context';

-- Should return:
-- column_name | data_type
-- context     | jsonb
```

## What This Column Does

The `context` column stores JSON metadata for each segment:

```json
{
  "type": "heading",
  "pageUrl": "https://example.com/about",
  "pageTitle": "About Us",
  "metadata": {
    "level": "h1"
  }
}
```

This allows the system to:
- Track which page each segment came from
- Store segment type (heading, paragraph, button, meta tag, etc.)
- Preserve additional metadata for reconstruction
- Enable better filtering and organization

## Fallback Behavior

The code now includes a fallback:
- If `context` column exists: Stores full JSON metadata
- If `context` column doesn't exist: Stores basic info in `notes` field
- Website translation will work either way, but with less metadata

## After Migration

Once the migration is complete:
1. Refresh your Glossa application
2. Try the website translation feature again
3. The error should be gone
4. Segments will now include full metadata

## Troubleshooting

### Error: "permission denied"
- Make sure you're logged in as the database owner
- Check your Supabase project permissions

### Error: "column already exists"
- The migration has already been run
- You can safely ignore this error

### Still getting the error?
- Clear your browser cache
- Refresh the Supabase schema cache
- Wait a few minutes for changes to propagate

## Migration File Location

The migration file is located at:
```
supabase/migrations/20240309_add_context_column_to_segments.sql
```

## Need Help?

If you encounter issues:
1. Check Supabase logs in the Dashboard
2. Verify your database connection
3. Ensure you have the correct permissions
4. Contact Supabase support if needed

---

**Status:** Migration ready to run
**Priority:** High (required for website translation feature)
**Impact:** Adds one column to segments table (non-breaking change)
