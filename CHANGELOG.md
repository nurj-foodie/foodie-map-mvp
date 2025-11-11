# 🗺️ KAWAN MAKAN — CHANGELOG.md

*Project timeline: 3 Oct – 11 Nov 2025*  

*Core Stack: React, Firebase Firestore, Google Maps Platform, @react-google-maps/api, TailwindCSS, Netlify/Firebase Hosting*

---

## v0.6.6 — Admin Tab Review & App Review Completion (11 Nov 2025)

**Milestone:** Complete Admin Tab review with Restaurant Edit Review, Review Moderation, and User Management dashboards. Comprehensive app review completed before beta phase.  
**Objective:** Review and enhance Admin Dashboard, implement missing admin features, fix Firestore permission issues, complete app review.

### 📦 Features Added

- 🔧 **Admin Dashboard Reorganization** – Grouped tabs for better UX
  - Main tabs: Analytics, Restaurants, Users
  - Analytics sub-tabs: Overview, Cost, User Behavior, System Performance
  - Restaurants sub-tabs: Submissions, Edits, Reviews
  - Users tab: User Management Dashboard
- ✏️ **Restaurant Edit Review Dashboard** – Complete admin workflow
  - `RestaurantEditReviewDashboard` component
  - Lists pending edits with original vs. proposed changes
  - Approve/reject functionality (single and bulk)
  - Filter by status (pending, approved, rejected, all)
  - Applies changes to restaurant documents on approval
- ⭐ **Review Moderation Dashboard** – Review moderation system
  - `ReviewModerationDashboard` component
  - Lists unverified reviews
  - Verify/delete functionality (single and bulk)
  - Filter by status (unverified, verified, all)
  - Displays review details (rating, comment, user, restaurant, photos)
- 👥 **User Management Dashboard** – Comprehensive user management
  - `UserManagementDashboard` component
  - List all users with search and filter
  - View user details and live statistics
  - Suspend, activate, ban, unban users
  - Statistics: points, routes, favorites, reviews

### 🧩 Fixes & Improvements

- ✅ **Firestore Rules Updated** – Admin access to all collections
  - Admin read/write access to `users` collection
  - Admin read access to `userPoints` collection
  - Admin read access to `favorites` collection
  - Admin read/update/delete access to `restaurant_edits` collection
  - Admin read/update/delete access to `reviews` collection
  - Consolidated `isAdmin()` function (single definition)
- ✅ **Fixed User Stats Loading** – Correct query structure
  - Fixed `loadUserStats` to read total points from document ID
  - Added individual error handling for each query
  - Improved error messages
- ✅ **Profile Photo Loading** – Reduced rate limit errors
  - Added `loading="lazy"` attribute to images
  - Added `onError` handler for graceful fallback
  - Improved placeholder display logic
- ✅ **Firestore Indexes Added** – Efficient querying
  - Added composite indexes for `restaurant_edits` collection
  - Added indexes for admin queries

### 🎯 Key Decisions Made

- **Admin Dashboard Structure:** Grouped into main tabs (Analytics, Restaurants, Users) with sub-tabs
- **Bulk Actions:** Implemented for both edit review and review moderation
- **Admin Emails:** Configured 3 admin emails in Firestore rules
- **User Statistics:** Live data from Firestore (points, routes, favorites, reviews)

### 🧩 System Design Notes

- **Edit Review Flow:** User submits → Admin reviews → Approve/Reject → Apply changes
- **Review Moderation Flow:** User submits → Admin verifies → Display publicly
- **User Management Flow:** Admin views → Manages status → Updates account

---

## v0.6.5 — User Tab & Restaurant Detail Modal Review (11 Nov 2025)

**Milestone:** Comprehensive User Tab and Restaurant Detail Modal review with profile management, Add Review and Edit Details features.  
**Objective:** Complete User Tab review (Overview, Settings, Gamification, Social), replace mock data with real Firestore queries, implement review and edit functionality, ensure user-submitted data displays correctly.

### 📦 Features Added

- 👤 **User Tab Enhancements** – Profile management and settings
  - Settings tab with profile photo upload (Base64 storage in Firestore)
  - Username change functionality
  - Fixed routes count bug (querying `saved_routes` collection)
  - Live stats display from Firestore (routes, favorites, reviews, points)
  - Gamification dashboard aligned with Beta v0.7 design
  - Point values updated: Check-in (20 XP), Photo (40 XP), Review (50 XP)
