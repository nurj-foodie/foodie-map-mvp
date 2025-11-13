# Beta Phase User Flow Implementation Plan

**Date:** 13 November 2025  
**Status:** Planning Complete - Ready for Implementation  
**Community Name:** Kawan Makan Community (EN) / Komuniti Kawan Makan (BM)

---

## Overview

Implement end-to-end beta phase flow: Traffic → Landing Page → Waitlist → Referral & Rewards → Email Drips → Cohort Scoring → Beta Access → In-App Onboarding → Feedback → Conversion. Includes beta reporting feature for bugs and functionality feedback.

---

## Key Decisions & Clarifications

### Landing Page
- **Separate Standalone Page** (Lightweight React)
- Uses Firebase hosting URL for now (can add custom domain later)
- Separate project folder: `landing-page/`
- Redirects to main app after beta access granted

### Referral System
- **Referral links join WAITLIST** (not beta directly)
- **Points awarded when referred user joins BETA** (not waitlist)
- **Points only awarded if inviter is also in beta**
- Same referral links work for both waitlist and beta phases

### Email Drip Sequence (5 Emails over 14 days)
1. **Day 0:** Welcome email
2. **Day 2:** App preview
3. **Day 5:** Community building (Kawan Makan Community / Komuniti Kawan Makan)
4. **Day 8:** Referral reminder
5. **Day 11:** Launch countdown

### Launch Strategy
- **Launch Date:** 14 days after waitlist opens
- **Minimum Waitlist Size:** 500 users (target 300 beta users)
- **Beta Access:** Top 300 by cohort score on launch date
- Creates anticipation and ensures sufficient beta users

### Cohort Scoring Formula
```
Base Score = 1000 - (signup_order * 10)
+ Referral Points: +50 per referral that joins BETA (only if inviter in beta)
+ Email Engagement: +5 per email open, +10 per email click
+ Social Shares: +20 per social share (if tracked)
```

### Beta Phase Duration
- **Minimum:** 1 month
- **Target:** 300 beta users
- **Community Emails:** Weekly updates with stats and leaderboards

### Community Branding
- Always use bilingual naming: **"Kawan Makan Community (EN) / Komuniti Kawan Makan (BM)"**
- Include in all emails, onboarding, UI components, and community-related content

---

## Implementation Phases

### Phase 1: Data Models & Firestore Collections

#### 1.1 Waitlist Collection (`waitlist`)
```javascript
{
  email: string,
  name: string,
  referredBy: string | null, // userId or referral code
  referralCode: string, // Unique code for this user
  signupDate: timestamp,
  signupOrder: number, // For base score calculation
  cohortScore: number,
  emailEngagement: {
    opens: number,
    clicks: number,
    lastOpened: timestamp
  },
  betaAccessGranted: boolean,
  betaAccessDate: timestamp | null,
  conversionStatus: 'waitlist' | 'beta_active' | 'converted',
  createdAt: timestamp
}
```

#### 1.2 Referrals Collection (`referrals`)
```javascript
{
  referrerId: string, // User who referred (waitlist or beta user)
  referrerEmail: string,
  referredEmail: string,
  referralCode: string,
  status: 'pending' | 'signed_up_waitlist' | 'beta_active' | 'converted',
  pointsAwarded: boolean, // True when points awarded to referrer
  createdAt: timestamp,
  betaAccessDate: timestamp | null, // When referred user got beta access
  convertedAt: timestamp | null
}
```

