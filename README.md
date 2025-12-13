# 🗺️ Kawan Makan — Food Discovery App

**Current Version:** v0.8.0 | [📋 View Changelog](./CHANGELOG.md)  
**Last Updated:** 13 December 2025  
**Status:** Phases 0, 1, 2, 3.1, 3.2, 3.3, 4 Complete ✅ | **Mobile Polish & Auth Fix Complete v0.8.0** ✅ | Production Ready 🚀

A cost-effective food discovery app that helps users find restaurants along their routes with 95% API cost reduction. Built for Peninsular Malaysia with route planning, restaurant discovery, and user contributions.

## 🎯 Features

### ✅ Core Functionality
- **🗺️ Route Planning** - Plan routes between cities with multiple alternatives
- **🍽️ Restaurant Discovery** - Find restaurants along your route with detour calculations
- **🛣️ R&R Stops** - Find rest stops along your route (5km/30min threshold)
- **⛽ Petrol Stations** - Find petrol stations along your route (5km/15min threshold)
- **🧭 Waypoint Navigation** - Navigate via selected places (Start → Place → End)
- **🔍 Smart Filtering** - Filter by place type (All, Restaurants, R&R, Petrol), distance, rating, cuisine type, halal status
- **💾 Save & Load Routes** - User-specific saved routes with place selections
- **🗺️ Smart Autocomplete** - Firestore-first location index that learns from searches

### ✅ User Experience
- **🔐 Authentication** - Google OAuth + Email/Password login
- **⭐ Favorites System** - Save favorite restaurants with soft delete & 24-hour restore
  - Smart duplicate prevention (name + location matching)
  - Automatic ID updates for old favorites
  - Duplicate cleanup system
  - Consistent ID handling across all components
- **📚 Saved Routes** - Access saved routes from FavoritesTab with tabbed interface
- **👤 User Dashboard** - Personal overview, activity tracking, and stats
- **🔍 Global Search** - Search entire database with advanced filters
- **📱 Mobile-First** - Optimized for mobile devices
- **🎨 Enhanced Markers** - Custom emoji markers with colored backgrounds for better visibility
- **🍽️ Restaurant Detail Modal** - Comprehensive restaurant information with real-time data
  - View photos (user-submitted + Google Places)
  - Read and write reviews (50 XP per review)
  - Edit restaurant details (5 XP per edit)
  - Check-in functionality
  - Share restaurant details
  - Auto-fetches latest data from Firestore

### ✅ Restaurant Management
- **➕ Add Restaurants** - User submission system with Google Places integration
- **📍 GPS Location Detection** - "Locate Me" feature for current location
- **🗺️ Interactive Location Map** - Pin restaurant location on interactive map with draggable marker
- **📸 Photo Upload** - Upload photos from gallery or capture with camera
- **📋 Menu Photos** - Upload menu photos with custom naming and meal time selection (breakfast/lunch/dinner/all)
- **🍽️ Menu Database** - Structured menu database with meal time divisions for accurate food searches
- **🔍 Nearby Detection** - Auto-detect existing restaurants within 100m to prevent duplicates
- **🧾 Admin Dashboard** - Complete admin management system
  - Review and approve restaurant submissions
  - Review and approve restaurant edits (photos, hours, name, closed status)
  - Moderate user reviews (verify/delete)
  - Duplicate detection for submissions (Firestore-only, 3-strategy detection)
  - Manage user accounts (suspend, activate, ban, unban)
  - View analytics (overview, cost, user behavior, system performance)

### ✅ Gamification System (Designed & Implemented)
- **🎮 Beta System (v0.7)** - Simplified XP-based progression for testing
- **🏆 Badge System** - Multi-tier progression (Explorer I-VII, Memory Keeper, Food Critic, Local Hero, Treasure Hunter)
- **💰 K-Coins System** - Reward currency for beta phase (✅ Implemented v0.7.2)
  - Earn: Waitlist signup (+25), Referrals (+100), Survey (+50) ✅