- 📝 **Add Review System** – Complete review submission workflow
  - `AddReviewModal` component with star rating and comment form
  - `reviewsService` for review CRUD operations
  - Prevents duplicate reviews (checks existing reviews)
  - Admin verification workflow (reviews marked as `verified: false`)
  - Awards 50 XP per review submission (aligned with Beta v0.7)
- ✏️ **Edit Restaurant Details** – Multi-type edit system with admin verification
  - `EditRestaurantModal` component with tabbed interface
  - `restaurantEditService` for edit submissions
  - Supports 4 edit types: Photos, Operating Hours, Name, Closed Status
  - Photo upload (Base64, multiple photos)
  - Operating hours editor (multiple periods per day)
  - Admin verification workflow (`restaurant_edits` collection)
  - Awards 5 XP per edit session (flat rate)
- 🔄 **Auto-Refresh Restaurant Data** – Modal fetches fresh data from Firestore
  - Fetches full restaurant document on modal open
  - Includes latest `userPhotos` from Firestore
  - Auto-refreshes after edits are submitted
  - Loading state while fetching
  - Fallback to provided restaurant data if Firestore fetch fails
- 📸 **Photo Display Improvements** – Better handling of photo data
  - Parses JSON strings if photos stored as strings
  - Filters invalid strings like `"[ ]"` or `"[]"`
  - Improved `getPrimaryPhotoUrl()` function
  - Handles both arrays and JSON strings
  - Displays user-submitted photos (Base64 from Firestore)

### 🧩 Fixes & Improvements

- ✅ **User Tab Fixes** – Profile management and stats display
  - Fixed routes count bug (was querying wrong collection)
  - Implemented profile photo upload (Base64 in Firestore)
  - Added username change functionality
  - Aligned gamification point values with Beta v0.7
  - All stats now display live data from Firestore
- ✅ **Replaced Mock Data** – All mock data replaced with real Firestore queries
  - Photos load from `restaurant.userPhotos` and `restaurant.photos`
  - Reviews load from `reviews` collection via `reviewsService`
  - Check-ins load from `checkIns` collection via `checkInService`
  - Real user-submitted data now displays correctly
- ✅ **Fixed Add Review Button** – Now opens modal and submits reviews
  - Created `AddReviewModal` component
  - Integrated with `reviewsService`
  - Connected to gamification system
- ✅ **Fixed Share Button** – Implemented Web Share API with clipboard fallback
  - Native share on mobile devices
  - Clipboard copy fallback for desktop
  - Handles share cancellation gracefully
- ✅ **Fixed Photo Loading** – Handles various photo storage formats
  - Parses JSON strings automatically
  - Filters invalid photo strings
  - Primary photo displays correctly
- ✅ **Fixed Infinite Render Loop** – EditRestaurantModal now renders correctly
  - Changed `useEffect` dependency to restaurant ID only
  - Used `useCallback` for fetch function
  - Proper cleanup on modal close
- ✅ **Fixed Z-Index Issues** – Modals now appear above RestaurantModal overlay
  - AddReviewModal z-index: 20000
  - EditRestaurantModal z-index: 20000
  - Proper modal layering
- ✅ **Fixed Review Points Error** – Reviews now award points correctly
  - Changed to `awardPoints(userId, 'REVIEW', metadata)`
  - Aligned with gamificationService API

### 🎯 Key Decisions Made

- **Photo Storage:** Base64 in Firestore (no Firebase Storage needed for now)
- **Review System:** Admin verification required (reviews marked `verified: false`)
- **Edit System:** Admin verification required (edits in `restaurant_edits` collection)
- **Point Values:** 50 XP for reviews, 5 XP for edits (aligned with Beta v0.7)
- **Data Fetching:** Modal fetches fresh data on open to show latest user submissions

### 🧩 System Design Notes

- **Review Flow:** User submits → Stored in `reviews` → Admin verifies → Displayed
- **Edit Flow:** User submits → Stored in `restaurant_edits` → Admin approves → Applied to restaurant
- **Photo Handling:** Supports arrays, JSON strings, and Base64 data
- **Auto-Refresh:** Modal fetches latest data on open and after edits

### 📋 Documentation Created

- ✅ `APP_REVIEW_SESSION_20251111.md` – Complete session documentation
- ✅ `RESTAURANT_MODAL_REVIEW_20251111.md` – Initial review findings (updated)

### 🧠 Lessons Learned

- Mock data should be replaced early in development
- Modal z-index hierarchy critical for nested modals
- Photo data can be stored in various formats (need robust parsing)
- Auto-fetching fresh data ensures users see latest submissions
- Admin verification workflow essential for user-generated content

---

## v0.6.4 — Favorites Tab Review & ID System Overhaul (10 Nov 2025)

