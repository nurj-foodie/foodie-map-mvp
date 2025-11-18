# SendGrid Single Sender Setup Guide

**Date:** 17 November 2025  
**Purpose:** Step-by-step guide to fill out SendGrid "Verify a Single Sender" form

---

## 📋 Form Field Guide

### 1. **From Name** (Required)
**What it is:** The display name recipients will see in their inbox

**Fill with:**
```
Kawan Makan Community
```

**Why:** This matches your community branding and will appear as the sender name in all emails.

---

### 2. **From Email Address** (Required + Verification)
**What it is:** The email address that will send emails (must be verified)

**Options:**
- **Option A (Recommended):** Use your personal email
  ```
  nurj.media@gmail.com
  ```
  (or whichever email you prefer)

- **Option B:** Create a new Gmail account specifically for this
  ```
  kawanmakan.beta@gmail.com
  ```

**Important:** 
- SendGrid will send a verification email to this address
- You MUST click the verification link in that email
- Until verified, you cannot send emails

**Fill with:** Your chosen email address

---

### 3. **Reply To** (Optional but Recommended)
**What it is:** Where replies to your emails will go

**Fill with:** Same as "From Email Address"
```
nurj.media@gmail.com
```
(or same email you used in step 2)

**Why:** This ensures replies come back to you.

---

### 4. **Company Address** (Required for CAN-SPAM Compliance)
**What it is:** Physical mailing address required by anti-spam laws (CAN-SPAM, CASL)

**⚠️ IMPORTANT:** This address will appear in the footer of promotional emails (required by law).

**Fill with:** Your actual physical address or business address

**Example:**
```
123 Jalan Example
Taman Example
```

**Note:** If you don't have a business address, use your personal address. This is required by law for promotional emails.

---

### 5. **Company Address Line 2** (Optional)
**What it is:** Additional address line (suite, unit, etc.)

**Fill with:** Leave blank or add if needed
```
(Leave blank)
```

---

### 6. **City** (Required)
**What it is:** City name

**Fill with:** Your city
```
Kluang
```
(or your actual city)

---

### 7. **State** (Required)
**What it is:** State/Province

**Fill with:** Your state
```
Johor
```
(or your actual state)

---

### 8. **Zip Code** (Required)
**What it is:** Postal/ZIP code

**Fill with:** Your postal code
```
86000
```
(or your actual postal code)

---

### 9. **Country** (Required)
**What it is:** Country

**Fill with:**
```
Malaysia
```

---

### 10. **Nickname** (Optional)
**What it is:** Internal name for this sender (only you see this)

**Fill with:**
```
Kawan Makan Beta Sender
```

**Why:** Helps you identify this sender in SendGrid dashboard later.

---

## ✅ Complete Form Example

Here's a filled-out example:

```
From Name:                    Kawan Makan Community
From Email Address:           nurj.media@gmail.com
Reply To:                     nurj.media@gmail.com
Company Address:              123 Jalan Example
Company Address Line 2:       (Leave blank)
City:                         Kluang
State:                         Johor
Zip Code:                     86000
Country:                       Malaysia
Nickname:                      Kawan Makan Beta Sender
```

---

## 📝 Step-by-Step Instructions

1. **Fill in "From Name":** `Kawan Makan Community`

2. **Fill in "From Email Address":** Your email (e.g., `nurj.media@gmail.com`)

3. **Fill in "Reply To":** Same as From Email Address

4. **Fill in "Company Address":** Your physical address (required by law)

5. **Fill in "City":** Your city

6. **Fill in "State":** Your state

7. **Fill in "Zip Code":** Your postal code

8. **Select "Country":** Malaysia

9. **Fill in "Nickname":** `Kawan Makan Beta Sender`

10. **Click "Create"**

11. **Check your email** for verification email from SendGrid

12. **Click verification link** in the email

13. **Done!** Your sender is verified and ready to use.

---

## ⚠️ Important Notes

### CAN-SPAM Compliance
- The physical address you provide **will appear in email footers** (required by law)
- This is mandatory for promotional emails
- If you don't want your personal address public, consider:
  - Using a business address
  - Using a PO Box
  - Creating a business entity with a business address

### Email Verification
- You MUST verify the email address before you can send emails
- Check your inbox (and spam folder) for the verification email
- Click the verification link within 24 hours (usually)

### Using This Email in .env
After verification, add to your `.env` file:
```bash
REACT_APP_SENDGRID_FROM_EMAIL=nurj.media@gmail.com
REACT_APP_SENDGRID_FROM_NAME=Kawan Makan Community
```

---

## 🚨 Troubleshooting

### "Email already verified"
- If you've verified this email before, you can reuse it
- Just select it from the dropdown if available

### "Verification email not received"
- Check spam/junk folder
- Wait 5-10 minutes
- Try resending verification email
- Make sure email address is correct

### "Domain doesn't match authenticated domain"
- This is normal! You're using "Single Sender" verification
- SendGrid will send a verification email to your email address
- Click the link in that email to verify

---

## ✅ After Verification

Once verified:
1. ✅ Sender status will show as "Verified" in SendGrid dashboard
2. ✅ You can use this email in your `.env` file
3. ✅ You can start sending emails (up to 100/day on free tier)

---

**Last Updated:** 17 November 2025

