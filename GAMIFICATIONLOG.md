# 🎮 KAWAN MAKAN — GAMIFICATION LOG (v0.1)

**Version:** 0.1 (Concept Phase)  

**Last Updated:** 13 November 2025  
**Note:** This document has been updated to reflect new token naming conventions (straightforward) and separate Energy/Explorer token systems. See `GAMIFICATION_NAMING_DISCUSSION.md` for details.  
**Beta Phase Update:** K-Coins system added for beta phase (accumulation only). See `GAMIFICATION_BETA_v0.7.md` Section 4 and `BETA_PHASE_FLOW_PLAN_INTEGRATED.md` for details.

**Maintainer:** @Founder (Game Director)  

**Companion Files:** `PRD.md`, `CHANGELOG.md`, `README.md`, `GAMIFICATION_BETA_v0.7.md`, `GAMIFICATION_POST_BETA_v1.0.md`, `BETA_PHASE_FLOW_PLAN_INTEGRATED.md`

---

## 1. Overview

**Purpose:**  

This document outlines the design, progression, and behavioral systems behind Kawan Makan's gamified ecosystem — how users earn, level up, and engage with the world through food discovery.

**Design Philosophy:**  

Reward contribution, not just consumption.  

Encourage exploration, consistency, and community — all while keeping gameplay halal, transparent, and purposeful.

---

## 2. Core Gameplay Loop

| Step | Player Action | System Response | Reward |
|------|----------------|------------------|---------|
| 1 | Search food route / explore eateries | Map renders valid locations | Base XP + small resource drop |
| 2 | Check-in at restaurant | Verifies GPS + timestamp | XP, resources, streak counter |
| 3 | Upload photo / review | Validated and stored | Bonus XP + community badge progress |
| 4 | Add new location | Admin verifies submission | Major XP, resource drop, contribution badge |
| 5 | Participate in event (Treasure Hunt) | QR code or GPS quest | Special item, badge, or perk pack |

💡 *Key Loop:* **Explore → Engage → Earn → Upgrade → Repeat**

---

## 3. Level & XP System (v1 Prototype)

| Level Range | XP Required | Unlocks / Benefits |
|--------------|-------------|--------------------|
| 1–5 | 0–500 | Base features (search, check-in, upload) |
| 6–10 | 500–1,500 | Access to daily quests + badge progress |
| 11–20 | 1,500–5,000 | Unlock "Route Explorer" tier (early access features) |
| 21–30 | 5,000–15,000 | Access to treasure hunt events, alliance system |
| 30+ | 15,000+ | Prestige levels, Founder-only access, visual cosmetics |

🧮 **XP Sources**

- Check-in: +20 XP  
- Photo upload: +40 XP  
- Review: +50 XP  
- Add new eatery: +100 XP  
- Complete daily challenge: +75 XP  
- Complete event: +200–1000 XP  

---

## 4. K-Coins System (Beta Phase)

### Overview

K-Coins are a reward currency introduced during beta phase. During beta, K-Coins accumulate only (no spending). Post-beta, K-Coins convert to premium features, in-app purchases, and tokens.

### Beta Phase Earning

| Action | K-Coins Reward | Notes |
|--------|---------------|-------|
| Join waitlist | +25 K-Coins | Automatic on signup |
| Refer a friend (waitlist) | +100 K-Coins | When referred user joins waitlist |
| Complete survey | +50 K-Coins | 30-second survey (device, frequency, corridor) |
| Travel package draw | Variable | Monthly winner (top referrers) |

### Post-Beta Conversion

- **Premium Features:** Filters (100/month), Offline Cache (50/month), Feature Voting (25/vote)
- **In-App Purchases:** Energy Boosters (50), Route Credits (30), Token Conversion (10 K-Coins = 1 Token)
- **Gamification Integration:** Convert to Food/Photo/Review/Explorer tokens, XP Boosters, Challenge Skips

**See:** `GAMIFICATION_BETA_v0.7.md` Section 4 and `BETA_PHASE_FLOW_PLAN_INTEGRATED.md` Section 3.4 for full details.

---

## 5. Resource System (v2 Integration Plan)

### Token Types (Four Core Resources)

| Token | Source | Usage | Notes |
|-------|--------|-------|-------|
| 🍽️ **Food** | Check-ins | Required for leveling (token crafting) | Core progression resource |
| 📸 **Photo** | Photo uploads | Required for leveling + crafting | Encourages sharing |
| ✍️ **Review** | Reviews | Required for leveling | Quality content reward |
| 📍 **Explorer** | Route discoveries | Required for leveling | Exploration reward |