**Milestone:** Comprehensive Favorites Tab review with ID system fixes and duplicate prevention.  
**Objective:** Fix favorite button state, prevent duplicates, and ensure consistent ID handling across the app.

### 📦 Features Added

- 🔧 **Automatic ID Update** – Updates old favorites with correct Google Place IDs
  - Detects favorites with Firestore document IDs
  - Automatically updates to Google Place IDs when duplicates found
  - Removes `eateryId` field to standardize on `restaurantId`
  - Seamless migration for existing favorites
- 🧹 **Duplicate Cleanup System** – Automatically removes duplicate favorites
  - Detects duplicates on favorites load
  - Keeps most recent favorite, removes older duplicates
  - Runs automatically in background
  - Prevents duplicate warnings
- 🔍 **Smart Duplicate Detection** – Name + location matching (100m radius)
  - Prevents adding same restaurant with different IDs
  - Finds duplicates even when IDs don't match
  - Updates existing favorites instead of creating new ones
- ✅ **ID Standardization** – Consistent ID handling across all components
  - Prioritizes Google Place IDs (`place_id`)
  - Validates IDs before use (must start with "ChIJ" or "temp_")
  - Ignores Firestore document IDs
  - Generates temp IDs for restaurants without Google Place IDs

### 🧩 Fixes & Improvements

- ✅ **Fixed Favorite Button State** – Button now turns red when favorited
  - Consistent ID extraction between `FavoriteButton` and `favoritesService`
  - Proper state management with `favoriteIds` Set
  - Visual feedback with CSS `!important` overrides
- ✅ **Fixed Auto-Unfavorite Issue** – No longer unfavorites wrong restaurants
  - Proper ID matching prevents conflicts
  - Soft-delete filtering prevents wrong matches
  - Consistent ID generation prevents mismatches
- ✅ **Fixed Duplicate Creation** – Prevents multiple favorites for same restaurant
  - Name + location duplicate detection
  - Auto-update existing favorites with correct IDs
  - Firestore cleanup removes duplicate documents
- ✅ **Fixed ID Extraction** – Handles all ID field variations correctly
  - Prioritizes `place_id` over `id`
  - Validates `id` before use (Google Place ID or temp ID only)
  - Ignores Firestore document IDs
  - Consistent logic across all components
- ✅ **Improved Restaurant Reconstruction** – Better handling of favorites from Firestore
  - Extracts valid Google Place IDs from `restaurantData`
  - Removes Firestore document IDs from `id` field
  - Generates temp IDs when needed
  - Ensures `place_id` is always set correctly

### 🎯 Key Decisions Made

- **ID Priority:** `place_id` → validated `id` → generated temp ID
- **Duplicate Handling:** Update existing favorites instead of creating new ones
- **Standardization:** Use `restaurantId` only, remove `eateryId` field
- **Auto-Repair:** Automatically fix old favorites with incorrect IDs
- **Cleanup Strategy:** Remove duplicates on load, keep most recent

### 🧩 System Design Notes

- **ID Extraction:** Three-tier validation (place_id → validated id → temp ID)
- **Duplicate Detection:** Haversine distance + name fuzzy matching (100m radius)
- **Auto-Update:** Updates `restaurantId` when duplicate found with different ID
- **Firestore Cleanup:** Groups by `restaurantId`, keeps most recent, deletes others
- **Backward Compatibility:** Handles both `restaurantId` and `eateryId` during migration

### 📋 Documentation Created

- ✅ `FAVORITES_TAB_FIXES_20251110.md` – Complete fixes documentation
- ✅ `SESSION_START_FAVORITES_TAB_REVIEW_20251110.md` – Review planning document

### 🧠 Lessons Learned

- Consistent ID extraction critical for state management
- Firestore document IDs should never be used as restaurant identifiers
- Auto-repair systems prevent user frustration
- Duplicate cleanup must happen at Firestore level, not just UI
- Standardization prevents future conflicts

---

## v0.6.3 — Add Restaurant Tab Review & UX Enhancements (10 Nov 2025)

**Milestone:** Comprehensive Add Restaurant tab review with major UX improvements.  
**Objective:** Enhance restaurant submission workflow with duplicate prevention, camera capture, and interactive location mapping.

### 📦 Features Added

- 🔍 **Nearby Restaurant Detection** – Automatically detects existing restaurants within 100m radius
  - Prevents duplicate submissions
  - Shows warning with list of nearby restaurants
  - Displays on first page of form
  - Triggers automatically when user location is available
