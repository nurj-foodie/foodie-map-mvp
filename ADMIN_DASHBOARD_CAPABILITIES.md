# 📊 Admin Dashboard - Complete Capabilities Overview

**Date:** 11 November 2025  
**Status:** Current Implementation Review  
**Purpose:** Document all admin capabilities, roles, and actions for mobile on-the-go review

---

## 🔐 **Admin Access & Authentication**

### **Login Requirements:**
- ✅ Admin must be logged in with Firebase Auth (Google OAuth or Email/Password)
- ✅ Admin email must be in environment variables (`REACT_APP_ADMIN_EMAIL_1/2/3`)
- ✅ Admin must enter admin password (from `REACT_APP_ADMIN_PASSWORD_1/2/3`)
- ✅ Session stored in localStorage (24-hour timeout)
- ✅ Auto-logout after session expires

### **Admin Configuration:**
- Supports up to 3 admin users via environment variables
- Each admin can have custom role (`REACT_APP_ADMIN_ROLE_1/2/3`)
- Admin names configurable (`REACT_APP_ADMIN_NAME_1/2/3`)

---

## 📊 **Current Admin Dashboard Tabs**

### **1. 📊 Overview Tab**
**Purpose:** Quick snapshot of key metrics

**Metrics Displayed:**
- 💰 **Total Cost** (RM) - Real-time API costs
- 👥 **Active Users** - Total unique users
- 💾 **Cache Hit Rate** (%) - Percentage of cached requests
- ⚡ **Error Rate** (%) - System error percentage

**Charts:**
- 📊 **Cost Breakdown by API Type** - Visual breakdown of costs
  - Google Directions
  - Google Places
  - Google Distance Matrix
  - Google Geocoding
- 📈 **Daily Cost Trend** - Cost trends over time

**Update Frequency:** Every 30 seconds (real-time)

---

### **2. 💰 Cost Analytics Tab**
**Purpose:** Detailed API cost analysis

**Summary Cards:**
- Total Cost (RM)
- Total Requests
- Cache Hit Rate (%)
- Cached Requests

**Detailed Tables:**
- **Cost by API Type:**
  - API Type
  - Requests count
  - Cost (RM)
  - Percentage of total
- **Top Users by Cost:**
  - User ID
  - Requests count
  - Cost (RM)
  - Percentage of total
  - (Top 10 users)

**Use Cases:**
- Identify high-cost API calls
- Find users generating most costs
- Monitor cache effectiveness
- Budget planning

---

### **3. 👤 User Behavior Tab**
**Purpose:** User engagement and activity analysis

**Summary Cards:**
- Total Users
- Total Sessions
- Average Session Duration (minutes)

**Detailed Tables:**
- **Most Used Features:**
  - Feature name
  - Usage count
  - Percentage of total
  - Features tracked: route_planning, restaurant_search, favorites, admin_dashboard
- **Geographic Distribution:**
  - Country
  - User count
  - Percentage

**Use Cases:**
- Understand user engagement
- Identify popular features
- Geographic user distribution
- Session duration analysis

---

### **4. ⚡ System Performance Tab**
**Purpose:** System health and performance monitoring

**Summary Cards:**
- Average Response Time (ms)
- Error Rate (%)
- Total Requests
- Failed Requests

**Detailed Tables:**
- **Performance by Endpoint:**
  - Endpoint name
  - Requests count
  - Average response time (ms)
  - Errors count
  - Error rate (%)
- **Error Types:**
  - Error type (e.g., ZERO_RESULTS, INVALID_REQUEST)
  - Count
  - Percentage

**Use Cases:**
- Monitor system health
- Identify slow endpoints
- Track error patterns
- Performance optimization

---

### **5. 🍽️ Restaurant Review Tab**
**Purpose:** Review and approve/reject restaurant submissions

**Current Features:**
- ✅ View pending restaurant submissions
- ✅ Filter by status: All, Pending Review, Approved, Rejected
- ✅ View submission details (modal):
  - Basic info (name, address, cuisine, halal status, price level, phone, website)
  - Description
  - Submitted photos (Base64)
  - Submission metadata (submitted by, submitted at, reviewed at, rejection reason)
