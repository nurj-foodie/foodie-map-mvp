# 🍽️ Add Restaurant Tab - Complete User Flow

**Date:** 10 November 2025  
**Component:** `AddRestaurantTab.js`  
**Status:** ✅ Documented

---

## 📋 Overview

The Add Restaurant tab is a **5-step wizard form** that allows users to submit new restaurants to the database. The form includes Google Places integration, photo uploads, location verification, and duplicate checking.

---

## 🚀 Complete User Flow: Start to Submit

### **Phase 1: Initialization & Authentication**

#### **Step 0: Component Load**
1. **User clicks** the "➕" (Plus) button in the navigation bar
2. **Component mounts** → `AddRestaurantTab` loads
3. **Authentication check** → Checks if user is logged in via `useAuth()`
4. **Location request** → Automatically requests user's GPS location:
   ```javascript
   navigator.geolocation.getCurrentPosition()
   ```
   - ✅ **Success:** Stores user location in `userLocation` state
   - ❌ **Failure:** Logs error, continues without location

#### **Step 0.5: Login Check**
- **If NOT logged in:**
  - Shows login prompt: "🔐 Login Required"
  - User must log in before proceeding
- **If logged in:**
  - Shows 5-step progress indicator
  - Initializes form with default values

#### **Step 0.6: Nearby Restaurant Detection** 🔍
- **Triggered automatically** when user location is available
- **Process:**
  1. Calculates distance to all restaurants in Firestore using Haversine formula
  2. Filters restaurants within **100m radius**
  3. Updates `nearbyRestaurants` state with results
- **Display:**
  - Shows warning banner in Step 1: "⚠️ Found X nearby restaurants"
  - Lists restaurant names within 100m
  - Purpose: Prevents duplicate submissions
  - User can still proceed (with awareness)

---

### **Phase 2: Step 1 - Basic Information** 🍽️

#### **Nearby Restaurants Warning** (if detected):
- **Displayed at top of Step 1**
- Shows count: "⚠️ Found X nearby restaurants within 100m"
- Lists restaurant names:
  - "Restaurant Name 1"
  - "Restaurant Name 2"
  - etc.
- **Purpose:** Prevents duplicate submissions
- **User Action:** Can proceed if restaurant is different

#### **Form Fields:**
1. **Restaurant Name** (Required) ⭐
   - Text input
   - Must be filled to proceed to next step
   - Auto-filled if Google Places result selected

2. **Google Places Search** (Optional but Recommended)
   - **User types** restaurant name → Triggers `searchGooglePlaces()`
   - **After 3+ characters:** Calls Google Places API `textSearch()`
   - **Shows dropdown** with up to 5 results:
     - Restaurant name
     - Address
     - Rating (if available)
   - **User clicks result** → `selectPlace()` function:
     - ✅ Auto-fills: name, address, location (lat/lng), place_id, rating, phone, website, priceLevel, types
     - ✅ Triggers duplicate check automatically
     - ✅ Hides search results

3. **Address** (Required) ⭐
   - Textarea (3 rows)
   - Auto-filled from Google Places
   - Must be filled to proceed

4. **Cuisine Type** (Optional)
   - Dropdown: Malay, Chinese, Indian, Western, Japanese, Korean, Thai, Italian, Mexican, Fast Food, Cafe, Dessert, Other

5. **Halal Status** (Optional)
   - Dropdown: Unknown (default), Halal, Non-Halal, Pork-Free

6. **Price Level** (Optional)
   - Dropdown: $ (Budget), $$ (Moderate), $$$ (Expensive), $$$$ (Very Expensive)
   - Default: $ (Budget)

7. **Description** (Optional)
   - Textarea (4 rows)
   - Free-form text about restaurant

8. **Phone Number** (Optional)
   - Tel input
   - Auto-filled from Google Places

9. **Website** (Optional)
   - URL input
   - Auto-filled from Google Places