- 📷 **Camera Capture** – Take photos directly with device camera
  - "Take Photo" button for regular photos
  - "Capture Menu" button for menu photos
  - Works alongside gallery selection
  - Mobile-optimized camera access
- 🗺️ **Interactive Location Map** – Pin restaurant location on interactive map
  - Replaces static "Locate Me" button in review section
  - Draggable marker for precise location pinning
  - Reverse geocoding updates address automatically
  - Visual feedback with coordinates display
  - Required validation prevents submission without location
- 📋 **Menu Photos Section** – Dedicated menu photo upload with naming
  - Separate section for menu photos
  - Custom naming for each menu item
  - Display in review section with names
  - Supports both gallery and camera capture
- ✅ **Enhanced Form Validation** – Prevents premature submission
  - Requires Step 5 (Review) before submission
  - Location pinning required (lat/lng cannot be 0)
  - Name and address required before proceeding
  - Enter key moves to next step (not submit) on earlier steps

### 🧩 Fixes & Improvements

- ✅ **Fixed Duplicate Check** – Prevents double-checking in React StrictMode
- ✅ **Fixed Form Submission** – Prevents automatic submission without review
- ✅ **Fixed Location Validation** – Requires location pinning on map
- ✅ **Improved Mobile UX** – Touch-friendly buttons, responsive layout
- ✅ **Enhanced Photo Processing** – Menu photos handled separately with naming
- ✅ **Schema Alignment** – Form data matches Firestore schema exactly
  - Nested maps (analytics, business, contact, socialMedia, metadata)
  - Operating hours format (day: 0-6, openTime: "0800", closeTime: "2200")
  - Menu photos array with names
  - All required fields properly structured

### 🎯 Key Decisions Made

- **Duplicate Prevention:** Auto-detect nearby restaurants on page load (100m radius)
- **Location Pinning:** Interactive map replaces static button for better UX
- **Camera Integration:** Both gallery and camera options for maximum flexibility
- **Menu Photos:** Separate section with naming for better organization
- **Form Flow:** Multi-step validation prevents user errors

### 🧩 System Design Notes

- **Nearby Detection:** Uses Haversine distance calculation (100m radius)
- **Location Map:** Google Maps with draggable marker and reverse geocoding
- **Photo Processing:** Client-side compression before Base64 encoding
- **Form State:** Multi-step wizard with validation at each step
- **Schema Compliance:** Matches Firestore structure exactly

### 📋 Documentation Created

- ✅ `ADD_RESTAURANT_USER_FLOW.md` – Complete user flow documentation
- ✅ `ADD_RESTAURANT_TEST_RESULTS.md` – Test results summary
- ✅ `ADD_RESTAURANT_TESTING_CHECKLIST.md` – Testing checklist
- ✅ `ADD_RESTAURANT_MOBILE_MENU_UPDATE.md` – Mobile and menu updates summary
- ✅ `FIRESTORE_SCHEMA_MENU_PHOTOS.md` – Schema confirmation for menu photos

### 🧠 Lessons Learned

- Auto-detection prevents user frustration and duplicate data
- Interactive maps provide better UX than static buttons
- Camera access improves mobile user experience
- Multi-step validation prevents submission errors
- Schema alignment critical for data consistency

---

## v0.6.2 — Search Tab Review & Keyword Learning System (8–9 Nov 2025)

**Milestone:** Comprehensive Search Tab review, intelligent keyword system, and geocoding improvements.  
**Objective:** Enhance search functionality with smart keyword recognition, compound query support, and automatic learning system.

### 📦 Features Added

- 🧠 **Keyword Learning System (The Brain)** – Automatic keyword learning from user search behavior
  - Learns locations, food items, cuisines, and meal types
  - Learns coordinates automatically from geocoding results
  - Grows with database and usage without manual intervention
  - Privacy-focused: Only learns from aggregate patterns, no personal tracking
- 🔍 **Compound Query Support** – Intelligent parsing of complex queries
  - Supports "food + location" queries (e.g., "roti canai petaling jaya")
  - Supports "cuisine + location" queries (e.g., "western johor bahru")
  - Supports "meal type + location" queries (e.g., "breakfast kluang")
  - Parses multiple keywords from single query
- 🗺️ **Geocoding First Strategy** – Improved location detection
  - Tries geocoding FIRST (like Discover tab) for better location detection
  - Works for ANY location (even unknown ones like "kluang", "tawau")
  - Automatic coordinate learning for future searches
  - Malaysia-only validation to protect API budget
- 📊 **Search Analytics System** – Track search patterns for learning
  - Tracks search queries, parsed components, result counts
  - Feeds keyword learning system
  - Privacy-focused analytics (no personal data)
