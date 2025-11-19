# 🗺️ KAWAN MAKAN — CHANGELOG.md

*Project timeline: 3 Oct – 19 Nov 2025*  

*Core Stack: React, Firebase Firestore, Google Maps Platform, @react-google-maps/api, TailwindCSS, Netlify/Firebase Hosting*

---

## v0.7.5 — Beta Phase: Phase 3.3 Email Drip Automation Complete (19 Nov 2025)

**Milestone:** Phase 3.3 Email Drip Automation Implementation & Testing Complete.  
**Objective:** Implement automated email drip sequence using Firebase Functions scheduled triggers.

### 📧 Email Drip Automation Implementation

- **Scheduled Functions** (`functions/index.js`)
  - `sendSurveyEmailsT2` - T+2 Survey Email (daily 9:00 AM)
  - `sendCommunityEmailsT5` - T+5 Community Email (daily 9:00 AM)
  - `sendReferralReminderEmailsT8` - T+8 Referral Reminder (daily 9:00 AM)
  - `sendFeedbackEmailsT7` - T+7 Feedback Email post-invite (daily 9:00 AM)

- **Email Drip Module** (`functions/emailDrip.js`)
  - Email templates for server-side use
  - SendGrid integration helper functions
  - Duplicate prevention logic
  - Email tracking in Firestore

- **HTTP Test Functions** (`functions/index.js`)
  - `testSendSurveyEmailsT2` - Manual testing
  - `testSendCommunityEmailsT5` - Manual testing
  - `testSendReferralReminderEmailsT8` - Manual testing
  - `testSendFeedbackEmailsT7` - Manual testing

- **Firestore Indexes** (`firestore.indexes.json`)
  - Composite index for `waitlist` collection: `signupDate` queries
  - Composite index for `waitlist` collection: `betaAccessGranted` + `betaAccessDate` queries

### 🧪 Testing Results

- ✅ All 4 test functions deployed successfully
- ✅ All 4 test functions tested and working
- ✅ Firestore indexes created and active
- ✅ Functions return correct JSON responses
- ✅ Ready for production testing with real data

### 📚 Documentation Created

- `PHASE_3_3_SETUP_GUIDE.md` - Setup and deployment guide
- `PHASE_3_3_TESTING_GUIDE.md` - Comprehensive testing guide
- `PHASE_3_3_TEST_DATA_GUIDE.md` - Test data creation methods
- `PHASE_3_3_TEST_RESULTS.md` - Test results documentation
- `PHASE_3_3_QUICK_TEST.md` - Quick reference card
- `BROWSER_CONSOLE_EASY.md` - Browser console method guide
- `create-test-waitlist-entries.js` - Node.js script for test data
- `SESSION_SUMMARY_PHASE_3_20251119.md` - Session summary

### 🔧 Technical Changes

- Added 4 scheduled Firebase Functions for automated email sending
- Added 4 HTTP test functions for manual testing
- Created `functions/emailDrip.js` module for email templates and helpers
- Updated `firestore.indexes.json` with composite indexes
- Configured Firebase Functions environment variables

### 📝 Next Steps

- Test with real data (create test waitlist entries)
- Deploy scheduled functions for production use
- Monitor function logs and email delivery

---

## v0.7.4 — Beta Phase: Phase 3.2 Survey System Complete (19 Nov 2025)

**Milestone:** Phase 3.2 Survey System Implementation & Testing Complete.  
**Objective:** Implement survey system for beta phase users to provide travel habit information and earn +50 K-Coins.

### 📋 Survey System Implementation

- **Survey Service** (`src/services/surveyService.js`)
  - Survey submission with validation
  - K-Coins award (+50 on completion)
  - Cohort score update based on drive frequency
  - Survey status tracking
  - Email integration (T+2 trigger ready)

- **Survey Modal Component** (`src/components/SurveyModal.js`)
  - Device selector (iOS/Android)
  - Drive frequency selector (Weekly/Monthly/Occasional)
  - Corridor input (free text)
  - Form validation
  - Success state with auto-close
  - Pre-fills if already completed

- **Integration**
  - Survey prompt card in Overview tab (conditional)
  - Survey Test section in Beta Test tab
  - URL parameter support (`?survey=true`)
  - Auto-refresh K-Coins after completion

### 🐛 Bug Fixes