- **📋 Survey System** - Travel habit survey for beta users (✅ Implemented v0.7.4)
  - Device preference (iOS/Android)
  - Drive frequency (Weekly/Monthly/Occasional)
  - Usual corridor input
  - Awards +50 K-Coins on completion
  - Updates cohort score based on drive frequency
  - Balance tracking and transaction history
  - Display in User Dashboard
  - Post-beta: Convert to premium features, tokens, in-app purchases
- **💎 Special Perks** - Founder Tier and Beta Tester exclusive perks
- **🎁 Tangible Rewards** - Physical merchandise, events, and future discounts
- **💰 Founder Pass** - RM100 pricing (500 lots) with complete perk structure
- **🎯 Token System** - Four token types (Food, Photo, Review, Explorer)
- **⚡ Energy System** - Separate energy system for API cost control

### ✅ Beta Phase Systems (v0.7.2 - v0.7.5)
- **📋 Waitlist System** - User signup and beta access management
  - Join waitlist with email and name
  - Referral code generation (format: KM-XXXXXX)
  - Beta access checking and granting
  - Signup order tracking
- **👥 Referral System** - Referral tracking and rewards
  - Referral code validation
  - Automatic K-Coins rewards (+100 referrer, +25 new user)
  - Referral statistics tracking
- **🔐 Beta Access Control** - Access management utilities
  - Check beta access on login
  - Grant/revoke beta access (admin)
  - Batch access granting for waves
- **🌐 Landing Page (v0.7.3)** - Standalone React app for beta waitlist
  - Bilingual support (EN/BM)
  - Waitlist signup form with validation
  - Referral code pre-fill from URL (`?ref=CODE`)
  - Social sharing (WhatsApp, Telegram, Facebook, Twitter)
  - Live waitlist count display
  - Mobile-first responsive design
  - Deployed to: `https://waitlist-foodie-map-23842.web.app`
- **📧 Email Drip Automation (v0.7.5)** - Automated email sequence via Firebase Functions
  - T+2 Survey Email (2 days after signup)
  - T+5 Community Email (5 days after signup)
  - T+8 Referral Reminder (8 days after signup)
  - T+7 Feedback Email (7 days after beta access)
  - Scheduled functions run daily at 9:00 AM (Asia/Kuala_Lumpur)
  - HTTP test functions for manual testing
  - Email tracking in Firestore (`email_drips` collection)

### ✅ Cost Optimization
- **Firestore-First Search** - 95% reduction in Google Places API costs
- **Haversine-First Distance** - Free Haversine calculation before Distance Matrix API
- **Location Index** - Firestore-based autocomplete reduces API calls
- **Automatic Caching** - Route and place data caching (restaurants, R&R, petrol)
- **Smart Fallback** - Uses Google Places only when needed

