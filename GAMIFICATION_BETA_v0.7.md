# 🎮 KAWAN MAKAN — GAMIFICATION BETA v0.7

**Version:** 0.7 (Beta Testing Phase)  
**Last Updated:** 18 November 2025 (Phase 2 Complete)  
**Maintainer:** @Founder (Game Director)  
**Based On:** Gamification V2 Draft  
**Companion Files:** `GAMIFICATIONLOG.md`, `PRD.md`, `CHANGELOG.md`, `BETA_PHASE_FLOW_PLAN_INTEGRATED.md`

---

## 1. Overview

**Purpose:**  

Simplified gamification system for beta testing — validate core mechanics before full v2 rollout.

**Design Philosophy:**  

Test core loops first, add complexity later. Focus on validating: XP system, basic progression, Energy economy, and user engagement patterns.

**Beta Goals:**
- Validate XP and leveling mechanics
- Test Energy economy (cost control)
- Measure user engagement (check-ins, photos, reviews)
- Collect data for v2 refinement
- Ensure Shariah compliance
- Accumulate K-Coins through beta participation (waitlist, referrals, surveys)

---

## 2. Core Gameplay Loop (Beta)

| Step | Player Action | System Response | Reward |
|------|----------------|------------------|---------|
| 1 | Search food route | Map renders valid locations | Base XP + Energy cost |
| 2 | Check-in at restaurant | Verifies GPS + timestamp | XP + small bonus |
| 3 | Upload photo | Validated and stored | XP + bonus |
| 4 | Write review | Validated and stored | XP + bonus |
| 5 | Level up | Unlock new features | Badge + cosmetic reward |

💡 *Key Loop:* **Explore → Check-in → Contribute → Level Up → Repeat**

---

## 3. XP & Level System (Beta)

### XP Sources (Simplified)

| Action | XP Reward | Notes |
|--------|-----------|-------|
| Check-in | +20 XP | Once per venue per 2 hours |
| Upload photo | +40 XP | First photo per venue per day |
| Write review | +50 XP | One review per venue |
| Add new eatery | +100 XP | After admin approval |
| Complete daily challenge | +75 XP | One per day |
| Complete weekly challenge | +150 XP | One per week |

### Level Progression (Beta)

| Level Range | XP Required | Unlocks |
|--------------|-------------|---------|
| 1–5 | 0–500 | Base features (search, check-in, upload) |
| 6–10 | 500–1,500 | Daily challenges + badge progress |
| 11–15 | 1,500–3,500 | Weekly challenges + leaderboards |
| 16–20 | 3,500–7,500 | Advanced features preview |
| 20+ | 7,500+ | Prestige levels (cosmetic only) |

**Beta Focus:** Simple XP-based progression (no resource crafting yet)

---

## 4. K-Coins System (Beta - Accumulation Phase)

### Overview

K-Coins are a reward currency earned during beta phase through participation and referrals. During beta, K-Coins accumulate only (no spending). They will convert to premium features, in-app purchases, and tokens post-beta.

### K-Coins Earning (Beta Phase)

| Action | K-Coins Reward | Notes |
|--------|---------------|-------|
| Join waitlist | +25 K-Coins | Automatic on signup |
| Refer a friend (waitlist) | +100 K-Coins | When referred user joins waitlist |
| Complete survey | +50 K-Coins | 30-second survey (device, frequency, corridor) |
| Travel package draw | Variable | Monthly winner (top referrers) |

### K-Coins Display (Beta)

- **Balance visible in UI** (header/navigation, User Tab)
- **Transaction history** available
- **No spending during beta** (accumulation only)
- **No "coming soon" messaging** (keep it mysterious)

### Post-Beta K-Coins Use Cases

**Note:** Defined for planning, implemented post-beta. See `BETA_PHASE_FLOW_PLAN_INTEGRATED.md` Section 3.4 for full details.

**A. Premium Features:**
- Premium Filters (100 K-Coins/month)
- Offline Cache Access (50 K-Coins/month)
- Early Feature Voting (25 K-Coins per vote)
- Ad-Free Experience (200 K-Coins/month)
- Priority Support (100 K-Coins per request)

**B. In-App Purchases:**
- Energy Boosters (50 K-Coins)
- Route Search Credits (30 K-Coins)
- Token Conversion (10 K-Coins = 1 Token)
- Badge Unlocks (150 K-Coins)
- Profile Customization (75 K-Coins)

**C. Gamification Integration:**
- Token conversion to Food/Photo/Review/Explorer tokens
- XP Boosters (100 K-Coins = 2x XP for 24h)
- Challenge Skips (50 K-Coins per skip)

**Beta Goal:** Accumulate K-Coins through participation, convert to rewards post-beta

---

## 5. Energy System (Beta - Simplified)

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

### Energy Mechanics (Beta)