- ✅ Approve submissions
- ✅ Reject submissions (with reason)
- ✅ Override rejected submissions (approve rejected ones)

**Status Badges:**
- 🟡 Pending Review (yellow)
- 🟢 Approved (green)
- 🔴 Rejected (red)

**Actions Available:**
- ✅ Approve → Sets `status: 'approved'`, `verified: true`
- ✅ Reject → Sets `status: 'rejected'`, `verified: false`, adds rejection reason
- ✅ View Details → Opens modal with full submission info

**Limitations:**
- Only reviews restaurant **submissions** (new restaurants added by users)
- Does NOT review restaurant **edits** (changes to existing restaurants)
- Does NOT review user **reviews** (restaurant reviews)

---

## ❌ **MISSING Admin Features (Not Yet Implemented)**

### **1. Restaurant Edit Review** ⚠️ **CRITICAL**
**Status:** ❌ **NOT IMPLEMENTED**

**What's Missing:**
- Admin dashboard to review pending restaurant edits from `restaurant_edits` collection
- Approve/reject edits submitted via `EditRestaurantModal`
- Apply approved edits to restaurant documents in `eateries` collection

**Edit Types That Need Review:**
- 📸 **Photos** - New photos added by users
- 🕐 **Operating Hours** - Changes to opening hours
- 📝 **Name** - Restaurant name changes
- 🚫 **Closed Status** - Marking restaurants as permanently closed

**Current Flow:**
1. User submits edit → Stored in `restaurant_edits` with `status: 'pending'`
2. ❌ **NO ADMIN INTERFACE** to review these edits
3. Edits remain pending forever

**Required Implementation:**
- New tab: "✏️ Restaurant Edits"
- List pending edits from `restaurant_edits` collection
- Show original data vs proposed changes (side-by-side comparison)
- Approve → Apply changes to `eateries` document, set `status: 'approved'`
- Reject → Set `status: 'rejected'`, add rejection reason

---

### **2. Review Moderation** ⚠️ **CRITICAL**
**Status:** ❌ **NOT IMPLEMENTED**

**What's Missing:**
- Admin dashboard to review user-submitted reviews
- Approve/reject reviews (currently all reviews marked `verified: false`)
- Filter inappropriate content
- Verify review authenticity

**Current Flow:**
1. User submits review → Stored in `reviews` with `verified: false`
2. ❌ **NO ADMIN INTERFACE** to verify reviews
3. Reviews display but remain unverified

**Required Implementation:**
- New tab: "📝 Review Moderation"
- List unverified reviews from `reviews` collection
- Show review details (rating, comment, user, restaurant, photos)
- Approve → Set `verified: true`
- Reject → Delete or mark as inappropriate
- Bulk actions (approve/reject multiple)

---

### **3. Route Analytics** ⚠️ **MISSING**
**Status:** ❌ **NOT IMPLEMENTED**

**What's Missing:**
- Analytics on route searches
- Popular routes analysis
- Route usage patterns
- Route discovery metrics

**Required Data:**
- Most searched routes
- Route popularity by city pairs
- Average routes per user
- Route save/load statistics

---

### **4. Heat Map Visualization** ⚠️ **MISSING**
**Status:** ❌ **NOT IMPLEMENTED**

**What's Missing:**
- Geographic heat map of:
  - Restaurant check-ins
  - Route searches
  - User activity
  - Popular locations
- Visual representation on map
- Interactive map with markers/clusters

**Required Implementation:**
- Map component with Google Maps
- Heat map overlay
- Filter by date range
- Filter by activity type
- Export heat map data

---

### **5. User Management** ⚠️ **MISSING**
**Status:** ❌ **NOT IMPLEMENTED**

**What's Missing:**
- View all users
- User activity history
- User statistics (routes, favorites, reviews, points)
- Suspend/ban users
- User role management

**Required Features:**
- User list with search/filter
- User detail view
- Activity timeline
- Gamification stats
- Admin actions (suspend, ban, promote to admin)