- 🎨 **Enhanced Search UI** – Improved search navigation bar
  - Enhanced styling with gradients and animations
  - Better visual feedback and user experience
  - Improved mobile responsiveness

### 🧩 Fixes & Improvements

- ✅ **Fixed Parsing Order** – Food items checked before locations (prevents "nasi" matching as location in "nasi lemak")
- ✅ **Fixed Geocoding Issues** – Unknown locations now geocode correctly (kluang, tawau, semporna)
- ✅ **Added Food Prefix Detection** – Prevents geocoding food-related partial queries ("nasi ", "mee ", "roti ")
- ✅ **Added Malaysia Validation** – Only geocodes and learns Malaysia locations (protects API budget)
- ✅ **Fixed Restaurant Card Issues**:
  - Call button now checks multiple phone number fields
  - Get directions button uses place_id for direct Google Maps navigation
  - Removed eye emoji from View Details button
  - Fixed bottom navigation overlap with last result
- ✅ **Fixed Analytics Bug** – localStorage data validation (handles corrupted data gracefully)
- ✅ **Fixed Learning System** – Prevents learning food prefixes as locations
- ✅ **Improved Browse Tab** – Independent loading states for each section

### 🎯 Key Decisions Made

- **Geocoding Strategy:** Try geocoding FIRST (like Discover tab) for better location detection
- **Parsing Order:** Food items before locations (more specific matches first)
- **Learning System:** Automatic but protected (food prefix detection, Malaysia validation)
- **Budget Protection:** Malaysia-only validation prevents unnecessary API calls
- **Compound Queries:** Support natural language queries with multiple keywords

### 🧩 System Design Notes

- **Keyword Learning Service:** Analyzes search analytics, categorizes keywords, learns automatically
- **Search Analytics Service:** Tracks searches with parsed components and result counts
- **Search Keyword Service:** Provides intelligent keyword recognition and suggestions
- **Enhanced Search Service:** Orchestrates search with geocoding-first strategy
- **Coordinate Learning:** Automatically learns location coordinates from geocoding results
- **Food Prefix Protection:** Prevents geocoding and learning food-related words

### 📋 Documentation Created

- ✅ `SEARCH_TAB_REVIEW_COMPLETE.md` – Complete review summary
- ✅ `KEYWORD_SEARCH_CHALLENGES.md` – Why keyword search is tricky
- ✅ `GEOCODING_FIRST_IMPLEMENTATION.md` – Geocoding strategy implementation
- ✅ `GEOCODING_FIRST_IMPACT_ANALYSIS.md` – Impact analysis
- ✅ `DISCOVER_VS_SEARCH_GEOCODING.md` – Comparison with Discover tab
- ✅ `KEYWORD_BRAIN_LOCATION_LEARNING.md` – Learning system details
- ✅ `MALAYSIA_ONLY_VALIDATION.md` – Budget protection details
- ✅ `GEOCODING_FIRST_FIXES_SUMMARY.md` – All fixes summary
- ✅ `SESSION_SUMMARY_SEARCH_TAB_REVIEW_20251108-09.md` – Session summary

### 🧠 Lessons Learned

- Keyword search is complex – ambiguity, parsing order, and edge cases require careful handling
- Geocoding needs validation – can return wrong results, needs Malaysia-only check
- Learning system needs safeguards – can learn wrong things without proper protection
- Order matters – food items before locations, longer matches before shorter
- Budget protection is critical – Malaysia-only validation prevents unnecessary API calls

---

## v0.6.1 — App Review & Quality Improvements (6–8 Nov 2025)

**Milestone:** Comprehensive app review, bug fixes, and UX enhancements.  
**Objective:** Ensure app quality meets founder standards and fix all identified issues.

### 📦 Features Added

- 🛣️ **R&R Stops Integration** – Search and display rest stops along routes (5km/30min threshold)
- ⛽ **Petrol Station Integration** – Search and display petrol stations along routes (5km/15min threshold)
- 📚 **Saved Routes in FavoritesTab** – Tabbed interface for Favorites and Saved Routes
- 🗺️ **Firestore Location Index** – Autocomplete system that learns from user searches
- 🎯 **Place Type Tabs** – Filter results by All, Restaurants, R&R, or Petrol stations
- 🎨 **Enhanced Markers** – Custom emoji markers with colored backgrounds for better visibility

### 🧩 Fixes & Improvements