#### 1.3 Beta Reports Collection (`beta_reports`)
```javascript
{
  userId: string,
  type: 'bug' | 'feature_request' | 'feedback' | 'other',
  title: string,
  description: string,
  stepsToReproduce: string | null, // For bugs
  screenshot: string | null, // Base64 or Firebase Storage URL
  deviceInfo: {
    userAgent: string,
    platform: string,
    screenSize: string
  },
  appVersion: string,
  status: 'open' | 'in_progress' | 'resolved' | 'closed',
  priority: 'low' | 'medium' | 'high' | 'critical',
  adminNotes: string | null,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### 1.4 Email Drips Collection (`email_drips`)
```javascript
{
  waitlistId: string, // Reference to waitlist document
  email: string,
  dripSequence: number, // 1, 2, 3, 4, 5
  sentAt: timestamp,
  openedAt: timestamp | null,
  clickedAt: timestamp | null,
  status: 'scheduled' | 'sent' | 'opened' | 'clicked'
}
```

#### 1.5 Community Updates Collection (`community_updates`)
```javascript
{
  updateType: 'weekly' | 'milestone' | 'launch',
  title: string,
  content: string,
  stats: {
    totalWaitlist: number,
    totalBetaUsers: number,
    activeBetaUsers: number,
    referralLeaderboard: array // Top 10
  },
  sentAt: timestamp,
  recipients: number
}
```

#### 1.6 Update Users Collection
Add beta-specific fields:
```javascript
{
  // ... existing fields
  betaAccess: boolean,
  betaAccessDate: timestamp | null,
  onboardingCompleted: boolean,
  referralCode: string,
  totalReferrals: number,
  referralPoints: number, // Points from referrals
  conversionDate: timestamp | null
}
```

---

### Phase 2: Landing Page (Separate Standalone)

#### 2.1 Create Landing Page Project Structure
- Create new folder: `landing-page/` (sibling to `foodie-simple/`)
- Initialize lightweight React app (Create React App or Vite)
- Minimal dependencies (React, Firebase SDK for waitlist API)
- File structure:
  ```
  landing-page/
  ├── public/
  │   └── index.html
  ├── src/
  │   ├── components/
  │   │   ├── Hero.js
  │   │   ├── WaitlistForm.js
  │   │   ├── ReferralSection.js
  │   │   └── SocialProof.js
  │   ├── services/
  │   │   └── waitlistApi.js (calls Firebase Functions or Firestore)
  │   ├── App.js
  │   ├── App.css
  │   └── index.js
  ├── package.json
  └── firebase.json (for hosting)
  ```

#### 2.2 Landing Page Components

**Hero Section** (`src/components/Hero.js`)
- App value proposition
- "Kawan Makan Community / Komuniti Kawan Makan" branding
- CTA: Join Waitlist
- Launch countdown (if launch date set)

**Waitlist Form** (`src/components/WaitlistForm.js`)
- Email input with validation
- Name input
- Referral code input (optional, pre-filled from URL param `?ref=CODE`)
- Submit button
- Success message with referral code and share options
- Error handling

**Referral Section** (`src/components/ReferralSection.js`)
- Display referral code after signup
- Share buttons (copy link, WhatsApp, Facebook, Twitter)
- Referral stats (if user returns with same email)
- Referral link format: `https://[landing-url]?ref=REFERRAL_CODE`

**Social Proof** (`src/components/SocialProof.js`)
- Waitlist count (live from Firestore)
- Testimonials placeholder
- Community highlights
- "Join Kawan Makan Community / Komuniti Kawan Makan" messaging

#### 2.3 Landing Page Service
**Waitlist API** (`src/services/waitlistApi.js`)
- `joinWaitlist(email, name, referralCode?)` - Add to waitlist, generate referral code
- `checkBetaAccess(email)` - Check if user has beta access
- `getWaitlistCount()` - Get total waitlist count
- `getUserReferralCode(email)` - Get user's referral code
- `getReferralStats(email)` - Get referral statistics
- Redirects to main app if beta access granted

#### 2.4 Landing Page Deployment
- Deploy to Firebase Hosting (same project)
- URL: `https://foodie-map-23842.web.app/` (or subdomain)
- Can add custom domain later: `kawanmakan.com`
- File: `landing-page/firebase.json`

---

### Phase 3: Waitlist System

