# Phase 3.2: Survey System - Testing Guide

**Date:** 19 Nov 2025  
**Version:** v0.7.4  
**Status:** Ready for Testing

---

## 📋 Overview

This guide covers testing the Survey System implementation for Phase 3.2. The survey allows waitlist users to provide travel habit information and earn +50 K-Coins.

### What to Test

1. ✅ Survey Modal Component (UI/UX)
2. ✅ Survey Submission Flow
3. ✅ K-Coins Award (+50 on completion)
4. ✅ Cohort Score Update (based on drive frequency)
5. ✅ Survey Status Tracking
6. ✅ Email Integration (T+2 trigger)
7. ✅ URL Parameter Support (`?survey=true`)
8. ✅ Survey Prompt Card (conditional display)
9. ✅ Error Handling & Edge Cases

---

## 🔧 Prerequisites

### 1. Environment Setup

Ensure you have:
- ✅ Firebase project configured (`foodie-map-23842`)
- ✅ User account with beta access (or waitlist entry)
- ✅ `.env` file configured with:
  ```env
  REACT_APP_MAIN_APP_URL=https://foodie-map-23842.web.app
  REACT_APP_LANDING_PAGE_URL=https://waitlist-foodie-map-23842.web.app
  ```

### 2. Test User Setup

**Option A: Use Existing User**
- Log in with a user that has beta access
- Ensure user has a waitlist entry

**Option B: Create New Test User**
1. Join waitlist from landing page
2. Grant beta access via admin panel
3. Log in with that email

### 3. Start Application

```bash
cd foodie-simple
npm start
```

Application should start on `http://localhost:3000` (or configured port).

---

## 🧪 Test Cases

### Test 1: Survey Modal Display

**Objective:** Verify survey modal opens correctly

**Steps:**
1. Log in to the app
2. Navigate to User Dashboard (Profile icon)
3. Click "Take Survey →" button in the survey prompt card

**Expected Results:**
- ✅ Survey modal opens with overlay
- ✅ Modal displays:
  - Title: "📋 Quick Survey"
  - Intro text mentioning +50 K-Coins
  - Device selector (iOS/Android buttons)
  - Drive frequency selector (Weekly/Monthly/Occasional buttons)
  - Corridor input field
  - Submit button: "Submit & Get +50 K-Coins"
  - Cancel button

**Browser Console:**
- ✅ No errors
- ✅ No Firebase permission errors

---

### Test 2: Survey Form Validation

**Objective:** Verify form validation works correctly

**Steps:**
1. Open survey modal
2. Try submitting without filling any fields
3. Fill only device, try submitting
4. Fill device + drive frequency, try submitting
5. Fill all fields, try submitting

**Expected Results:**
- ✅ Submit button disabled when fields incomplete
- ✅ Error message appears if submitting incomplete form: "Please fill in all fields"
- ✅ Submit button enabled when all fields filled
- ✅ No submission occurs until all fields valid

---

### Test 3: Device Selection

**Objective:** Verify device selector works

**Steps:**
1. Open survey modal
2. Click "📱 iOS" button
3. Click "🤖 Android" button
4. Verify visual feedback

**Expected Results:**
- ✅ Selected device button shows active state (purple background, white text)
- ✅ Unselected device button shows default state (white background, gray text)
- ✅ Only one device can be selected at a time
- ✅ Selection persists until form submission

---

### Test 4: Drive Frequency Selection

**Objective:** Verify drive frequency selector works

**Steps:**
1. Open survey modal
2. Click each option: "🚗 Weekly", "🛣️ Monthly", "🎯 Occasional"
3. Verify visual feedback

**Expected Results:**
- ✅ Selected frequency button shows active state
- ✅ Unselected frequency buttons show default state
- ✅ Only one frequency can be selected at a time
- ✅ Selection persists until form submission

---

### Test 5: Corridor Input

**Objective:** Verify corridor input works

**Steps:**
1. Open survey modal
2. Type in corridor input: "KL ↔ Penang"
3. Try different formats: "Kluang ↔ JB", "KL to Penang", etc.
4. Try empty input (should be invalid)