- **No crafting yet** (Energy Drinks will come in v2)
- **Simple regen** (hourly + daily bonus)
- **Soft limit** (after 3 routes/hour, add +5⚡ per extra route)

**Beta Goal:** Validate Energy economy prevents API abuse while keeping gameplay fun

---

## 6. Check-In System (Beta - Basic)

### Basic Rules

- **Per-venue cooldown:** 2 hours between check-ins at same venue
- **Daily cap:** 6 check-ins/day (tokened) — start conservative for beta
- **GPS verification:** Required (within 100m of venue)
- **Timestamp:** Required for validation

### Anti-Abuse (Beta - Basic)

- **Basic dwell time:** 5 minutes minimum at venue
- **Speed check:** Must be ≤5 km/h (walking speed)
- **Burst limiter:** Max 4 check-ins per hour across all venues

**Beta Goal:** Test basic anti-abuse measures, refine for v2

---

## 7. Badges & Achievements (Beta)

### Progression Badges (Easier for Beta)

| Badge | Requirement | Type |
|--------|--------------|------|
| 🥾 **Explorer I** | Visit 5 eateries | Progression |
| 🥾 **Explorer II** | Visit 15 eateries | Progression |
| 🥾 **Explorer III** | Visit 30 eateries | Progression |
| 🥾 **Explorer IV** | Visit 60 eateries | Progression |
| 🥾 **Explorer V** | Visit 100 eateries | Progression |

**Note:** Beta uses easier progression (5/15/30/60/100) to encourage early engagement. Post-beta will use balanced progression (10/25/50/100/200).

### Contribution Badges (Multi-Tier)

| Badge | Requirement | Type |
|--------|--------------|------|
| 📸 **Memory Keeper I** | Upload 5 photos | Contribution |
| 📸 **Memory Keeper II** | Upload 15 photos | Contribution |
| 📸 **Memory Keeper III** | Upload 30 photos | Contribution |
| 📸 **Memory Keeper IV** | Upload 60 photos | Contribution |
| 📸 **Memory Keeper V** | Upload 100 photos | Contribution |

### Skill Badges (Multi-Tier)

| Badge | Requirement | Type |
|--------|--------------|------|
| ✍️ **Food Critic I** | Write 3 reviews | Skill |
| ✍️ **Food Critic II** | Write 10 reviews | Skill |
| ✍️ **Food Critic III** | Write 25 reviews | Skill |
| ✍️ **Food Critic IV** | Write 50 reviews | Skill |
| ✍️ **Food Critic V** | Write 100 reviews | Skill |

### Contribution Badges (Multi-Tier)

| Badge | Requirement | Type |
|--------|--------------|------|
| 🧑‍🍳 **Local Hero I** | Add 1 verified eatery | Contribution |
| 🧑‍🍳 **Local Hero II** | Add 3 verified eateries | Contribution |
| 🧑‍🍳 **Local Hero III** | Add 5 verified eateries | Contribution |
| 🧑‍🍳 **Local Hero IV** | Add 10 verified eateries | Contribution |
| 🧑‍🍳 **Local Hero V** | Add 20 verified eateries | Contribution |

### Special Badges