### Energy System (Separate from Tokens and K-Coins)

| Resource | Purpose | Usage | Notes |
|---------|---------|-------|-------|
| ⚡ **Energy** | API cost control | Route searches (costs 10⚡), multi-stop routes (15⚡) | Prevents API abuse |
| | | Regeneration: +20⚡/hour, daily cap 100⚡ | Can be crafted (Energy Drinks) |
| 💰 **K-Coins** | Reward currency | Beta accumulation only, post-beta conversion | Separate from Energy and Tokens |

**Key Distinction:**
- **Tokens (Food, Photo, Review, Explorer):** Used for progression (leveling via crafting)
- **Energy (⚡):** Used for API-heavy operations (route searches)
- **Separate systems:** No conflict between progression and utility

### Level-Up Requirement Example (Post-Beta):

> Level 4 → Level 5 requires:  
> 4🍽 Food + 2📸 Photo + 1✍️ Review = *token crafting-based leveling*, not just XP.

### XP Migration Plan

**Beta Phase (v0.7):**
- XP-based progression (temporary)
- Earn XP from actions (check-in +20 XP, photo +40 XP, etc.)
- Level up based on total XP

**Post-Beta Migration (v1.0+):**
- **XP disappears** (converted to tokens)
- **One-time conversion:**
  - Check-ins in history → Food tokens
  - Photos in history → Photo tokens
  - Reviews in history → Review tokens
  - Routes in history → Explorer tokens
- **Beta tester bonus:** +10% bonus tokens for beta participation
- **Post-beta:** Only tokens tracked (XP removed from UI)

---

## 5. Challenges & Events

### 🗓️ Daily Challenges

- Visit 2 new eateries today → +75 XP  
- Upload 3 photos → +60 XP  
- Write 1 verified review → +50 XP  

### 📅 Weekly Challenges

- 5 check-ins in new districts  
- 1 new restaurant submission  
- Participate in 1 Treasure Hunt event  

### 🧭 Treasure Hunt (Event Mode)

- **Trigger:** Special map zones during campaigns  
- **Mechanics:** Scan QR → answer clue → check-in  
- **Rewards:** Event badge + bonus XP + Food token + Photo token  
- **Collaboration:** Linked with partnered vendors  
- **Purpose:** Drive real-world traffic & vendor participation

**Note:** In post-beta (v1.0+), rewards will be token-based instead of XP-based. See XP Migration Plan above.  

---

## 6. Badges & Achievements

### Progression Badges (Explorer)

| Badge | Requirement | Type |
|--------|--------------|------|
| 🥾 **Explorer I** | Visit 10 eateries | Progression |
| 🥾 **Explorer II** | Visit 25 eateries | Progression |
| 🥾 **Explorer III** | Visit 50 eateries | Progression |
| 🥾 **Explorer IV** | Visit 100 eateries | Progression |
| 🥾 **Explorer V** | Visit 200 eateries | Progression |
| 🥾 **Explorer VI** | Visit 500 eateries | Progression |
| 🥾 **Explorer VII** | Visit 1000 eateries | Progression |

**Note:** Explorer badges use balanced progression (10/25/50/100/200/500/1000) for post-beta. Beta uses easier progression (5/15/30/60/100) for early engagement.

### Contribution Badges (Memory Keeper - Photos)

| Badge | Requirement | Type |
|--------|--------------|------|
| 📸 **Memory Keeper I** | Upload 10 photos | Contribution |
| 📸 **Memory Keeper II** | Upload 25 photos | Contribution |
| 📸 **Memory Keeper III** | Upload 50 photos | Contribution |
| 📸 **Memory Keeper IV** | Upload 100 photos | Contribution |
| 📸 **Memory Keeper V** | Upload 200 photos | Contribution |

### Skill Badges (Food Critic - Reviews)

| Badge | Requirement | Type |
|--------|--------------|------|
| ✍️ **Food Critic I** | Write 5 reviews | Skill |
| ✍️ **Food Critic II** | Write 10 reviews | Skill |
| ✍️ **Food Critic III** | Write 25 reviews | Skill |
| ✍️ **Food Critic IV** | Write 50 reviews | Skill |
| ✍️ **Food Critic V** | Write 100 reviews | Skill |