**Expected Results:**
- ✅ Input accepts free text
- ✅ Input trims whitespace on submission
- ✅ Empty input shows validation error
- ✅ Input field has proper focus styling

---

### Test 6: Survey Submission - Success Flow

**Objective:** Verify survey submission works and awards K-Coins

**Steps:**
1. Open survey modal
2. Fill all fields:
   - Device: iOS (or Android)
   - Drive Frequency: Weekly (or Monthly/Occasional)
   - Corridor: "KL ↔ Penang" (or any route)
3. Click "Submit & Get +50 K-Coins"
4. Wait for submission

**Expected Results:**
- ✅ Loading state shows: "Submitting..."
- ✅ Success message appears:
  - ✅ Icon: "✅"
  - ✅ Title: "Survey Completed!"
  - ✅ Message: "Thank you for your feedback! **+50 K-Coins** have been added to your account."
  - ✅ Note: "This helps us prioritize features and routes that matter most to you."
- ✅ Modal auto-closes after 3 seconds
- ✅ Survey prompt card disappears from dashboard

**Firestore Verification:**
1. Open Firebase Console → Firestore
2. Check `survey_responses` collection:
   - ✅ New document created
   - ✅ Fields: `waitlistId`, `email`, `device`, `driveFrequency`, `corridor`, `submittedAt`
3. Check `waitlist` collection:
   - ✅ User's document updated:
     - ✅ `surveyCompleted: true`
     - ✅ `surveyData` object with device, driveFrequency, corridor
4. Check `kcoins_transactions` collection:
   - ✅ New transaction:
     - ✅ `userId`: `waitlist:{email}`
     - ✅ `amount`: 50
     - ✅ `type`: "survey"
     - ✅ `description`: "Completed beta survey"
     - ✅ `relatedId`: survey response document ID

**Browser Console:**
- ✅ Log: "✅ Survey submitted: {email} (Survey ID: {id})"
- ✅ Log: "✅ Cohort score updated: {waitlistId} (+{points} for drive frequency: {frequency})"
- ✅ No errors

---

### Test 7: K-Coins Balance Update

**Objective:** Verify K-Coins balance updates after survey completion

**Steps:**
1. Note current K-Coins balance (from Overview tab)
2. Complete survey (Test 6)
3. Check K-Coins balance again

**Expected Results:**
- ✅ K-Coins balance increases by +50
- ✅ K-Coins history shows new transaction:
  - ✅ Type: "Survey"
  - ✅ Amount: +50
  - ✅ Description: "Completed beta survey"
  - ✅ Timestamp: Current time

---

### Test 8: Cohort Score Update

**Objective:** Verify cohort score updates based on drive frequency

**Steps:**
1. Note current cohort score (check Firestore `waitlist` collection)
2. Complete survey with different drive frequencies:
   - Test A: Weekly → should add +50 points
   - Test B: Monthly → should add +25 points
   - Test C: Occasional → should add +10 points

**Expected Results:**
- ✅ Weekly: Cohort score increases by +50
- ✅ Monthly: Cohort score increases by +25
- ✅ Occasional: Cohort score increases by +10
- ✅ Score persists in Firestore

**Firestore Verification:**
- ✅ `waitlist` document → `cohortScore` field updated
- ✅ `updatedAt` timestamp updated

---

### Test 9: Survey Status Checking

**Objective:** Verify survey status is tracked correctly

**Steps:**
1. Complete survey (Test 6)
2. Refresh page
3. Check if survey prompt card appears

**Expected Results:**
- ✅ Survey prompt card does NOT appear (already completed)
- ✅ Survey modal shows completed state if opened manually
- ✅ Survey status persists after page refresh

**Firestore Verification:**
- ✅ `waitlist` document → `surveyCompleted: true`
- ✅ `surveyData` object exists with submitted values

---

### Test 10: Duplicate Survey Submission

**Objective:** Verify users cannot submit survey twice

**Steps:**
1. Complete survey (Test 6)
2. Try to open survey modal again (if possible)
3. Try to submit survey again

**Expected Results:**
- ✅ Survey prompt card does not appear
- ✅ If modal opened manually, shows completed state
- ✅ Cannot submit survey again
- ✅ Error message if attempted: "Survey already completed"

