/**
 * Email Templates Service
 * 
 * Contains all email templates for the beta phase email drip sequence.
 * All emails include bilingual community name: "Kawan Makan Community / Komuniti Kawan Makan"
 */

const COMMUNITY_NAME_EN = 'Kawan Makan Community';
const COMMUNITY_NAME_BM = 'Komuniti Kawan Makan';
const LANDING_PAGE_URL = process.env.REACT_APP_LANDING_PAGE_URL || 'https://waitlist-foodie-map-23842.web.app';
const MAIN_APP_URL = process.env.REACT_APP_MAIN_APP_URL || 'https://foodie-map-23842.web.app';

/**
 * Email 1: Welcome Email (T+0)
 * Sent immediately when user joins waitlist
 */
export const getWelcomeEmailTemplate = (name, referralCode) => {
  const referralLink = `${LANDING_PAGE_URL}?ref=${referralCode}`;
  
  const subject = "You're in—claim your K-Coins";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${COMMUNITY_NAME_EN}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${COMMUNITY_NAME_EN}!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${COMMUNITY_NAME_BM}</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; margin-top: 0;">Hi ${name}! 👋</p>
        
        <p>You're on the <strong>Kawan Makan beta list</strong>. Your starter <strong>25 K-Coins</strong> have been added to your account!</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h2 style="margin-top: 0; color: #667eea;">🎁 Your Referral Code</h2>
          <p style="font-size: 24px; font-weight: bold; color: #764ba2; margin: 10px 0;">${referralCode}</p>
          <p style="margin-bottom: 0;">Share this link to earn <strong>100 K-Coins per friend</strong>:</p>
          <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px; margin: 10px 0 0 0;">
            <a href="${referralLink}" style="color: #667eea; text-decoration: none;">${referralLink}</a>
          </p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">📍 Quick Question</h3>
          <p>What's your usual corridor? (e.g., <strong>Kluang ↔ Penang</strong>)</p>
          <p style="font-size: 14px; color: #666;">Reply to this email with your most common route, and we'll make sure Kawan Makan works perfectly for you!</p>
        </div>
        
        <p><strong>Next:</strong> In 2 days, you'll receive a 30-second survey for <strong>+50 K-Coins</strong>! 🎯</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 5px 0;">
            <a href="<% %>" style="color: #667eea; text-decoration: none;">Unsubscribe</a> | 
            <a href="${LANDING_PAGE_URL}" style="color: #667eea; text-decoration: none;">Visit Landing Page</a>
          </p>
          <p style="margin: 5px 0;">
            ${COMMUNITY_NAME_EN} / ${COMMUNITY_NAME_BM}<br>
            Malaysia
          </p>
          <p style="margin: 5px 0; font-size: 11px; color: #999;">
            You're receiving this email because you joined the Kawan Makan waitlist.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Welcome to ${COMMUNITY_NAME_EN}!

Hi ${name}!

You're on the Kawan Makan beta list. Your starter 25 K-Coins have been added to your account!

YOUR REFERRAL CODE: ${referralCode}

Share this link to earn 100 K-Coins per friend:
${referralLink}

QUICK QUESTION:
What's your usual corridor? (e.g., Kluang ↔ Penang)
Reply to this email with your most common route, and we'll make sure Kawan Makan works perfectly for you!

NEXT:
In 2 days, you'll receive a 30-second survey for +50 K-Coins!

${COMMUNITY_NAME_EN} / ${COMMUNITY_NAME_BM}
Visit: ${LANDING_PAGE_URL}
  `;
  
  return { subject, html, text };
};

/**
 * Email 2: Survey Email (T+2)
 * Sent 2 days after waitlist signup
 */
export const getSurveyEmailTemplate = (name) => {
  // Survey link points to main app where users can log in and complete survey
  const surveyLink = `${MAIN_APP_URL}?survey=true`;
  
  const subject = "30 seconds = +50 K-Coins";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quick Survey - ${COMMUNITY_NAME_EN}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">⏱️ 30 Seconds = +50 K-Coins</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; margin-top: 0;">Hi ${name}! 👋</p>
        
        <p>Quick question: Help us understand your travel habits and earn <strong>50 K-Coins</strong>!</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">📱 The Survey (30 seconds):</h3>
          <ul style="line-height: 2;">
            <li>What device will you use? (iOS / Android)</li>
            <li>How often do you drive? (Weekly / Monthly / Occasional)</li>
            <li>Your usual corridor? (e.g., KL ↔ Penang)</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${surveyLink}" style="background: #f5576c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Complete Survey → Get +50 K-Coins
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; text-align: center;">This helps us prioritize features and routes that matter most to you!</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
          <p style="font-size: 14px; color: #666; margin: 0;">
            ${COMMUNITY_NAME_EN} / ${COMMUNITY_NAME_BM}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
30 seconds = +50 K-Coins

Hi ${name}!

Quick question: Help us understand your travel habits and earn 50 K-Coins!

THE SURVEY (30 seconds):
- What device will you use? (iOS / Android)
- How often do you drive? (Weekly / Monthly / Occasional)
- Your usual corridor? (e.g., KL ↔ Penang)

Complete the survey here: ${surveyLink}

This helps us prioritize features and routes that matter most to you!

${COMMUNITY_NAME_EN} / ${COMMUNITY_NAME_BM}
  `;
  
  return { subject, html, text };
};