#### 3.1 Waitlist Service (`src/services/waitlistService.js`)
- `joinWaitlist(email, name, referralCode?)` - Add to waitlist
  - Generate unique referral code
  - Track referral relationship if referralCode provided
  - Calculate signup order
  - Initialize cohort score
- `checkBetaAccess(userId)` - Check if user has access
- `getWaitlistPosition(email)` - Get position in queue
- `generateReferralCode(userId)` - Create unique referral code
- `getWaitlistCount()` - Get total waitlist users

#### 3.2 Referral Tracking
- When user joins waitlist with referral code:
  - Create entry in `referrals` collection
  - Link referrer and referred user
  - Status: 'signed_up_waitlist'
- When referred user gets beta access:
  - Update referral status to 'beta_active'
  - Check if referrer is in beta
  - If yes, award +50 points to referrer
  - Update referral.pointsAwarded = true

---

### Phase 4: Referral System

#### 4.1 Referral Service (`src/services/referralService.js`)
- `createReferral(referrerId, referredEmail)` - Track referral
- `getUserReferrals(userId)` - Get user's referrals
- `validateReferralCode(code)` - Validate referral code
- `awardReferralPoints(referrerId)` - Update cohort score (+50 points)
- `getReferralStats(userId)` - Get referral statistics
- `checkAndAwardPoints(referredUserId)` - Check if points should be awarded

#### 4.2 Referral Component (`src/components/ReferralSection.js`)
- Display user's referral code
- Share buttons (copy link, social media)
- Referral stats (count, status of referrals)
- Referral link format: `https://[landing-url]?ref=REFERRAL_CODE`
- File: `src/components/ReferralSection.js`

---

### Phase 5: Email Drip System

#### 5.1 Email Service (`src/services/emailService.js`)
- `sendWelcomeEmail(email, name)` - Day 0 (immediate)
- `sendAppPreviewEmail(email, name)` - Day 2
- `sendCommunityEmail(email, name)` - Day 5 (Kawan Makan Community / Komuniti Kawan Makan)
- `sendReferralReminderEmail(email, name)` - Day 8
- `sendLaunchCountdownEmail(email, name)` - Day 11
- `trackEmailOpen(emailId)` - Track email opens (webhook)
- `trackEmailClick(emailId)` - Track email clicks (webhook)
- Integration with SendGrid API

#### 5.2 Email Templates (`src/services/emailTemplates.js`)
All emails must include community name: "Kawan Makan Community / Komuniti Kawan Makan"

**Email 1: Welcome (Day 0)**
- Subject: "Welcome to Kawan Makan Beta Waitlist!"
- Content: Thank you, what to expect, referral program intro
- CTA: Share your referral link
- Include: Referral code, referral link

**Email 2: App Preview (Day 2)**
- Subject: "Here's What You'll Discover"
- Content: Features overview, screenshots, use cases
- CTA: Share with friends
- Include: Referral link reminder

**Email 3: Community Building (Day 5)**
- Subject: "Join Kawan Makan Community / Komuniti Kawan Makan"
- Content: Community goals, early adopter benefits, social links
- CTA: Follow social media
- Include: Community name prominently

**Email 4: Referral Reminder (Day 8)**
- Subject: "Unlock Beta Access Faster"
- Content: How referrals work, current position, leaderboard teaser
- CTA: Share referral link
- Include: Referral stats, referral link

**Email 5: Launch Countdown (Day 11)**
- Subject: "Beta Launch: [X] Days Away!"
- Content: Launch date announcement, what to expect, preparation tips
- CTA: Stay tuned
- Include: Launch date, countdown

#### 5.3 Email Tracking (`src/services/emailTrackingService.js`)
- Webhook endpoint for SendGrid events
- Update `email_drips` collection
- Update cohort score based on engagement (+5 per open, +10 per click)
- File: `src/services/emailTrackingService.js`

---

### Phase 6: Cohort Scoring System