**Firestore Verification:**
- ✅ Only one document in `survey_responses` collection for this user
- ✅ `waitlist` document → `surveyCompleted: true` (unchanged)

---

### Test 11: URL Parameter Support

**Objective:** Verify survey modal opens from email link

**Steps:**
1. Log out of app
2. Navigate to: `http://localhost:3000?survey=true`
3. Log in
4. Check if survey modal opens automatically

**Expected Results:**
- ✅ Survey modal opens automatically after login
- ✅ URL parameter removed from address bar (clean URL)
- ✅ Modal displays correctly

**Alternative Test:**
1. Log in first
2. Navigate to: `http://localhost:3000?survey=true`
3. Check if survey modal opens

**Expected Results:**
- ✅ Survey modal opens immediately
- ✅ URL parameter removed

---

### Test 12: Survey Email Integration

**Objective:** Verify survey email sends correctly (T+2)

**Note:** This requires Firebase Functions scheduled trigger (or manual trigger for testing)

**Steps:**
1. Use Email Test Panel (Beta Test tab)
2. Click "Send Survey Email"
3. Enter test email and name
4. Check email inbox

**Expected Results:**
- ✅ Email received with subject: "30 seconds = +50 K-Coins"
- ✅ Email contains:
  - ✅ Survey questions preview
  - ✅ Survey link button: "Complete Survey → Get +50 K-Coins"
  - ✅ Link points to: `{MAIN_APP_URL}?survey=true`
- ✅ Clicking link opens app and survey modal

**Firestore Verification:**
- ✅ `email_drips` collection → new document:
  - ✅ `emailType`: "survey"
  - ✅ `waitlistId`: correct ID
  - ✅ `sentAt`: timestamp

---

### Test 13: Survey Prompt Card Conditional Display

**Objective:** Verify survey prompt card shows/hides correctly

**Test A: Not Completed**
- ✅ Survey prompt card visible in Overview tab
- ✅ Card shows: "📋 Complete Survey & Earn +50 K-Coins"
- ✅ Button: "Take Survey →"

**Test B: Completed**
- ✅ Survey prompt card NOT visible
- ✅ No survey-related UI in Overview tab

**Test C: No Waitlist Entry**
- ✅ Survey prompt card NOT visible
- ✅ User without waitlist entry doesn't see survey

---

### Test 14: Error Handling

**Objective:** Verify error handling works correctly

**Test A: Network Error**
1. Disconnect internet
2. Try submitting survey

**Expected Results:**
- ✅ Error message displayed: "Failed to submit survey"
- ✅ Modal remains open
- ✅ User can retry after reconnecting

**Test B: Invalid Waitlist ID**
1. Manually set invalid waitlistId (if possible)
2. Try submitting survey

**Expected Results:**
- ✅ Error message displayed
- ✅ Survey not submitted
- ✅ No K-Coins awarded

**Test C: Firestore Permission Error**
1. Check Firestore rules allow:
   - ✅ Create in `survey_responses` collection
   - ✅ Update in `waitlist` collection
   - ✅ Create in `kcoins_transactions` collection

**Expected Results:**
- ✅ No permission errors
- ✅ Survey submits successfully

---

### Test 15: Mobile Responsiveness

**Objective:** Verify survey modal works on mobile devices

**Steps:**
1. Open app on mobile device (or browser dev tools mobile view)
2. Open survey modal
3. Test form interaction

**Expected Results:**
- ✅ Modal displays correctly on mobile
- ✅ Buttons are touch-friendly
- ✅ Input fields are accessible
- ✅ Modal scrolls if content exceeds viewport
- ✅ Close button works
- ✅ Form submission works

---

## ✅ Testing Checklist

### Core Functionality
- [ ] Survey modal opens and closes correctly
- [ ] Form validation works (all fields required)
- [ ] Device selector works (iOS/Android)
- [ ] Drive frequency selector works (Weekly/Monthly/Occasional)
- [ ] Corridor input accepts text
- [ ] Survey submission successful
- [ ] Success message displays correctly
- [ ] Modal auto-closes after 3 seconds

