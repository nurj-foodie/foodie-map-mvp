# 🎮 KAWAN MAKAN — GAMIFICATION LOG UPDATE TEMPLATE

**Version:** [vX.X]  

**Date:** [DD MMM YYYY]  

**Maintainer:** [Your Name / Role]  

**Companion Files:** `GAMIFICATIONLOG.md`, `CHANGELOG.md`, `PRD.md`

---

## 1. Summary

### 🎯 Objective

Briefly describe the goal of this update.  

*(Example: Introduce Treasure Hunt event logic and refine XP reward scaling.)*

### 🧩 Components Affected

- XP calculation system
- Badge progression logic
- UI for check-in and challenge tracking
- Backend Firestore schema updates

---

## 2. Changes Implemented

| Category | Description | Status |
|-----------|--------------|---------|
| 🧮 **XP / Level System** | [Detail XP formula, level thresholds, balance adjustments] | ✅ Done / ⏳ Pending |
| 🎖️ **Badges & Achievements** | [New badges, changes, or removals] | ✅ Done / ⏳ Pending |
| 🗺️ **Events & Challenges** | [List new daily/weekly/seasonal events or quests] | ✅ Done / ⏳ Pending |
| 💎 **Resource Mechanics** | [Adjustments to resource drops, usage, or economy balance] | ✅ Done / ⏳ Pending |
| 👥 **Social Mechanics** | [New alliance/guild, streaks, leaderboards, or friend systems] | ✅ Done / ⏳ Pending |
| 🧠 **Behavior / UX Updates** | [Explain player motivation tweaks or interface enhancements] | ✅ Done / ⏳ Pending |

---

## 3. New Formulas / Logic

### XP Formula Example:

XP = BaseXP + (CheckInCount × 20) + (PhotoUploads × 40) + (Reviews × 50)

### Resource Drop Table:

| Action | Resource | Drop Range | Notes |
|---------|-----------|------------|--------|
| Check-in | Taste Tokens | 1–3 | Depends on rarity of eatery |
| Upload photo | Memory Shards | 2–4 | Bonus for new locations |
| Complete daily quest | Journey Points | +5 | Used for route energy |
| Treasure Hunt | Flavor Gems | 1–2 | Rare — event only |

---

## 4. Design Notes

### 🎨 UX / UI Enhancements

- [Describe visual updates or player-facing UI changes]
- [Include icons, effects, or interface flow improvements]

### 🎯 Balancing / Difficulty

- [Explain any change in difficulty, reward curve, or drop rate]
- [Example: "Increased XP per check-in by 10% to reward frequent explorers."]

---

## 5. Ethical Guardrails (Check)

| Principle | Verified | Notes |
|------------|-----------|--------|
| No chance-based mechanics | ☑️ / ☐ | |
| No pay-to-win imbalance | ☑️ / ☐ | |
| All perks earnable via gameplay | ☑️ / ☐ | |
| Shariah-compliant resource flow | ☑️ / ☐ | |
| Transparent booster system | ☑️ / ☐ | |

---

## 6. Analytics & Testing Notes

| Metric | Target | Result |
|---------|---------|---------|
| Avg. session length | 8–12 mins | [Measured] |
| Check-ins per day | 3+ | [Measured] |
| XP earned per session | 150–250 XP | [Measured] |
| Event participation | 25%+ | [Measured] |

### Testing Log

- ✅ Unit-tested XP and resource calculations  
- ✅ Verified reward consistency across devices  
- ⏳ A/B testing on event frequency (pending)

---

## 7. Next Actions

| Priority | Task | Owner | Due Date |
|-----------|------|--------|----------|
| 🔥 | Deploy updated XP formula to live build | Dev Team | [DD MMM] |
| 🧭 | Design UI for Treasure Hunt tracker | UI/UX | [DD MMM] |
| 💾 | Add Firestore collection for `userChallenges` | Backend | [DD MMM] |
| 🎨 | Create icons for 3 new badges | Design | [DD MMM] |

---

## 8. Version Summary (for Master Log)

| Version | Focus | Highlights | Status |
|----------|--------|-------------|--------|
| [vX.X] | [Short summary, e.g., "Treasure Hunt Integration"] | [Key changes or additions] | ✅ Completed / ⏳ In progress |

---

**End of Update Log [vX.X]**  

_Add this section to the master `GAMIFICATIONLOG.md` once validated._

---

## ✅ How to Use in Workflow

1. **Duplicate this file** → rename it `GAMIFICATIONLOG_v0.2.md` (for example).

2. **After each feature push**, summarize your gamification changes here.

3. **Once validated**, copy the content into the main `GAMIFICATIONLOG.md`.

4. **Keep CHANGELOG.md** for code-level updates, and `GAMIFICATIONLOG.md` for player-facing system updates.

---

## 📝 Notes

- Use this template for each gamification update
- Fill in all relevant sections
- Verify ethical guardrails before finalizing
- Update version history in master log after validation