#### **Duplicate Check (Automatic):**
- **Triggered when:** User selects Google Places result OR manually enters name/address
- **Process:**
  1. Searches Firestore `eateries` collection by name (case-insensitive)
  2. Searches Firestore `eateries` collection by address (case-insensitive)
  3. Combines results and removes duplicates
  4. **If matches found:**
     - Shows warning in Step 5 (Review & Submit)
     - User can still proceed (with confirmation)

#### **Navigation:**
- **Next button** → Disabled until name AND address are filled
- **Clicking Next** → Moves to Step 2

---

### **Phase 3: Step 2 - Photos** 📸

#### **Regular Photo Upload:**
1. **Two Options:**
   - **"📷 Choose from Gallery"** → Opens file picker
   - **"📸 Take Photo"** → Opens device camera
2. **File picker / Camera:**
   - User selects 1-10 photos OR captures with camera
   - Camera capture automatically processes photo
3. **Validation:**
   - ✅ Max 10 photos total
   - ✅ Max 5MB per photo
   - ✅ Only image files accepted
4. **Processing:**
   - Each photo is **compressed** using `compressImage()`:
     - Max width: 800px
     - Quality: 0.8 (80%)
     - Converts to Blob
   - Converts to **base64** for storage
   - Adds to `uploadedPhotos` array with metadata:
     ```javascript
     {
       id: Date.now() + Math.random(),
       name: file.name,
       size: compressedFile.size,
       type: compressedFile.type,
       data: base64String,
       uploadedAt: new Date()
     }
     ```
5. **Display:**
   - Shows photo previews in grid
   - Each photo has "❌" remove button
   - Shows count: "Current: X/10 photos"

#### **Menu Photos Section** 📋
1. **Two Options:**
   - **"📷 Add Menu Photos"** → Opens file picker
   - **"📸 Capture Menu"** → Opens device camera
2. **Upload Process:**
   - Same validation and compression as regular photos
   - Adds to `menuPhotos` array with naming field
3. **Naming Menu Items:**
   - Each menu photo has text input: "Menu Item Name"
   - User can name each menu item (e.g., "Nasi Lemak", "Roti Canai")
   - Names stored with photo data
4. **Display:**
   - Shows menu photo previews with name inputs
   - Each menu photo has "❌" remove button
   - Shows count: "Current: X menu photos"
5. **Review Section:**
   - Menu photos displayed with names in Step 5
   - Format: "Menu Item Name" + photo preview

#### **Photo Management:**
- **Remove photo:** Click ❌ → Removes from `uploadedPhotos` array
- **Add more:** Click "Add Photos" again → Adds to existing photos

#### **Navigation:**
- **Previous button** → Returns to Step 1
- **Next button** → Always enabled (photos optional)
- **Clicking Next** → Moves to Step 3

---

### **Phase 4: Step 3 - Operating Hours** 🕒

#### **Operating Hours Setup:**
1. **24 Hours Option:**
   - Checkbox: "Open 24 Hours"
   - If checked → Skips day-by-day setup

2. **Day-by-Day Setup** (if not 24 hours):
   - **7 days:** Monday through Sunday
   - **For each day:**
     - **Closed checkbox** → If checked, restaurant closed that day
     - **Open time** → Time picker (default: 09:00)
     - **Close time** → Time picker (default: 22:00)
   - **Default:** All days open 09:00-22:00

#### **Data Structure:**
```javascript
operatingHours: {
  isOpen: true,
  isOpen24Hours: false,
  periods: [
    { day: 'Monday', open: '09:00', close: '22:00', isClosed: false },
    // ... 6 more days
  ]
}
```

#### **Navigation:**
- **Previous button** → Returns to Step 2
- **Next button** → Always enabled
- **Clicking Next** → Moves to Step 4

---

### **Phase 5: Step 4 - Accessibility & Features** ♿

#### **Accessibility Options (Checkboxes):**
1. **Wheelchair Accessible** (default: false)
2. **Parking Available** (default: false)
3. **Delivery Available** (default: false)
4. **Takeout Available** (default: true ✅)
5. **Dine In Available** (default: true ✅)
6. **Outdoor Seating** (default: false)
7. **WiFi Available** (default: false)
8. **Air Conditioned** (default: false)