### K-Coins & Rewards
- [ ] +50 K-Coins awarded on completion
- [ ] K-Coins balance updates correctly
- [ ] K-Coins transaction recorded in Firestore
- [ ] Transaction appears in K-Coins history

### Cohort Score
- [ ] Weekly drive frequency adds +50 points
- [ ] Monthly drive frequency adds +25 points
- [ ] Occasional drive frequency adds +10 points
- [ ] Cohort score persists in Firestore

### Survey Status
- [ ] Survey status tracked correctly
- [ ] Survey prompt card hides after completion
- [ ] Survey cannot be submitted twice
- [ ] Survey status persists after refresh

### Email Integration
- [ ] Survey email sends correctly (T+2)
- [ ] Email link opens survey modal
- [ ] URL parameter (`?survey=true`) works
- [ ] Email tracking recorded in Firestore

### UI/UX
- [ ] Survey prompt card displays conditionally
- [ ] Modal styling looks good
- [ ] Loading states work correctly
- [ ] Error messages display clearly
- [ ] Mobile responsive

### Error Handling
- [ ] Network errors handled gracefully
- [ ] Invalid data rejected
- [ ] Permission errors handled
- [ ] Duplicate submission prevented

---

## 🐛 Known Issues / Limitations

### Current Limitations

1. **T+2 Email Trigger**
   - Currently requires manual trigger via Email Test Panel
   - Production: Should use Firebase Functions scheduled trigger
   - **Workaround:** Use Email Test Panel for testing

2. **Survey Link Authentication**
   - Survey link requires user to be logged in
   - Users without accounts cannot complete survey
   - **Future:** May need anonymous survey option

3. **Cohort Score Calculation**
   - Drive frequency points added directly to cohort score
   - Full cohort score formula not yet implemented (Phase 4)
   - **Note:** This is expected for Phase 3.2

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________
Version: v0.7.4

Test Results:
- Test 1: Survey Modal Display: [ ] PASS [ ] FAIL
- Test 2: Survey Form Validation: [ ] PASS [ ] FAIL
- Test 3: Device Selection: [ ] PASS [ ] FAIL
- Test 4: Drive Frequency Selection: [ ] PASS [ ] FAIL
- Test 5: Corridor Input: [ ] PASS [ ] FAIL
- Test 6: Survey Submission: [ ] PASS [ ] FAIL
- Test 7: K-Coins Balance Update: [ ] PASS [ ] FAIL
- Test 8: Cohort Score Update: [ ] PASS [ ] FAIL
- Test 9: Survey Status Checking: [ ] PASS [ ] FAIL
- Test 10: Duplicate Submission: [ ] PASS [ ] FAIL
- Test 11: URL Parameter Support: [ ] PASS [ ] FAIL
- Test 12: Survey Email Integration: [ ] PASS [ ] FAIL
- Test 13: Survey Prompt Card: [ ] PASS [ ] FAIL
- Test 14: Error Handling: [ ] PASS [ ] FAIL
- Test 15: Mobile Responsiveness: [ ] PASS [ ] FAIL

Issues Found:
1. ___________
2. ___________

Notes:
___________
```

---

## 🚀 Next Steps After Testing

1. **If All Tests Pass:**
   - ✅ Document test results
   - ✅ Update `BETA_PHASE_INITIALIZATION_REVIEW.md`
   - ✅ Update `CHANGELOG.md`
   - ✅ Proceed to Phase 3.3 or Phase 4

2. **If Issues Found:**
   - ✅ Document issues in detail
   - ✅ Fix bugs
   - ✅ Re-test affected test cases
   - ✅ Update documentation

---

## 📝 Additional Notes

- **Firestore Rules:** Ensure rules allow:
  - Public create access to `survey_responses` collection
  - Authenticated update access to `waitlist` collection
  - Public create access to `kcoins_transactions` collection

- **Environment Variables:** Ensure `.env` has:
  ```env
  REACT_APP_MAIN_APP_URL=https://foodie-map-23842.web.app
  REACT_APP_LANDING_PAGE_URL=https://waitlist-foodie-map-23842.web.app
  ```

- **Testing Email:** Use Email Test Panel in Beta Test tab to send survey emails manually

---

**Last Updated:** 19 Nov 2025  
**Version:** v0.7.4