- Fixed Firestore permission errors for referrals and K-Coins
- Fixed survey modal and K-Coins history modal bottom nav overlap
- Fixed cohort score update bug (`getDoc` API)
- Fixed K-Coins email extraction for waitlist users
- Fixed survey transaction not appearing in history
- Fixed transaction sorting order
- Added Survey Test section for repeated testing

### 🧪 Testing Results

- ✅ All core functionality working
- ✅ K-Coins awarded correctly (+50)
- ✅ Cohort score updates correctly
- ✅ Survey status tracking works
- ✅ UI/UX improvements complete
- ✅ Mobile responsive
- ✅ Zero critical issues

### 📊 Technical Changes

- Updated Firestore rules for referrals and K-Coins collections
- Modified K-Coins service to support waitlist users (email-based queries)
- Improved transaction sorting logic
- Added auto-refresh events for K-Coins balance/history
- Enhanced debug logging

---

## v0.7.3 — Beta Phase: Phases 0, 1 & 2 Complete + Mobile Testing (18 Nov 2025)

**Session Wrap-Up:** 18 November 2025, 18:06 PM  
**Milestone:** Phases 0, 1, and 2 Complete - Foundation, Core Systems, and Landing Page  
**Status:** ✅ **PRODUCTION READY** - All testing passed, zero issues found

### 📱 Mobile Testing Complete
- ✅ Tested on iPhone (iOS Safari) - All tests passed
- ✅ Tested on Android (Chrome) - All tests passed  
- ✅ Tested on iPad (iOS Safari) - All tests passed
- ✅ Zero issues found across all devices and orientations
- ✅ Performance verified excellent on all network conditions

---

## v0.7.3 — Beta Phase: Phase 2 Landing Page Complete (18 Nov 2025)

**Milestone:** Phase 2 Landing Page Implementation & Testing Complete.  
**Objective:** Build standalone React landing page for beta waitlist signups with bilingual support, referral system, and social sharing.

### 🌐 Landing Page Implementation

- **Standalone React App** – Created `landing-page/` folder (sibling to `foodie-simple/`)
  - Initialized with Create React App
  - Firebase SDK integration
  - Separate Firebase Hosting site: `waitlist-foodie-map-23842.web.app`
  - Mobile-first responsive design

- **Core Components** – Complete landing page UI
  - `Hero.js` – Hero section with EN/BM bilingual copy
  - `WaitlistForm.js` – Email, name, referral code inputs with validation
  - `ReferralSection.js` – Referral code display and social sharing
  - `SocialProof.js` – Live waitlist count and trust badges
  - `waitlistApi.js` – Landing page API service

- **Features Implemented**
  - Bilingual support (EN/BM toggle)
  - Referral code pre-fill from URL (`?ref=CODE`)
  - Form validation (email format, required fields)
  - 2-second loading state for better UX
  - Social sharing (WhatsApp, Telegram, Facebook, Twitter)
  - Live waitlist count (updates every 30 seconds)
  - Duplicate email detection with clear warning
  - Success state with referral code display

### 🔧 Firebase Configuration

- **Firebase Hosting Multiple Sites** – Configured separate hosting site
  - Main app: `foodie-map-23842.web.app`
  - Landing page: `waitlist-foodie-map-23842.web.app`
  - `.firebaserc` configured with hosting target
  - `firebase.json` configured with target

- **Firestore Rules Updates** – Public access for landing page
  - `waitlist` collection: Public read for count display
  - `kcoins_transactions` collection: Public create for waitlist signups
  - `referrals` collection: Public create for referral tracking

### 🐛 Bug Fixes & UX Improvements

- **Permission Errors** – Fixed Firestore permission issues
  - Waitlist count permission denied → Fixed (public read)
  - K-Coins transaction permission denied → Fixed (public create)
  - Referral handling permission denied → Fixed (removed unnecessary update)

- **UX Improvements**
  - Added 2-second loading delay for psychological feedback
  - Enhanced duplicate email warning (yellow background, shake animation)
  - Improved error message clarity and visibility
  - Better success state messaging for duplicate emails

### 🧪 Testing & Quality Assurance

- **Comprehensive Testing** – All features verified working
  - ✅ Page loads correctly
  - ✅ Firebase initializes successfully
  - ✅ Language toggle works (EN/BM)
  - ✅ Form validation works
  - ✅ Form submission works (with 2s loading state)
  - ✅ K-Coins awarded successfully
  - ✅ Referral tracking works
  - ✅ Social sharing buttons work
  - ✅ Waitlist count displays and updates
  - ✅ Duplicate email warning displays clearly
  - ✅ No console errors
  - ✅ Firestore data created correctly

