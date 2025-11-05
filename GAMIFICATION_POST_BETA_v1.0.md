# 🎮 KAWAN MAKAN — GAMIFICATION POST-BETA v1.0+ (Refinement)

**Version:** 1.0+ (Post-Beta Refinement)  
**Last Updated:** 5 November 2025  
**Maintainer:** @Founder (Game Director)  
**Based On:** Gamification V2 Draft  
**Companion Files:** `GAMIFICATIONLOG.md`, `GAMIFICATION_BETA_v0.7.md`, `PRD.md`

---

## 1. Overview

**Purpose:**  

Full gamification system post-beta — refined based on beta testing data and feedback. This is the complete v2 system with all advanced features.

**Design Philosophy:**  

Resource-based progression with token crafting, quality-first photo sets, and sophisticated anti-abuse measures. Ego-safe, Spark-tier-friendly, ready for production.

**Post-Beta Goals:**
- Implement full resource economy (4 token types)
- Add token crafting for leveling
- Launch Photo Sets system (A/B/C structure)
- Enable Energy Drink crafting
- Deploy Treasure Hunts (QR codes)
- Refine anti-abuse based on beta data

---

## 2. Core Gameplay Loop (Post-Beta)

| Step | Player Action | System Response | Reward |
|------|----------------|------------------|---------|
| 1 | Search food route | Map renders valid locations | Base XP + Explorer token + Energy cost |
| 2 | Check-in at restaurant | Verifies GPS + dwell + speed | Food token + XP |
| 3 | Upload photo (A/B/C set) | Validated and stored | Photo token + XP + set bonus |
| 4 | Write review | Validated and stored | Review token + XP |
| 5 | Craft level-up | Consume tokens | Level up + unlock features |
| 6 | Participate in Treasure Hunt | QR scan + quest | Special rewards + event badge |

💡 *Key Loop:* **Explore → Collect Tokens → Craft Level-Up → Unlock Features → Repeat**

---

## 3. Resource Economy (Post-Beta)

### Four Token Types

| Token | Source | Usage | Notes |
|-------|--------|-------|-------|
| 🍽️ **Food** | Check-ins | Required for leveling | Core progression resource |
| 📸 **Photo** | Photo uploads | Required for leveling + crafting | Encourages sharing |
| ✍️ **Review** | Reviews | Required for leveling | Quality content reward |
| 📍 **Explorer** | Route discoveries | Required for leveling | Exploration reward |

### Token Minting (Per Action)

| Action | 🍽 Food | 📸 Photo | ✍️ Review | 📍 Explorer | Notes |
|--------|---------|----------|-----------|-------------|-------|
| Check-in (existing) | +1 | 0 | 0 | 0 | 1 per venue per 2h; dwell+speed required |
| First-time check-in (new) | +2 | 0 | 0 | +1 | geo/dupe guard |
| Upload photo (unique) | 0 | +1 | 0 | 0 | PQS quality gate |
| Quality review (≥120 chars) | 0 | 0 | +1 | 0 | NLP quality gate |
| Route contribution (new) | 0 | 0 | 0 | +2 | cache miss + acceptance |
| Map edit accepted | 0 | 0 | 0 | +1 | moderator/trust gate |
| Treasure QR (on-site) | +1 | +1 | 0 | 0 | event-only |

### Trust Ramp

- **New accounts:** Mint at 50% until 3 approved actions
- **Trust score:** Calculated from approved actions
- **Formula:** Base 10 + (5×check-ins) + (10×photos) + (15×reviews) + (20×new locations)
- **Max trust score:** 100 points

---

## 4. Leveling via Token Crafting (Post-Beta)

### L1 → L10 (Soft Incremental)

| Level | Offer to Level Up |
|-------|-------------------|
| 1→2 | 2🍽 + 1📸 |
| 2→3 | 3🍽 + 1📸 + 1✍️ |
| 3→4 | 3🍽 + 2📸 + 1✍️ |
| 4→5 | 4🍽 + 2📸 + 1✍️ |
| 5→6 | 4🍽 + 2📸 + 2✍️ + 1📍 |
| 6→7 | 5🍽 + 2📸 + 2✍️ + 1📍 |
| 7→8 | 5🍽 + 3📸 + 2✍️ + 1📍 |
| 8→9 | 6🍽 + 3📸 + 2✍️ + 2📍 |
| 9→10 | 6🍽 + 3📸 + 3✍️ + 2📍 |

### L11 → L30 (Steady Rhythm)

- **Every 2 levels:** Add +1🍽 and +1✍️
- **Photo additions:** +1📸 at L14, L18, L24
- **Explorer additions:** +1📍 at L15, L19, L27

### Time Targets

- **Casual:** L30 in ~6–8 weeks
- **Enthusiast:** L30 in ~4–5 weeks
- **Active weekends:** Can spike faster

