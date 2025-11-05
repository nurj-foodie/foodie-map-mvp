# 🗺️ KAWAN MAKAN — CHANGELOG.md

*Project timeline: 3 Oct – 5 Nov 2025*  

*Core Stack: React, Firebase Firestore, Google Maps Platform, @react-google-maps/api, TailwindCSS, Netlify/Firebase Hosting*

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

**Duration:** 3 Oct – Nov 2025  

**Total Versions:** v0.1 → v0.6  

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