- ✅ **Fixed Google Maps Loading** – Proper API key injection and IP restriction handling
- ✅ **Fixed Polyline Rendering** – Normalized storage format and added coordinate validation
- ✅ **Fixed Map Element Timing** – Added retry mechanism for DOM element access
- ✅ **Improved Restaurant Filtering** – OR logic (distance <= 5km OR duration <= 30min)
- ✅ **Fixed Deprecated API Properties** – Updated to use `isOpen()` and `utc_offset_minutes`
- ✅ **Fixed NEW Places API Viewport** – Added robust null checks for viewport properties
- ✅ **Added 100km Safety Filter** – Prevents far-away places from appearing in results
- ✅ **Removed Debug UI** – Cleaned up status-info section from RouteResults
- ✅ **Reduced Verbose Logging** – Optimized console output for better performance
- ✅ **Haversine-First Approach** – Cost optimization by using free Haversine before Distance Matrix API

### 🎯 Key Decisions Made

- **R&R & Petrol Integration:** Separate place types with different filtering thresholds
- **Saved Routes Access:** Tabbed interface in FavoritesTab for better UX
- **Location Autocomplete:** Firestore-first approach with Google Places fallback
- **Filtering Logic:** OR-based (distance OR duration) for "quick detour" functionality
- **Safety Thresholds:** 100km maximum distance to prevent edge cases

### 🧩 System Design Notes

- **Place Search Service:** Unified service for R&R stops and petrol stations
- **Brand Detection:** Automatic brand extraction for petrol stations (Petronas, Shell, BHP, etc.)
- **Data Serialization:** Comprehensive serialization to remove Google Maps objects before Firestore save
- **Operating Hours:** Proper serialization of `periods` array to match Firestore schema
- **Route Caching:** Enhanced to include all place types (restaurants, R&R, petrol)

### 📋 Documentation Created

- ✅ `APP_REVIEW_CHECKLIST.md` – Comprehensive review checklist
- ✅ `APP_REVIEW_SESSION_20251106.md` – Detailed session tracking
- ✅ `FAVORITES_TAB_ROUTES_PLAN.md` – Saved routes integration plan
- ✅ `RR_AND_PETROL_IMPLEMENTATION_SPEC.md` – R&R and petrol implementation details

### 🧠 Lessons Learned

- Always check IP restrictions when Google Maps fails to load
- Firestore-first autocomplete reduces API costs and improves UX
- OR-based filtering provides better "quick detour" experience
- Comprehensive serialization prevents Firestore errors
- Tabbed interfaces improve navigation for related features
- Safety thresholds prevent edge cases from breaking UX

---

## v0.6 — Gamification System Design (5 Nov 2025)

**Milestone:** Complete gamification system design and documentation.  
**Objective:** Design comprehensive gamification system for beta testing and post-beta launch.

### 📦 Features Designed

- 🎮 **Complete Gamification System** – Beta (v0.7) and post-beta (v1.0+) designs
- 🏆 **Badge System** – Multi-tier progression (Explorer I-VII, Memory Keeper, Food Critic, Local Hero, Treasure Hunter)
- 💎 **Special Perks** – Founder Tier and Beta Tester exclusive perks
- 🎁 **Tangible Rewards** – Physical merchandise, events, and future discounts
- 💰 **Founder Pass** – RM100 pricing (500 lots) with complete perk structure
- 🎯 **Token System** – Four token types (Food, Photo, Review, Explorer) with straightforward naming
- ⚡ **Energy System** – Separate energy system for API cost control
- 📊 **XP Migration Plan** – XP-to-tokens conversion strategy

### 📋 Documentation Created

- ✅ `GAMIFICATION_BETA_v0.7.md` – Beta gamification system design
- ✅ `GAMIFICATION_POST_BETA_v1.0.md` – Post-beta full gamification system
- ✅ `GAMIFICATIONLOG.md` – Updated with complete gamification systems
- ✅ `FOUNDER_PASS_PRICING.md` – Complete pricing and rewards breakdown
- ✅ `BADGE_SYSTEM_FINAL.md` – Badge system summary
- ✅ `SPECIAL_PERKS_DISCUSSION.md` – Special perks analysis
- ✅ `TANGIBLE_REWARDS_DISCUSSION.md` – Tangible rewards analysis
- ✅ `GAMIFICATION_NAMING_DISCUSSION.md` – Naming convention analysis
- ✅ `BADGE_PROGRESSION_DISCUSSION.md` – Badge progression analysis
- ✅ `GAMIFICATION_SYNC_ANALYSIS.md` – File synchronization analysis

### 🎯 Key Decisions Made