---

## 5. Check-In System (Post-Beta - Advanced)

### Advanced Rules

- **Per-venue cooldown:** 2 hours between check-ins at same venue
- **Daily cap:** 8 check-ins/day (tokened) — refined from beta data
- **Dwell time:** Venue-type specific
  - Kiosk: 7–10 minutes
  - Café: 12–15 minutes
  - Dine-in: 15–20 minutes
- **Speed check:** ≤3 km/h (walking speed)
- **Motion sanity:** Low-speed window required before approval

### Anti-Abuse (Post-Beta - Advanced)

- **Burst limiter:** ~4 check-ins/hour across venues (beyond that = 0 tokens)
- **Near-venue bounce guard:** Within 150m, require ≥12m between different venues
- **GPS verification:** Within 100m of venue
- **Timestamp validation:** Prevents time manipulation

---

## 6. Photo Sets System (Post-Beta)

### Set Structure

**Three photo types per venue:**
- **A) Ambience/Exterior** — Restaurant atmosphere
- **B) Dish Close-up** — Food presentation
- **C) Menu/Price** — Pricing information

### Rewards

| Action | Reward | Notes |
|--------|--------|-------|
| First approved set (A+B+C) | +2📸 | One-time per venue |
| Single good photo (no set) | +1📸 | First of day |
| Extra photos after set | Spice only | Cap 3/venue/day (cosmetics/energy) |

### Quality Gates

- **PQS (Photo Quality Score):** Sharpness, lighting, no watermarks/faces
- **Duplicate detection:** Hash-based duplicate prevention
- **Weekly variety bonus:** ≥4 sets across 4 distinct venues in 7 days → +1📸 (once/week)

---

## 7. Energy Economy (Post-Beta - Full)

### Energy Costs

| Action | Energy Cost | Notes |
|--------|-------------|-------|
| Route search (1–2 cities) | 10⚡ | API-heavy operation |
| Multi-stop route | 15⚡ | More complex route |
| Add new location | 5⚡ | Submission cost |
| Check-in | 0⚡ | Free (encourages engagement) |
| Upload photo | 0⚡ | Free (encourages contribution) |
| Write review | 0⚡ | Free (encourages contribution) |

### Energy Regeneration

- **Base Regen:** +20⚡ per hour
- **Daily Cap:** 100⚡
- **Full Recharge:** 5 hours (from 0 to 100)
- **Daily Login Bonus:** +20⚡ (encourages daily return)

### Energy Crafting (Post-Beta)

**Energy Drink Crafting:**
- **Recipe:** 2🍽 + 1📸 → +30⚡
- **Cooldown:** Once per day
- **Purpose:** Comfort, not power (F2P can still progress)

### Soft Surcharge

- **After 3 routes/hour:** Add +5⚡ per extra route
- **Purpose:** Discourage API hammering while keeping play fair

---

## 8. Treasure Hunts (Post-Beta)

### Eligibility

- **Account age:** ≥3 days OR trustScore ≥20
- **Location:** Within 100m of treasure venue
- **Speed:** ≤3 km/h (walking speed)
- **Dwell:** ~5 minutes at venue

### Pre-Scan Requirements (Choose One)

**Option 1:** Valid check-in at this venue in last 60 minutes

**Option 2:** Any 2 of:
- PQS photo uploaded
- ≥120-character review
- Same-day check-in (any venue)

### Frequency Limits

- **Per venue:** 1 scan/day
- **Daily max:** 5 scans/day across all venues

### QR Integrity

- **Rotating nonce:** Server-side validation
- **Time window:** 4-hour epoch
- **Device signature:** Prevents screenshot abuse
- **Screenshots fail:** QR codes expire quickly

### Rewards

- **Base:** +1🍽 + 1📸 + small Spice
- **Sponsor voucher:** 10% drop rate
- **City chain bonus:** 3 different treasure venues in 72h → event badge

### Optional Sink

- **Weekly Hunt Pass:** Entry cost 2📍 (optional premium feature)

---

## 9. Badges & Achievements (Post-Beta)

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

### Event Badges (Treasure Hunter)

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

### Future Feature Badges

| Badge | Requirement | Type | Status |
|--------|--------------|------|--------|
| 🎬 **Video Creator I** | Upload 1 video | Contribution | 🕐 Planned |
| 🎬 **Video Creator II** | Upload 5 videos | Contribution | 🕐 Planned |
| 🎬 **Video Creator III** | Upload 10 videos | Contribution | 🕐 Planned |
| 🎬 **Video Creator IV** | Upload 25 videos | Contribution | 🕐 Planned |
| 🎬 **Video Creator V** | Upload 50 videos | Contribution | 🕐 Planned |
| 🏆 **Event Champion** | Complete special event | Event | 🕐 Planned |
| 🏆 **Seasonal Champion** | Complete seasonal event | Event | 🕐 Planned |
| 🎉 **Festival Master** | Participate in food festival | Event | 🕐 Planned |