### 📚 Documentation

- **PHASE_2_SETUP_GUIDE.md** – Complete setup guide
- **DEPLOYMENT_GUIDE.md** – Step-by-step deployment instructions
- **FIREBASE_HOSTING_SETUP.md** – Multiple sites configuration guide
- **LOCAL_TESTING_CHECKLIST.md** – Comprehensive testing checklist
- **TESTING_FIXES_SUMMARY.md** – Bug fixes documentation
- **PHASE_2_COMPLETION_SUMMARY.md** – Phase 2 completion summary
- **ENV_SETUP_INSTRUCTIONS.md** – Environment variables setup guide

### 📊 Technical Changes

- **New Files:**
  - `landing-page/src/components/Hero.js` + CSS
  - `landing-page/src/components/WaitlistForm.js` + CSS
  - `landing-page/src/components/ReferralSection.js` + CSS
  - `landing-page/src/components/SocialProof.js` + CSS
  - `landing-page/src/services/waitlistApi.js`
  - `landing-page/src/config/firebaseConfig.js`
  - `landing-page/firebase.json`
  - `landing-page/.firebaserc`
  - `landing-page/.env` (protected)

- **Modified Files:**
  - `firestore.rules` – Public read for waitlist, public create for kcoins_transactions

### 🚀 Deployment Status

- ✅ Firebase hosting site created: `waitlist-foodie-map-23842.web.app`
- ✅ Configuration complete (`.firebaserc`, `firebase.json`, `.env`)
- ✅ Ready for deployment (build and deploy commands ready)

---

## v0.7.2 — Beta Phase: Phase 1 Core Systems Complete (18 Nov 2025)

**Milestone:** Phase 1 Core Systems Implementation & Testing Complete.  
**Objective:** Implement and test core beta phase systems (K-Coins, Waitlist, Referrals, Beta Access).

### 🎯 Core Systems Implemented

- **💰 K-Coins System** – Complete reward currency system
  - `kCoinsService.js` – Award, balance, and history management
  - `KCoinsDisplay.js` – UI component with balance and transaction history
  - Integrated into User Dashboard Overview tab
  - Transaction types: `waitlist_signup`, `referral`, `survey`, `draw_prize`, `conversion`
  - Beta phase: Accumulation only (no spending)
  - Client-side sorting to avoid Firestore index requirements

- **📋 Waitlist System** – User signup and beta access management
  - `waitlistService.js` – Join waitlist, check beta access, generate referral codes
  - Referral code generation (format: `KM-XXXXXX`)
  - Signup order tracking
  - Automatic +25 K-Coins on waitlist signup
  - Email normalization and duplicate prevention
  - Uses `getDocs` instead of `getCountFromServer` to avoid index requirements

- **👥 Referral System** – Referral tracking and rewards
  - `referralService.js` – Complete referral management
  - Referral code validation
  - Automatic K-Coins rewards (+100 referrer, +25 new user)
  - Referral statistics tracking
  - Integration with waitlist service
  - Cohort points (+50) when referred user joins beta (post-beta feature)

- **🔐 Beta Access Control** – Access management utilities
  - `betaAccess.js` – Check, grant, revoke, and batch operations
  - Integrated into `AuthContext.js` – Automatic beta access checking on login
  - Admin email added to Firestore rules for testing
  - Wave number support for phased beta access

### 🧪 Testing & Quality Assurance

- **Beta Phase Test Panel** – Comprehensive testing utility
  - `BetaPhaseTestPanel.js` – Full-featured test interface
  - Accessible via User Dashboard → Beta Test tab
  - Test K-Coins awarding, waitlist signup, referral validation, beta access granting
  - Real-time status display and transaction history
  - Error handling and user feedback

- **Testing Results** – All systems verified working
  - ✅ K-Coins balance tracking and transaction history
  - ✅ Waitlist signup with referral code generation
  - ✅ Referral code validation and tracking
  - ✅ Automatic K-Coins rewards on referrals
  - ✅ Beta access granting and checking
  - ✅ Beta access verification on login

### 🐛 Bug Fixes

- **K-Coins History** – Removed `orderBy` to avoid Firestore index requirement, implemented client-side sorting
- **Waitlist Count** – Replaced `getCountFromServer` with `getDocs` to avoid index requirements
- **Beta Access Grant** – Added email normalization, better error handling, and logging
- **Firestore Rules** – Added testing admin email to allow beta access granting

