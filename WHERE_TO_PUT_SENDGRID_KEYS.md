# Where to Put SendGrid API Keys

**Location:** `.env` file in `foodie-simple/` directory

---

## 📍 File Location

```
foodie-simple/
├── .env                    ← PUT IT HERE (create if doesn't exist)
├── package.json
├── src/
└── ...
```

**Full Path:** `/Users/izura/Documents/foodie mvp/foodie-simple/.env`

---

## 📝 Step-by-Step Instructions

### Step 1: Navigate to Directory

```bash
cd "/Users/izura/Documents/foodie mvp/foodie-simple"
```

### Step 2: Create or Edit .env File

**If `.env` file doesn't exist:**
```bash
touch .env
```

**Or create it manually:**
- Open your code editor
- Create new file: `.env`
- Save it in `foodie-simple/` directory

### Step 3: Add SendGrid Keys

Add these lines to your `.env` file:

```bash
# ============================================
# BETA PHASE CONFIGURATION - SendGrid
# ============================================

# SendGrid API Key (get from SendGrid dashboard: Settings → API Keys)
REACT_APP_SENDGRID_API_KEY=SG.your_actual_api_key_here

# SendGrid Sender Email (use your verified single sender email)
REACT_APP_SENDGRID_FROM_EMAIL=your_verified_email@example.com

# SendGrid Sender Name
REACT_APP_SENDGRID_FROM_NAME=Kawan Makan Community

# Landing Page URL
REACT_APP_LANDING_PAGE_URL=https://foodie-map-23842.web.app

# Beta Phase Settings
REACT_APP_BETA_ENABLED=true
REACT_APP_BETA_MIN_WAITLIST_SIZE=500
REACT_APP_BETA_TARGET_USERS=300
REACT_APP_BETA_WAVE_SIZE_MIN=50
REACT_APP_BETA_WAVE_SIZE_MAX=100
```

### Step 4: Replace Placeholder Values

**Replace these placeholders:**

1. **`SG.your_actual_api_key_here`**
   - Replace with your actual SendGrid API key
   - Format: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Get from: SendGrid Dashboard → Settings → API Keys

2. **`your_verified_email@example.com`**
   - Replace with your verified sender email
   - Example: `nurj.media@gmail.com`
   - Must be verified in SendGrid (Settings → Sender Authentication)

---

## ✅ Example .env File

Here's what your `.env` file should look like (with real values):

```bash
# SendGrid API Key
REACT_APP_SENDGRID_API_KEY=SG.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

# SendGrid Sender Email
REACT_APP_SENDGRID_FROM_EMAIL=nurj.media@gmail.com

# SendGrid Sender Name
REACT_APP_SENDGRID_FROM_NAME=Kawan Makan Community

# Landing Page URL
REACT_APP_LANDING_PAGE_URL=https://foodie-map-23842.web.app

# Beta Phase Settings
REACT_APP_BETA_ENABLED=true
REACT_APP_BETA_MIN_WAITLIST_SIZE=500
REACT_APP_BETA_TARGET_USERS=300
REACT_APP_BETA_WAVE_SIZE_MIN=50
REACT_APP_BETA_WAVE_SIZE_MAX=100
```

---

## 🔒 Security Checklist

- [ ] `.env` file is in `.gitignore` (should NOT be committed to git)
- [ ] API key starts with `SG.` (SendGrid format)
- [ ] No spaces around `=` sign
- [ ] No quotes around values (unless needed)
- [ ] File is in `foodie-simple/` directory (not in subdirectories)

---

## 🧪 Verify It Works

After adding keys, restart your dev server:

```bash
npm start
```

Then check console for:
- ✅ No errors about missing API key
- ✅ Environment variables loaded correctly

---

## 📋 Quick Checklist

1. ✅ Create `.env` file in `foodie-simple/` directory
2. ✅ Add `REACT_APP_SENDGRID_API_KEY=SG.your_key_here`
3. ✅ Add `REACT_APP_SENDGRID_FROM_EMAIL=your_email@example.com`
4. ✅ Add `REACT_APP_SENDGRID_FROM_NAME=Kawan Makan Community`
5. ✅ Verify `.env` is in `.gitignore`
6. ✅ Restart dev server

---

## ⚠️ Important Notes

1. **File Name:** Must be exactly `.env` (not `.env.txt` or `env`)
2. **Location:** Must be in `foodie-simple/` root directory
3. **Format:** `KEY=value` (no spaces around `=`)
4. **No Quotes:** Don't wrap values in quotes unless necessary
5. **Git:** Never commit `.env` file to git (it's in `.gitignore`)

---

## 🆘 Troubleshooting

### "API key not found"
- Check file is named exactly `.env` (not `.env.txt`)
- Check file is in `foodie-simple/` directory
- Check `REACT_APP_` prefix is correct
- Restart dev server after adding keys

### "Environment variable undefined"
- Make sure variable name starts with `REACT_APP_`
- Check for typos in variable name
- Restart dev server

### "File not found"
- Create `.env` file manually
- Make sure it's in the correct directory
- Check file permissions

---

**Last Updated:** 17 November 2025

