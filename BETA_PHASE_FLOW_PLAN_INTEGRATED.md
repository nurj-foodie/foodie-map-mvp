# Beta Phase User Flow Implementation Plan - INTEGRATED

**Date:** 13 November 2025  
**Status:** Planning Complete - Ready for Implementation  
**Community Name:** Kawan Makan Community (EN) / Komuniti Kawan Makan (BM)  
**Version:** Integrated Marketing + Technical Plan

---

## Overview

Complete end-to-end beta phase flow integrating marketing strategy with technical implementation: Traffic → Landing Page → Waitlist → K-Coins & Referrals → Survey → Email Drips → Cohort Scoring → Weekly Wave Invites → Beta Access → In-App Onboarding → Feedback → Conversion. Includes beta reporting, creator partnerships, and travel package draw system.

---

## Key Decisions & Clarifications

### Landing Page
- **Separate Standalone Page** (Lightweight React)
- Uses Firebase hosting URL for now (can add custom domain later)
- Separate project folder: `landing-page/`
- Redirects to main app after beta access granted

### K-Coins System
- **Implemented NOW** (not post-beta)
- **Visible in UI** during beta (balance displayed)
- Awarded on: Waitlist signup (+25), Referrals (+100), Survey completion (+50)
- Convert to in-app rewards post-beta launch

### Referral System
- **Referral links join WAITLIST** (not beta directly)
- **K-Coins awarded when referred user joins WAITLIST** (+100 to referrer, +25 to new user)
- **Additional points when referred user joins BETA** (+50 cohort score to referrer, only if inviter in beta)
- Same referral links work for both waitlist and beta phases

### Survey System
- **30-second survey** sent T+2 days after waitlist signup
- Captures: Device (iOS/Android), Drive frequency (weekly/monthly/occasional), Usual corridor
- **Reward:** +50 K-Coins on completion
- Used for cohort scoring (drive frequency = 25% weight)

### Email Drip Sequence (Updated)
1. **T+0:** Welcome email (K-Coins, referral link, corridor question)
2. **T+2:** Survey email (30-second form = +50 K-Coins)
3. **T+5:** Community building (Kawan Makan Community / Komuniti Kawan Makan)
4. **T+8:** Referral reminder
5. **Rolling:** Invite email (when beta access granted)
6. **T+7 post-invite:** Feedback email (NPS, missing spots, favorite detours)

### Launch Strategy (Updated - Weekly Waves)
- **Flexible Admin Control:** Admin sets wave timing and size
- **Weekly Waves:** 50-100 seats per wave (admin configurable)
- **First Wave:** Week 2 (or when admin triggers)
- **Wave Prioritization:** Corridor fit (40%) + Drive frequency (25%) + Referrals (25%) + Creator flag (10%)
- **Creator Slots:** Reserve ~20% of each wave for creators (automatic priority)

### Cohort Scoring Formula (Updated)
```
Base Score = 1000 - (signup_order * 10)
+ Corridor Fit: 40% weight (e.g., Kluang↔Penang, KL↔JB priority)
+ Drive Frequency: 25% weight (weekly > monthly > occasional)
+ Referrals: 25% weight (+50 per referral that joins BETA, only if inviter in beta)
+ Creator Flag: 10% weight (automatic priority access)
+ Email Engagement: +5 per email open, +10 per email click
+ Social Shares: +20 per social share (if tracked)
```

### Creator System
- **Automatic Beta Access:** Creators get priority access (can bypass scoring)
- **Scoring Bonus:** Creators also get +10% bonus if going through scoring
- **Manual Approval:** Admin can manually approve/flag creators
- **Reserved Slots:** ~20% of each wave reserved for creators
- **Unique Referral Codes:** Creators get special tracking codes

### Beta Phase Duration
- **Minimum:** 1 month
- **Target:** 300 beta users
- **Community Emails:** Weekly updates with stats and leaderboards

### Travel Package Draw
- **Monthly draw** for top referrers
- **Qualification:** Top N referrers (admin configurable, e.g., top 50)
- **Prize:** Malaysia travel package
- **Announcement:** Email + community update

### Community Branding
- Always use bilingual naming: **"Kawan Makan Community (EN) / Komuniti Kawan Makan (BM)"**
- Include in all emails, onboarding, UI components, and community-related content

---

## Marketing Strategy & Messaging

### Target Personas
1. **Lone Explorers** - Solo travelers exploring routes
2. **Food Crews** - Groups planning road trips
3. **Food Bloggers/Instagrammers** - Content creators needing map-friendly content
4. **Frequent Interstate Travelers** - Regular KL↔JB, Kluang↔Penang drivers

### Traffic Channels
- IG Reels/Stories
- FB Groups (foodie/travel)
- WhatsApp/Telegram shares
- Creator shoutouts
- UTM tracking on all links
- Unique `?ref=` codes for creators

### Core Promise
**"Makan stops you'll actually love—within 5km or 30min of your route."**

### Value Propositions
- Malaysia-first routes
- Firestore-first (faster, cheaper)
- Built by travelers
- Halal-first, Shariah-aligned business model
- One tap to Google Maps