### 📚 Documentation

- **PHASE_1_TESTING_GUIDE.md** – Complete testing guide with step-by-step instructions
- **PHASE_1_COMPLETION_SUMMARY.md** – Phase 1 completion documentation (created)

### 📊 Technical Changes

- **New Services:**
  - `src/services/kCoinsService.js` – K-Coins management
  - `src/services/waitlistService.js` – Waitlist management
  - `src/services/referralService.js` – Referral system
- **New Utilities:**
  - `src/utils/betaAccess.js` – Beta access control
- **New Components:**
  - `src/components/KCoinsDisplay.js` – K-Coins UI
  - `src/components/KCoinsDisplay.css` – K-Coins styling
  - `src/components/BetaPhaseTestPanel.js` – Testing utility
  - `src/components/BetaPhaseTestPanel.css` – Test panel styling
- **Updated Components:**
  - `src/components/UserDashboard.js` – Added K-Coins display and Beta Test tab
  - `src/contexts/AuthContext.js` – Added beta access checking on login

### ✅ Deployment

- All code changes committed and ready for deployment
- Firestore rules deployed with admin email for testing
- All systems tested and verified working

### 🎯 Next Steps

- **Phase 2:** Landing Page (separate React app for waitlist signups)
- **Phase 3:** Email Drip System (SendGrid integration)
- **Phase 4:** Survey System
- **Phase 5:** Admin Tools (wave management, cohort scoring)

---

## v0.7.1 — Pre-Beta Initialization: Phase 0 Foundation Setup (18 Nov 2025)

**Milestone:** Beta Phase Foundation Setup - Firestore & Storage rules, environment configuration.  
**Objective:** Set up infrastructure for beta phase features (waitlist, referrals, K-Coins, email drips).

### 🏗️ Infrastructure Setup

- **Firestore Collections** – Added 8 beta phase collections with security rules
  - `waitlist` – Waitlist signups and beta access tracking
  - `referrals` – Referral tracking and rewards
  - `kcoins_transactions` – K-Coins transaction history
  - `survey_responses` – Survey completion data
  - `travel_draws` – Monthly travel package draws
  - `beta_reports` – Bug reports and feedback
  - `email_drips` – Email drip sequence tracking
  - `community_updates` – Community email updates
- **Firebase Storage** – Configured beta reports screenshot storage
  - `beta-reports/{userId}/` folder with user-specific permissions
  - Admin read access for all beta report screenshots
  - ASIA region bucket: `foodie-map-23842.firebasestorage.app`
- **Environment Variables** – Documented SendGrid and beta phase configuration
  - SendGrid API key setup guide
  - Landing page URL configuration
  - Beta phase settings (wave sizes, targets)

### 📚 Documentation

- **BETA_PHASE_ENV_SETUP.md** – Complete environment variables setup guide
- **SENDGRID_SENDER_SETUP_GUIDE.md** – Step-by-step SendGrid sender verification guide
- **SENDGRID_INTEGRATION_GUIDE.md** – Node.js Web API integration guide
- **WHERE_TO_PUT_SENDGRID_KEYS.md** – Quick reference for API key placement
- **FIREBASE_STORAGE_SETUP.md** – Firebase Storage bucket selection guide
- **PHASE_0_COMPLETION_SUMMARY.md** – Phase 0 completion documentation
- **BETA_PHASE_INITIALIZATION_REVIEW.md** – Updated with Phase 0 completion status

### 📊 Technical Changes

- **firestore.rules** – Added 8 beta phase collection rules
- **storage.rules** – Added beta-reports folder rules
- **firebase.json** – Updated storage configuration

### ✅ Deployment

- Firestore rules deployed successfully
- Storage rules deployed successfully
- All beta phase collections active and ready

---

## v0.7.0 — Pre-Beta Finalization: Discover Tab & Branding Updates (17 Nov 2025)

**Milestone:** Pre-Beta finalization - Discover tab adjustments and branding updates.  
**Objective:** Final UI/UX adjustments before beta phase launch, update branding to "Kawan Makan", improve Discover tab favorite button UX.

### 🎨 UI/UX Improvements

- **Branding Update** – Changed header from "🍽️ Foodie Map - Simple" to "Kawan Makan"
  - Updated Discover tab header
  - Consistent branding across app
- **Discover Tab Favorite Button** – Improved favorite button UX in restaurant result cards
  - Removed border around favorite button (icon-only display)
  - Fixed overflow issues on mobile
  - Transparent background with scale animation on hover
  - Better mobile responsiveness with flex-shrink prevention