- **Token Naming:** Straightforward (Food, Photo, Review, Explorer) vs gamified naming
- **Energy vs Explorer:** Separate systems (Energy for API costs, Explorer for leveling)
- **Badge Progression:** 
  - Beta: Easier (5/15/30/60/100) for early engagement
  - Post-Beta: Balanced (10/25/50/100/200/500/1000) for long-term
- **XP Migration:** XP disappears, converts to tokens with beta tester bonus
- **Founder Pass:** RM100 (adjusted from RM300 initial plan)
- **Tangible Rewards:** RM30 budget per user (pin, tote bag, take-away pack)

### 🧩 System Design Notes

- **Beta System:** Simplified XP-based progression for testing core mechanics
- **Post-Beta System:** Full resource economy with token crafting and advanced features
- **Badge System:** Multi-tier progression for all badge types (7 Explorer tiers, 5 tiers for others)
- **Special Perks:** Balanced mix of recognition, convenience, and access perks
- **Shariah Compliance:** No gambling, no riba, no speculative value, transparent perks

### 🧠 Lessons Learned

- Discussion documents before decisions help clarify choices
- Multiple options for consideration improve decision quality
- Budget constraints must be considered early in design
- Clear separation of current vs future features prevents confusion
- Comprehensive documentation ensures consistency across files

---

## v0.5 — Stability & Recovery (23–24 Oct 2025)

**Milestone:** Disaster recovery, GitHub cleanup, and hosting migration.  

**Objective:** Restore full functionality after failed Mapbox migration.

### 📦 Features Added / Recovered

- ✅ Reverted to Google Maps implementation (commit `ae016d5`).
- 🔒 Created missing `adminAuth.js` and verified 3 admin accounts.
- 🚀 Deployed live to Firebase Hosting (`https://foodie-map-23842.web.app`).
- 📱 Mobile optimization confirmed — app fully usable on phones.
- 🔐 Environment keys secured via `.env` + `.gitignore`.

### 🧩 Fixes & Improvements

- Fixed function parameter handling (User object → email).
- Implemented password verification with environment variables.
- Rebuilt hosting config (`firebase.json`).
- Resolved API restriction conflicts and authentication errors.

### ⚙️ Technical Stack Notes

- Firebase Hosting + Firestore backend.
- Git-based rollback & re-deploy strategy.
- Secure environment configuration management.

### 🧠 Lessons Learned

- Don't overcomplicate a working system.
- Git revert is a lifesaver — keep commits clean.
- "Consult before execute" rule prevents massive rollbacks.

---

## v0.4 — Add Restaurant & Admin System (21 Oct 2025)

**Milestone:** Implemented user submission system and admin review workflow.  

**Objective:** Allow verified contributions from the community.

### 📦 Features Added

- 🏗️ **Multi-Step Add Restaurant Form** – Name, photos, location, verification.
- 🗺️ **Google Places Integration** – Auto-populate restaurant data.
- 🧾 **Admin Dashboard (Phase 2)** – Submission review, approval, and rejection.
- 📍 **Location Verification** – GPS + form cross-validation.
- 💾 **Client-side Caching** – Reduced Firestore reads by 40%.

### 🧩 Fixes & Improvements

- Fixed `useAuth` provider loop and component hierarchy.
- Replaced complex queries with simple order + filter.
- Removed redundant forms from old system.
- Improved error handling and upload validation.

### ⚙️ Technical Stack Notes

- Firebase Firestore with "pending/approved" status fields.
- Firestore document references for admin review flow.
- TypeScript migration (in progress) with ESLint cleanup.

### 🧠 Lessons Learned

- Proper provider structure prevents major React runtime errors.
- Client-side filtering reduces Firestore index costs.
- Separate business logic from UI — futureproofs scaling.

---

## v0.3 — Auth & Favorites (16–20 Oct 2025)

**Milestone:** Authentication, user dashboard, and advanced Favorites system.  

**Objective:** Personalize user experience and introduce persistent state.

### 📦 Features Added

- 🔐 **Firebase Auth Integration** – Google OAuth + Email/Password login.
- 👤 **User Dashboard** – Overview, Social, and Gamification tabs.
- ⭐ **Advanced Favorites System** – Soft delete, 24-hour restore, auto-cleanup.
- 🧭 **Bottom Navigation Bar** – Core app sections: Discover, Search, Favorites, Profile, Add.
- 🔒 **Secure Firestore Rules** – Proper validation and user-based data access.

### 🧩 Fixes & Improvements

- Fixed index and circular dependency issues.
- Optimized query costs using client-side filtering.
- Cleaned React key duplication and unused imports.
- Enhanced UX with modal previews and consistent detail buttons.

### ⚙️ Technical Stack Notes

