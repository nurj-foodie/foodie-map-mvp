# 📋 KAWAN MAKAN (KM) — Product Requirements Document (PRD)

**Version:** 0.1 (Post-MVP / Pre-Beta Phase)  
**Last Updated:** 5 November 2025  
**Maintainer:** @Founder (Project Lead)  
**Companion Files:** `README.md`, `CHANGELOG.md`, `GAMIFICATIONLOG.md`  
**Status:** MVP v0.5 Completed | Gamification Design v0.6 Complete | Pre-Beta v0.7 In Development

---

## 1. Overview

### Mission

**Kawan Makan** connects people through halal food discovery — helping travelers, locals, and small vendors find each other along their routes. It's a social map for food and community, gamified to reward exploration and contribution.

### Vision

To become Malaysia's leading halal food discovery ecosystem — blending map navigation, gamified exploration, and small business empowerment.

### Current Phase

**MVP (Map + Eatery Directory + Auth + Favorites)** completed and deployed.  
Entering **Pre-Beta** stage to integrate gamification, event mechanics, and user reward systems.

### Core Value Proposition

Find great halal food along your journey without breaking the bank on API costs, while earning rewards for exploration and contribution.

---

## 2. Goals & Non-Goals

### ✅ Goals

1. **Deliver a functional, mobile-first foodie app** with Google Maps discovery
2. **Build a community-driven eatery database** with user submissions
3. **Introduce gamification system v1** (XP, check-ins, badges, levels)
4. **Maintain Shariah-compliant business structure** (Founder Pass & Mudarabah Pool)
5. **Optimize API costs** using Firestore-first architecture (95% cost reduction)

### 🚫 Non-Goals (for this phase)

- Full 3D / AR map experiences
- Food delivery or payment systems
- Cross-country support beyond Malaysia (until v1.5)
- Complex business/vendor dashboards (reserved for v2+)

---

## 3. Target Users

| Persona | Description | Motivation |
|----------|-------------|------------|
| **Lone Explorer** | Solo traveler exploring new routes | Wants halal, authentic food and XP progression |
| **Food Crew** | Groups planning road trips or events | Discover and collect badges together |
| **Street Vendor / SME Owner** | Local business owner | Gain visibility and engage customers |
| **Event Organizer** | Hosts food festivals | Uses Kawan Makan for location-based campaigns |

---

## 4. Core User Stories

1. **As a traveler**, I want to find halal eateries along my driving route so I can plan authentic food stops.
2. **As a foodie**, I want to earn XP and badges by checking in, uploading photos, and adding reviews.
3. **As a vendor**, I want to register my stall and verify my business so travelers can find me.
4. **As an event organizer**, I want to host limited-time treasure hunts or map campaigns to drive real-world engagement.
5. **As a F2P user**, I want to progress through skill and contribution, not only purchases.
6. **As a P2P user**, I want to buy optional booster packs to speed up progression.

---

## 5. Feature Breakdown & Requirements

| Feature | Description | Priority | Status |
|----------|-------------|----------|---------|
| **Map Discovery** | Route-based eatery search using Firestore-first caching | ⭐ Must | ✅ Done |
| **Eatery Directory** | List + Detail pages with filters and photos | ⭐ Must | ✅ Done |
| **Auth & Favorites** | Firebase Auth + soft-delete favorite system | ⭐ Must | ✅ Done |
| **Add Eatery / Admin Review** | User submission + admin approval flow | ⭐ Must | ✅ Done |
| **Gamification v1** | XP, levels, badges, and leaderboards | ⭐ Must | ✅ Designed (Beta v0.7) |
| **Treasure Hunt Events** | Map-based QR & clue hunts (business-linked) | 💡 Should | 🕐 Planned |
| **Energy / Resource Mechanics** | Route search cost limiter with booster packs | 💡 Should | 🕐 Planned |
| **Vendor Collaboration Tools** | Claim listings, offer perks | 💡 Could | 🕐 Concept |
| **Offline Cache / Lite Mode** | Basic route view without live API | 💡 Could | 🕐 Future |