---

### **6. Analytics Export** ⚠️ **PARTIALLY IMPLEMENTED**
**Status:** ⚠️ **BASIC IMPLEMENTATION**

**Current:**
- ✅ CSV export (basic)
- ✅ PDF export (print HTML)

**Missing:**
- Excel export (.xlsx)
- JSON export
- Scheduled reports
- Email reports
- Custom report builder

---

## 📱 **Mobile Optimization Status**

### **Current Mobile Support:**
- ⚠️ **PARTIAL** - Dashboard works on mobile but not optimized
- Tables may be hard to read on small screens
- Date range selector may be cramped
- Export buttons may be small

### **Required Mobile Improvements:**
- ✅ Responsive tables (horizontal scroll or card view)
- ✅ Touch-friendly buttons (larger tap targets)
- ✅ Swipeable tabs
- ✅ Collapsible sections
- ✅ Mobile-optimized modals
- ✅ Quick actions (swipe to approve/reject)
- ✅ Pull-to-refresh
- ✅ Offline support (cache data)

---

## 🎯 **Admin Must-Do Actions**

### **Daily Tasks:**
1. ✅ **Review Restaurant Submissions** (Current)
   - Check pending submissions
   - Approve/reject new restaurants
   - Verify restaurant information

2. ❌ **Review Restaurant Edits** (Missing)
   - Check pending edits
   - Verify proposed changes
   - Apply approved edits

3. ❌ **Moderate Reviews** (Missing)
   - Review user-submitted reviews
   - Verify review authenticity
   - Remove inappropriate content

4. ✅ **Monitor Analytics** (Current)
   - Check cost trends
   - Monitor system performance
   - Review user behavior

### **Weekly Tasks:**
1. ✅ **Export Reports** (Current)
   - Generate cost reports
   - Export analytics data

2. ❌ **Review Heat Maps** (Missing)
   - Analyze geographic activity
   - Identify popular areas

3. ❌ **User Management** (Missing)
   - Review user activity
   - Handle user issues

---

## 🔧 **Technical Implementation Details**

### **Collections Used:**
- `analytics` - API usage, user behavior, system performance
- `eateries` - Restaurant submissions (status: pending_review/approved/rejected)
- `restaurant_edits` - Pending restaurant edits (status: pending/approved/rejected)
- `reviews` - User reviews (verified: true/false)
- `users` - User profiles
- `saved_routes` - User saved routes

### **Services Used:**
- `analyticsService` - Analytics data aggregation
- `restaurantEditService` - Restaurant edit operations
- `reviewsService` - Review operations
- `adminAuth` - Admin authentication

### **Real-Time Updates:**
- Analytics refresh every 30 seconds
- Manual refresh button available
- Date range filtering

---

## 📋 **Priority Implementation List**

### **High Priority (Critical for Beta):**
1. 🔴 **Restaurant Edit Review Dashboard**
   - Review pending edits
   - Approve/reject with side-by-side comparison
   - Apply approved edits to restaurants

2. 🔴 **Review Moderation Dashboard**
   - Review unverified reviews
   - Approve/reject reviews
   - Bulk actions

### **Medium Priority:**
3. 🟡 **Route Analytics**
   - Popular routes
   - Route usage patterns

4. 🟡 **Mobile Optimization**
   - Responsive tables
   - Touch-friendly UI
   - Mobile-optimized modals

### **Low Priority:**
5. 🟢 **Heat Map Visualization**
   - Geographic activity maps
   - Interactive visualization

6. 🟢 **User Management**
   - User list and details
   - User actions

---

## 📝 **Notes for Next Session**

1. **Restaurant Edit Review** is the highest priority - users can submit edits but admins can't review them
2. **Review Moderation** is also critical - reviews are unverified and need admin approval
3. **Mobile optimization** needed for on-the-go admin access
4. Current dashboard focuses on analytics, but needs content moderation features

---

**Last Updated:** 11 November 2025  
**Next Review:** Admin Tab Review Session