#### 6.1 Cohort Scoring Service (`src/services/cohortScoringService.js`)
- `calculateCohortScore(waitlistId)` - Calculate total score
  - Base: 1000 - (signup_order * 10)
  - Referrals: +50 per referral that joins BETA (only if inviter in beta)
  - Email opens: +5 per open
  - Email clicks: +10 per click
  - Social shares: +20 per share (if tracked)
- `getTopCohort(limit)` - Get top N users for beta access
- `updateScore(waitlistId, points)` - Manual score adjustment (admin)
- `awardReferralPoints(referrerId)` - Award +50 when referred user joins beta
- File: `src/services/cohortScoringService.js`

#### 6.2 Admin Cohort Dashboard
- View waitlist with scores
- Filter by score, referrals, engagement
- Grant beta access manually
- Set launch date
- View top 300 users
- File: `src/components/AdminCohortDashboard.js` (add to AdminDashboard)

---

### Phase 7: Beta Access Gating

#### 7.1 Beta Access Check (`src/utils/betaAccess.js`)
- `checkBetaAccess(userId)` - Check Firestore for access
- `grantBetaAccess(userId)` - Grant access (admin or automated)
- `revokeBetaAccess(userId)` - Revoke access (admin)
- `grantBetaAccessBatch(userIds)` - Grant access to top 300 on launch date
- File: `src/utils/betaAccess.js`

#### 7.2 Update AuthContext
- Add `betaAccess` to user state
- Check on login
- Redirect to landing page if no access
- File: `src/contexts/AuthContext.js` (modify)

#### 7.3 Launch Date Automation
- Set launch date in admin dashboard
- On launch date, automatically:
  - Get top 300 users by cohort score
  - Grant beta access
  - Send beta access email
  - Update waitlist status

---

### Phase 8: In-App Onboarding

#### 8.1 Onboarding Service (`src/services/onboardingService.js`)
- `markOnboardingComplete(userId)` - Mark as completed
- `getOnboardingStatus(userId)` - Check if completed
- File: `src/services/onboardingService.js`

#### 8.2 Onboarding Flow Component (`src/components/OnboardingFlow.js`)
- Step 1: Welcome & App Overview
- Step 2: Route Discovery Tutorial
- Step 3: Restaurant Features Tour
- Step 4: Gamification Introduction
- Step 5: Beta Reporting Feature
- Step 6: Community Introduction - "Welcome to Kawan Makan Community / Komuniti Kawan Makan"
- Include community name in onboarding content
- File: `src/components/OnboardingFlow.js`
- Styles: `src/components/OnboardingFlow.css`

#### 8.3 Update App.tsx
- Check onboarding status on first login
- Show OnboardingFlow if not completed
- File: `src/App.tsx` (modify)

---

### Phase 9: Beta Reporting Feature

#### 9.1 Beta Reporting FAB (`src/components/BetaReportingFAB.js`)
- Floating action button (bottom-right)
- Always visible across all tabs
- Opens BetaReportingModal
- Badge for unread admin responses
- File: `src/components/BetaReportingFAB.js`
- Styles: `src/components/BetaReportingFAB.css`

#### 9.2 Beta Reporting Modal (`src/components/BetaReportingModal.js`)
- Report type selector (bug, feature, feedback, other)
- Title input
- Description textarea
- Steps to reproduce (for bugs)
- Screenshot upload (camera or gallery)
- Device info auto-capture
- Submit button
- View previous reports
- File: `src/components/BetaReportingModal.js`
- Styles: `src/components/BetaReportingModal.css`

#### 9.3 Beta Reporting Service (`src/services/betaReportingService.js`)
- `submitReport(userId, reportData)` - Submit new report
- `getUserReports(userId)` - Get user's reports
- `getReportDetails(reportId)` - Get single report
- `uploadScreenshot(file)` - Upload to Firebase Storage
- File: `src/services/betaReportingService.js`

#### 9.4 Admin Beta Reports Dashboard
- List all reports with filters
- View report details
- Update status and priority
- Add admin notes
- File: `src/components/AdminBetaReportsDashboard.js` (add to AdminDashboard)

