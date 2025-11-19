# Phase 3.2: Survey System - Quick Reference Card

**Version:** v0.7.4 | **Date:** 19 Nov 2025

---

## 🎯 Quick Test Flow

### 1. Open Survey Modal
- **Location:** User Dashboard → Overview tab
- **Action:** Click "Take Survey →" button
- **Or:** Navigate to `?survey=true` in URL

### 2. Fill Survey Form
- **Device:** Select iOS or Android
- **Drive Frequency:** Select Weekly / Monthly / Occasional
- **Corridor:** Enter route (e.g., "KL ↔ Penang")

### 3. Submit Survey
- **Action:** Click "Submit & Get +50 K-Coins"
- **Expected:** Success message → Modal closes after 3s

---

## ✅ Quick Verification Checklist

### Immediate Checks
- [ ] Survey modal opens/closes
- [ ] All 3 fields required (validation works)
- [ ] Submit button disabled until all fields filled
- [ ] Success message shows after submission
- [ ] Modal auto-closes after 3 seconds

### K-Coins Verification
- [ ] Balance increases by +50
- [ ] Transaction appears in K-Coins history
- [ ] Transaction type: "Survey"

### Firestore Verification
- [ ] `survey_responses` → New document created
- [ ] `waitlist` → `surveyCompleted: true`
- [ ] `waitlist` → `surveyData` object exists
- [ ] `kcoins_transactions` → New transaction (+50)

### Cohort Score Verification
- [ ] Weekly: +50 points
- [ ] Monthly: +25 points
- [ ] Occasional: +10 points
- [ ] Score persists in Firestore

### UI/UX Checks
- [ ] Survey prompt card disappears after completion
- [ ] Cannot submit survey twice
- [ ] URL parameter `?survey=true` works

---

## 🔍 Quick Debug Commands

### Check Survey Status
```javascript
// Browser Console
const { surveyService } = await import('./src/services/surveyService');
const status = await surveyService.getSurveyStatus('{waitlistId}');
console.log(status);
```

### Check K-Coins Balance
- Go to Overview tab → K-Coins Display
- Click "View History" to see transactions

### Check Firestore
- Firebase Console → Firestore
- Collections to check:
  - `survey_responses`
  - `waitlist` (user's document)
  - `kcoins_transactions`

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Modal doesn't open | Check `waitlistId` is loaded, check URL parameter |
| Submit button disabled | Fill all 3 fields (device, frequency, corridor) |
| No K-Coins awarded | Check Firestore rules, check console for errors |
| Survey prompt still shows | Check `surveyCompleted` status in Firestore |
| Permission error | Verify Firestore rules allow create/update |

---

## 📊 Test Data Examples

### Device Options
- `iOS`
- `Android`

### Drive Frequency Options
- `weekly` → +50 cohort points
- `monthly` → +25 cohort points
- `occasional` → +10 cohort points

### Corridor Examples
- `KL ↔ Penang`
- `Kluang ↔ JB`
- `KL to JB`
- `Penang ↔ Ipoh`

---

## 🚀 Quick Test Commands

### Start App
```bash
cd foodie-simple
npm start
```

### Test Email (Manual)
- Go to Beta Test tab → Email Test Panel
- Click "Send Survey Email"
- Enter test email and name

### Test URL Parameter
```
http://localhost:3000?survey=true
```

---

## 📝 Quick Notes

- **K-Coins Award:** +50 on completion
- **Cohort Score:** Based on drive frequency (Weekly > Monthly > Occasional)
- **Survey Status:** Tracked in `waitlist.surveyCompleted`
- **Email Trigger:** T+2 (requires Firebase Functions scheduled trigger)
- **Survey Link:** `{MAIN_APP_URL}?survey=true`

---

**For detailed testing, see:** `PHASE_3_2_TESTING_GUIDE.md`

