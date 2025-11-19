# Fix: Emails Going to Spam

**Issue:** Emails are landing in spam folder instead of inbox.

---

## 🔍 Common Causes

1. **Unverified Sender Email** - Most common cause
2. **No SPF/DKIM Records** - Missing email authentication
3. **New Domain/IP Reputation** - Low sender reputation
4. **Email Content** - Triggers spam filters
5. **Missing Unsubscribe Link** - Required for promotional emails

---

## ✅ Quick Fixes

### 1. Verify Sender Email in SendGrid

**Steps:**
1. Go to SendGrid Dashboard → Settings → Sender Authentication
2. Check if your sender email (`nurj.media@gmail.com`) is verified
3. If not verified:
   - Click "Verify a Single Sender"
   - Use your Gmail address
   - Check email and click verification link
   - Wait for verification (usually instant)

**Why:** Unverified senders have lower deliverability

### 2. Use Domain Authentication (Best Solution)

**For Custom Domain:**
1. Go to SendGrid Dashboard → Settings → Sender Authentication
2. Click "Authenticate Your Domain"
3. Add your domain (e.g., `kawanmakan.com`)
4. Add DNS records (SPF, DKIM) to your domain
5. Verify domain authentication

**Why:** Domain authentication significantly improves deliverability

### 3. Improve Email Content

**Current Issues:**
- Missing unsubscribe link (required by CAN-SPAM)
- Missing physical address (required by CAN-SPAM)
- Too many links/images
- Spam trigger words

**Fixes:**
- Add unsubscribe link to all emails
- Add physical address in footer
- Reduce number of links
- Avoid spam trigger words (free, click here, etc.)

### 4. Warm Up Your IP/Domain

**For New SendGrid Accounts:**
- Start with low volume (10-20 emails/day)
- Gradually increase over 2-4 weeks
- SendGrid will build reputation

**Why:** New accounts have lower reputation initially

---

## 🛠️ Immediate Actions

### Action 1: Verify Sender Email

```bash
# Check SendGrid dashboard:
# Settings → Sender Authentication → Verify a Single Sender
```

### Action 2: Add Unsubscribe Link

Update email templates to include:
- Unsubscribe link (required by law)
- Physical address (required by CAN-SPAM)
- Plain text version

### Action 3: Check SendGrid Activity

1. Go to SendGrid Dashboard → Activity
2. Check email status:
   - Delivered ✅
   - Bounced ❌
   - Blocked ❌
   - Spam Report ❌

---

## 📧 Email Template Improvements Needed

### Add to Footer (All Emails):

```html
<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666;">
  <p>
    <a href="{{unsubscribe_url}}" style="color: #667eea;">Unsubscribe</a> | 
    <a href="{{landing_page_url}}" style="color: #667eea;">Manage Preferences</a>
  </p>
  <p>
    Kawan Makan Community<br>
    [Your Physical Address]<br>
    Malaysia
  </p>
</div>
```

### SendGrid Substitution Tags:

SendGrid automatically provides:
- `{{unsubscribe_url}}` - Unsubscribe link
- `{{unsubscribe}}` - Plain unsubscribe link

---

## 🔧 Technical Fixes

### Update Email Service to Use Substitution Tags

SendGrid supports automatic unsubscribe links via substitution tags. We should:

1. Add `{{unsubscribe_url}}` to email templates
2. Enable unsubscribe tracking in SendGrid
3. Add physical address to footer

### Check SendGrid Settings

1. **Settings → Mail Settings → Plain Content:**
   - Ensure plain text version is sent
   
2. **Settings → Mail Settings → Event Webhook:**
   - Set up webhook to track spam reports
   
3. **Settings → Sender Authentication:**
   - Verify domain or single sender

---

## 📊 Monitor Deliverability

### SendGrid Dashboard Metrics:

1. **Activity Feed:**
   - Check delivery rate
   - Monitor bounce rate
   - Watch spam reports

2. **Stats Dashboard:**
   - Delivery rate (should be >95%)
   - Bounce rate (should be <5%)
   - Spam reports (should be <0.1%)

---

## ✅ Checklist

- [ ] Verify sender email in SendGrid
- [ ] Add unsubscribe link to all emails
- [ ] Add physical address to email footer
- [ ] Check SendGrid Activity for issues
- [ ] Monitor spam reports
- [ ] Consider domain authentication (if custom domain)
- [ ] Warm up account (if new)

---

## 🎯 Expected Results

After fixes:
- **Inbox Placement:** 80-95% (up from current spam rate)
- **Delivery Rate:** >95%
- **Spam Rate:** <1%

---

## 📚 Resources

- [SendGrid Deliverability Guide](https://docs.sendgrid.com/ui/sending-email/deliverability)
- [CAN-SPAM Compliance](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)
- [SendGrid Sender Authentication](https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication)

---

**Last Updated:** 19 November 2025