### CTA
**"Join the beta & earn K-Coins"**

### Incentives
- +25 K-Coins for joining waitlist
- +100 K-Coins per friend who joins via your link
- +50 K-Coins for 30-second survey
- Monthly draw for top referrers: Malaysia travel package
- K-Coins convert to in-app rewards at launch

---

## Landing Page Copy & Messaging

### Hero Section
**EN:**
"Eat better on every road trip. Within 5km or 30 min of your route, halal-first."

**BM:**
"Port makan padu—5km atau 30 min dari laluan anda."

### Sub-headline
**EN:**
"Pick your route (adventure options included). We surface food, R&R and petrol. One tap to Google Maps."

**BM:**
"Pilih laluan (termasuk adventure). Kami cadangkan makan, R&R, petrol. Satu tap ke Google Maps."

### Bullet Points
- Multiple routes: fastest or scenic
- Food/R&R/petrol along your chosen path
- Offline-friendly caching of past routes
- Save & share favorites

### Incentive Block
"Join now → +25 K-Coins. Share your link → +100 per friend. 30-sec survey → +50. Top referrers enter a Malaysia travel package draw."

### Trust Elements
- Halal-first
- Shariah-aligned business model
- Coverage: Malaysia-first (interstate drives)
- Navigation: opens directly in Google Maps
- Audience: frequent travelers, food bloggers, food hunters

### Mini FAQ
- Coverage: Malaysia-first (interstate drives)
- Nav: opens directly in Google Maps
- Audience: frequent travelers, food bloggers/instagrammers, food hunters

---

## Implementation Phases

### Phase 1: Data Models & Firestore Collections

#### 1.1 Waitlist Collection (`waitlist`) - UPDATED
```javascript
{
  email: string,
  name: string,
  referredBy: string | null, // userId or referral code
  referralCode: string, // Unique code for this user
  signupDate: timestamp,
  signupOrder: number, // For base score calculation
  cohortScore: number,
  kCoins: number, // K-Coins balance (starts at 25)
  isCreator: boolean, // Creator flag
  creatorApproved: boolean, // Manual creator approval
  surveyCompleted: boolean, // Survey completion status
  surveyData: {
    device: 'ios' | 'android' | null,
    driveFrequency: 'weekly' | 'monthly' | 'occasional' | null,
    usualCorridor: string | null // e.g., "Kluang↔Penang", "KL↔JB"
  } | null,
  emailEngagement: {
    opens: number,
    clicks: number,
    lastOpened: timestamp
  },
  betaAccessGranted: boolean,
  betaAccessDate: timestamp | null,
  waveNumber: number | null, // Which wave they were invited in
  conversionStatus: 'waitlist' | 'beta_active' | 'converted',
  createdAt: timestamp
}
```

#### 1.2 Referrals Collection (`referrals`) - UPDATED
```javascript
{
  referrerId: string, // User who referred (waitlist or beta user)
  referrerEmail: string,
  referredEmail: string,
  referralCode: string,
  isCreatorReferral: boolean, // If referrer is creator
  status: 'pending' | 'signed_up_waitlist' | 'beta_active' | 'converted',
  kCoinsAwarded: boolean, // True when +100 K-Coins awarded to referrer
  pointsAwarded: boolean, // True when +50 cohort points awarded
  createdAt: timestamp,
  betaAccessDate: timestamp | null, // When referred user got beta access
  convertedAt: timestamp | null
}
```

#### 1.3 K-Coins Transactions Collection (`kcoins_transactions`)
```javascript
{
  userId: string,
  email: string,
  type: 'waitlist_signup' | 'referral' | 'survey' | 'draw_prize' | 'conversion',
  amount: number, // Positive for earned, negative for spent
  description: string,
  relatedId: string | null, // referralId, surveyId, etc.
  createdAt: timestamp
}
```

#### 1.4 Survey Responses Collection (`survey_responses`)
```javascript
{
  waitlistId: string,
  email: string,
  device: 'ios' | 'android',
  driveFrequency: 'weekly' | 'monthly' | 'occasional',
  usualCorridor: string, // e.g., "Kluang↔Penang", "KL↔JB"
  completedAt: timestamp,
  kCoinsAwarded: boolean
}
```

#### 1.5 Travel Package Draw Collection (`travel_draws`)
```javascript
{
  month: string, // "2025-11"
  topReferrers: array, // Top N referrer IDs
  winnerId: string | null,
  winnerEmail: string | null,
  drawnAt: timestamp | null,
  announced: boolean,
  createdAt: timestamp
}
```

#### 1.6 Beta Reports Collection (`beta_reports`)
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

#### 1.7 Email Drips Collection (`email_drips`) - UPDATED
```javascript
{
  waitlistId: string,
  email: string,
  dripSequence: number, // 1 (Welcome), 2 (Survey), 3 (Community), 4 (Referral), 5 (Invite), 6 (Feedback)
  sentAt: timestamp,
  openedAt: timestamp | null,
  clickedAt: timestamp | null,
  status: 'scheduled' | 'sent' | 'opened' | 'clicked'
}
```