| Badge | Requirement | Type | Perks |
|--------|--------------|------|-------|
| 💎 **Beta Tester** | Participate in beta | Exclusive | See [Beta Tester Perks](#beta-tester-perks) |

#### Beta Tester Perks

**Digital Perks (Beta Phase):**
- ⚡ **Energy Bonus:** +5 Energy per day (added to daily cap: 100⚡ → 105⚡)
- 🍽️ **Token Bonus:** +5% permanent bonus tokens from all actions (when tokens are implemented)
- 🎮 **Beta Feature Access:** Access to beta gamification features for testing
- 🎨 **Cosmetic Perks:** Special badge, blue username, profile badge highlight, "Beta Tester" rank title
- 💎 **Migration Bonus:** +10% bonus tokens during XP-to-tokens migration (post-beta)

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

**Beta Focus:** Easier progression (5/15/30/60/100) for Explorer badges to encourage early engagement during short beta period (1-2 months). Beta testers get exclusive perks and early access to features.

---

## 8. Challenges (Beta)

### Daily Challenges

- Visit 2 new eateries today → +75 XP
- Upload 2 photos → +60 XP
- Write 1 review → +50 XP

### Weekly Challenges

- 5 check-ins in new districts → +150 XP
- 1 new restaurant submission → +100 XP
- Complete 3 daily challenges → +100 XP

**Beta Goal:** Test challenge engagement and completion rates

---

## 9. Leaderboards (Beta - Simple)

### Leaderboard Types

- **Global XP Leaderboard** (opt-in)
- **Friends Leaderboard** (if friends system exists)
- **Personal Best** (always visible)

### Brackets (Beta)

- L1–5 (Beginners)
- L6–10 (Explorers)
- L11–15 (Enthusiasts)
- L16+ (Masters)

**Beta Goal:** Test leaderboard engagement without complex brackets

---

## 10. Anti-Abuse (Beta - Basic)

### Location Verification

- GPS required (within 100m)
- Basic dwell time (5 minutes)
- Speed check (≤5 km/h)

### Content Verification

- Photo quality check (basic)
- Review length (≥50 characters)
- Duplicate detection (basic)

### Trust System (Beta - Simple)

- **New accounts:** Earn 75% XP until 3 approved actions
- **Trust score:** Simple count of approved actions
- **Penalty:** Warning → temp ban (with appeal)

**Beta Goal:** Test basic anti-abuse, refine for v2

---

## 11. Beta Testing Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| **DAU Growth** | +30–40% | Daily active users |
| **Check-ins per user** | 2–3 per day | Average engagement |
| **Photo uploads** | 1–2 per day | Content contribution |
| **Review submissions** | 0.5–1 per day | Quality content |
| **Energy usage** | <50⚡ per session | Cost control |
| **Level progression** | L5 in first week | Onboarding success |
| **Challenge completion** | 60%+ daily | Engagement metric |

---

## 12. What's NOT in Beta

### Deferred to v2 (Post-Beta)

- ❌ Resource economy (4 token types)
- ❌ Token crafting for leveling
- ❌ Photo Sets system (A/B/C structure)
- ❌ Energy Drink crafting
- ❌ Treasure Hunts (QR codes)
- ❌ Advanced dwell time (venue-type specific)
- ❌ Trust ramp with trustScore formula
- ❌ Complex anti-abuse (near-venue bounce guard)
- ❌ Alliance system
- ❌ Sponsor vouchers

**Reason:** Test core mechanics first, add complexity after validation

---

## 13. Beta → v2 Migration Plan

### K-Coins Migration

- **K-Coins earned:** Preserved and carried over to post-beta
- **Conversion options:** 
  - Premium features (filters, offline cache, etc.)
  - Token conversion (10 K-Coins = 1 Token, any type)
  - In-app purchases (energy boosters, badges, etc.)
- **Beta tester bonus:** +10% bonus on token conversion
- **Average accumulation:** 200-500 K-Coins per user during beta

### Data Preservation

- **XP earned:** Carry over to v2
- **Levels achieved:** Maintain in v2
- **Badges unlocked:** Preserved
- **Energy balance:** Convert to v2 system
- **K-Coins balance:** Preserved for post-beta conversion

### Migration Steps

1. **Announce v2 features** (2 weeks before launch)
2. **Convert XP to resources** (based on v2 formula)
3. **Unlock new features** (Photo Sets, Treasure Hunts)
4. **Introduce crafting** (Energy Drinks, token crafting)
5. **Launch v2** (with beta tester bonuses)

---

## 14. Ethical Guardrails (Beta)

| Principle | Implementation |
|------------|----------------|
| No chance-based mechanics | All rewards earned through effort |
| No speculative value | XP and Energy have no monetary value |
| No riba / interest | Time-based progress only |
| Transparent system | Clear XP and Energy rules |
| Fair access | All features achievable via gameplay |

---

## 15. Beta Testing Checklist

### Pre-Beta Launch

- [ ] XP system implemented and tested
- [ ] Energy economy working correctly
- [ ] K-Coins system implemented (earning and display)
- [ ] Check-in system with GPS verification
- [ ] Basic anti-abuse measures active
- [ ] Leaderboards functional
- [ ] Daily/weekly challenges working
- [ ] Badge system operational
- [ ] Analytics tracking configured
- [ ] Waitlist and referral system integrated

### Beta Monitoring

- [ ] Track XP earned per user
- [ ] Monitor Energy usage patterns
- [ ] Track K-Coins accumulation per user
- [ ] Measure check-in frequency
- [ ] Analyze challenge completion rates
- [ ] Track level progression speed
- [ ] Monitor API costs
- [ ] Track referral and survey completion rates
- [ ] Collect user feedback

---

## 16. Success Criteria for Beta

### Technical

- ✅ XP system stable and balanced
- ✅ Energy economy prevents API abuse
- ✅ Check-in system accurate (GPS verification)
- ✅ Anti-abuse measures effective
- ✅ API costs under control (<RM100/month)

### Engagement

- ✅ 60%+ users complete daily challenges
- ✅ Average 2–3 check-ins per active user per day
- ✅ 50%+ users reach L5 in first week
- ✅ 30%+ users upload photos
- ✅ 20%+ users write reviews
- ✅ Average 200-500 K-Coins accumulated per user during beta
- ✅ 30%+ users complete survey (T+2)
- ✅ 25%+ referral rate (users referring others)

### User Satisfaction

- ✅ Positive feedback on progression speed
- ✅ Energy system feels fair (not restrictive)
- ✅ Badges feel achievable
- ✅ Leaderboards engaging (not demotivating)

---

**End of Beta Gamification v0.7**

_This simplified system will be tested in beta, then refined into full v2 post-beta._