### Contribution Badges (Local Hero - Eatery Submissions)

| Badge | Requirement | Type |
|--------|--------------|------|
| 🧑‍🍳 **Local Hero I** | Add 1 verified eatery | Contribution |
| 🧑‍🍳 **Local Hero II** | Add 3 verified eateries | Contribution |
| 🧑‍🍳 **Local Hero III** | Add 5 verified eateries | Contribution |
| 🧑‍🍳 **Local Hero IV** | Add 10 verified eateries | Contribution |
| 🧑‍🍳 **Local Hero V** | Add 20 verified eateries | Contribution |

### Event Badges

| Badge | Requirement | Type |
|--------|--------------|------|
| 🎯 **Treasure Hunter I** | Complete 1 treasure hunt | Event |
| 🎯 **Treasure Hunter II** | Complete 3 treasure hunts | Event |
| 🎯 **Treasure Hunter III** | Complete 5 treasure hunts | Event |
| 🎯 **Treasure Hunter IV** | Complete 10 treasure hunts | Event |
| 🎯 **Treasure Hunter V** | Complete 20 treasure hunts | Event |

### Special Badges

| Badge | Requirement | Type | Perks |
|--------|--------------|------|-------|
| 💎 **Founder Tier** | Early supporter / pass holder | Exclusive | See [Special Perks](#special-perks) |
| 💎 **Beta Tester** | Participated in beta testing | Exclusive | See [Special Perks](#special-perks) |
| 🎬 **Video Creator** | Upload 1 video (future feature) | Contribution | - |
| 🎬 **Video Creator II** | Upload 5 videos (future feature) | Contribution | - |
| 🎬 **Video Creator III** | Upload 10 videos (future feature) | Contribution | - |
| 🏆 **Event Champion** | Complete special event (future feature) | Event | - |

### Special Perks

#### Founder Tier Perks

**Digital Perks:**
- ⚡ **Energy Bonus:** +10 Energy per day (added to daily cap: 100⚡ → 110⚡)
- 🍽️ **Token Bonus:** +10% permanent bonus tokens from all actions
- 🚀 **Early Feature Access:** New features available 1 week before general release
- 📱 **Priority Support:** Faster response to support tickets (24-48 hours vs 3-5 days)
- 🎨 **Cosmetic Perks:** Animated badge, gold username, profile frame, "Founder" rank title
- 📊 **Advanced Analytics:** Detailed stats dashboard (future feature)
- 💬 **Founder Forum:** Exclusive community access (future feature)

**Real-World Perks (Future - After Partnerships):**
- 🍽️ **10% discount** at partner restaurants (monthly) - *Pending vendor partnerships*
- 🎫 **Free meal voucher** (quarterly, 1 per quarter) - *Pending vendor partnerships*
- 🎁 **VIP access** to food festivals (free entry) - *After partnerships established*

**Physical Merchandise (Available Now):**
- 🎨 **Founder Pin/Badge** (one-time, included in Founder Pass)
- 🎨 **Founder Tote Bag** (one-time, included in Founder Pass)
- 🎨 **Founder Take-Away Pack** (one-time, event-based, no sizing required)
- 🎨 **Founder Certificate** (digital + physical, included in Founder Pass)
- **Budget:** RM30 per user for physical merchandise

**Events (Available Now):**
- 🎉 **Simple foodie food taste events** (quarterly, exclusive Founder meetup)
- 🎉 **Founder meetup** (quarterly, community building)

**Special Achievement Rewards (Limited):**
- ✈️ **Travel Package** (limited, depends on achievements during beta/post-beta)
  - Criteria: Top performers, special milestones, community contributions
  - Availability: Limited quantity, achievement-based

**Founder Pass Pricing:**
- **Initial Plan:** RM300 for 500 lots
- **Current Plan:** RM100 per Founder Pass
- **Availability:** Limited quantity (500 lots initially)

**Total Value:** ~RM200-300/year (current: merchandise + events) | ~RM500-800/year (future: with discounts + vouchers)

#### Beta Tester Perks

**Digital Perks:**
- ⚡ **Energy Bonus:** +5 Energy per day (added to daily cap: 100⚡ → 105⚡)
- 🍽️ **Token Bonus:** +5% permanent bonus tokens from all actions
- 🎮 **Beta Feature Access:** Access to beta gamification features for testing
- 🎨 **Cosmetic Perks:** Special badge, blue username, profile badge highlight, "Beta Tester" rank title
- 💬 **Beta Tester Forum:** Community access (future feature)
- 💎 **Migration Bonus:** +10% bonus tokens during XP-to-tokens migration (already documented)

**Real-World Perks (Future - After Partnerships):**
- 🍽️ **5% discount** at partner restaurants (monthly) - *Pending vendor partnerships*
- 🎫 **Free drink voucher** (quarterly, 1 per quarter) - *Pending vendor partnerships*
- 🎁 **Free entry** to food festivals (standard access) - *After partnerships established*

**Physical Merchandise (Available Now):**
- 🎨 **Beta Tester Pin/Badge** (one-time, included in beta participation)
- 🎨 **Beta Tester Tote Bag** (one-time, included in beta participation)
- 🎨 **Beta Tester Certificate** (digital, included in beta participation)
- **Budget:** RM30 per user for physical merchandise

**Events (Available Now):**
- 🎉 **Simple foodie food taste events** (bi-annually, Beta Tester meetup)
- 🎉 **Beta Tester meetup** (bi-annually, community building)

**Special Achievement Rewards (Limited):**
- ✈️ **Travel Package** (limited, depends on achievements during beta/post-beta)
  - Criteria: Top performers, special milestones, community contributions
  - Availability: Limited quantity, achievement-based

**Upgrade Path to Founder:**
- **Beta Tester Discount:** Depends on achievements during beta phase
- **Founder Pass Price:** RM100 (RM300 initial plan adjusted)
- **Upgrade Value:** ~RM300-500/year more value (with future discounts + vouchers)

**Total Value:** ~RM100-150/year (current: merchandise + events) | ~RM200-300/year (future: with discounts + vouchers)

**Note:** See `SPECIAL_PERKS_DISCUSSION.md` and `TANGIBLE_REWARDS_DISCUSSION.md` for detailed perk analysis.

**Note:** Badge progression requirements are subject to adjustment based on beta testing data and user engagement patterns. See `BADGE_PROGRESSION_DISCUSSION.md` for detailed analysis. Future features will add more badge types (video upload, special events, etc.).

---

## 7. F2P vs P2P Balance Model

| Category | F2P Players | P2P Players |
|-----------|--------------|--------------|
| Access | Full gameplay, slower progression | Faster XP gain, boosters |
| Currency | Earn tokens via activity | Option to buy perk packs |
| Rewards | Regular challenges & badges | Special packs & cosmetics |
| Fairness | "No paywall" policy | Only time-saving perks |
| Longevity | Encouraged via streaks, events | Retained via seasonal drops |

---

## 8. Alliance System (Future Concept)

| Feature | Description |
|----------|--------------|
| **Alliance Creation** | Users form small guilds of 10–30 members |
| **Territory Claim** | Local check-in clusters = team influence zone |
| **Alliance Tasks** | Shared objectives for collective bonuses |
| **Contribution Pool** | Members contribute resources to upgrade alliance level |
| **Rewards** | Collective XP bonuses + rare item unlocks |

*(Scheduled for v1.2 or later — social expansion phase.)*

---

## 9. Ethical & Shariah Guardrails

| Principle | Implementation |
|------------|----------------|
| No gambling / chance | All rewards earned through effort or contribution |
| No speculative value | Points & resources have no monetary or tradable value |
| No riba / interest | Time-based progress only (no "interest" rewards) |
| Transparent perks | Paid perks = fixed digital items (e.g., boosters, energy) |
| Fair access | All features achievable through gameplay, no pay-only lockouts |

---

## 10. Version History

| Version | Date | Focus | Status |
|----------|------|--------|--------|
| v0.1 | Nov 2025 | Base XP, resource & event model | ✅ Established |
| v0.2 | Dec 2025 | Add daily challenges + Treasure Hunt events | 🕐 Planned |
| v0.3 | Jan 2026 | Resource-driven level-up + packs store | 🕐 Concept |
| v0.4 | Feb 2026 | Social alliances & territory mechanics | 🕐 Future |
| v1.0 | Q2 2026 | Full gamified release with vendor integration | 🕐 Roadmap |

---

**End of GAMIFICATIONLOG v0.1**  

_This document evolves alongside Kawan Makan's game systems and user engagement features. Each update is logged here to ensure progression consistency and ethical gameplay alignment._