#### 1.8 Community Updates Collection (`community_updates`)
```javascript
{
  updateType: 'weekly' | 'milestone' | 'launch' | 'draw_announcement',
  title: string,
  content: string,
  stats: {
    totalWaitlist: number,
    totalBetaUsers: number,
    activeBetaUsers: number,
    referralLeaderboard: array // Top 10
  },
  travelDrawWinner: string | null, // If draw announcement
  sentAt: timestamp,
  recipients: number
}
```

#### 1.9 Update Users Collection
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
  kCoins: number, // K-Coins balance
  isCreator: boolean,
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
  │   │   └── waitlistApi.js
  │   ├── App.js
  │   ├── App.css
  │   └── index.js
  ├── package.json
  └── firebase.json
  ```

#### 2.2 Landing Page Components

**Hero Section** (`src/components/Hero.js`)
- EN: "Eat better on every road trip. Within 5km or 30 min of your route, halal-first."
- BM: "Port makan padu—5km atau 30 min dari laluan anda."
- Sub: "Pick your route (adventure options included). We surface food, R&R and petrol. One tap to Google Maps."
- CTA: Join Waitlist
- Incentive: "+25 K-Coins for joining"

**Waitlist Form** (`src/components/WaitlistForm.js`)
- Email input with validation
- Name input
- Referral code input (optional, pre-filled from URL param `?ref=CODE`)
- Submit button
- Success message:
  - "You're in! +25 K-Coins added to your account."
  - Display referral code
  - Share buttons (WhatsApp, Telegram, Facebook, Twitter)
  - "Share your link → +100 K-Coins per friend"

**Referral Section** (`src/components/ReferralSection.js`)
- Display referral code after signup
- Share buttons (copy link, WhatsApp, Telegram - prioritized for Malaysia)
- Referral stats (if user returns with same email)
- Referral link format: `https://[landing-url]?ref=REFERRAL_CODE`
- Incentive messaging: "+100 K-Coins per friend, monthly travel package draw"

**Social Proof** (`src/components/SocialProof.js`)
- Waitlist count (live from Firestore)
- "Join Kawan Makan Community / Komuniti Kawan Makan" messaging
- Trust elements: Halal-first, Shariah-aligned

#### 2.3 Landing Page Copy
Use provided EN/BM copy from marketing plan in all components.

---

### Phase 3: K-Coins System

#### 3.1 K-Coins Service (`src/services/kCoinsService.js`)
- `awardKCoins(userId, amount, type, description)` - Award K-Coins
  - Types: 'waitlist_signup', 'referral', 'survey', 'draw_prize', 'conversion'
- `getKCoinsBalance(userId)` - Get current balance
- `getKCoinsHistory(userId)` - Get transaction history
- `spendKCoins(userId, amount, description)` - Spend K-Coins (post-beta)
- `convertToTokens(userId, amount)` - Convert K-Coins to tokens (post-beta)
- File: `src/services/kCoinsService.js`

#### 3.2 K-Coins Display Component (`src/components/KCoinsDisplay.js`)
- Display K-Coins balance in header/navigation
- Show balance prominently in User Tab
- Transaction history view
- **Beta Phase:** Just show balance (no "coming soon" messaging - keep it mysterious)
- **Post-Beta:** Show balance + available uses (premium features, token conversion)
- File: `src/components/KCoinsDisplay.js`
- Styles: `src/components/KCoinsDisplay.css`

#### 3.3 K-Coins Awards (Beta Phase)
- **Waitlist Signup:** +25 K-Coins (automatic on signup)
- **Referral:** +100 K-Coins (when referred user joins waitlist)
- **Survey Completion:** +50 K-Coins (on survey submit)
- **Travel Draw:** Variable (monthly winner)

#### 3.4 Post-Beta K-Coins Use Cases (Hybrid Approach)

**Note:** These use cases are defined for planning but will be implemented post-beta. During beta, K-Coins accumulate only.

**A. Premium Features (Subscription-like)**
- **Premium Filters** - 100 K-Coins/month
  - Advanced halal tags (certified, self-declared, pork-free)
  - Buka lewat filter (late-night dining)
  - Price range filters
  - Cuisine-specific filters
  
- **Offline Cache Access** - 50 K-Coins/month
  - Download routes for offline use
  - Access cached restaurant data without internet
  - Sync when online
  
- **Early Feature Voting** - 25 K-Coins per vote
  - Vote on upcoming features
  - Influence development roadmap
  - Beta tester priority voting
  
- **Ad-Free Experience** - 200 K-Coins/month (if ads added)
  - Remove all advertisements
  - Cleaner interface
  
- **Priority Support** - 100 K-Coins per request
  - Faster response times
  - Direct support channel

**B. In-App Purchases (One-time)**
- **Energy Boosters** - 50 K-Coins per booster
  - +20 Energy (for route searches)
  - Instant energy refill
  
- **Route Search Credits** - 30 K-Coins per search
  - Additional route searches beyond daily limit
  - Premium route calculations
  
- **Token Conversion** - 10 K-Coins = 1 Token (any type)
  - Convert K-Coins to Food/Photo/Review/Explorer tokens
  - Helps with leveling and crafting (post-beta gamification)
  - Flexible conversion rate
  
