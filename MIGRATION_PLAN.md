# 🔄 Database Migration Plan
## Converting 1,867 Eateries to Structured Schema

**Date:** 8 November 2025  
**Total Eateries:** 1,887  
**Need Migration:** 1,867 (99%)  
**Already Structured:** 20 (1%)

---

## 📊 CURRENT STATE

### **Database Analysis Results:**

- **Total Eateries:** 1,887
- **Structured (no migration):** 20 (1%)
- **Needs Migration:** 1,867 (99%)

### **Field Name Distribution:**
- `placeId` (camelCase): 92% ✅
- `place_id` (snake_case): 8% ⚠️
- `userRatingTotal`: 4% ⚠️
- `userRatingCount`: 8% ⚠️

### **Nested Maps Distribution:**
- `analytics`: 40% have it
- `business`: 40% have it
- `contact`: 40% have it
- `metadata`: 40% have it
- `socialMedia`: 0% have it

### **Structure Type:**
- **Structured (nested maps):** 40%
- **Flat (top-level only):** 60%

---

## 🎯 MIGRATION GOALS

1. **Standardize Field Names:**
   - `place_id` → `placeId` (keep both during transition)
   - `userRatingCount` → `userRatingTotal` (keep both during transition)

2. **Add Nested Maps:**
   - `analytics` - User engagement metrics
   - `business` - Business features and status
   - `contact` - Contact information
   - `socialMedia` - Social media links
   - `metadata` - Data source and quality info

3. **Extract Missing Fields:**
   - `cuisineCategory` - From types array
   - `cuisineType` - From types array
   - `cuisineTags` - From types array
   - `halalStatus` - From types/name (if missing)

4. **Preserve Existing Data:**
   - Keep all existing fields
   - Don't overwrite user-generated content
   - Maintain timestamps

---

## 🚀 MIGRATION STRATEGY

### **Phase 1: Update Auto-Population (COMPLETE ✅)**

**Status:** ✅ Done  
**What:** Updated `firestoreSearchService.saveToFirestore()` to use structured schema  
**Impact:** All NEW restaurants will use structured schema

---

### **Phase 2: Create Migration Script (COMPLETE ✅)**

**Status:** ✅ Done  
**File:** `scripts/migrateEateriesToStructuredSchema.mjs`  
**What:** Script to migrate existing 1,867 eateries

**Features:**
- ✅ Batch processing (500 docs per batch)
- ✅ Skips already-structured documents
- ✅ Preserves existing data
- ✅ Adds missing nested maps
- ✅ Extracts cuisine/halal info
- ✅ Updates field names
- ✅ Error handling and logging

---

### **Phase 3: Test Migration (RECOMMENDED)**

**Before running on all data:**

1. **Test on Sample:**
   ```bash
   # Modify script to limit to 10 documents for testing
   node scripts/migrateEateriesToStructuredSchema.mjs
   ```

2. **Verify Results:**
   - Check migrated documents in Firestore console
   - Verify nested maps are created
   - Verify field names are updated
   - Verify no data loss

3. **Check for Errors:**
   - Review error logs
   - Fix any issues
   - Re-run on sample

---

### **Phase 4: Run Full Migration**

**When Ready:**

1. **Backup Database (RECOMMENDED):**
   ```bash
   # Export Firestore data
   firebase firestore:export gs://your-bucket/backup-$(date +%Y%m%d)
   ```

2. **Run Migration:**
   ```bash
   node scripts/migrateEateriesToStructuredSchema.mjs
   ```

3. **Monitor Progress:**
   - Script logs progress every 500 documents
   - Watch for errors
   - Estimated time: 5-10 minutes for 1,867 documents

4. **Verify Results:**
   - Check total migrated count
   - Spot-check random documents
   - Verify nested maps exist
   - Verify field names are correct

---

## 📋 MIGRATION CHECKLIST

### **Pre-Migration:**
- [x] Update auto-population to structured schema
- [x] Create migration script
- [ ] Test migration on sample (10 documents)
- [ ] Verify sample results
- [ ] Backup database (recommended)

### **Migration:**
- [ ] Run migration script
- [ ] Monitor progress
- [ ] Check for errors
- [ ] Verify migration count

### **Post-Migration:**
- [ ] Verify random documents
- [ ] Check nested maps exist
- [ ] Verify field names updated
- [ ] Test queries work correctly
- [ ] Update query code if needed
- [ ] Remove backward compatibility code (later)

---

## ⚠️ RISKS & MITIGATION

### **Risk 1: Data Loss**
**Mitigation:**
- Script only ADDS fields, doesn't delete
- Preserves all existing data
- Backup database before migration

### **Risk 2: Performance Impact**
**Mitigation:**
- Batch processing (500 docs per batch)
- Can run during off-peak hours
- Firestore handles batch writes efficiently

### **Risk 3: Schema Conflicts**
**Mitigation:**
- Script checks if already structured (skips)
- Handles both `place_id` and `placeId`
- Preserves existing nested maps

### **Risk 4: Field Extraction Errors**
**Mitigation:**
- Defaults to safe values
- Logs errors for review
- Doesn't fail entire migration on single error

---

## 🔍 VERIFICATION STEPS

### **After Migration:**

1. **Check Migration Stats:**
   ```bash
   node scripts/checkFirestoreSchema.mjs
   ```
   - Should show 100% structured
   - Should show 100% `placeId` (camelCase)
   - Should show 100% nested maps

2. **Spot-Check Documents:**
   - Open Firestore console
   - Check random documents
   - Verify nested maps exist
   - Verify field names correct

3. **Test Queries:**
   - Test search functionality
   - Test filters (halal, cuisine)
   - Test nested map queries
   - Verify no errors

---

## 📊 EXPECTED RESULTS

### **After Migration:**

- ✅ **100%** use `placeId` (camelCase)
- ✅ **100%** have nested maps (`analytics`, `business`, `contact`, `metadata`, `socialMedia`)
- ✅ **100%** have `cuisineCategory`, `cuisineType`, `cuisineTags`
- ✅ **100%** have `halalStatus` (extracted or existing)
- ✅ **100%** have `userRatingTotal`
- ✅ **0%** need migration

---

## 🎯 NEXT STEPS

1. **Test Migration (Now):**
   - Run on 10 sample documents
   - Verify results
   - Fix any issues

2. **Run Full Migration (When Ready):**
   - Backup database
   - Run migration script
   - Verify results

3. **Update Query Code (After Migration):**
   - Remove backward compatibility
   - Use consistent field names
   - Query nested maps directly

4. **Cleanup (Later):**
   - Remove `place_id` field (after verifying all use `placeId`)
   - Remove `userRatingCount` field (after verifying all use `userRatingTotal`)
   - Update indexes if needed

---

## 💡 NOTES

- **Migration is non-destructive** - only adds fields, doesn't delete
- **Can run multiple times** - script skips already-structured documents
- **Backward compatible** - code handles both schemas during transition
- **Safe to test** - test on sample first, then full migration

---

**Ready to migrate?** Start with testing on a sample, then proceed with full migration when ready!