#### **Display:**
- Grid layout with checkboxes
- Labels formatted nicely (e.g., "Wheelchair Accessible")

#### **Navigation:**
- **Previous button** → Returns to Step 3
- **Next button** → Always enabled
- **Clicking Next** → Moves to Step 5 (Final Review)

---

### **Phase 6: Step 5 - Review & Submit** 📋

#### **Review Section:**
1. **Restaurant Information Summary:**
   - Name
   - Address
   - Cuisine (or "Not specified")
   - Halal Status
   - Price Level (shown as $ symbols)
   - Phone (if provided)
   - Website (if provided)
   - Description (if provided)

2. **Photos Preview** (if uploaded):
   - Shows all uploaded photos in grid
   - Count: "Photos (X)"

3. **Set Restaurant Location** 🗺️ (Required) ⭐
   - **"🗺️ Open Map to Set Location" button**
   - **When clicked:**
     - Shows interactive Google Map
     - Displays draggable marker
     - User can drag marker to pin exact location
     - Clicking map also moves marker
     - Reverse geocoding updates address automatically
     - Shows coordinates: "Lat: X.XXXX, Lng: Y.YYYY"
   - **Required Validation:**
     - Location must be pinned (lat/lng cannot be 0)
     - Submit button disabled until location set
     - Warning shown if location not set: "⚠️ Please set restaurant location on map"
   - **Instructions:**
     - "Drag the marker to set the restaurant's exact location"
     - "Click anywhere on the map to move the marker"
     - "Address will update automatically"

4. **Duplicate Warning** (if duplicates found):
   - Shows warning: "⚠️ Similar Restaurants Found"
   - Lists matching restaurants:
     - Name
     - Address
   - User can still proceed (with confirmation)

#### **Navigation:**
- **Previous button** → Returns to Step 4
- **Submit button** → "✅ Submit Restaurant"
  - Disabled if: name OR address missing, OR currently submitting

---

### **Phase 7: Submission Process** 📤

#### **Step 1: Pre-Submission Checks**
1. **Authentication check:**
   - If not logged in → Alert: "Please log in to submit a restaurant"
   - Stops submission

2. **Duplicate check (re-run):**
   - Calls `checkForDuplicates()` again
   - **If duplicates found:**
     - Shows confirmation dialog:
       ```
       "Similar restaurants already exist in our database. 
        Are you sure this is a different restaurant that should be added?"
       ```
     - **User clicks Cancel:** Shows warning, stops submission
     - **User clicks OK:** Continues submission

#### **Step 2: Data Preparation**
1. **Sets `isSubmitting = true`** → Disables submit button, shows "📤 Submitting..."
2. **Cleans form data:**
   - Trims name, address, description
   - Adds metadata:
     ```javascript
     {
       verified: false,
       createdBy: user.uid,
       createdAt: new Date(),
       updatedAt: new Date(),
       status: 'pending_review',
       source: 'user_submission',
       // Analytics
       totalViews: 0,
       totalClicks: 0,
       totalCheckIns: 0,
       userCheckIns: 0,
       userReviews: [],
       userPhotos: uploadedPhotos,
       // Location verification
       locationVerification: {
         isVerified: locationVerification.isVerified,
         distance: locationVerification.distance,
         verifiedAt: new Date()
       }
     }
     ```

#### **Step 3: Firestore Submission**
1. **Calls `addDoc()`:**
   ```javascript
   await addDoc(collection(db, 'eateries'), cleanFormData);
   ```
2. **Saves to Firestore collection:** `eateries`
3. **Document structure:**
   - All form fields
   - Metadata (status: 'pending_review')
   - User ID (createdBy)
   - Timestamps
   - Photos (base64)
   - Location verification data

#### **Step 4: Success Handling**
1. **Success message:**
   ```
   Restaurant "[Name]" submitted successfully! 
   It will be reviewed and published within 24 hours.
   ```
2. **Form reset:**
   - Resets all form fields to defaults
   - Clears uploaded photos
   - Clears duplicate check
   - Clears location verification
   - Returns to Step 1