---

### Detailed Feature Requirements

### 1. Route Discovery & Planning

**Feature:** Plan routes between cities and discover restaurants along the way

**Requirements:**
- ✅ Enter start and end locations (autocomplete support)
- ✅ Calculate multiple route alternatives
- ✅ Display routes on interactive map
- ✅ Show route distance, duration, and summary
- ✅ Save and load favorite routes
- ✅ Multi-route support with route selection

**User Stories:**
- As a user, I want to enter my start and end locations and see route options
- As a user, I want to see restaurants along my chosen route
- As a user, I want to save routes for future reference

**Acceptance Criteria:**
- [ ] Route calculation completes within 5 seconds
- [ ] Multiple route alternatives displayed when available
- [ ] Routes can be saved and loaded from user account
- [ ] Map displays routes clearly with restaurant markers

---

### 2. Restaurant Discovery

**Feature:** Find restaurants along routes with detour calculations

**Requirements:**
- ✅ Display restaurants within 5km or 15min detour
- ✅ Show detour distance and time for each restaurant
- ✅ Filter by cuisine type, rating, halal status
- ✅ Display restaurant details (name, address, rating, photos)
- ✅ Select multiple restaurants for waypoint navigation
- ✅ View restaurant details in modal

**User Stories:**
- As a user, I want to see restaurants along my route with detour info
- As a user, I want to filter restaurants by cuisine and rating
- As a user, I want to see restaurant photos and details

**Acceptance Criteria:**
- [ ] Restaurants displayed within 5km or 15min detour
- [ ] Detour calculations accurate and fast
- [ ] Filtering works correctly for all criteria
- [ ] Restaurant details load within 2 seconds

---

### 3. Waypoint Navigation

**Feature:** Navigate via selected restaurants (Start → Restaurant → End)

**Requirements:**
- ✅ Select multiple restaurants as waypoints
- ✅ Generate navigation URL with waypoints
- ✅ Open in Google Maps app
- ✅ Smart navigation mode (start/preview based on location)

**User Stories:**
- As a user, I want to navigate through selected restaurants
- As a user, I want to see my route with waypoints on the map

**Acceptance Criteria:**
- [ ] Navigation URL generated correctly with waypoints
- [ ] Opens in Google Maps app successfully
- [ ] Smart navigation detects user proximity

---

### 4. Global Restaurant Search

**Feature:** Search entire restaurant database with advanced filters

**Requirements:**
- ✅ Search by name, cuisine, location
- ✅ Filter by rating, halal status, distance, price range
- ✅ Sort by rating, distance, newest, most reviews
- ✅ Display results in list and map view
- ✅ Pagination for large result sets

**User Stories:**
- As a user, I want to search for restaurants by name
- As a user, I want to filter restaurants by halal status and rating

**Acceptance Criteria:**
- [ ] Search results return within 2 seconds
- [ ] Filters work correctly in combination
- [ ] Results display correctly in both views

---

### 5. User Authentication & Profiles

**Feature:** User accounts with personalization

**Requirements:**
- ✅ Google OAuth login
- ✅ Email/Password registration and login
- ✅ User dashboard with activity tracking
- ✅ Profile management
- ✅ User-specific saved routes and favorites

**User Stories:**
- As a user, I want to create an account to save my routes
- As a user, I want to see my activity and saved routes

**Acceptance Criteria:**
- [ ] Login/registration completes within 3 seconds
- [ ] User data persists across sessions
- [ ] Dashboard displays accurate user statistics

---

### 6. Favorites System

**Feature:** Save and manage favorite restaurants

**Requirements:**
- ✅ Add restaurants to favorites
- ✅ View favorites list
- ✅ Soft delete with 24-hour restore
- ✅ Auto-cleanup after 24 hours
- ✅ Quick access from favorites tab

**User Stories:**
- As a user, I want to save my favorite restaurants
- As a user, I want to restore accidentally deleted favorites