**Note:** Badge system will evolve with new features. Future badges will be added for video uploads, special events, seasonal campaigns, and other planned features.

---

## 10. Leaderboards & Ego Safety (Post-Beta)

### Leaderboard Types

- **Friends-only** (default)
- **Skill brackets** (L1–3, L4–6, L7–10, L11–15, L16–20, L21–30, L30+)
- **Personal Best boards** (always visible)
  - Best month
  - Longest chain
  - Most check-ins in a day
- **Global boards** (opt-in only)

### Ego Safety Features

- **No demotions** for inactivity
- **Personal progress** always visible
- **Achievement highlights** (not just rankings)
- **Friend comparisons** (not global competition)

---

## 11. Anti-Abuse & Trust (Post-Beta - Full)

### Location Verification

- **Geofence:** 100m radius
- **Dwell time:** Venue-type specific (7–20 minutes)
- **Speed check:** ≤3 km/h
- **Motion sanity:** Low-speed window required

### Content Verification

- **Review NLP:** Length (≥120 chars), quality, duplicate detection
- **Photo PQS:** Sharpness, lighting, no watermarks/faces
- **Duplicate hashing:** Prevents duplicate submissions

### Route Integrity

- **Cache keys:** Replay detection
- **Soft cooldowns:** Prevents route spam
- **Surcharges:** After 3 routes/hour, add +5⚡ per extra

### Trust System (Post-Beta - Full)

- **Trust score formula:**
  - Base: 10 points
  - +5 per approved check-in
  - +10 per approved photo
  - +15 per approved review
  - +20 per approved new location
  - Max: 100 points
- **Trust ramp:** New accounts mint 50% tokens until 3 approved actions
- **Penalty ladder:**
  1. Warning
  2. Token revoke for fraudulent items
  3. Temp energy lock (24h)
  4. Suspension (with appeal process)

---

## 12. Challenges & Events (Post-Beta)

### Daily Challenges

- Visit 2 new eateries today → +75 XP + 1🍽
- Upload 3 photos → +60 XP + 1📸
- Write 1 verified review → +50 XP + 1✍️

### Weekly Challenges

- 5 check-ins in new districts → +150 XP + 2🍽
- 1 new restaurant submission → +100 XP + 1📍
- Complete 3 Treasure Hunts → Event badge + 2📍

### Seasonal Events

- **Monthly Food Festival:** Special challenges and rewards
- **City-specific events:** Location-based campaigns
- **Partner events:** Vendor-sponsored treasure hunts

---

## 13. F2P vs P2P Balance (Post-Beta)

| Category | F2P Players | P2P Players |
|-----------|--------------|--------------|
| **Access** | Full gameplay, slower progression | Faster progression, boosters |
| **Currency** | Earn tokens via activity | Option to buy perk packs |
| **Rewards** | Regular challenges & badges | Special packs & cosmetics |
| **Fairness** | "No paywall" policy | Only time-saving perks |
| **Longevity** | Encouraged via streaks, events | Retained via seasonal drops |
| **Energy** | Earn via gameplay + crafting | Option to buy Energy packs |
| **Crafting** | Full access to all recipes | No exclusive recipes |

**Key Principle:** All features achievable via gameplay, P2P only saves time

---

## 14. Beta → Post-Beta Refinements

### Based on Beta Data

#### Check-In System
- **Beta:** 6 check-ins/day
- **Post-Beta:** 8 check-ins/day (if data supports it)
- **Refinement:** Venue-type specific dwell times

#### Energy Economy
- **Beta:** Basic regen (20⚡/hour)
- **Post-Beta:** Add Energy Drink crafting (2🍽 + 1📸 → +30⚡)
- **Refinement:** Daily login bonus + crafting options

#### Leveling System
- **Beta:** Simple XP-based
- **Post-Beta:** Resource-based token crafting
- **Refinement:** Balanced token requirements per level

#### Photo System
- **Beta:** Simple photo upload (+40 XP)
- **Post-Beta:** Photo Sets (A/B/C) with quality gates
- **Refinement:** Set bonuses + weekly variety bonus

#### Anti-Abuse
- **Beta:** Basic GPS + dwell (5 minutes)
- **Post-Beta:** Advanced dwell (venue-type specific) + speed checks
- **Refinement:** Near-venue bounce guard + burst limiters

---

## 15. Post-Beta Success Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| **DAU Growth** | +40–50% | Daily active users |
| **Route cache hit** | ≥60% by week 6 | Cost efficiency |
| **Avg. cost/session** | ≤RM0.05 | API cost control |
| **Event participation** | ≥25% MAU | Treasure Hunt engagement |
| **F2P→P2P conversion** | 8–12% | Comfort-driven, not power |
| **Token crafting usage** | 70%+ users craft level-ups | Engagement metric |
| **Photo Sets completion** | 40%+ users complete sets | Quality content |
| **Trust score average** | 50+ points | Community trust |