3. **Sets `isSubmitting = false`** → Re-enables buttons

#### **Step 5: Error Handling**
- **If submission fails:**
  - Shows error message: "Failed to submit restaurant. Please try again."
  - Logs error to console
  - Sets `isSubmitting = false`
  - User can try again

---

## 🔄 Complete Flow Diagram

```
START
  ↓
[Component Load]
  ↓
[Check Authentication]
  ├─→ NOT LOGGED IN → [Show Login Prompt] → END
  └─→ LOGGED IN → [Request GPS Location] → [Show 5-Step Form]
                    ↓
              [STEP 1: Basic Information]
              ├─→ [Enter Name/Address] OR [Search Google Places]
              ├─→ [Select Place] → [Auto-fill Form] → [Check Duplicates]
              ├─→ [Fill Optional Fields]
              └─→ [Click Next] → STEP 2
                    ↓
              [STEP 2: Photos]
              ├─→ [Click Add Photos] → [Select Files]
              ├─→ [Compress Images] → [Convert to Base64]
              ├─→ [Preview Photos] → [Remove if needed]
              └─→ [Click Next] → STEP 3
                    ↓
              [STEP 3: Operating Hours]
              ├─→ [Set 24 Hours] OR [Set Day-by-Day Hours]
              └─→ [Click Next] → STEP 4
                    ↓
              [STEP 4: Accessibility & Features]
              ├─→ [Check Accessibility Options]
              └─→ [Click Next] → STEP 5
                    ↓
              [STEP 5: Review & Submit]
              ├─→ [Review All Information]
              ├─→ [Verify Location] (Optional)
              ├─→ [Check Duplicate Warnings]
              └─→ [Click Submit] → SUBMISSION
                    ↓
              [SUBMISSION PROCESS]
              ├─→ [Check Authentication]
              ├─→ [Re-check Duplicates] → [Confirm if needed]
              ├─→ [Prepare Data] → [Add Metadata]
              ├─→ [Save to Firestore] → [Collection: 'eateries']
              ├─→ [Success] → [Show Success Message] → [Reset Form] → STEP 1
              └─→ [Error] → [Show Error Message] → [Stay on STEP 5]
                    ↓
              END
```

---

## 📊 Data Flow

### **Form State Management:**
- **`formData`** → Main form state object
- **`uploadedPhotos`** → Array of photo objects
- **`userLocation`** → User's GPS coordinates
- **`locationVerification`** → Verification status and distance
- **`duplicateCheck`** → Duplicate search results
- **`activeStep`** → Current step (1-5)
- **`isSubmitting`** → Submission in progress flag
- **`submissionStatus`** → Success/error message

### **Firestore Document Structure:**
```javascript
{
  // Basic Info
  name: string,
  address: string,
  location: { lat: number, lng: number },
  place_id: string,
  cuisineType: string,
  halalStatus: 'unknown' | 'halal' | 'non-halal' | 'pork-free',
  rating: number,
  phone: string,
  website: string,
  description: string,
  businessStatus: 'OPERATIONAL',
  priceLevel: 1-4,
  types: ['restaurant', 'food', 'establishment'],
  
  // Operating Hours
  operatingHours: {
    isOpen: boolean,
    isOpen24Hours: boolean,
    periods: [
      { day: string, open: string, close: string, isClosed: boolean },
      // ... 6 more days
    ]
  },
  
  // Accessibility
  accessibility: {
    wheelchairAccessible: boolean,
    parkingAvailable: boolean,
    deliveryAvailable: boolean,
    takeoutAvailable: boolean,
    dineInAvailable: boolean,
    outdoorSeating: boolean,
    wifiAvailable: boolean,
    airConditioned: boolean
  },
  
  // Metadata
  verified: false,
  createdBy: string (user.uid),
  createdAt: Timestamp,
  updatedAt: Timestamp,
  status: 'pending_review',
  source: 'user_submission',
  
  // Analytics
  totalViews: 0,
  totalClicks: 0,
  totalCheckIns: 0,
  userCheckIns: 0,
  userReviews: [],
  userPhotos: [
    {
      id: number,
      name: string,
      size: number,
      type: string,
      data: string (base64),
      uploadedAt: Timestamp
    }
  ],
  
  // Menu Photos (NEW - photos with menu item names)
  menuPhotos: [
    {
      id: number,
      name: string,           // Original filename
      menuName: string,       // User-entered menu item name (e.g., "Nasi Lemak", "Roti Canai")
      size: number,
      type: string,
      data: string (base64),
      uploadedAt: Timestamp
    }
  ],
  
  // Location Verification
  locationVerification: {
    isVerified: boolean,
    distance: number (km),
    verifiedAt: Timestamp
  }
}
```