- **Badge Unlocks** - 150 K-Coins per badge
  - Unlock special badges early
  - Exclusive beta tester badges
  
- **Profile Customization** - 75 K-Coins per item
  - Custom profile themes
  - Avatar frames
  - Achievement showcases

**C. Gamification Integration (Post-Beta)**
- **Token Conversion:** K-Coins can convert to tokens (Food, Photo, Review, Explorer)
  - Conversion rate: 10 K-Coins = 1 Token (any type)
  - Tokens used for leveling and crafting (see GAMIFICATIONLOG.md)
  - Beta testers get +10% bonus on conversion
  
- **XP Boosters:** 100 K-Coins = 2x XP for 24 hours
  - Temporary XP multiplier
  - Helps with leveling
  
- **Challenge Skips:** 50 K-Coins per skip
  - Skip daily/weekly challenges
  - Still earn partial rewards

**D. Community & Social**
- **Featured Listing** - 200 K-Coins per restaurant
  - Feature your favorite restaurant
  - Highlight in community feed
  
- **Event Participation** - 75 K-Coins per event
  - Join exclusive treasure hunt events
  - Access to special community events

**E. Conversion Rates (Reference)**
- 1 K-Coin ≈ RM 0.10 (for Founder Pass conversion reference)
- Beta accumulation: Average user earns 200-500 K-Coins during beta
- Post-beta value: Significant savings on premium features

**Implementation Timeline:**
- **Beta Phase:** K-Coins earned and displayed (accumulation only)
- **Post-Beta v1.0:** Premium features + Token conversion
- **Post-Beta v1.1+:** Additional features and social elements

---

### Phase 4: Waitlist System

#### 4.1 Waitlist Service (`src/services/waitlistService.js`)
- `joinWaitlist(email, name, referralCode?)` - Add to waitlist
  - Generate unique referral code
  - Track referral relationship if referralCode provided
  - Calculate signup order
  - Initialize cohort score
  - Award +25 K-Coins
  - Award +25 K-Coins to referred user if referralCode provided
  - Award +100 K-Coins to referrer if referralCode provided
- `checkBetaAccess(userId)` - Check if user has access
- `getWaitlistPosition(email)` - Get position in queue
- `generateReferralCode(userId)` - Create unique referral code
- `getWaitlistCount()` - Get total waitlist users
- File: `src/services/waitlistService.js`

#### 4.2 Referral Tracking
- When user joins waitlist with referral code:
  - Create entry in `referrals` collection
  - Link referrer and referred user
  - Status: 'signed_up_waitlist'
  - Award +100 K-Coins to referrer
  - Award +25 K-Coins to new user
- When referred user gets beta access:
  - Update referral status to 'beta_active'
  - Check if referrer is in beta
  - If yes, award +50 cohort points to referrer
  - Update referral.pointsAwarded = true

---

### Phase 5: Survey System

#### 5.1 Survey Service (`src/services/surveyService.js`)
- `sendSurveyEmail(email, name)` - Send survey email T+2
- `submitSurvey(waitlistId, surveyData)` - Submit survey response
  - Validate data
  - Award +50 K-Coins
  - Update waitlist.surveyCompleted = true
  - Update waitlist.surveyData
  - Update cohort score with drive frequency
- `getSurveyStatus(waitlistId)` - Check if survey completed
- File: `src/services/surveyService.js`

#### 5.2 Survey Component (`src/components/SurveyModal.js`)
- Device selector (iOS/Android)
- Drive frequency selector (Weekly/Monthly/Occasional)
- Corridor input (free text, suggest common routes)
- Submit button
- Success message: "+50 K-Coins added!"
- File: `src/components/SurveyModal.js`
- Styles: `src/components/SurveyModal.css`

#### 5.3 Survey Email Template
- Subject: "30 seconds = +50 K-Coins"
- Content: Device, drive frequency, usual corridor questions
- Link to survey form (landing page or in-app)
- CTA: Complete survey

---

### Phase 6: Referral System

#### 6.1 Referral Service (`src/services/referralService.js`)
- `createReferral(referrerId, referredEmail)` - Track referral
- `getUserReferrals(userId)` - Get user's referrals
- `validateReferralCode(code)` - Validate referral code
- `awardReferralKCoins(referrerId)` - Award +100 K-Coins
- `awardReferralPoints(referrerId)` - Award +50 cohort points (when referred joins beta)
- `getReferralStats(userId)` - Get referral statistics
- `checkAndAwardPoints(referredUserId)` - Check if points should be awarded
- File: `src/services/referralService.js`

#### 6.2 Referral Component (`src/components/ReferralSection.js`)
- Display user's referral code
- Share buttons (copy link, WhatsApp, Telegram - prioritized)
- Referral stats (count, K-Coins earned, status of referrals)
- Referral link format: `https://[landing-url]?ref=REFERRAL_CODE`
- Leaderboard position (if in top N)
- File: `src/components/ReferralSection.js`

---

### Phase 7: Email Drip System (Updated Sequence)