### 📊 Technical Changes

- **App.tsx** – Updated Discover tab header text
- **RouteResults.css** – Favorite button styling improvements, overflow fixes

---

## v0.6.9 — Add Restaurant Tab Mobile Fixes & Admin Duplicate Detection (17 Nov 2025)

**Milestone:** Add Restaurant tab mobile UX improvements, Admin submission review fixes, duplicate detection feature.  
**Objective:** Fix mobile testing bugs in Add Restaurant tab, ensure admin can review submissions, add duplicate detection for admin review process.

### 🐛 Bug Fixes

- **Admin Tab Query** – Fixed restaurant submissions not appearing in Admin tab
  - Changed from `limit(200)` to fetching all documents
  - Improved filtering logic to handle documents without status field
  - Added prioritization for pending_review submissions
  - Increased limit to 100 filtered results
- **Add Restaurant Tab Mobile** – Fixed UI overflow issues
  - Removed `min-width: 150px` on mobile for photo upload buttons
  - Added `overflow-x: hidden` to containers
  - Added `box-sizing: border-box` to form inputs
  - Made buttons full width on mobile
- **Admin Modal Overlap** – Fixed action buttons overlapping bottom navigation
  - Added `padding-bottom: 80px` to modal overlay
  - Made modal flexbox with sticky action buttons
  - Improved mobile-specific positioning
  - Action buttons now visible above bottom navigation

### 🚀 Enhancements

- **Admin Duplicate Detection** – Firestore-only duplicate checking for admin review
  - Three-strategy detection: name matching, address matching, location proximity (100m)
  - Similarity scoring (0-100%) with color-coded badges
  - Match type indicators (name/address/location)
  - Detailed duplicate information display
  - Automatic detection when opening submission modal
  - Excludes current submission from results
  - Shows top 10 most similar matches

### 📊 Technical Changes

- **RestaurantReviewDashboard.js** – Enhanced query logic, duplicate detection functions
- **RestaurantReviewDashboard.css** – Modal positioning fixes, duplicate section styles
- **AddRestaurantTab.css** – Mobile overflow fixes, responsive button styles

### 🔍 Error Explanations

- **Firestore WebChannelConnection Warning** – Explained as network/connection issue, not Firestore rules problem
  - Automatic retry mechanism handles transient failures
  - No action needed unless operations consistently fail

---

## v0.6.8 — Search Tab Mobile Fixes & Menu Database Enhancement (14 Nov 2025)

**Milestone:** Mobile UX improvements, search accuracy fixes, menu database system enhancement.  
**Objective:** Fix mobile testing bugs, improve search UX, implement structured menu database with meal time divisions.

### 🐛 Bug Fixes

- **Mobile Filter Layout** – Quick filters collapsed by default, optimized CSS for compact state
- **Map View** – Fullscreen Google Maps integration, user location marker always visible, dynamic centering
- **Distance Sorting** – Fixed sorting to prioritize closest restaurants (Johor → Melaka → NS → KL)
- **Results Visibility** – Restaurant cards completely hidden in map view, conditional rendering
- **Search Accuracy** – Fixed "Could not determine location" warning, always use user location for food searches
- **API Over-Firing** – Filter Firestore results before API calls, only expand if insufficient relevant results
- **Result Limits** – Increased minResults to 30, maxResultCount to 60

### 🚀 Enhancements

- **Menu Database System** – Structured menu with meal time divisions (breakfast/lunch/dinner/all)
  - Added `mealTime` field to menu photos
  - Created `buildMenuDatabase()` function
  - Menu structure: `{breakfast: [], lunch: [], dinner: [], all: [], allItems: []}`
  - Menu items included in searchable text
- **Food Items Extraction** – Extract food items from restaurant names when saving to Firestore
  - Created `extractFoodItems()` function
  - Supports 50+ Malaysian food items
  - Saves to `foodItems` array in Firestore
- **Search Improvements** – Lenient text filtering, menu database integration, better result combination

### 📊 Technical Changes

- **SearchTab.js** – Fullscreen map, conditional rendering, user location marker
- **SearchTab.css** – Fullscreen map styles, mobile-responsive filters
- **enhancedSearchService.js** – Fixed search bounds, progressive radius with filtering, lenient mode
- **firestoreSearchService.js** – Food items extraction, menu database saving
- **AddRestaurantTab.js** – Meal time selection, menu database building

