# 🧪 Add Restaurant Tab - Testing Checklist

**Date:** 10 November 2025  
**Tester:** Ready for mobile testing

---

## ✅ Quick Test Checklist

### **1. Nearby Restaurants Detection** ⏳
- [ ] Open Add Restaurant tab
- [ ] Grant location permission
- [ ] Check if nearby restaurants warning appears (if within 100m of existing restaurant)
- [ ] Verify restaurant names and distances show correctly

### **2. Google Places Search** ⏳
- [ ] Type restaurant name in search box
- [ ] Verify results appear (up to 5)
- [ ] Click on a result
- [ ] Verify form auto-fills correctly
- [ ] Check duplicate warning appears (if applicable)

### **3. Form Navigation** ⏳
- [ ] Fill Step 1 (name, address required)
- [ ] Click "Next" → Should go to Step 2
- [ ] Verify "Previous" button works
- [ ] Navigate through all 5 steps
- [ ] Verify form doesn't submit early (Enter key on Steps 1-4)

### **4. Photo Upload** ⏳
- [ ] Click "Choose from Gallery" → Select photos
- [ ] Click "Take Photo" → Camera opens
- [ ] Capture photo → Verify it appears in preview
- [ ] Upload multiple photos (max 10)
- [ ] Remove photos (click ❌)

### **5. Menu Photos** ⏳
- [ ] Click "Add Menu Photos" → Select menu photos
- [ ] Click "Capture Menu" → Camera opens
- [ ] Capture menu photo → Verify it appears
- [ ] Enter menu item name (e.g., "Nasi Lemak")
- [ ] Upload multiple menu photos
- [ ] Verify menu names save correctly

### **6. Operating Hours** ⏳
- [ ] Set hours for each day
- [ ] Mark some days as "Closed"
- [ ] Check "Open 24 Hours" option
- [ ] Verify hours save correctly

### **7. Accessibility Features** ⏳
- [ ] Check/uncheck various features
- [ ] Verify selections save correctly

### **8. Location Map** ⏳
- [ ] On Step 5, click "Open Map to Set Location"
- [ ] Verify map loads
- [ ] Drag marker to set location
- [ ] Click on map to move marker
- [ ] Verify address auto-fills from reverse geocoding
- [ ] Click "Confirm Location"
- [ ] Verify coordinates display
- [ ] Verify location verification works

### **9. Form Submission** ⏳
- [ ] Complete all 5 steps
- [ ] Set location on map (required)
- [ ] Click "Submit Restaurant"
- [ ] Verify success message appears
- [ ] Verify form resets
- [ ] Check Firestore to verify data saved correctly

### **10. Mobile-Specific** ⏳
- [ ] Test on mobile device
- [ ] Verify camera works
- [ ] Verify map is touch-friendly
- [ ] Verify buttons are easy to tap
- [ ] Verify form is readable on small screen

---

## 🔍 Things to Watch For

### **Issues to Report:**
- Form submits before Step 5
- Location not required validation
- Camera doesn't open
- Map doesn't load
- Menu photos don't save
- Operating hours format incorrect
- Data structure doesn't match Firestore schema

### **Success Indicators:**
- ✅ All 5 steps work smoothly
- ✅ Location map works correctly
- ✅ Menu photos save with names
- ✅ Data matches Firestore schema
- ✅ Mobile experience is smooth

---

## 📝 Notes Section

**Issues Found:**
- 

**Suggestions:**
- 

**Working Well:**
- 

---

**Happy Testing!** 🚀