#### 7.1 Email Service (`src/services/emailService.js`)
- `sendWelcomeEmail(email, name, referralCode)` - T+0 (immediate)
- `sendSurveyEmail(email, name)` - T+2
- `sendCommunityEmail(email, name)` - T+5
- `sendReferralReminderEmail(email, name)` - T+8
- `sendInviteEmail(email, name)` - Rolling (when beta access granted)
- `sendFeedbackEmail(email, name)` - T+7 post-invite
- `trackEmailOpen(emailId)` - Track email opens (webhook)
- `trackEmailClick(emailId)` - Track email clicks (webhook)
- Integration with SendGrid API
- File: `src/services/emailService.js`

#### 7.2 Email Templates (`src/services/emailTemplates.js`)
All emails must include community name: "Kawan Makan Community / Komuniti Kawan Makan"

**Email 1: Welcome (T+0)**
- Subject: "You're in—claim your K-Coins"
- Content:
  - "Hi! You're on the Kawan Makan beta list. Starter 25 K-Coins added."
  - "Your corridor (e.g., Kluang↔Penang)? Reply with your most common route."
  - "Share this link to earn 100 K-Coins per friend: {your_ref_link}"
  - "Next: a 30-sec survey for +50 K-Coins."
- Include: Referral code, referral link

**Email 2: Survey (T+2)**
- Subject: "30 seconds = +50 K-Coins"
- Content: Device (iOS/Android), drive frequency (weekly/monthly/occasional), usual corridor
- Link to survey form
- CTA: Complete survey

**Email 3: Community Building (T+5)**
- Subject: "Join Kawan Makan Community / Komuniti Kawan Makan"
- Content: Community goals, early adopter benefits, social links
- CTA: Follow social media
- Include: Community name prominently

**Email 4: Referral Reminder (T+8)**
- Subject: "Unlock Beta Access Faster"
- Content: How referrals work, current position, leaderboard teaser
- CTA: Share referral link
- Include: Referral stats, referral link

**Email 5: Invite (Rolling)**
- Subject: "Your Kawan Makan beta access"
- Content:
  - "Build your first route → pick a detour → open in Google Maps."
  - "Tip: save 1 favorite & share 1 stop for a chance to be featured."
- CTA: Start exploring

**Email 6: Feedback (T+7 post-invite)**
- Subject: "Rate your makan run (1–10)"
- Content: Accuracy, detour time, food quality, missing stops
- Request: Reply with 3 favorite detours
- CTA: Submit feedback

#### 7.3 Email Tracking (`src/services/emailTrackingService.js`)
- Webhook endpoint for SendGrid events
- Update `email_drips` collection
- Update cohort score based on engagement (+5 per open, +10 per click)
- File: `src/services/emailTrackingService.js`

---

### Phase 8: Cohort Scoring System (Updated)

#### 8.1 Cohort Scoring Service (`src/services/cohortScoringService.js`)
- `calculateCohortScore(waitlistId)` - Calculate total score
  - Base: 1000 - (signup_order * 10)
  - Corridor Fit: 40% weight (prioritize Kluang↔Penang, KL↔JB, etc.)
  - Drive Frequency: 25% weight (weekly > monthly > occasional)
  - Referrals: 25% weight (+50 per referral that joins BETA, only if inviter in beta)
  - Creator Flag: 10% weight (automatic priority)
  - Email opens: +5 per open
  - Email clicks: +10 per click
  - Social shares: +20 per share (if tracked)
- `getTopCohort(limit, filters)` - Get top N users for beta access
  - Filters: corridor, drive frequency, creator flag
- `updateScore(waitlistId, points)` - Manual score adjustment (admin)
- `awardReferralPoints(referrerId)` - Award +50 when referred user joins beta
- File: `src/services/cohortScoringService.js`

#### 8.2 Admin Cohort Dashboard
- View waitlist with scores
- Filter by score, referrals, engagement, corridor, drive frequency, creator flag
- Grant beta access manually
- Set wave timing and size (flexible admin control)
- View top users by various criteria
- Creator management (flag, approve, priority access)
- File: `src/components/AdminCohortDashboard.js` (add to AdminDashboard)

---

### Phase 9: Weekly Wave System

#### 9.1 Wave Management Service (`src/services/waveService.js`)
- `createWave(waveNumber, size, criteria)` - Create new wave
  - Criteria: corridor fit, drive frequency, referrals, creator flag
  - Size: 50-100 seats (admin configurable)
- `getNextWaveCandidates()` - Get users eligible for next wave
- `grantWaveAccess(waveNumber, userIds)` - Grant access to wave
- `getWaveStats(waveNumber)` - Get wave statistics
- File: `src/services/waveService.js`

#### 9.2 Wave Prioritization Logic
1. **Creators:** Automatic priority (reserve ~20% slots)
2. **Corridor Fit:** 40% weight (prioritize flagship routes)
3. **Drive Frequency:** 25% weight (weekly > monthly > occasional)
4. **Referrals:** 25% weight (top referrers)
5. **Email Engagement:** Bonus points

#### 9.3 Admin Wave Dashboard
- Create new wave
- Set wave size (50-100)
- Set wave criteria
- Preview wave candidates
- Grant access to wave
- View wave history
- File: `src/components/AdminWaveDashboard.js` (add to AdminDashboard)

