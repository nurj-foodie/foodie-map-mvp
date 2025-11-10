# 🗂️ Kawan Makan — Handoff Card for Cursor 2.0

**Project Name:** Kawan Makan (KM)  
**Phase:** Post-MVP stabilization → App Review Complete → Preparing for Gamification V2  
**Last Updated:** 8 November 2025

---

## 🎯 Goal

A community-driven food discovery app that maps eateries along travel routes, with social and gamified progression systems designed around halal, skill-based engagement (no gambling or riba elements).

---

## 📁 Key Repo Files

| File | Purpose |
|------|---------|
| **README.md** | High-level overview of Kawan Makan — vision, purpose, and tech stack |
| **CHANGELOG.md** | Full chronological dev record from MVP build (Oct 3–24, 2025). Keep this updated per session |
| **PRD.md** | Product Requirements Document — functional, UX, and technical scope of the app |
| **GAMIFICATIONLOG.md** | Dedicated log for Gamification V2 — player resources, challenges, and XP systems |
| **GAMIFICATION_LOG_UPDATE_TEMPLATE.md** | Template for structured updates to gamification progression and events |

---

## 🧭 Current Focus

1. **Stabilize MVP codebase** — ensure Maps (Google) remain primary and cost-optimized
2. **Integrate Gamification V2 layer** — resource farming, challenges, and event-based perks
3. **Plan Founder Pass & Mudarabah Pool integration** — non-interest funding, compliant terms
4. **Prepare beta test pipeline** — private testers before Founder Pass launch

---

## 🧠 Cursor Instructions

### When Analyzing Repo:

1. **Prioritize context from CHANGELOG.md** for continuity
2. **Use PRD.md** for requirement boundaries
3. **Log every new iteration** to CHANGELOG.md with proper versioning (v0.6, v0.7, etc.)
4. **For gamification logic or system balancing**, update GAMIFICATIONLOG.md
5. **Maintain Shariah guardrails** — no time-linked or chance-based mechanics

### Key Principles:

- ✅ **Firebase-first architecture** — Always check Firestore before external APIs
- ✅ **Cost optimization** — Maintain 95% API cost reduction
- ✅ **Shariah compliance** — No gambling, no riba, no speculative value
- ✅ **User contribution** — Reward exploration and contribution, not just consumption
- ✅ **Mobile-first** — All features must work on mobile devices

---

## 📊 Current Status

### ✅ Completed (v0.5 - MVP)
- Route discovery with Google Maps
- Restaurant discovery with detour calculations
- User authentication (Google OAuth + Email/Password)
- Favorites system with soft delete
- Restaurant submissions with admin review
- Admin dashboard
- Cost optimization (95% reduction)
- Firebase-first caching
- Mobile deployment (Firebase Hosting)

### ✅ Completed (v0.6.1 - App Review & Quality)
- R&R stops and petrol stations integration
- Saved routes in FavoritesTab (tabbed interface)
- Firestore location index for smart autocomplete
- Place type filtering (All, Restaurants, R&R, Petrol)
- Enhanced markers with colored backgrounds
- Comprehensive bug fixes (14 issues resolved)
- Haversine-first distance calculation
- 100km safety filter for edge cases
- Removed debug UI elements
- Optimized logging for performance

### ⏳ In Progress (v0.6 - Pre-Beta)
- Gamification system (XP, badges, levels)
- Check-in system
- Resource mechanics (Taste Tokens, Memory Shards, Journey Points, Flavor Gems)
- Daily/weekly challenges
- Leaderboards

### 🕐 Planned (v0.7+)
- Treasure Hunt events (QR code scanning)
- Energy/Resource mechanics with booster packs
- Alliance system (social features)
- Vendor collaboration tools

---

## 🔧 Technical Context

### Environment Configuration
- **Centralized .env:** `foodie-simple/.env` (all backend scripts use this)
- **Backend Helper:** `foodie-app/backend/loadEnv.js` (loads centralized .env)
- **API Keys:** Google Maps (frontend + backend), Firebase config

### Key Services
- `firestoreSearchService.js` — Firebase-first restaurant search
- `placeSearchService.js` — R&R stops and petrol stations search
- `locationIndexService.js` — Firestore location autocomplete
- `routeIndexService.js` — Route caching in Firestore (includes all place types)
- `distanceMatrixService.js` — Detour calculations (Haversine-first, Distance Matrix fallback)
- `gamificationService.js` — XP, badges, levels (in progress)
- `checkInService.js` — Check-in tracking (in progress)

### Important Notes
- **Google Maps is primary** — No Mapbox fallback (removed after issues)
- **Firebase-first** — Always query Firestore before external APIs
- **Cost target:** <RM100/month API usage
- **Cache hit rate target:** >90% for indexed routes

---

## 🚨 Critical Warnings

1. **DO NOT** introduce chance-based mechanics (gambling)
2. **DO NOT** add time-based interest/rewards (riba)
3. **DO NOT** make features pay-only (all must be earnable via gameplay)
4. **DO NOT** break Firebase-first architecture
5. **DO NOT** remove Google Maps without explicit approval

---

## 📝 Documentation Workflow

1. **Code changes** → Update `CHANGELOG.md`
2. **Gamification changes** → Update `GAMIFICATIONLOG.md` (use template)
3. **Feature requirements** → Update `PRD.md`
4. **Setup instructions** → Update `README.md`
5. **Session handoff** → Update this `HANDOFF_CARD.md`

---

## 🎯 Next Session Objective

Assist in preparing the Gamification V2 framework integration plan and begin implementation scaffolding under v0.6.

### Immediate Priorities:
1. Implement XP system (check-ins, photos, reviews)
2. Create badge progression logic
3. Build check-in service with GPS verification
4. Design resource drop mechanics
5. Create daily challenge system

---

## 📞 Quick Reference

### File Locations
- **Frontend:** `foodie-simple/src/`
- **Backend:** `foodie-app/backend/`
- **Config:** `foodie-simple/.env` (centralized)
- **Documentation:** `foodie-simple/*.md`

### Key Commands
```bash
# Start frontend
cd foodie-simple && npm start

# Start backend
cd foodie-app/backend && npm start

# Deploy to Firebase
cd foodie-simple && firebase deploy --only hosting
```

### Important URLs
- **Local Frontend:** http://localhost:3000
- **Local Backend:** http://localhost:3001
- **Production:** https://foodie-map-23842.web.app

---

## 🔗 Related Documents

- [PRD.md](./PRD.md) — Full product requirements
- [CHANGELOG.md](./CHANGELOG.md) — Version history
- [GAMIFICATIONLOG.md](./GAMIFICATIONLOG.md) — Game design log
- [README.md](./README.md) — Setup and overview

---

**Last Updated:** 8 November 2025  
**Maintained By:** @Founder (Project Lead)

---

## 💡 Session Tips

- **Always check CHANGELOG.md first** to understand recent changes
- **Refer to PRD.md** before implementing new features
- **Use GAMIFICATION_LOG_UPDATE_TEMPLATE.md** for gamification updates
- **Test on mobile** — app is mobile-first
- **Monitor API costs** — keep under RM100/month
- **Maintain Shariah compliance** — verify all mechanics

---

**End of Handoff Card**