---

### Phase 10: Community Email Updates (During Beta)

#### 10.1 Community Update Service (`src/services/communityUpdateService.js`)
- `sendWeeklyUpdate(weekNumber)` - Send weekly community email
- `getCommunityStats()` - Get current stats
- `getReferralLeaderboard(limit)` - Get top referrers
- File: `src/services/communityUpdateService.js`

#### 10.2 Community Email Templates
All emails include: "Kawan Makan Community / Komuniti Kawan Makan"

**Email 1: Beta Launch Celebration (Day 1 of beta)**
- Subject: "Welcome to Kawan Makan Beta! | Kawan Makan Community"
- Content: Launch stats, first users, what's next
- Stats: Total beta users, active users
- CTA: Start exploring

**Email 2: Week 1 Update (Day 7)**
- Subject: "Beta Week 1: [Stats] Users Active! | Kawan Makan Community"
- Content: Active users count, top contributors, referral leaderboard top 10
- Stats: Active users, new signups, top referrers
- CTA: Check your stats

**Email 3: Mid-Beta Update (Day 14)**
- Subject: "Halfway There: [Stats] Beta Testers! | Komuniti Kawan Makan"
- Content: Growth stats, community highlights, feature requests summary
- Stats: Total beta users, growth rate, community engagement
- CTA: Submit feedback

**Email 4: Final Push (Day 21)**
- Subject: "Final Week: Help Us Reach 300 Beta Testers! | Kawan Makan Community"
- Content: Current count, referral leaderboard, final push message
- Stats: Current beta users, target, referral leaderboard
- CTA: Share referral link

**Email 5: Beta Wrap-up (Day 30)**
- Subject: "Beta Complete: Thank You! | Komuniti Kawan Makan"
- Content: Final stats, achievements, next steps, Founder Pass info
- Stats: Final numbers, top contributors, achievements
- CTA: Join Founder Pass

---

### Phase 11: Feedback Collection

#### 11.1 Feedback Service (`src/services/feedbackService.js`)
- `submitFeedback(userId, feedbackData)` - Submit feedback
- `getUserFeedback(userId)` - Get user's feedback
- File: `src/services/feedbackService.js`

#### 11.2 Feedback Component (`src/components/FeedbackModal.js`)
- Rating (1-5 stars)
- Comment textarea
- Category selector
- Submit button
- File: `src/components/FeedbackModal.js`

---

### Phase 12: Conversion Tracking

#### 12.1 Conversion Service (`src/services/conversionService.js`)
- `trackConversion(userId, type)` - Track conversion event
  - Types: 'app_opened', 'route_searched', 'restaurant_favorited', 'review_submitted'
- `getConversionMetrics()` - Get conversion stats
- Update `waitlist` collection with conversion status
- File: `src/services/conversionService.js`

#### 12.2 Conversion Analytics
- Track key actions in app
- Update `waitlist` collection with conversion status
- Dashboard for conversion metrics
- File: `src/components/AdminConversionDashboard.js`

---

### Phase 13: Firestore Security Rules

#### 13.1 Update firestore.rules
- Waitlist: Users can create, read own; Admins read/write all
- Referrals: Users can create, read own; Admins read/write all
- Beta Reports: Users can create, read own; Admins read/write all
- Email Drips: System write, users read own; Admins read/write all
- Community Updates: System write, users read all; Admins read/write all
- File: `firestore.rules`

---

### Phase 14: Firebase Storage

#### 14.1 Screenshot Storage
- Create `beta-reports` bucket folder
- Rules: Users can upload own; Admins read all
- File: `storage.rules`

---

## File Structure