---

## 🔍 Key Features

### **1. Google Places Integration**
- **Real-time search** as user types
- **Auto-fill** name, address, location, phone, website, rating
- **Prevents manual errors** in location data

### **2. Duplicate Prevention**
- **Automatic checking** when place selected or name/address entered
- **Shows warnings** but allows user to proceed
- **Prevents accidental duplicates**

### **3. Photo Management**
- **Compression** reduces file size (max 800px width, 80% quality)
- **Base64 storage** for easy Firestore storage
- **Multiple photos** (up to 10)
- **Size limits** (5MB per photo)

### **4. Location Verification**
- **GPS-based verification** (within 500m = verified)
- **Optional** but helps ensure accuracy
- **Distance calculation** using Haversine formula

### **5. Multi-Step Form**
- **Progressive disclosure** reduces cognitive load
- **Step validation** ensures required fields filled
- **Progress indicator** shows current step

### **6. Admin Review Workflow**
- **Status: 'pending_review'** → Admin must approve
- **Created by:** User ID tracked
- **Source:** 'user_submission' → Identifies user-submitted entries

---

## ⚠️ Validation Rules

### **Required Fields:**
- ✅ Restaurant Name
- ✅ Address

### **Optional Fields:**
- Cuisine Type
- Halal Status
- Price Level
- Description
- Phone Number
- Website
- Photos
- Operating Hours
- Accessibility Features

### **File Limits:**
- Max 10 photos total
- Max 5MB per photo
- Only image files accepted

### **Location Verification:**
- Optional (doesn't block submission)
- Verified if ≤ 500m from user location

---

## 🎯 User Experience Highlights

1. **Smart Auto-fill:** Google Places integration reduces manual entry
2. **Progressive Steps:** 5-step wizard breaks complex form into manageable chunks
3. **Visual Feedback:** Progress indicator, loading states, success/error messages
4. **Duplicate Prevention:** Warns user but doesn't block submission
5. **Photo Compression:** Automatic compression reduces upload time
6. **Location Verification:** Optional GPS verification adds trust
7. **Clear Navigation:** Previous/Next buttons, step labels
8. **Form Reset:** After successful submission, form resets for next entry

---

## 🔄 Post-Submission Flow

### **After Successful Submission:**
1. **Document saved** to Firestore `eateries` collection
2. **Status:** `pending_review`
3. **Admin Dashboard:**
   - Admin sees submission in pending queue
   - Admin can review details
   - Admin can approve or reject
4. **If Approved:**
   - Status changes to `verified: true`
   - Restaurant appears in search results
   - Available to all users
5. **If Rejected:**
   - Status changes to `rejected`
   - User notified (if notification system implemented)
   - Restaurant not shown in search results

---

## 📝 Notes

- **Authentication Required:** Users must be logged in to submit
- **GPS Location:** Requested automatically but not required
- **Google Places:** Optional but highly recommended for accuracy
- **Photo Storage:** Currently stored as base64 in Firestore (consider Firebase Storage for production)
- **Duplicate Check:** Case-insensitive, fuzzy matching by name/address
- **Form Reset:** Complete reset after successful submission
- **Error Handling:** Graceful error messages, allows retry

---

**Document Status:** ✅ Complete  
**Last Updated:** 10 November 2025

