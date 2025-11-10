# 📋 Firestore Schema - Menu Photos Field

**Date:** 10 November 2025  
**Field Added:** `menuPhotos`  
**Status:** ✅ No manual update needed

---

## ✅ Answer: No Manual Update Needed

**Firestore is a NoSQL database** - it doesn't require predefined schemas. You can add new fields dynamically without any manual configuration.

---

## 🔍 How It Works

### **1. Firestore Security Rules**
✅ **Current rules allow it:**
```javascript
match /eateries/{eateryId} {
  allow read: if true;
  allow create: if true;  // ✅ Allows any fields
  allow update, delete: if true;
}
```

The `allow create: if true` rule means **any field** can be written to the `eateries` collection, including `menuPhotos`.

### **2. Code Already Saves It**
✅ **The form already saves `menuPhotos`:**
```javascript
const cleanFormData = {
  ...formData,
  userPhotos: uploadedPhotos,
  menuPhotos: menuPhotos,  // ✅ Already included
  // ... other fields
};

await addDoc(collection(db, 'eateries'), cleanFormData);
```

### **3. No Schema Definition Required**
- ❌ **No need to create a schema file**
- ❌ **No need to run migrations**
- ❌ **No need to update Firestore console**
- ✅ **Just submit the form - it works!**

---

## 📊 Menu Photos Structure

### **Field Name:** `menuPhotos`
### **Type:** Array of objects
### **Location:** Top-level field in `eateries` collection

### **Structure:**
```javascript
menuPhotos: [
  {
    id: number,              // Unique ID (Date.now() + Math.random())
    name: string,            // Original filename (e.g., "menu-photo-1234567890.jpg")
    menuName: string,        // User-entered menu item name (e.g., "Nasi Lemak")
    size: number,            // File size in bytes (after compression)
    type: string,            // MIME type (e.g., "image/jpeg")
    data: string,            // Base64 encoded image data
    uploadedAt: Date        // Upload timestamp
  },
  // ... more menu photos (max 10)
]
```

### **Example:**
```javascript
{
  name: "Restaurant ABC",
  address: "123 Main St",
  // ... other fields
  menuPhotos: [
    {
      id: 1720728000000.123,
      name: "menu-photo-1720728000000.jpg",
      menuName: "Nasi Lemak",
      size: 245678,
      type: "image/jpeg",
      data: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
      uploadedAt: "2025-11-10T12:00:00.000Z"
    },
    {
      id: 1720728001000.456,
      name: "menu-photo-1720728001000.jpg",
      menuName: "Roti Canai",
      size: 189234,
      type: "image/jpeg",
      data: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
      uploadedAt: "2025-11-10T12:00:01.000Z"
    }
  ]
}
```

---

## 🔍 Verification

### **How to Verify It's Working:**

1. **Submit a restaurant** with menu photos
2. **Check Firestore Console:**
   - Go to Firebase Console → Firestore Database
   - Open `eateries` collection
   - Find your submitted restaurant
   - Check if `menuPhotos` field exists ✅

3. **Check the Data:**
   - `menuPhotos` should be an array
   - Each item should have `id`, `name`, `menuName`, `data`, etc.
   - Menu names should match what you entered

---

## 📝 Documentation Updates

### **Files Updated:**
- ✅ `ADD_RESTAURANT_USER_FLOW.md` - Added menuPhotos to schema documentation
- ✅ `ADD_RESTAURANT_MOBILE_MENU_UPDATE.md` - Documented menu photo feature

### **Files That Reference Schema:**
- `foodie-app/backend/docs/EATERY_SCHEMA_DESIGN.md` - Reference schema (optional to update)
- `foodie-app/src/setup-firestore-schema.js` - Example schema (optional to update)

**Note:** These are documentation/reference files. Updating them is optional but recommended for future reference.

---

## 🎯 Summary

### **What You Need to Do:**
- ✅ **Nothing!** The field will be saved automatically when you submit the form.

### **What Happens Automatically:**
1. User uploads menu photos
2. User names each menu item
3. Form submits to Firestore
4. `menuPhotos` array is saved automatically
5. No manual configuration needed

### **Optional (For Documentation):**
- Update schema documentation files (optional)
- Add comments in code (already done ✅)

---

## 🔒 Security Considerations

### **Current Setup (Development):**
- ✅ Public read/write allowed
- ✅ `menuPhotos` can be written by anyone

### **Production Recommendations:**
```javascript
match /eateries/{eateryId} {
  allow read: if true;
  allow create: if request.auth != null;  // Require authentication
  allow update: if request.auth != null && (
    request.auth.uid == resource.data.createdBy ||  // Owner
    request.auth.token.admin == true  // Admin
  );
}
```

---

## 📊 Field Comparison

| Field | Type | Required | Max Items | Storage |
|-------|------|----------|-----------|---------|
| `userPhotos` | Array | No | 10 | Base64 |
| `menuPhotos` | Array | No | 10 | Base64 |

**Note:** Both use base64 storage. For production, consider Firebase Storage for better performance.

---

## ✅ Conclusion

**No manual Firestore schema update is needed.** The `menuPhotos` field will be automatically saved when users submit restaurants with menu photos. Firestore's NoSQL nature allows dynamic field addition without any configuration.

**Just test the form and it will work!** 🎉

---

**Status:** ✅ Ready to Use  
**Last Updated:** 10 November 2025