**Acceptance Criteria:**
- [ ] Favorites save instantly
- [ ] Restore functionality works within 24 hours
- [ ] Favorites list loads quickly

---

### 7. Restaurant Submissions

**Feature:** Community-driven restaurant data

**Requirements:**
- ✅ Submit new restaurants (authenticated users)
- ✅ Google Places integration for auto-fill
- ✅ GPS location detection ("Locate Me")
- ✅ Manual override for all fields
- ✅ Photo upload support
- ✅ Admin review workflow

**User Stories:**
- As a user, I want to add restaurants that aren't in the database
- As an admin, I want to review and approve restaurant submissions

**Acceptance Criteria:**
- [ ] Submission form validates all required fields
- [ ] Google Places integration works correctly
- [ ] GPS location detection accurate
- [ ] Admin dashboard shows pending submissions

---

### 8. Admin Dashboard

**Feature:** Admin management and quality control

**Requirements:**
- ✅ Review restaurant submissions
- ✅ Approve/reject submissions
- ✅ Edit restaurant data
- ✅ View analytics and user activity
- ✅ Manage restaurant database

**User Stories:**
- As an admin, I want to review user submissions
- As an admin, I want to see app usage analytics

**Acceptance Criteria:**
- [ ] Admin dashboard accessible only to authorized users
- [ ] Review workflow efficient and clear
- [ ] Analytics display accurate data

---

### 9. Gamification System (v0.6 - Planned)

**Feature:** XP, levels, badges, and leaderboards

**Requirements:**
- [ ] XP (Experience Points) system
- [ ] User levels and progression
- [ ] Badges and achievements
- [ ] Check-in system for restaurants
- [ ] Leaderboards (global and friends)
- [ ] Challenges and quests
- [ ] User streaks
- [ ] Resource/Energy mechanics
- [ ] Booster packs (P2P optional purchases)

**User Stories:**
- As a foodie, I want to earn XP and badges by checking in, uploading photos, and adding reviews
- As a F2P user, I want to progress through skill and contribution, not only purchases
- As a P2P user, I want to buy optional booster packs to speed up progression

**Acceptance Criteria:**
- [ ] XP awarded for check-ins, reviews, submissions
- [ ] Badges unlock based on achievements
- [ ] Leaderboards update in real-time
- [ ] Energy system limits route searches (with booster packs)
- [ ] Gamification data tracked in Firebase

---

### 10. Treasure Hunt Events (v0.7 - Planned)

**Feature:** Map-based QR & clue hunts (business-linked)

**Requirements:**
- [ ] QR code scanning at restaurants
- [ ] Limited-time treasure hunt campaigns
- [ ] Event organizer dashboard
- [ ] Location-based clues and rewards
- [ ] Business partnership integration

**User Stories:**
- As an event organizer, I want to host limited-time treasure hunts or map campaigns to drive real-world engagement
- As a user, I want to participate in treasure hunts to earn special rewards

**Acceptance Criteria:**
- [ ] QR codes scan correctly at restaurant locations
- [ ] Events can be created and managed by organizers
- [ ] Users can participate and track progress
- [ ] Rewards distributed correctly

---

## 6. UX / Design Notes

- **Style:** Modern minimalist, clean lines, bright palette (not heavy red)
- **Logo:** "M" with right-slanted twin arcs (1st taller), dotted start → X end (map-trail motif)
- **Tone:** Friendly, community-first, trustworthy
- **Accessibility:** Mobile-first, readable contrast, simple navigation

---

## 7. Cost Optimization Requirements

### Firebase-First Architecture
- **Requirement:** Query Firestore before external APIs
- **Target:** 95% reduction in Google Places API calls
- **Implementation:** Firestore search → Google Places fallback → Auto-populate

### Haversine Distance Calculation
- **Requirement:** Use mathematical distance calculation instead of Distance Matrix API
- **Target:** 100% reduction in Distance Matrix API costs
- **Implementation:** Client-side Haversine formula with smart speed estimation