---

### Phase 10: Creator System

#### 10.1 Creator Service (`src/services/creatorService.js`)
- `flagAsCreator(userId, approved)` - Flag user as creator
- `grantCreatorAccess(userId)` - Grant automatic beta access
- `getCreatorReferrals(creatorId)` - Get creator's referral stats
- `getCreatorLeaderboard()` - Get top creators
- File: `src/services/creatorService.js`

#### 10.2 Creator Management
- **Automatic Access:** Creators bypass scoring, get immediate access
- **Scoring Bonus:** If going through scoring, +10% bonus
- **Manual Approval:** Admin can approve/flag creators
- **Reserved Slots:** ~20% of each wave reserved for creators
- **Unique Codes:** Creators get special referral codes for tracking

#### 10.3 Admin Creator Dashboard
- List all creators
- Flag/approve creators
- View creator referral performance
- Creator leaderboard
- File: `src/components/AdminCreatorDashboard.js` (add to AdminDashboard)

---

### Phase 11: Travel Package Draw System

#### 11.1 Draw Service (`src/services/drawService.js`)
- `getTopReferrers(limit)` - Get top N referrers for the month
- `createDraw(month, topN)` - Create draw entry
- `conductDraw(drawId)` - Randomly select winner from top referrers
- `announceDraw(drawId)` - Send announcement email
- File: `src/services/drawService.js`

#### 11.2 Draw Component (`src/components/TravelDraw.js`)
- Display current month's top referrers
- Show draw status (pending, drawn, announced)
- Announce winner (if drawn)
- File: `src/components/TravelDraw.js`

#### 11.3 Draw Email Template
- Subject: "Travel Package Winner: [Name]!"
- Content: Winner announcement, next month's draw info
- CTA: Keep referring to qualify

---

### Phase 12: Beta Access Gating

#### 12.1 Beta Access Check (`src/utils/betaAccess.js`)
- `checkBetaAccess(userId)` - Check Firestore for access
- `grantBetaAccess(userId, waveNumber?)` - Grant access (admin or automated)
- `revokeBetaAccess(userId)` - Revoke access (admin)
- `grantBetaAccessBatch(userIds, waveNumber)` - Grant access to wave
- File: `src/utils/betaAccess.js`

#### 12.2 Update AuthContext
- Add `betaAccess` to user state
- Check on login
- Redirect to landing page if no access
- File: `src/contexts/AuthContext.js` (modify)

---

### Phase 13: In-App Onboarding

#### 13.1 Onboarding Service (`src/services/onboardingService.js`)
- `markOnboardingComplete(userId)` - Mark as completed
- `getOnboardingStatus(userId)` - Check if completed
- File: `src/services/onboardingService.js`

#### 13.2 Onboarding Flow Component (`src/components/OnboardingFlow.js`)
- Step 1: Welcome & App Overview
- Step 2: Route Discovery Tutorial
- Step 3: Restaurant Features Tour
- Step 4: Gamification Introduction (K-Coins, XP)
- Step 5: Beta Reporting Feature
- Step 6: Community Introduction - "Welcome to Kawan Makan Community / Komuniti Kawan Makan"
- **First-session goals checklist:**
  - Pick route
  - View food/R&R/petrol
  - Add 1 waypoint
  - Open in Google Maps
  - Save 1 favorite
  - Share 1 stop
- Include community name in onboarding content
- File: `src/components/OnboardingFlow.js`
- Styles: `src/components/OnboardingFlow.css`

#### 13.3 Update App.tsx
- Check onboarding status on first login
- Show OnboardingFlow if not completed
- File: `src/App.tsx` (modify)

---

### Phase 14: Beta Reporting Feature

#### 14.1 Beta Reporting FAB (`src/components/BetaReportingFAB.js`)
- Floating action button (bottom-right)
- Always visible across all tabs
- Opens BetaReportingModal
- Badge for unread admin responses
- File: `src/components/BetaReportingFAB.js`
- Styles: `src/components/BetaReportingFAB.css`

#### 14.2 Beta Reporting Modal (`src/components/BetaReportingModal.js`)
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

#### 14.3 Beta Reporting Service (`src/services/betaReportingService.js`)
- `submitReport(userId, reportData)` - Submit new report
- `getUserReports(userId)` - Get user's reports
- `getReportDetails(reportId)` - Get single report
- `uploadScreenshot(file)` - Upload to Firebase Storage
- File: `src/services/betaReportingService.js`

#### 14.4 Admin Beta Reports Dashboard
- List all reports with filters
- View report details
- Update status and priority
- Add admin notes
- File: `src/components/AdminBetaReportsDashboard.js` (add to AdminDashboard)

---

### Phase 15: Community Email Updates (During Beta)

#### 15.1 Community Update Service (`src/services/communityUpdateService.js`)
- `sendWeeklyUpdate(weekNumber)` - Send weekly community email
- `getCommunityStats()` - Get current stats
- `getReferralLeaderboard(limit)` - Get top referrers
- File: `src/services/communityUpdateService.js`

#### 15.2 Community Email Templates
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