- React Context for Auth & Favorites management.
- Firestore CRUD operations for personal data.
- Optimized Firestore composite index usage.

### 🧠 Lessons Learned

- Keep state close to where it's used.
- Context & services pattern improves codebase scalability.
- Simple client-side queries outperform complex indexes for early scale.

---

## v0.2 — Directory & Photos (11–15 Oct 2025)

**Milestone:** Added Eatery Directory, Detail Pages, and Photo Upload functionality.  

**Objective:** Enable browsing, detailed restaurant viewing, and user contributions.

### 📦 Features Added

- 🍴 **Eatery Directory System** – Search, filter (Nearby, 4+ Stars, Halal, Open Now), and infinite scroll.
- 🖼️ **Eatery Detail Page** – Photos, hours, distance, actions (Call, Check-in, Directions).
- 📸 **Photo Upload System** – Authenticated users upload images (validated & compressed).
- 📊 **Admin Dashboard (Phase 1)** – View eateries, routes, and analytics.
- 📋 **Privacy Policy & Terms** – Full legal compliance with PDPA, GDPR, CCPA.

### 🧩 Fixes & Improvements

- Fixed distance matrix integration.
- Added detour-time filtering logic (5, 10, 15, 20 mins).
- Solved duplicate Firestore entries via caching.
- Implemented lazy image loading and error fallbacks.

### ⚙️ Technical Stack Notes

- Firestore indexes for eateries, reviews, and photos.
- Firebase CLI & JSON configuration.
- Event analytics (`photo_uploaded`, `eatery_viewed`, etc.)

### 🧠 Lessons Learned

- Legal compliance isn't optional; bake it in early.
- Use client-side caching + validation to reduce API costs.
- User-uploaded content drives engagement — but needs structure.

---

## v0.1 — MVP Build (3–10 Oct 2025)

**Milestone:** Core route discovery system built and functioning across Peninsular Malaysia.  

**Objective:** Deliver a functional MVP with real route planning, eatery discovery, and map rendering.

### 📦 Features Added

- 🗺️ **Google Maps Integration** – Route-based restaurant discovery.
- 🍽️ **Firestore Eateries Collection** – Stores name, location, rating, and address.
- 🔍 **Autocomplete & Route Finder** – Smooth navigation and restaurant mapping.
- 🎨 **Glassmorphism UI** – Modern design with Tailwind CSS.
- 📱 **Mobile-first Homepage** – Optimized for phone users.
- ⚡ **Directions & Polyline Rendering** – Multi-route support.

### 🧩 Fixes & Improvements

- Fixed dropdown z-index rendering and portal layering.
- Resolved `Find Food Along Route` navigation bug.
- Eliminated infinite loops and blank map issues.
- Enhanced Google Places API integration and error handling.
- Removed debug components and improved UX polish.

### ⚙️ Technical Stack Notes

- React 18 (hooks + Context API)
- Firebase Firestore & Authentication
- Google Maps Directions + Places APIs
- Haversine formula for distance calculations

### 🧠 Lessons Learned

- Start simple, scale later — API key security & structure matter.
- Debugging visually (z-index, layering) saves hours.
- Real data from Firestore offers better control than live API-only approach.

---

## 🧭 Project Summary

**Duration:** 3 Oct – 8 Nov 2025  

**Total Versions:** v0.1 → v0.6.1  

**Core Focus:** Route discovery, eatery data management, authentication, admin control, and gamification system design.

### 🔧 Stack Overview

| Layer | Tools / Services |
|-------|------------------|
| Frontend | React 18, Context API, TailwindCSS |
| Backend | Firebase Firestore, Firebase Auth |
| Maps | Google Maps, Places, Directions APIs |
| Hosting | Firebase Hosting, GitHub |
| Utilities | Haversine Distance, custom caching, analytics events |

### 🌱 Foundation for Next Phase

- ✅ Gamification system designed (Beta v0.7 and Post-Beta v1.0+)
- ✅ Badge system complete (multi-tier progression)
- ✅ Founder Pass pricing finalized (RM100 for 500 lots)
- ✅ Special perks designed (Founder Tier and Beta Tester)
- ⏳ Gamification implementation (next phase)
- ⏳ Beta Testing & Founder Pass rollout (Q4 2025)
- ⏳ Social Integration & Reviews
- ⏳ Performance scaling for nationwide data coverage

---

### 🧩 Author's Note

> "The system now mirrors a full-fledged food discovery platform — stable, cost-efficient, and socially ready. Every challenge taught better architecture, better patience, and better discipline."  

> — *Founder, Kawan Makan* 🍜

---