### Route Caching
- **Requirement:** Cache route calculations in Firestore
- **Target:** 90%+ cache hit rate for popular routes
- **Implementation:** Route index service with automatic caching

### Performance Targets
- **Search Speed:** < 2 seconds (Firestore) vs 3-5 seconds (Google Places)
- **Cache Hit Rate:** > 90% for indexed routes
- **API Cost:** < $50/month (from $1,110/month)

---

## 8. Technical Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + Tailwind CSS |
| **Backend** | Firebase Firestore + Functions |
| **Auth** | Firebase Authentication |
| **Maps** | Google Maps API (optimized Firestore-first) |
| **Deployment** | Firebase Hosting |
| **Analytics** | Custom event tracker (privacy-compliant) |

### Detailed Technical Requirements

### Frontend Stack
- **Framework:** React 18 with TypeScript
- **State Management:** React Context API
- **Maps:** Google Maps Platform (Directions, Places, Maps JavaScript API)
- **Styling:** CSS3 with TailwindCSS
- **Build:** Create React App

### Backend Stack
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Hosting:** Firebase Hosting
- **Backend Service:** Node.js/Express (optional, for advanced features)

### Third-Party Services
- **Maps:** Google Maps Platform
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Storage:** Firebase Storage (for photos)

### Environment & Configuration
- **Environment Variables:** Centralized in `foodie-simple/.env`
- **API Keys:** Secure configuration with restrictions
- **Build:** Production builds with environment injection

---

## 9. Platform Requirements

### Web Application
- **Primary Platform:** Progressive Web App (PWA)
- **Browser Support:** Chrome, Safari, Firefox, Edge (latest 2 versions)
- **Mobile Optimization:** Mobile-first responsive design
- **Performance:** Lighthouse score > 80

### Future Platforms
- **Mobile App:** React Native (planned)
- **Desktop:** Web app (current)

---

## 10. Security & Privacy Requirements

### Authentication
- **Requirement:** Secure user authentication
- **Implementation:** Firebase Auth with OAuth and email/password
- **Security:** Password hashing, secure session management

### Data Protection
- **Requirement:** Protect user data and API keys
- **Implementation:** Environment variables, Firestore security rules
- **Compliance:** GDPR, PDPA considerations

### Admin Access
- **Requirement:** Secure admin authentication
- **Implementation:** Environment-based admin configuration
- **Access Control:** Role-based access control

### Shariah Compliance
- **Business Model:** Founder Pass & Mudarabah Pool structure
- **Revenue:** Transparent, ethical monetization
- **Audit:** Ongoing compliance review and documentation

---

## 11. Success Metrics (KPIs)

| Category | Metric | Target |
|-----------|---------|--------|
| **Adoption** | Active users | 1,000 active users by Beta close |
| **Database Growth** | Eateries indexed | +1,000 eateries (50% user-submitted) |
| **Engagement** | Check-ins per user | 3 avg. check-ins per user / week |
| **Gamification** | Challenge completion | 70% users complete at least 1 challenge |
| **Cost Efficiency** | API usage | <RM100/month API usage |
| **API Cost Reduction** | Cost savings | 95%+ (from $37/day to $1.60/day) |
| **Cache Performance** | Cache hit rate | > 90% for indexed routes |

### Analytics & Monitoring

- **User Analytics:** Route searches, restaurant views, favorites, submissions, check-ins, XP earned
- **Performance Monitoring:** API costs, cache hit rates, response times
- **Error Tracking:** Application errors, API failures
- **Tools:** Firebase Analytics, Google Cloud Console, custom event tracking

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **API Cost Spikes** | Firestore-first + caching strategy |
| **User Drop-off** | Gamification + rewards cadence |
| **Vendor Skepticism** | Start with QR sticker pilot + incentives |
| **Feature Overload** | Phase-based rollout, clear changelog discipline |
| **Shariah Compliance** | Ongoing audit of Founder Pass / Pool structure |

---

## 13. Roadmap & Phase Planning