### Phase 16: Feedback Collection

#### 16.1 Feedback Service (`src/services/feedbackService.js`)
- `submitFeedback(userId, feedbackData)` - Submit feedback
- `getUserFeedback(userId)` - Get user's feedback
- File: `src/services/feedbackService.js`

#### 16.2 Feedback Component (`src/components/FeedbackModal.js`)
- Rating (1-10 NPS scale)
- Comment textarea
- Category selector (accuracy, detour time, food quality, missing stops)
- Request: "Share 3 favorite detours"
- Submit button
- File: `src/components/FeedbackModal.js`

---

### Phase 17: Conversion Tracking

#### 17.1 Conversion Service (`src/services/conversionService.js`)
- `trackConversion(userId, type)` - Track conversion event
  - Types: 'app_opened', 'route_searched', 'restaurant_favorited', 'review_submitted', 'first_route_built'
- `getConversionMetrics()` - Get conversion stats
- Update `waitlist` collection with conversion status
- File: `src/services/conversionService.js`

#### 17.2 Conversion Analytics
- Track key actions in app
- Update `waitlist` collection with conversion status
- Dashboard for conversion metrics
- KPIs:
  - 300+ signups
  - ≥30% weekly drivers
  - ≥25% invite acceptance
  - Time to first route < 24h post-invite
  - 1+ favorite per activated user
- File: `src/components/AdminConversionDashboard.js`

---

### Phase 18: Firestore Security Rules

#### 18.1 Update firestore.rules
- Waitlist: Users can create, read own; Admins read/write all
- Referrals: Users can create, read own; Admins read/write all
- K-Coins Transactions: Users can read own; System write; Admins read/write all
- Survey Responses: Users can create, read own; Admins read/write all
- Travel Draws: Users can read; Admins read/write all
- Beta Reports: Users can create, read own; Admins read/write all
- Email Drips: System write, users read own; Admins read/write all
- Community Updates: System write, users read all; Admins read/write all
- File: `firestore.rules`

---

### Phase 19: Firebase Storage

#### 19.1 Screenshot Storage
- Create `beta-reports` bucket folder
- Rules: Users can upload own; Admins read all
- File: `storage.rules`

---

## Marketing Assets Checklist

### Landing Page Assets
- [ ] Hero copy (EN/BM)
- [ ] Value proposition bullets
- [ ] Incentive block copy
- [ ] Mini FAQ
- [ ] Trust elements (halal, Shariah-aligned)

### Email Templates
- [ ] Welcome email (plain text)
- [ ] Survey email (plain text)
- [ ] Community email (plain text)
- [ ] Referral reminder (plain text)
- [ ] Invite email (plain text)
- [ ] Feedback email (plain text)

### Social Media Assets
- [ ] WhatsApp/Telegram message template
- [ ] IG Reel script 1: "3 detours worth 15 min"
- [ ] IG Reel script 2: "Fast vs Adventure route"
- [ ] IG Reel script 3: "1-tap pit stops to Google Maps"
- [ ] FB Group post template
- [ ] Creator DM template

### Lead Magnet
- [ ] "Top 50 Detours" PDF outline
- [ ] PDF design and content

### Creator Kit
- [ ] Creator benefits document
- [ ] Examples and use cases
- [ ] Referral code assignment system

---

## 30-Day Pre-Beta Plan

### Week 1 (Setup & Seed)
- [ ] Publish landing page + analytics
- [ ] Seed personal network (WA/Telegram/IG Stories)
- [ ] Recruit 3-5 creators (food bloggers/instagrammers) with unique referral codes
- [ ] Asset pack: hero visuals, "Top 50 Detours" PDF lead magnet

### Week 2 (Communities & Early Cohort)
- [ ] Posts in MY foodie/travel/videography groups
- [ ] Emphasize Kluang↔Penang and KL↔JB corridors
- [ ] Send Welcome + Survey emails
- [ ] Announce first travel-perk window
- [ ] First invite wave (50): route-fit + creators

### Week 3 (Proof & Momentum)
- [ ] Publish "Top Routes & Detours of the Week" (with credits)
- [ ] Collab reels (3 short scripts) linking to waitlist
- [ ] Creator spotlight
- [ ] Second invite wave (75-100): reward engaged referrers

### Week 4 (Optimize & Expand)
- [ ] Diagnose drop-offs (Landing→Submit→Invite→Activation)
- [ ] Referral push ("100 K-Coins per friend this week")
- [ ] Tease v0.7 treasure hunts
- [ ] Third invite wave (100): widen corridor mix

---

## KPIs & Measurement

### Key Events to Track
- `waitlist_submit{route,frequency}`
- `referral_click{code}`
- `invite_sent`
- `activation_started`
- `first_route_built`
- `survey_completed`
- `kcoins_earned{type,amount}`

### 14-Day Targets
- 300+ signups
- ≥30% weekly drivers
- ≥25% invite acceptance
- Time to first route < 24h post-invite
- 1+ favorite per activated user

### Dashboards
- Source/creator performance
- Referrals leaderboard
- Corridor heatmap
- Stepwise funnel (landing→submit→invite→activation)
- K-Coins distribution
- Survey completion rate