---

## 16. Ethical Guardrails (Post-Beta)

| Principle | Implementation |
|------------|----------------|
| **No chance-based mechanics** | All rewards earned through effort or contribution |
| **No speculative value** | Tokens and Energy have no monetary or tradable value |
| **No riba / interest** | Time-based progress only (no "interest" rewards) |
| **Transparent perks** | Paid perks = fixed digital items (boosters, energy) |
| **Fair access** | All features achievable through gameplay, no pay-only lockouts |
| **No gambling** | No random chance, all outcomes based on actions |
| **Shariah compliance** | Ongoing audit and documentation |

---

## 17. Architecture & Cost (Post-Beta)

### Current (Spark Tier)

- **Client Haversine ETA:** Free distance calculations
- **Firestore cache-first:** 95% cost reduction
- **Distance Matrix on miss:** Only when needed
- **Cloud Functions:** Validate mints, leaderboard snapshots

### Future (Blaze Tier)

- **Cron jobs:** Re-verify top routes
- **Batched leaderboards:** Performance optimization
- **Scheduled challenges:** Automated resets
- **Image processing pipeline:** Photo quality checks

### Cost Targets

- **API usage:** <RM100/month
- **Cache hit rate:** ≥60%
- **Cost per session:** ≤RM0.05

---

## 18. Tunable Dials (Post-Beta)

| Dial | Default | Range | Notes |
|------|---------|-------|-------|
| **Daily check-ins** | 8 | 6–10 | Adjust based on abuse data |
| **Dwell time (kiosk)** | 7–10 min | 5–15 min | Venue-type specific |
| **Dwell time (café)** | 12–15 min | 10–20 min | Venue-type specific |
| **Dwell time (dine-in)** | 15–20 min | 12–25 min | Venue-type specific |
| **Burst limit** | 4/hour | 3–6/hour | Anti-abuse measure |
| **Energy regen** | 20⚡/hour | 15–25⚡/hour | Balance gameplay |
| **Treasure Hunt drop rate** | 10% | 5–15% | Sponsor vouchers |
| **Trust ramp duration** | 3 actions | 2–5 actions | New account protection |

---

## 19. Open Questions (Post-Beta)

### For Partner Review

1. **Daily check-ins:** Keep at 8, or adjust based on beta data?
2. **L1–10 recipes:** Finalize based on beta progression data
3. **Energy Drink crafting:** Adjust value (30⚡) or ingredients (2🍽+1📸)?
4. **Treasure Hunt pre-reqs:** Finalize "check-in-first" vs "2-action alternative"
5. **Sponsor needs:** Voucher % caps, city-only events, etc.

### For Implementation

1. **Photo Sets UI:** How to display A/B/C progress?
2. **Token crafting UI:** Visual crafting interface design?
3. **Treasure Hunt UI:** QR scanner integration?
4. **Leaderboard UI:** How to display brackets and personal bests?
5. **Energy display:** How to show regen rate and crafting options?

---

## 20. Migration from Beta

### Data Conversion

- **XP → Resources:** Convert based on activity history
  - Check-ins → Food tokens
  - Photos → Photo tokens
  - Reviews → Review tokens
  - Routes → Explorer tokens
- **Levels:** Maintain current levels
- **Badges:** Preserve all unlocked badges
- **Energy:** Convert to new system (with bonus for beta testers)

### Feature Rollout

1. **Week 1:** Resource economy + token crafting
2. **Week 2:** Photo Sets system
3. **Week 3:** Energy Drink crafting
4. **Week 4:** Treasure Hunts (pilot)
5. **Week 5:** Full v2 launch

### Beta Tester Bonuses

- **Founder badge:** Exclusive for beta testers
- **Bonus tokens:** Extra resources for migration
- **Early access:** First to try new features
- **Special cosmetics:** Beta tester exclusive items

---

## 21. Summary

**Post-Beta v1.0+ delivers:**
- Full resource economy (4 token types)
- Token crafting for leveling
- Photo Sets system (A/B/C quality focus)
- Energy Drink crafting
- Treasure Hunts (QR codes, events)
- Advanced anti-abuse measures
- Ego-safe leaderboards
- Shariah-compliant mechanics

**Key Principles:**
- Reward contribution, not just consumption
- Fair F2P/P2P balance (no paywalls)
- Cost-efficient (Spark → Blaze ready)
- Quality-first (photo sets, reviews)
- Community-driven (trust system, contributions)

---

**End of Post-Beta Gamification v1.0+**

_This full system will be implemented after beta testing validates core mechanics._