/**
 * Email 3: Community Building Email (T+5)
 * Sent 5 days after waitlist signup
 */
export const getCommunityEmailTemplate = (name) => {
  const subject = `Join ${COMMUNITY_NAME_EN} / ${COMMUNITY_NAME_BM}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Join ${COMMUNITY_NAME_EN}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${COMMUNITY_NAME_EN}</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${COMMUNITY_NAME_BM}</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; margin-top: 0;">Hi ${name}! 👋</p>
        
        <p>You're part of something special—the <strong>${COMMUNITY_NAME_EN}</strong>!</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">🎯 Community Goals</h3>
          <ul style="line-height: 2;">
            <li><strong>Discover</strong> amazing halal food along your routes</li>
            <li><strong>Share</strong> hidden gems with fellow travelers</li>
            <li><strong>Build</strong> Malaysia's most comprehensive food map</li>
            <li><strong>Earn</strong> rewards for exploration and contribution</li>
          </ul>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">🌟 Early Adopter Benefits</h3>
          <ul style="line-height: 2;">
            <li>Exclusive beta access to new features</li>
            <li>Priority support and feedback channels</li>
            <li>Special Founder perks and rewards</li>
            <li>Chance to shape the future of Kawan Makan</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p><strong>Follow us for updates:</strong></p>
          <p style="font-size: 14px; color: #666;">
            (Social media links coming soon!)
          </p>
        </div>
        
        <p style="text-align: center; font-size: 14px; color: #666;">
          Together, we're building Malaysia's food discovery community! 🍜
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
          <p style="font-size: 14px; color: #666; margin: 0;">
            ${COMMUNITY_NAME_EN} / ${COMMUNITY_NAME_BM}<br>
            <a href="${LANDING_PAGE_URL}" style="color: #4facfe; text-decoration: none;">Visit Landing Page</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Join ${COMMUNITY_NAME_EN} / ${COMMUNITY_NAME_BM}

Hi ${name}!

You're part of something special—the ${COMMUNITY_NAME_EN}!

COMMUNITY GOALS:
- Discover amazing halal food along your routes
- Share hidden gems with fellow travelers
- Build Malaysia's most comprehensive food map
- Earn rewards for exploration and contribution

EARLY ADOPTER BENEFITS:
- Exclusive beta access to new features
- Priority support and feedback channels
- Special Founder perks and rewards
- Chance to shape the future of Kawan Makan

Together, we're building Malaysia's food discovery community!

${COMMUNITY_NAME_EN} / ${COMMUNITY_NAME_BM}
Visit: ${LANDING_PAGE_URL}
  `;
  
  return { subject, html, text };
};

/**
 * Email 4: Referral Reminder Email (T+8)
 * Sent 8 days after waitlist signup
 */
