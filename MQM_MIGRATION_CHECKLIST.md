# 🗄️ MQM Database Migration Checklist

## 📋 **PRE-MIGRATION CHECKLIST**

### ✅ **Step 1: Backup Database**
- [ ] Create a backup of your Supabase database
- [ ] Verify backup is accessible and complete
- [ ] Note current annotation count: `SELECT COUNT(*) FROM annotations;`

### ✅ **Step 2: Check Current Status**
- [ ] Run `check_migration_status.sql` to see current state
- [ ] Verify annotations table exists and is accessible
- [ ] Check if any MQM columns already exist

## 🚀 **MIGRATION EXECUTION**

### ✅ **Step 3: Apply MQM Fields Migration**
```sql
-- Run this in Supabase SQL Editor:
-- File: supabase/migrations/20240313_add_mqm_fields.sql
```
- [ ] Execute the MQM fields migration
- [ ] Verify no errors occurred
- [ ] Check that `mqm_errors` and `mqm_score` columns were added

### ✅ **Step 4: Apply MQM Functions Migration**
```sql
-- Run this in Supabase SQL Editor:
-- File: supabase/migrations/20240313_add_mqm_functions.sql
```
- [ ] Execute the MQM functions migration
- [ ] Verify all 4 functions were created successfully
- [ ] Test function permissions for authenticated users

### ✅ **Step 5: Verify Migration Success**
- [ ] Run `check_migration_status.sql` again
- [ ] Confirm all MQM columns exist
- [ ] Confirm all MQM indexes were created
- [ ] Confirm all MQM functions are available

## 🧪 **POST-MIGRATION TESTING**

### ✅ **Step 6: Test MQM Functionality**
- [ ] Run `test_mqm_migration.sql` to test database operations
- [ ] Verify sample MQM data can be inserted
- [ ] Verify MQM data can be queried correctly
- [ ] Test MQM statistics functions

### ✅ **Step 7: Test Application Integration**
- [ ] Open CAT workspace in browser
- [ ] Navigate to Annotation tab
- [ ] Enable MQM evaluation in Admin settings
- [ ] Test adding MQM errors in annotation interface
- [ ] Verify MQM score calculation works
- [ ] Test saving and loading MQM annotations

### ✅ **Step 8: Performance Verification**
- [ ] Check query performance on annotations table
- [ ] Verify indexes are being used (run EXPLAIN ANALYZE)
- [ ] Test with multiple annotations and MQM data
- [ ] Monitor database performance metrics

## 📊 **PRODUCTION READINESS**

### ✅ **Step 9: Data Validation**
- [ ] Verify existing annotations are unaffected
- [ ] Test annotation saving/loading workflow
- [ ] Confirm MQM data persists correctly
- [ ] Validate MQM score calculations

### ✅ **Step 10: User Access Testing**
- [ ] Test with different user roles (Translator, Reviewer, Admin)
- [ ] Verify RLS policies work correctly
- [ ] Test annotation permissions
- [ ] Confirm MQM data is properly isolated per user/project

## 🎉 **MIGRATION COMPLETE**

### ✅ **Step 11: Update Roadmap**
- [ ] Mark "Database Migration for MQM" as ✅ COMPLETE
- [ ] Update roadmap status to reflect MQM system is production-ready
- [ ] Plan next development phase (Analytics Dashboard recommended)

---

## 🚨 **ROLLBACK PLAN** (If Issues Occur)

If any issues arise during migration:

1. **Stop immediately** - Don't continue with broken state
2. **Restore from backup** - Use the backup created in Step 1
3. **Investigate issue** - Check error logs and migration scripts
4. **Fix and retry** - Correct the issue and re-run migration

---

## 📞 **SUPPORT COMMANDS**

### Check Migration Status:
```sql
-- Run in Supabase SQL Editor
\i check_migration_status.sql
```

### Test MQM Functionality:
```sql
-- Run in Supabase SQL Editor  
\i test_mqm_migration.sql
```

### Get MQM Statistics:
```sql
-- After migration is complete
SELECT * FROM get_mqm_statistics();
```

---

## 🎯 **EXPECTED RESULTS**

After successful migration:
- ✅ `annotations` table has `mqm_errors` (JSONB) and `mqm_score` (INTEGER) columns
- ✅ MQM indexes are created for performance
- ✅ 4 MQM helper functions are available
- ✅ MQM evaluation works in CAT workspace annotation interface
- ✅ MQM data saves and loads correctly
- ✅ Ready to proceed with Analytics Dashboard development

---

**Estimated Time**: 1-2 hours  
**Risk Level**: LOW (non-destructive, adds new columns only)  
**Rollback Time**: 15 minutes (if backup restore needed)