---

## Risks & Mitigations

### API Cost Spikes
- **Risk:** High API usage during beta
- **Mitigation:** Firestore-first cache; Malaysia-only validation (already in PRD)

### Low Activation
- **Risk:** Users don't activate after invite
- **Mitigation:** In-app checklist + first-trip prompts; creator "how-to" reels

### Reward Abuse
- **Risk:** Gaming the referral system
- **Mitigation:** Server-side counting, unique email validation, basic device/IP heuristics, honeypot fields

### Content Thinness
- **Risk:** Not enough user-generated content
- **Mitigation:** Feature weekly "Top Detours" from early testers (social proof)

---

## File Structure

### Main App (`foodie-simple/`)
```
src/
├── components/
│   ├── KCoinsDisplay.js
│   ├── KCoinsDisplay.css
│   ├── SurveyModal.js
│   ├── SurveyModal.css
│   ├── ReferralSection.js
│   ├── OnboardingFlow.js
│   ├── OnboardingFlow.css
│   ├── BetaReportingFAB.js
│   ├── BetaReportingFAB.css
│   ├── BetaReportingModal.js
│   ├── BetaReportingModal.css
│   ├── FeedbackModal.js
│   ├── TravelDraw.js
│   ├── AdminCohortDashboard.js
│   ├── AdminWaveDashboard.js
│   ├── AdminCreatorDashboard.js
│   ├── AdminBetaReportsDashboard.js
│   └── AdminConversionDashboard.js
├── services/
│   ├── kCoinsService.js
│   ├── waitlistService.js
│   ├── surveyService.js
│   ├── referralService.js
│   ├── emailService.js
│   ├── emailTemplates.js
│   ├── emailTrackingService.js
│   ├── cohortScoringService.js
│   ├── waveService.js
│   ├── creatorService.js
│   ├── drawService.js
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
- [ ] K-Coins awarded on signup (+25)
- [ ] Referral code generation works
- [ ] Referral tracking works (waitlist → waitlist)
- [ ] K-Coins awarded on referral (+100 to referrer, +25 to new user)
- [ ] Survey email sends T+2
- [ ] Survey completion awards +50 K-Coins
- [ ] Points awarded when referred user joins beta
- [ ] Email drips send correctly (updated sequence)
- [ ] Email tracking works (opens, clicks)
- [ ] Cohort scoring calculates correctly (updated formula)
- [ ] Weekly wave system works
- [ ] Creator system works (automatic access + scoring bonus)
- [ ] Travel draw system works
- [ ] Beta access gating works
- [ ] Onboarding flow displays on first login
- [ ] Beta reporting FAB visible on all tabs
- [ ] Beta report submission works
- [ ] Screenshot upload works
- [ ] Community emails send correctly
- [ ] Admin dashboards display correctly
- [ ] Conversion tracking works
- [ ] K-Coins balance displays in UI (no "coming soon" messaging)
- [ ] K-Coins accumulate correctly during beta
- [ ] Community name appears in all relevant places

---

## Implementation Notes

### Key Points
- **K-Coins:** Implemented now, visible in UI, awarded on waitlist/referral/survey
- **K-Coins During Beta:** Accumulation only (no spending, no "coming soon" messaging - keep it mysterious)
- **K-Coins Post-Beta:** Hybrid use cases (premium features + in-app purchases + token conversion)
- **Referral Links:** Join waitlist (not beta directly)
- **K-Coins Awards:** +100 per referral (waitlist), +50 cohort points (beta)
- **Survey:** T+2, captures device/frequency/corridor, +50 K-Coins
- **Email Drips:** Updated sequence (Welcome, Survey, Community, Referral, Invite, Feedback)
- **Weekly Waves:** Flexible admin control, 50-100 seats per wave
- **Cohort Scoring:** Corridor fit (40%) + Drive frequency (25%) + Referrals (25%) + Creator (10%)
- **Creator System:** Automatic access + scoring bonus + manual approval
- **Travel Draw:** Monthly draw for top referrers
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

---

## Timeline Estimate

- **Phase 1:** Data models & K-Coins system (3-4 days)
- **Phase 2:** Landing page (3-4 days)
- **Phase 3-4:** Waitlist & Referral system (3-4 days)
- **Phase 5:** Survey system (2-3 days)
- **Phase 6:** Referral system updates (2-3 days)
- **Phase 7:** Email drip system (2-3 days)
- **Phase 8:** Cohort scoring (2-3 days)
- **Phase 9:** Weekly wave system (2-3 days)
- **Phase 10:** Creator system (2-3 days)
- **Phase 11:** Travel draw system (1-2 days)
- **Phase 12:** Beta access gating (1-2 days)
- **Phase 13:** Onboarding (2-3 days)
- **Phase 14:** Beta reporting (3-4 days)
- **Phase 15:** Community emails (2-3 days)
- **Phase 16-17:** Feedback & Conversion (2-3 days)
- **Phase 18-19:** Security & Storage (1-2 days)

**Total:** ~35-45 days

---

**Plan Status:** Complete and Ready for Implementation - Integrated Marketing + Technical Plan