export const getReferralReminderEmailTemplate = (name, referralCode, position, total) => {
  const referralLink = `${LANDING_PAGE_URL}?ref=${referralCode}`;
  
  const subject = "Unlock Beta Access Faster";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Unlock Beta Access - ${COMMUNITY_NAME_EN}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🚀 Unlock Beta Access Faster</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; margin-top: 0;">Hi ${name}! 👋</p>
        
        <p>Want to get beta access sooner? <strong>Share your referral link!</strong></p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #fa709a;">
          <h3 style="margin-top: 0; color: #333;">📊 Your Status</h3>
          <p style="font-size: 18px; margin: 10px 0;">
            Position: <strong>#${position}</strong> of ${total} waitlist members
          </p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">🎁 How Referrals Work</h3>
          <ul style="line-height: 2;">
            <li><strong>+100 K-Coins</strong> per friend who joins the waitlist</li>
            <li><strong>+50 cohort points</strong> per friend who gets beta access</li>
            <li>Higher cohort score = <strong>earlier beta access</strong></li>
            <li>Top referrers get <strong>exclusive perks</strong>!</li>
          </ul>
        </div>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="margin-top: 0; color: #333;">🔗 Your Referral Link</h3>
          <p style="font-size: 24px; font-weight: bold; color: #764ba2; margin: 10px 0;">${referralCode}</p>
          <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px; margin: 10px 0 0 0;">
            <a href="${referralLink}" style="color: #fa709a; text-decoration: none;">${referralLink}</a>
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p><strong>Share via:</strong> WhatsApp | Telegram | Facebook | Twitter</p>
          <p style="font-size: 14px; color: #666;">(Copy link and share manually for now)</p>
        </div>
        
        <p style="text-align: center; font-size: 14px; color: #666;">
          Every referral brings you closer to beta access! 🎯
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
          <p style="font-size: 14px; color: #666; margin: 0;">
            ${COMMUNITY_NAME_EN} / ${COMMUNITY_NAME_BM}<br>
            <a href="${LANDING_PAGE_URL}" style="color: #fa709a; text-decoration: none;">Visit Landing Page</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Unlock Beta Access Faster

Hi ${name}!

Want to get beta access sooner? Share your referral link!

YOUR STATUS:
Position: #${position} of ${total} waitlist members

HOW REFERRALS WORK:
- +100 K-Coins per friend who joins the waitlist
- +50 cohort points per friend who gets beta access
- Higher cohort score = earlier beta access
- Top referrers get exclusive perks!

YOUR REFERRAL LINK: ${referralCode}
${referralLink}

Share via: WhatsApp | Telegram | Facebook | Twitter

Every referral brings you closer to beta access!

${COMMUNITY_NAME_EN} / ${COMMUNITY_NAME_BM}
Visit: ${LANDING_PAGE_URL}
  `;
  
  return { subject, html, text };
};

/**
 * Email 5: Invite Email (Rolling)
 * Sent when beta access is granted
 */
export const getInviteEmailTemplate = (name) => {
  const appUrl = process.env.REACT_APP_APP_URL || 'https://foodie-map-23842.web.app';
  
  const subject = "Your Kawan Makan beta access";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Beta Access - ${COMMUNITY_NAME_EN}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 You're In!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Beta Access Granted</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; margin-top: 0;">Hi ${name}! 👋</p>
        
        <p><strong>Congratulations!</strong> You've been selected for the Kawan Makan beta. Welcome to the ${COMMUNITY_NAME_EN}!</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #30cfd0;">
          <h3 style="margin-top: 0; color: #333;">🚀 Getting Started</h3>
          <ol style="line-height: 2;">
            <li><strong>Build your first route</strong> → Pick a start and end location</li>
            <li><strong>Pick a detour</strong> → Discover restaurants along your route</li>
            <li><strong>Open in Google Maps</strong> → Navigate to your food stops</li>
          </ol>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">💡 Pro Tips</h3>
          <ul style="line-height: 2;">
            <li><strong>Save 1 favorite</strong> → Get featured in our community highlights</li>
            <li><strong>Share 1 stop</strong> → Help others discover great food</li>
            <li><strong>Add a restaurant</strong> → Earn K-Coins and XP</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}" style="background: #30cfd0; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Start Exploring →
          </a>
        </div>
        
        <p style="text-align: center; font-size: 14px; color: #666;">
          We're excited to have you on board! Your feedback shapes the future of Kawan Makan. 🍜
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
          <p style="font-size: 14px; color: #666; margin: 0;">
            ${COMMUNITY_NAME_EN} / ${COMMUNITY_NAME_BM}<br>
            <a href="${appUrl}" style="color: #30cfd0; text-decoration: none;">Open Kawan Makan</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Your Kawan Makan beta access

Hi ${name}!

Congratulations! You've been selected for the Kawan Makan beta. Welcome to the ${COMMUNITY_NAME_EN}!

GETTING STARTED:
1. Build your first route → Pick a start and end location
2. Pick a detour → Discover restaurants along your route
3. Open in Google Maps → Navigate to your food stops

PRO TIPS:
- Save 1 favorite → Get featured in our community highlights
- Share 1 stop → Help others discover great food
- Add a restaurant → Earn K-Coins and XP

Start exploring: ${appUrl}

We're excited to have you on board! Your feedback shapes the future of Kawan Makan.

${COMMUNITY_NAME_EN} / ${COMMUNITY_NAME_BM}
  `;
  
  return { subject, html, text };
};

