# 🗺️ Kawan Makan — Food Discovery App

**Current Version:** v0.6 | [📋 View Changelog](./CHANGELOG.md)

A cost-effective food discovery app that helps users find restaurants along their routes with 95% API cost reduction. Built for Peninsular Malaysia with route planning, restaurant discovery, and user contributions.

## 🎯 Features

### ✅ Core Functionality
- **🗺️ Route Planning** - Plan routes between cities with multiple alternatives
- **🍽️ Restaurant Discovery** - Find restaurants along your route with detour calculations
- **🧭 Waypoint Navigation** - Navigate via selected restaurants (Start → Restaurant → End)
- **🔍 Smart Filtering** - Filter by distance, rating, cuisine type, halal status
- **💾 Save & Load Routes** - User-specific saved routes with restaurant selections

### ✅ User Experience
- **🔐 Authentication** - Google OAuth + Email/Password login
- **⭐ Favorites System** - Save favorite restaurants with soft delete & 24-hour restore
- **👤 User Dashboard** - Personal overview, activity tracking, and stats
- **🔍 Global Search** - Search entire database with advanced filters
- **📱 Mobile-First** - Optimized for mobile devices

### ✅ Restaurant Management
- **➕ Add Restaurants** - User submission system with Google Places integration
- **📍 GPS Location Detection** - "Locate Me" feature for current location
- **🧾 Admin Dashboard** - Review, approve, and manage user submissions
- **📸 Photo Upload** - Authenticated users can upload restaurant photos

### ✅ Gamification System (Designed)
- **🎮 Beta System (v0.7)** - Simplified XP-based progression for testing
- **🏆 Badge System** - Multi-tier progression (Explorer I-VII, Memory Keeper, Food Critic, Local Hero, Treasure Hunter)
- **💎 Special Perks** - Founder Tier and Beta Tester exclusive perks
- **🎁 Tangible Rewards** - Physical merchandise, events, and future discounts
- **💰 Founder Pass** - RM100 pricing (500 lots) with complete perk structure
- **🎯 Token System** - Four token types (Food, Photo, Review, Explorer)
- **⚡ Energy System** - Separate energy system for API cost control

### ✅ Cost Optimization
- **Firestore-First Search** - 95% reduction in Google Places API costs
- **Haversine Distance Calculation** - No Distance Matrix API costs
- **Automatic Caching** - Route and restaurant data caching
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
1. **Plan a Route** - Enter start and end locations (e.g., "Kuala Lumpur" → "Petaling Jaya")
2. **Find Restaurants** - Click "Find Food Along Route" to discover restaurants along your route
3. **Select Routes** - Choose from multiple route alternatives if available
4. **View on Map** - See restaurants marked on the map with detour information
5. **Select Restaurants** - Click restaurants to add them to your journey
6. **Navigate** - Start navigation with waypoints (Start → Restaurant → End)

### 🔍 Search Tab
- **Global Search** - Search entire restaurant database
- **Advanced Filters** - Filter by cuisine, rating, halal status, distance, price range
- **Sort Options** - Sort by rating, distance, newest, most reviews

### ❤️ Favorites Tab
- **Save Favorites** - Add restaurants to your favorites list
- **Manage** - View, restore, or permanently delete favorites
- **Quick Access** - Fast access to your favorite spots

### ➕ Add Restaurant Tab
- **Submit New Restaurants** - Help grow the database
- **Google Places Integration** - Auto-fill restaurant data
- **GPS Location** - Use "Locate Me" for accurate positioning
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
- **Haversine Formula** - Mathematical distance calculation
- **No Distance Matrix API** - 100% cost reduction
- **Smart Speed Estimation** - City (35 km/h) vs Highway (90 km/h)
- **Detour Filtering** - Show only restaurants within 2km or 15min

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

- **🎮 Gamification Implementation** - Implement designed gamification system (Beta v0.7)
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

**Current Version:** v0.6 (Gamification System Design) - 5 November 2025

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