## 💰 Cost Savings

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| Daily API Cost | $37 | $1.60 | 95.7% |
| Monthly Cost | $1,110 | $48 | $1,062 |
| Annual Cost | $13,320 | $576 | $12,744 |

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Firebase project with Firestore enabled
- Google Maps API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd foodie-simple
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
REACT_APP_GOOGLE_MAPS_MAP_ID=your_map_id
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
```

## 📁 Project Structure

```
src/
├── components/
│   ├── RouteResults.js            # Route discovery & results
│   ├── SearchTab.js               # Global search interface
│   ├── FavoritesTab.js            # Favorites management
│   ├── AddRestaurantTab.js        # Restaurant submission
│   ├── UserTab.js                 # User dashboard
│   ├── AdminDashboard.js          # Admin management
│   └── ...                        # Other UI components
├── contexts/
│   ├── AuthContext.js             # Authentication state
│   └── FavoritesContext.js        # Favorites state
├── services/
│   ├── firestoreSearchService.js  # Firestore-first search
│   ├── routeIndexService.js       # Route caching
│   ├── distanceMatrixService.js   # Distance calculations
│   ├── gamificationService.js     # Gamification logic
│   └── ...                        # Other services
├── config/
│   ├── firebaseConfig.js          # Firebase configuration
│   └── adminConfig.js             # Admin settings
├── utils/
│   ├── distanceUtils.js           # Haversine calculations
│   └── adminAuth.js               # Admin authentication
├── App.tsx                        # Main application component
└── App.css                        # Application styles
```

## 🎮 How to Use

### 🗺️ Discovery Tab
1. **Plan a Route** - Enter start and end locations (autocomplete learns from your searches)
2. **Find Places** - Click "Find Food Along Route" to discover restaurants, R&R stops, and petrol stations
3. **Select Routes** - Choose from multiple route alternatives if available
4. **Filter by Type** - Use tabs to filter by All, Restaurants, R&R, or Petrol stations
5. **View on Map** - See places marked on the map with custom emoji markers and detour information
6. **Select Places** - Click places to add them to your journey
7. **Navigate** - Start navigation with waypoints (Start → Place → End)

### 🔍 Search Tab
- **Global Search** - Search entire restaurant database
- **🧠 Intelligent Keyword Recognition** - Automatic recognition of locations, food items, cuisines
- **🔍 Compound Query Support** - Natural language queries (e.g., "roti canai petaling jaya", "breakfast kluang")
- **🗺️ Smart Location Detection** - Geocoding-first strategy works for any location (even unknown cities)
- **📊 Search Analytics** - Privacy-focused tracking for keyword learning
- **🧠 Auto-Learning System** - Automatically learns new keywords and coordinates from user behavior
- **Advanced Filters** - Filter by cuisine, rating, halal status, distance, price range
- **Sort Options** - Sort by rating, distance, newest, most reviews
- **🇲🇾 Malaysia-Only** - Budget-protected (only processes Malaysia locations)

### ❤️ Favorites Tab
- **⭐ Favorites** - Save restaurants to your favorites list
- **📚 Saved Routes** - Access your saved routes with full details
- **Manage** - View, restore, or permanently delete favorites
- **Load Routes** - Quickly load saved routes (auto-switches to Discover tab)
- **Quick Access** - Fast access to your favorite spots and routes

### ➕ Add Restaurant Tab
- **5-Step Wizard Form** - Guided submission process
- **Google Places Integration** - Auto-fill restaurant data from search
- **Nearby Detection** - Automatically detects existing restaurants within 100m radius
- **Interactive Location Map** - Pin exact location with draggable marker and reverse geocoding
- **Camera Capture** - Take photos directly with device camera (in addition to gallery)
- **Menu Photos** - Upload menu photos with custom naming for each item
- **Form Validation** - Prevents early submission, requires location pinning
- **Admin Review** - Submissions go through quality control

### 👤 User Tab
- **Dashboard** - View your activity and stats
- **Profile Management** - Manage your account settings
- **Activity Tracking** - See your route searches and restaurant interactions

### 🛡️ Admin Dashboard (Admin Only)
- **Review Submissions** - Approve or reject user-submitted restaurants
- **Manage Eateries** - View and edit restaurant data
- **Analytics** - Track app usage and performance

## 🔍 Technical Details

### Firestore-First Architecture
1. **Query Firestore** - Search local database first
2. **Fallback to Google Places** - Only when no local results
3. **Auto-Save Results** - Cache Google results for future use
4. **Cost Reduction** - 95% fewer API calls

### Distance Calculation
- **Haversine-First** - Free mathematical distance calculation (primary method)
- **Distance Matrix Fallback** - Only used when Haversine fails or returns invalid results
- **Smart Speed Estimation** - City (35 km/h) vs Highway (90 km/h)
- **Detour Filtering** - OR logic: Show places within 5km OR 30min (restaurants/R&R) or 5km OR 15min (petrol)
- **Safety Threshold** - Places >100km away automatically excluded

### User Submission Workflow
1. **Search Google Places** (optional) - Auto-fill data
2. **GPS Location Detection** - Get current location
3. **Manual Override** - Edit any field
4. **Submit for Review** - Admin approval required
5. **Quality Control** - Verified restaurants only

## 🛠️ Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Key Technologies

- **React 18** - Frontend framework
- **TypeScript** - Type safety
- **Firebase Firestore** - Database
- **Google Maps API** - Maps and places
- **Haversine Formula** - Distance calculations

## 📊 Performance

- **API Cost Reduction**: 95.7%
- **Search Speed**: Instant (Firestore) vs 2-3s (Google Places)
- **Data Accuracy**: High (admin-verified submissions)
- **Scalability**: Excellent (Firestore auto-scaling)

## 🔒 Security

- **API Keys Protected** - `.env` file in `.gitignore`
- **Admin Review** - User submissions require approval
- **Input Validation** - Form validation and sanitization
- **Error Handling** - Comprehensive error management

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Setup
- Set production environment variables
- Configure Firebase security rules
- Set up Google Maps API restrictions

## 📈 Future Enhancements

### Beta Phase (v0.7)
- **📋 Beta Flow Implementation** - Waitlist, referrals, K-Coins, weekly waves
- **🎮 Gamification Implementation** - Implement designed gamification system (Beta v0.7)
- **💰 K-Coins System** - Accumulation during beta, conversion post-beta
- **👥 Creator Partnerships** - Creator referral program and priority access
- **📧 Email Drip Campaigns** - Nurture sequence for waitlist and beta users
- **🎁 Travel Package Draw** - Monthly rewards for top referrers

### Post-Beta (v1.0+)
- **💎 Founder Pass Launch** - Launch Founder Pass (RM100, 500 lots) with exclusive perks
- **🎁 Tangible Rewards** - Physical merchandise (pin, tote bag, take-away pack) and events
- **💬 Social Features** - Reviews, sharing, friend connections
- **⭐ Advanced Reviews** - User-generated reviews with ratings
- **📱 Mobile App** - React Native version
- **🌍 Expanded Coverage** - Nationwide data coverage

## 🎮 Gamification System

See comprehensive gamification documentation:
- [GAMIFICATIONLOG.md](./GAMIFICATIONLOG.md) - Main gamification log
- [GAMIFICATION_BETA_v0.7.md](./GAMIFICATION_BETA_v0.7.md) - Beta system design
- [GAMIFICATION_POST_BETA_v1.0.md](./GAMIFICATION_POST_BETA_v1.0.md) - Post-beta system design
- [FOUNDER_PASS_PRICING.md](./FOUNDER_PASS_PRICING.md) - Founder Pass details
- [BADGE_SYSTEM_FINAL.md](./BADGE_SYSTEM_FINAL.md) - Badge system summary

## 📋 Version History

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history and release notes.

**Current Version:** v0.7.6 (UI/UX Improvements: SearchTab & BottomNavigation) - 7 December 2025

## 🔒 Security

**Important:** Never commit API keys, passwords, or secrets to Git!

**Security System:**
- ✅ Pre-commit hook automatically checks for secrets
- ✅ Security check scripts for manual verification
- ✅ Comprehensive prevention guide

**Quick Start:**
- Just commit normally - the hook checks automatically
- If commit fails, fix the issue and try again
- See [`HOW_TO_USE_SECURITY_SYSTEM.md`](./HOW_TO_USE_SECURITY_SYSTEM.md) for details

**Documentation:**
- [`HOW_TO_USE_SECURITY_SYSTEM.md`](./HOW_TO_USE_SECURITY_SYSTEM.md) - Quick reference
- [`SECURITY_PREVENTION_GUIDE.md`](./SECURITY_PREVENTION_GUIDE.md) - Complete guide
- [`SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md) - Pre-commit checklist

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Google Maps Platform for mapping services
- Firebase for backend infrastructure
- React community for excellent documentation

---

**Built with ❤️ for food lovers who want to discover amazing restaurants along their journeys!**