/**
 * Email 6: Feedback Email (T+7 post-invite)
 * Sent 7 days after beta access granted
 */
export const getFeedbackEmailTemplate = (name) => {
  const feedbackLink = `${LANDING_PAGE_URL}?feedback=true`;
  
  const subject = "Rate your makan run (1–10)";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Feedback - ${COMMUNITY_NAME_EN}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">⭐ Rate Your Makan Run</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; margin-top: 0;">Hi ${name}! 👋</p>
        
        <p>You've been using Kawan Makan for a week now. How's it going?</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">📊 Quick Rating (1–10)</h3>
          <p>Rate your overall experience:</p>
          <ul style="line-height: 2;">
            <li><strong>Accuracy</strong> - Were the restaurant locations correct?</li>
            <li><strong>Detour Time</strong> - Was the time estimate accurate?</li>
            <li><strong>Food Quality</strong> - Did you discover great food?</li>
            <li><strong>Missing Stops</strong> - Any restaurants we should add?</li>
          </ul>
        </div>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="margin-top: 0; color: #333;">🎯 Share Your Favorites</h3>
          <p>Reply to this email with your <strong>3 favorite detours</strong> you discovered using Kawan Makan!</p>
          <p style="font-size: 14px; color: #666; margin-bottom: 0;">We'll feature the best ones in our community highlights.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${feedbackLink}" style="background: #a8edea; color: #333; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Submit Feedback →
          </a>
        </div>
        
        <p style="text-align: center; font-size: 14px; color: #666;">
          Your feedback helps us improve Kawan Makan for everyone! 🙏
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
          <p style="font-size: 14px; color: #666; margin: 0;">
            ${COMMUNITY_NAME_EN} / ${COMMUNITY_NAME_BM}<br>
            <a href="${feedbackLink}" style="color: #a8edea; text-decoration: none;">Submit Feedback</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Rate your makan run (1–10)

Hi ${name}!

You've been using Kawan Makan for a week now. How's it going?

QUICK RATING (1–10):
Rate your overall experience:
- Accuracy - Were the restaurant locations correct?
- Detour Time - Was the time estimate accurate?
- Food Quality - Did you discover great food?
- Missing Stops - Any restaurants we should add?

SHARE YOUR FAVORITES:
Reply to this email with your 3 favorite detours you discovered using Kawan Makan!
We'll feature the best ones in our community highlights.

Submit feedback: ${feedbackLink}

Your feedback helps us improve Kawan Makan for everyone!

${COMMUNITY_NAME_EN} / ${COMMUNITY_NAME_BM}
  `;
  
  return { subject, html, text };
};