---

## v0.6.7 — Beta Phase Planning & K-Coins System Design (13 Nov 2025)

**Milestone:** Complete beta phase flow planning with integrated marketing and technical strategy. K-Coins system designed for beta accumulation phase.  
**Objective:** Plan end-to-end beta phase flow, integrate marketing strategy with technical implementation, design K-Coins system, update gamification documentation.

### 📦 Planning & Documentation

- 📋 **Beta Phase Flow Plan** – Complete end-to-end beta flow planning
  - Created `BETA_PHASE_FLOW_PLAN_INTEGRATED.md` with 19 implementation phases
  - Integrated marketing strategy with technical implementation
  - Landing page strategy (separate standalone React app)
  - Waitlist system with referral tracking
  - Survey system (T+2, device/frequency/corridor capture)
  - Weekly wave system (flexible admin control, 50-100 seats per wave)
  - Creator partnership system (automatic access + scoring bonus)
  - Travel package draw system (monthly for top referrers)
- 💰 **K-Coins System Design** – Reward currency for beta phase
  - Earning: Waitlist signup (+25), Referrals (+100), Survey (+50)
  - Display: Balance visible in UI (no "coming soon" messaging)
  - Accumulation: Beta phase accumulation only (no spending)
  - Post-beta use cases: Premium features, in-app purchases, token conversion
  - Hybrid approach: Subscription-like features + one-time purchases
- 📧 **Email Drip Sequence** – Updated 6-email sequence
  - T+0: Welcome (K-Coins, referral link, corridor question)
  - T+2: Survey (30-second form = +50 K-Coins)
  - T+5: Community building (Kawan Makan Community / Komuniti Kawan Makan)
  - T+8: Referral reminder
  - Rolling: Invite (when beta access granted)
  - T+7 post-invite: Feedback (NPS, missing spots, favorite detours)
- 🎯 **Cohort Scoring System** – Updated scoring formula
  - Corridor fit: 40% weight (prioritize Kluang↔Penang, KL↔JB)
  - Drive frequency: 25% weight (weekly > monthly > occasional)
  - Referrals: 25% weight (+50 per referral that joins beta)
  - Creator flag: 10% weight (automatic priority)
  - Email engagement: +5 per open, +10 per click
- 👥 **Creator System** – Creator partnership management
  - Automatic beta access (priority)
  - Scoring bonus (+10% if going through scoring)
  - Manual admin approval
  - Reserved slots (~20% of each wave)
  - Unique referral codes for tracking
- 🎁 **Travel Package Draw** – Monthly reward system
  - Top referrers qualify (admin configurable, e.g., top 50)
  - Random draw from qualifiers
  - Malaysia travel package prize
  - Announcement email + community update

### 🧩 Documentation Updates

- ✅ **GAMIFICATION_BETA_v0.7.md** – Updated with K-Coins system
  - Added Section 4: K-Coins System (Beta - Accumulation Phase)
  - Updated beta goals to include K-Coins accumulation
  - Added K-Coins migration plan (post-beta conversion)
  - Updated checklists and success criteria
- ✅ **BETA_PHASE_FLOW_PLAN_INTEGRATED.md** – Complete integrated plan
  - 19 implementation phases
  - Marketing assets checklist
  - 30-day pre-beta plan
  - KPIs and measurement framework
  - Risks and mitigations

### 🎯 Key Decisions Made

- **K-Coins:** Implemented now, visible in UI, accumulation only during beta
- **Landing Page:** Separate standalone React app (lightweight)
- **Referral System:** Links join waitlist, K-Coins awarded on waitlist signup
- **Survey:** T+2, captures corridor/drive frequency, +50 K-Coins
- **Weekly Waves:** Flexible admin control, 50-100 seats per wave
- **Creator System:** Automatic access + scoring bonus + manual approval
- **Community Name:** Always use "Kawan Makan Community (EN) / Komuniti Kawan Makan (BM)"

### 🧩 System Design Notes

- **Beta Phase:** K-Coins accumulate only (no spending, mysterious)
- **Post-Beta:** K-Coins convert to premium features, tokens, in-app purchases
- **Referral Flow:** Waitlist → Waitlist (K-Coins), Beta → Beta (cohort points)
- **Email Sequence:** 6 emails over beta period (Welcome, Survey, Community, Referral, Invite, Feedback)
- **Wave System:** Admin controls timing and size, prioritizes corridor fit + engagement

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