### Main App (`foodie-simple/`)
```
src/
├── components/
│   ├── WaitlistForm.js (for in-app referral display)
│   ├── ReferralSection.js (for in-app referral display)
│   ├── OnboardingFlow.js
│   ├── OnboardingFlow.css
│   ├── BetaReportingFAB.js
│   ├── BetaReportingFAB.css
│   ├── BetaReportingModal.js
│   ├── BetaReportingModal.css
│   ├── FeedbackModal.js
│   ├── AdminCohortDashboard.js
│   ├── AdminBetaReportsDashboard.js
│   └── AdminConversionDashboard.js
├── services/
│   ├── waitlistService.js
│   ├── referralService.js
│   ├── emailService.js
│   ├── emailTemplates.js
│   ├── emailTrackingService.js
│   ├── cohortScoringService.js
│   ├── onboardingService.js
│   ├── betaReportingService.js
│   ├── feedbackService.js
│   ├── conversionService.js
│   └── communityUpdateService.js
├── utils/
│   └── betaAccess.js
└── App.tsx (modify)
```

### Landing Page (`landing-page/` - Separate Project)
```
landing-page/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Hero.js
│   │   ├── WaitlistForm.js
│   │   ├── ReferralSection.js
│   │   └── SocialProof.js
│   ├── services/
│   │   └── waitlistApi.js
│   ├── App.js
│   ├── App.css
│   └── index.js
├── package.json
└── firebase.json
```

---

## Dependencies to Add

### Main App
```json
{
  "@sendgrid/mail": "^8.0.0"
}
```

### Landing Page
```json
{
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "firebase": "^10.0.0"
}
```

---

## Testing Checklist

- [ ] Landing page loads correctly
- [ ] Waitlist signup works
- [ ] Referral code generation works
- [ ] Referral tracking works (waitlist → waitlist)
- [ ] Points awarded when referred user joins beta
- [ ] Email drips send correctly (5 emails over 14 days)
- [ ] Email tracking works (opens, clicks)
- [ ] Cohort scoring calculates correctly
- [ ] Launch date automation works
- [ ] Beta access gating works
- [ ] Onboarding flow displays on first login
- [ ] Beta reporting FAB visible on all tabs
- [ ] Beta report submission works
- [ ] Screenshot upload works
- [ ] Community emails send correctly
- [ ] Admin dashboards display correctly
- [ ] Conversion tracking works
- [ ] Community name appears in all relevant places

---

## Implementation Notes

### Key Points
- **Referral Links:** Join waitlist (not beta directly)
- **Points System:** Awarded when referred user joins BETA (only if inviter in beta)
- **Email Drips:** 5 emails over 14 days (nurture sequence)
- **Launch Date:** 14 days after waitlist opens
- **Minimum Waitlist:** 500 users (target 300 beta users)
- **Beta Access:** Top 300 by cohort score on launch date
- **Beta Referrals:** Same links work, points when both are in beta
- **Community Emails:** Weekly updates with stats and leaderboards
- **Community Name:** Always use "Kawan Makan Community (EN) / Komuniti Kawan Makan (BM)"

### Email Service
- **Recommended: SendGrid via Firebase Extensions**
- Free tier: 100 emails/day
- Easy Firebase integration
- Transactional email support

### Landing Page
- Separate lightweight React app
- Firebase hosting URL for now
- Can add custom domain later
- Redirects to main app after beta access

### In-Game Coins
- Will be implemented post-beta
- Convert from XP earned during beta phase
- Name: TBD (K-Coins was suggestion, need better name)

---

## Timeline Estimate

- **Phase 1-2:** Data models & Landing page (3-5 days)
- **Phase 3-4:** Waitlist & Referral system (3-4 days)
- **Phase 5:** Email drip system (2-3 days)
- **Phase 6:** Cohort scoring (2-3 days)
- **Phase 7:** Beta access gating (1-2 days)
- **Phase 8:** Onboarding (2-3 days)
- **Phase 9:** Beta reporting (3-4 days)
- **Phase 10:** Community emails (2-3 days)
- **Phase 11-12:** Feedback & Conversion (2-3 days)
- **Phase 13-14:** Security & Storage (1-2 days)

**Total:** ~25-35 days

---

**Plan Status:** Complete and Ready for Implementation

