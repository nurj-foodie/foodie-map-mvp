/**
 * Email Drip Automation Functions
 * 
 * Scheduled triggers for automated email drip sequence:
 * - T+2: Survey email (2 days after waitlist signup)
 * - T+5: Community email (5 days after waitlist signup)
 * - T+8: Referral reminder email (8 days after waitlist signup)
 * - T+7 post-invite: Feedback email (7 days after beta access granted)
 */

const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

// Email templates (simplified versions for server-side)
const getSurveyEmailTemplate = (name, mainAppUrl) => {
  const surveyLink = `${mainAppUrl}?survey=true`;
  return {
    subject: "30 seconds = +50 K-Coins",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quick Survey - Kawan Makan Community</title>
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
        </div>
      </body>
      </html>
    `,
    text: `Hi ${name}!\n\nQuick question: Help us understand your travel habits and earn 50 K-Coins!\n\nThe Survey (30 seconds):\n- What device will you use? (iOS / Android)\n- How often do you drive? (Weekly / Monthly / Occasional)\n- Your usual corridor? (e.g., KL ↔ Penang)\n\nComplete the survey here: ${surveyLink}\n\nThis helps us prioritize features and routes that matter most to you!`
  };
};

const getCommunityEmailTemplate = (name, landingPageUrl) => {
  return {
    subject: "Join Kawan Makan Community / Komuniti Kawan Makan",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Join Community - Kawan Makan</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">👥 Join Our Community</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 18px; margin-top: 0;">Hi ${name}! 👋</p>
          
          <p>You're part of something special! The Kawan Makan community is growing, and we'd love to have you more involved.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">What's Next?</h3>
            <ul style="line-height: 2;">
              <li>Share your referral code to move up the waitlist</li>
              <li>Join our community discussions</li>
              <li>Get early access to new features</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${landingPageUrl}" style="background: #4facfe; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Visit Landing Page
            </a>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${name}!\n\nYou're part of something special! The Kawan Makan community is growing.\n\nVisit: ${landingPageUrl}`
  };
};

const getReferralReminderTemplate = (name, referralCode, landingPageUrl) => {
  const referralLink = `${landingPageUrl}?ref=${referralCode}`;
  return {
    subject: "Unlock Beta Access Faster",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Referral Reminder - Kawan Makan</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🚀 Unlock Beta Access Faster</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 18px; margin-top: 0;">Hi ${name}! 👋</p>
          
          <p>Want to move up the waitlist faster? Share your referral code!</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Your Referral Code:</p>
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #fa709a;">${referralCode}</p>
          </div>
          
          <p><strong>For each friend who joins:</strong></p>
          <ul style="line-height: 2;">
            <li>You get +100 K-Coins</li>
            <li>They get +25 K-Coins</li>
            <li>You both move up the waitlist!</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${referralLink}" style="background: #fa709a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Share Your Referral Link
            </a>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${name}!\n\nWant to move up the waitlist faster? Share your referral code: ${referralCode}\n\nFor each friend who joins, you both get K-Coins and move up!\n\nShare: ${referralLink}`
  };
};

const getFeedbackEmailTemplate = (name, landingPageUrl) => {
  return {
    subject: "How's your Kawan Makan experience?",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Feedback Request - Kawan Makan</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">💬 We'd Love Your Feedback</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 18px; margin-top: 0;">Hi ${name}! 👋</p>
          
          <p>You've been using Kawan Makan for a week now. How's it going?</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Quick Questions:</h3>
            <ul style="line-height: 2;">
              <li>What's your favorite feature?</li>
              <li>Any detours you'd like to see?</li>
              <li>How can we improve?</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${landingPageUrl}" style="background: #30cfd0; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Share Your Feedback
            </a>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${name}!\n\nYou've been using Kawan Makan for a week now. How's it going?\n\nShare your feedback: ${landingPageUrl}`
  };
};

/**
 * Send email via SendGrid
 */
async function sendEmailViaSendGrid(to, subject, html, text, emailType, waitlistId) {
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (!sendgridKey) {
    throw new Error('SendGrid API key not configured');
  }
  sgMail.setApiKey(sendgridKey);

  const defaultFromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@sendgrid.net';
  const defaultFromName = process.env.SENDGRID_FROM_NAME || 'Kawan Makan Community';

  const msg = {
    to,
    from: {
      email: defaultFromEmail,
      name: defaultFromName,
    },
    subject,
    text,
    html,
    tracking_settings: {
      click_tracking: { enable: true },
      open_tracking: { enable: true },
      subscription_tracking: {
        enable: true,
        text: 'If you would like to unsubscribe and stop receiving these emails, you can do so here: <% %>',
        html: '<p>If you would like to <a href="<% %>">unsubscribe</a> and stop receiving these emails, you can do so here: <% %>.</p>',
        substitution_tag: '<% %>'
      }
    },
    mail_settings: {
      footer: {
        enable: true,
        text: 'If you would like to unsubscribe and stop receiving these emails, you can do so here: <% %>',
        html: '<p style="font-size: 12px; color: #666; text-align: center; margin-top: 20px;"><a href="<% %>" style="color: #667eea;">Unsubscribe</a></p>'
      }
    }
  };

  try {
    const result = await sgMail.send(msg);
    const messageId = result[0]?.headers?.['x-message-id'] || null;

    // Track email in Firestore
    if (waitlistId) {
      await admin.firestore().collection('email_drips').add({
        waitlistId,
        email: to,
        emailType,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        messageId,
        status: 'sent',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    console.log(`✅ Email sent (${emailType}): ${to} (Message ID: ${messageId})`);
    return { success: true, messageId };
  } catch (error) {
    console.error(`❌ Error sending email (${emailType}):`, error);
    throw error;
  }
}

/**
 * Check if email was already sent
 */
async function wasEmailSent(waitlistId, emailType) {
  const emailDripsRef = admin.firestore().collection('email_drips');
  const snapshot = await emailDripsRef
    .where('waitlistId', '==', waitlistId)
    .where('emailType', '==', emailType)
    .limit(1)
    .get();

  return !snapshot.empty;
}

module.exports = {
  getSurveyEmailTemplate,
  getCommunityEmailTemplate,
  getReferralReminderTemplate,
  getFeedbackEmailTemplate,
  sendEmailViaSendGrid,
  wasEmailSent
};

