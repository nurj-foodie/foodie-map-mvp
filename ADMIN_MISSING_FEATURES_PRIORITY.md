# 🚨 Admin Dashboard - Missing Features Priority List

**Date:** 11 November 2025  
**Status:** Review Complete - Implementation Plan Needed

---

## 🔴 **CRITICAL - Must Implement Before Beta**

### **1. Restaurant Edit Review Dashboard** 🔴 **HIGHEST PRIORITY**

**Why Critical:**
- Users can submit restaurant edits (photos, hours, name, closed status)
- Edits are stored in `restaurant_edits` collection with `status: 'pending'`
- **NO ADMIN INTERFACE EXISTS** to review these edits
- Edits will accumulate and never be processed

**What's Needed:**
- New tab: "✏️ Restaurant Edits"
- List pending edits from `restaurant_edits` collection
- Show original data vs proposed changes (side-by-side comparison)
- Approve → Apply changes to `eateries` document, set `status: 'approved'`
- Reject → Set `status: 'rejected'`, add rejection reason
- Filter by status (pending, approved, rejected)
- Show edit type (photos, hours, name, closed)
- Show user who submitted edit
- Show submission date

**Technical Requirements:**
- Query `restaurant_edits` collection where `status == 'pending'`
- Display edit details with before/after comparison
- On approve: Update `eateries` document with proposed changes
- On reject: Update edit document status
- Award points already handled (5 XP per edit)

**Estimated Effort:** Medium (2-3 hours)

---

### **2. Review Moderation Dashboard** 🔴 **HIGH PRIORITY**

**Why Critical:**
- Users can submit reviews via `AddReviewModal`
- Reviews stored in `reviews` collection with `verified: false`
- **NO ADMIN INTERFACE EXISTS** to verify reviews
- Reviews display but remain unverified forever

**What's Needed:**
- New tab: "📝 Review Moderation"
- List unverified reviews from `reviews` collection
- Show review details (rating, comment, user, restaurant, photos)
- Approve → Set `verified: true`
- Reject → Delete or mark as inappropriate
- Bulk actions (approve/reject multiple)
- Filter by restaurant, user, date
- Search reviews

**Technical Requirements:**
- Query `reviews` collection where `verified == false`
- Display review details with restaurant context
- On approve: Update `verified: true`
- On reject: Delete review or mark as inappropriate
- Bulk operations for efficiency

**Estimated Effort:** Medium (2-3 hours)

---

## 🟡 **MEDIUM PRIORITY - Nice to Have**

### **3. Route Analytics Dashboard** 🟡

**What's Needed:**
- New tab: "🗺️ Route Analytics"
- Most searched routes (city pairs)
- Route popularity metrics
- Average routes per user
- Route save/load statistics
- Popular route combinations
- Route discovery trends

**Data Sources:**
- `saved_routes` collection
- Route search analytics from `analytics` collection
- Route pre-population data

**Estimated Effort:** Medium (2-3 hours)

---

### **4. Heat Map Visualization** 🟡

**What's Needed:**
- New tab: "🗺️ Heat Map"
- Geographic heat map overlay on Google Maps
- Show check-in activity
- Show route searches
- Show user activity density
- Filter by date range
- Filter by activity type
- Interactive map with markers/clusters

**Technical Requirements:**
- Google Maps integration
- Heat map library (e.g., Google Maps Heatmap Layer)
- Aggregate check-in data by location
- Aggregate route searches by location
- Visual representation with color intensity

**Estimated Effort:** High (4-5 hours)

---

## 🟢 **LOW PRIORITY - Future Enhancement**

### **5. User Management Dashboard** 🟢

**What's Needed:**
- New tab: "👥 User Management"
- User list with search/filter
- User detail view:
  - Profile information
  - Activity history
  - Routes, favorites, reviews count
  - Gamification stats (points, level, badges)
  - Account status
- User actions:
  - Suspend user
  - Ban user
  - Promote to admin (future)
  - View user activity timeline

**Data Sources:**
- `users` collection
- `userPoints` collection
- `saved_routes` collection
- `favorites` collection
- `reviews` collection

**Estimated Effort:** High (4-5 hours)

---

## 📋 **Implementation Priority Order**

1. 🔴 **Restaurant Edit Review** (Critical - blocks user submissions)
2. 🔴 **Review Moderation** (Critical - blocks review verification)
3. 🟡 **Route Analytics** (Medium - useful insights)
4. 🟡 **Heat Map** (Medium - visual appeal)
5. 🟢 **User Management** (Low - can wait)

---

## 🎯 **Recommended Implementation Plan**

### **Phase 1: Critical Features (Before Beta)**
1. Restaurant Edit Review Dashboard
2. Review Moderation Dashboard

### **Phase 2: Analytics Enhancements (Post-Beta)**
3. Route Analytics Dashboard
4. Heat Map Visualization

### **Phase 3: User Management (Future)**
5. User Management Dashboard

---

## 📝 **Notes**

- Current dashboard has 5 tabs (all working)
- Missing 2 critical features for content moderation
- Missing 3 nice-to-have features for analytics
- All missing features are well-defined and can be implemented

---

**Last Updated:** 11 November 2025