| Phase | Version | Timeframe | Focus Area | Key Deliverables |
|--------|----------|-----------|------------|------------------|
| 🥇 **MVP** | v0.5 | Oct 2025 | Core Build | Maps, Directory, Auth, Favorites, Admin Review |
| ⚙️ **Pre-Beta** | v0.6 | Nov 2025 | Gamification Alpha | XP system, badges, resource mechanics |
| 🗺️ **Beta** | v0.7 | Dec 2025 | Treasure Hunt Pilot | QR scan events, energy packs, limited campaigns |
| 🏪 **Vendor Phase** | v0.8 | Jan 2026 | Vendor & Collab Tools | Business onboarding, verified partners |
| 🌐 **Expansion** | v1.0 | Q2 2026 | Full Launch | Malaysia-wide rollout, marketplace integration |
| 💡 **Beyond** | v2.0 | Late 2026+ | Social Economy Layer | In-app economy, vendor rewards, regional scaling |

### Current Phase Details

**Phase 1: MVP (v0.5) ✅ Completed**
- ✅ Route discovery
- ✅ Restaurant discovery
- ✅ User authentication
- ✅ Favorites system
- ✅ Restaurant submissions
- ✅ Admin dashboard
- ✅ Cost optimization

**Phase 2: Pre-Beta (v0.6) ⏳ In Progress**
- [ ] XP system implementation
- [ ] Badges and achievements
- [ ] Check-in system
- [ ] Leaderboards
- [ ] Resource/Energy mechanics
- [ ] Booster packs (P2P)

---

## 14. Documentation Requirements

### User Documentation
- [ ] User guide
- [ ] FAQ
- [ ] Tutorial videos
- [ ] Help center

### Technical Documentation
- [x] README.md
- [x] CHANGELOG.md
- [x] PRD.md (this document)
- [x] GAMIFICATIONLOG.md (game design progress)
- [ ] API documentation
- [ ] Architecture documentation
- [ ] Funding docs (Founder Pass & Mudarabah Pool)
- [ ] Logo design notes ("Kawan Makan" M arc concept)

---

## ✅ Definition of Done

### Feature Completion
- [ ] Feature implemented and tested
- [ ] Code reviewed and merged
- [ ] Documentation updated
- [ ] User acceptance testing passed
- [ ] Deployed to production

### Quality Standards
- [ ] No critical bugs
- [ ] Performance targets met
- [ ] Accessibility standards met
- [ ] Security requirements met
- [ ] Cost targets maintained

---

## 📞 Stakeholders & Contacts

### Product Team
- **Product Owner:** [To be filled]
- **Developer:** [To be filled]
- **Designer:** [To be filled]

### Technical Team
- **Backend Lead:** [To be filled]
- **Frontend Lead:** [To be filled]
- **DevOps:** [To be filled]

---

## 15. Appendices & References

### Companion Documents
- 📄 [README.md](./README.md) — App setup & instructions
- 🧾 [CHANGELOG.md](./CHANGELOG.md) — Version history
- 🎮 [GAMIFICATIONLOG.md](./GAMIFICATIONLOG.md) — Game design progress
- 💼 Funding docs — Founder Pass & Mudarabah Pool
- 🔖 Logo design notes — "Kawan Makan" M arc concept

### Technical References
- [API_STATUS.md](../foodie-app/backend/API_STATUS.md) - Backend API status
- [ENV_MIGRATION.md](./ENV_MIGRATION.md) - Environment configuration

---

## 16. Stakeholders & Contacts

### Product Team
- **Product Owner:** @Founder (Project Lead)
- **Developer:** [To be filled]
- **Designer:** [To be filled]

### Technical Team
- **Backend Lead:** [To be filled]
- **Frontend Lead:** [To be filled]
- **DevOps:** [To be filled]

---

**End of PRD v0.1**  

_This PRD reflects the vision and requirements of Kawan Makan as of November 2025. It will evolve with subsequent milestones and changelog updates._

**Last Updated:** 5 November 2025  
**Next Review:** [To be scheduled]

