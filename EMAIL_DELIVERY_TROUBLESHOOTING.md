# Email Delivery Troubleshooting

**Issue:** Emails sent successfully but not received.

---

## 🔍 Check SendGrid Activity Dashboard

1. **Go to:** https://app.sendgrid.com/activity
2. **Search for:** `jihas.ariffin@gmail.com` or `jihad.ariffin@gmail.com`
3. **Check Status:**
   - ✅ **Delivered** - Email was delivered (check spam folder)
   - ⚠️ **Bounced** - Email address invalid or mailbox full
   - ❌ **Blocked** - Email blocked by recipient server
   - 📧 **Processed** - Email is being processed
   - ⏳ **Pending** - Email queued for delivery

---

## 📧 Common Issues & Solutions

### Issue 1: Email in Spam Folder

**Solution:**
1. Check spam/junk folder in Gmail
2. Mark email as "Not Spam"
3. Add sender to contacts
4. Verify sender email in SendGrid

### Issue 2: Sender Email Not Verified

**Check:** https://app.sendgrid.com/settings/sender_auth

**Solution:**
1. Verify `nurj.media@gmail.com` as single sender
2. Check email and click verification link
3. Wait for verification (usually instant)

### Issue 3: Email Address Typo

**Check:**
- Welcome email: `jihas.ariffin@gmail.com`
- Survey email: `jihad.ariffin@gmail.com`

**Note:** Different email addresses! Make sure you're checking the correct inbox.

### Issue 4: SendGrid Account Limits

**Check:** https://app.sendgrid.com/settings/billing

**Free Tier Limits:**
- 100 emails/day
- If exceeded, emails won't send

---

## 🧪 Test Email Delivery

### Method 1: Send Test Email to Yourself

1. Use Email Test Panel
2. Send to your own verified email
3. Check inbox and spam folder

### Method 2: Check SendGrid Logs

```bash
# View function logs
firebase functions:log --only sendEmail
```

### Method 3: Check SendGrid Activity

1. Go to SendGrid Dashboard → Activity
2. Filter by recipient email
3. Check detailed delivery status

---

## ✅ Quick Checks

- [ ] Check spam folder
- [ ] Verify sender email is verified in SendGrid
- [ ] Check SendGrid Activity dashboard for delivery status
- [ ] Verify email address is correct
- [ ] Check SendGrid account limits (100/day free tier)
- [ ] Try sending to a different email address
- [ ] Check function logs for errors

---

## 📊 Expected Delivery Time

- **Normal:** 1-2 minutes
- **Delayed:** Up to 15 minutes (rare)
- **If >15 minutes:** Check SendGrid Activity for issues

---

## 🔧 Next Steps

1. **Check SendGrid Activity:** https://app.sendgrid.com/activity
2. **Verify Sender:** https://app.sendgrid.com/settings/sender_auth
3. **Check Spam Folder** in Gmail
4. **Try Different Email** address for testing

---

**Last Updated:** 19 November 2025

