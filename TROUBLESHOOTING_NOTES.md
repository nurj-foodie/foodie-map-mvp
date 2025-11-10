# 🔧 TROUBLESHOOTING NOTES

**Last Updated:** 6 November 2025

---

## 🗺️ Google Maps Not Loading

### **First Check: IP Address Restriction**

**⚠️ IMPORTANT:** If Google Maps is not loading after the app starts, **ALWAYS check IP address restrictions first!**

#### Steps to Diagnose:

1. **Check Your Current IP Address:**
   ```bash
   curl ifconfig.me
   # Or visit: https://whatismyipaddress.com/
   ```

2. **Check Google Cloud Console:**
   - Go to: [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to: **APIs & Services** → **Credentials**
   - Find your **Google Maps API Key**
   - Check **"Application restrictions"**:
     - If set to **"IP addresses"**, verify your current IP is in the allowed list
     - If set to **"HTTP referrers"**, verify your domain/localhost is allowed

3. **Update IP Restriction (if needed):**
   - Click on your API key
   - Under **"Application restrictions"**, add your current IP address
   - Click **Save**
   - Wait 1-2 minutes for changes to propagate
   - **Restart your dev server** (`npm start`)

#### Common Symptoms:
- ✅ Console shows: "⏳ Waiting for Google Maps..." repeatedly
- ✅ No "✅ Google Maps loaded successfully" message
- ✅ Geocoding errors: `ReferenceError: Can't find variable: google`
- ✅ Map doesn't display in the app

#### Quick Fix Checklist:
- [ ] Check current IP address
- [ ] Verify IP in Google Cloud Console API key restrictions
- [ ] Add/update IP if changed
- [ ] Wait 1-2 minutes
- [ ] Restart dev server (`npm start`)
- [ ] Check browser console for "✅ Google Maps loaded successfully"

---

## 🔑 API Key Injection Issues

### Problem: API key not loading in development

**Symptoms:**
- Google Maps API key shows as placeholder or undefined
- Console shows API key errors

**Solution:**
1. Ensure `.env` file exists with `REACT_APP_GOOGLE_MAPS_API_KEY=your_key`
2. The `npm start` script should automatically run `inject-env.js`
3. Check `public/index.html` uses `%REACT_APP_GOOGLE_MAPS_API_KEY%` placeholder
4. Restart dev server if changes were made

---

## 📝 Notes

- **IP addresses can change** when:
  - Switching networks (WiFi, mobile hotspot)
  - VPN connection changes
  - ISP assigns new dynamic IP
  - Router restarts

- **Always check IP first** before investigating other issues
- **IP restrictions apply immediately** but may take 1-2 minutes to propagate
- **Development vs Production:** Different IP restrictions may be needed for localhost vs production domain

---

**Remember:** When Google Maps doesn't load → **Check IP address in Google Cloud Console first!**

