const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');
const {
  getSurveyEmailTemplate,
  getCommunityEmailTemplate,
  getReferralReminderTemplate,
  getFeedbackEmailTemplate,
  sendEmailViaSendGrid,
  wasEmailSent
} = require('./emailDrip');

admin.initializeApp();

// Set SendGrid API key from environment variable
// Set this using: firebase functions:secrets:set SENDGRID_API_KEY
// Or use: firebase functions:config:set sendgrid.key="YOUR_API_KEY" (deprecated)
const sendgridKey = process.env.SENDGRID_API_KEY || functions.config().sendgrid?.key;
if (!sendgridKey) {
  console.warn('⚠️ SendGrid API key not configured. Set SENDGRID_API_KEY environment variable.');
}
sgMail.setApiKey(sendgridKey || '');

/**
 * Send Email Function
 * 
 * Sends email via SendGrid API (server-side) to avoid CORS issues.
 * Called from client-side emailService.js
 */
exports.sendEmail = functions.https.onCall(async (data, context) => {
  // Optional: Verify user is authenticated
  // Uncomment if you want to require authentication
  // if (!context.auth) {
  //   throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  // }

  const { to, subject, html, text, fromEmail, fromName } = data;

  // Validate required fields
  if (!to || !subject || !html || !text) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields: to, subject, html, text'
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid email address');
  }

  // Prepare SendGrid message
  const defaultFromEmail = process.env.SENDGRID_FROM_EMAIL || functions.config().sendgrid?.from_email || 'noreply@sendgrid.net';
  const defaultFromName = process.env.SENDGRID_FROM_NAME || functions.config().sendgrid?.from_name || 'Kawan Makan Community';
  
  const msg = {
    to,
    from: {
      email: fromEmail || defaultFromEmail,
      name: fromName || defaultFromName,
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
        substitution_tag: '<% %>',
        // Enable in footer AND allow template substitution
        html_content: '<p style="font-size: 12px; color: #666; text-align: center; margin-top: 20px;"><a href="<% %>" style="color: #667eea;">Unsubscribe</a></p>'
      }
    },
    // Enable footer for CAN-SPAM compliance (SendGrid handles unsubscribe)
    mail_settings: {
      footer: {
        enable: true, // Enable SendGrid footer for proper unsubscribe handling
        text: 'If you would like to unsubscribe and stop receiving these emails, you can do so here: <% %>',
        html: '<p style="font-size: 12px; color: #666; text-align: center; margin-top: 20px;"><a href="<% %>" style="color: #667eea;">Unsubscribe</a></p>'
      }
    }
  };

  try {
    const result = await sgMail.send(msg);
    const messageId = result[0]?.headers?.['x-message-id'] || null;

    console.log(`✅ Email sent successfully: ${to} (Message ID: ${messageId})`);

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    console.error('❌ SendGrid error:', error);
    
    // Log detailed error
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }

    throw new functions.https.HttpsError(
      'internal',
      error.response?.body?.errors?.[0]?.message || error.message || 'Failed to send email'
    );
  }
});

/**
 * Scheduled Function: Send Survey Email (T+2)
 * Runs daily at 9:00 AM to send survey emails to users who signed up 2 days ago
 */
exports.sendSurveyEmailsT2 = functions.pubsub.schedule('0 9 * * *')
  .timeZone('Asia/Kuala_Lumpur')
  .onRun(async (context) => {
    console.log('📧 Running T+2 Survey Email Job...');
    
    const db = admin.firestore();
    const mainAppUrl = functions.config().main_app?.url || process.env.MAIN_APP_URL || 'https://foodie-map-23842.web.app';
    
    // Calculate date 2 days ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);
    
    const twoDaysAgoEnd = new Date(twoDaysAgo);
    twoDaysAgoEnd.setHours(23, 59, 59, 999);
    
    try {
      // Query waitlist for users who signed up 2 days ago
      const waitlistRef = db.collection('waitlist');
      const snapshot = await waitlistRef
        .where('signupDate', '>=', admin.firestore.Timestamp.fromDate(twoDaysAgo))
        .where('signupDate', '<=', admin.firestore.Timestamp.fromDate(twoDaysAgoEnd))
        .get();
      
      console.log(`📊 Found ${snapshot.size} users who signed up 2 days ago`);
      
      let sentCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const waitlistId = doc.id;
        const email = data.email;
        const name = data.name || email.split('@')[0];
        
        // Skip if survey already completed
        if (data.surveyCompleted) {
          console.log(`⏭️ Skipping ${email} - survey already completed`);
          skippedCount++;
          continue;
        }
        
        // Check if email was already sent
        if (await wasEmailSent(waitlistId, 'survey')) {
          console.log(`⏭️ Skipping ${email} - survey email already sent`);
          skippedCount++;
          continue;
        }
        
        try {
          // Get email template
          const template = getSurveyEmailTemplate(name, mainAppUrl);
          
          // Send email
          await sendEmailViaSendGrid(
            email,
            template.subject,
            template.html,
            template.text,
            'survey',
            waitlistId
          );
          
          sentCount++;
        } catch (error) {
          console.error(`❌ Error sending survey email to ${email}:`, error);
          errorCount++;
        }
      }
      
      console.log(`✅ T+2 Survey Email Job Complete: ${sentCount} sent, ${skippedCount} skipped, ${errorCount} errors`);
      return { sentCount, skippedCount, errorCount };
    } catch (error) {
      console.error('❌ Error in T+2 Survey Email Job:', error);
      throw error;
    }
  });

/**
 * Scheduled Function: Send Community Email (T+5)
 * Runs daily at 9:00 AM to send community emails to users who signed up 5 days ago
 */
exports.sendCommunityEmailsT5 = functions.pubsub.schedule('0 9 * * *')
  .timeZone('Asia/Kuala_Lumpur')
  .onRun(async (context) => {
    console.log('📧 Running T+5 Community Email Job...');
    
    const db = admin.firestore();
    const landingPageUrl = functions.config().landing_page?.url || process.env.LANDING_PAGE_URL || 'https://waitlist-foodie-map-23842.web.app';
    
    // Calculate date 5 days ago
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    fiveDaysAgo.setHours(0, 0, 0, 0);
    
    const fiveDaysAgoEnd = new Date(fiveDaysAgo);
    fiveDaysAgoEnd.setHours(23, 59, 59, 999);
    
    try {
      const waitlistRef = db.collection('waitlist');
      const snapshot = await waitlistRef
        .where('signupDate', '>=', admin.firestore.Timestamp.fromDate(fiveDaysAgo))
        .where('signupDate', '<=', admin.firestore.Timestamp.fromDate(fiveDaysAgoEnd))
        .get();
      
      console.log(`📊 Found ${snapshot.size} users who signed up 5 days ago`);
      
      let sentCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const waitlistId = doc.id;
        const email = data.email;
        const name = data.name || email.split('@')[0];
        
        // Check if email was already sent
        if (await wasEmailSent(waitlistId, 'community')) {
          console.log(`⏭️ Skipping ${email} - community email already sent`);
          skippedCount++;
          continue;
        }
        
        try {
          const template = getCommunityEmailTemplate(name, landingPageUrl);
          await sendEmailViaSendGrid(
            email,
            template.subject,
            template.html,
            template.text,
            'community',
            waitlistId
          );
          sentCount++;
        } catch (error) {
          console.error(`❌ Error sending community email to ${email}:`, error);
          errorCount++;
        }
      }
      
      console.log(`✅ T+5 Community Email Job Complete: ${sentCount} sent, ${skippedCount} skipped, ${errorCount} errors`);
      return { sentCount, skippedCount, errorCount };
    } catch (error) {
      console.error('❌ Error in T+5 Community Email Job:', error);
      throw error;
    }
  });

/**
 * Scheduled Function: Send Referral Reminder Email (T+8)
 * Runs daily at 9:00 AM to send referral reminder emails to users who signed up 8 days ago
 */
exports.sendReferralReminderEmailsT8 = functions.pubsub.schedule('0 9 * * *')
  .timeZone('Asia/Kuala_Lumpur')
  .onRun(async (context) => {
    console.log('📧 Running T+8 Referral Reminder Email Job...');
    
    const db = admin.firestore();
    const landingPageUrl = functions.config().landing_page?.url || process.env.LANDING_PAGE_URL || 'https://waitlist-foodie-map-23842.web.app';
    
    // Calculate date 8 days ago
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    eightDaysAgo.setHours(0, 0, 0, 0);
    
    const eightDaysAgoEnd = new Date(eightDaysAgo);
    eightDaysAgoEnd.setHours(23, 59, 59, 999);
    
    try {
      const waitlistRef = db.collection('waitlist');
      const snapshot = await waitlistRef
        .where('signupDate', '>=', admin.firestore.Timestamp.fromDate(eightDaysAgo))
        .where('signupDate', '<=', admin.firestore.Timestamp.fromDate(eightDaysAgoEnd))
        .get();
      
      console.log(`📊 Found ${snapshot.size} users who signed up 8 days ago`);
      
      let sentCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const waitlistId = doc.id;
        const email = data.email;
        const name = data.name || email.split('@')[0];
        const referralCode = data.referralCode || 'N/A';
        
        // Check if email was already sent
        if (await wasEmailSent(waitlistId, 'referral_reminder')) {
          console.log(`⏭️ Skipping ${email} - referral reminder email already sent`);
          skippedCount++;
          continue;
        }
        
        try {
          const template = getReferralReminderTemplate(name, referralCode, landingPageUrl);
          await sendEmailViaSendGrid(
            email,
            template.subject,
            template.html,
            template.text,
            'referral_reminder',
            waitlistId
          );
          sentCount++;
        } catch (error) {
          console.error(`❌ Error sending referral reminder email to ${email}:`, error);
          errorCount++;
        }
      }
      
      console.log(`✅ T+8 Referral Reminder Email Job Complete: ${sentCount} sent, ${skippedCount} skipped, ${errorCount} errors`);
      return { sentCount, skippedCount, errorCount };
    } catch (error) {
      console.error('❌ Error in T+8 Referral Reminder Email Job:', error);
      throw error;
    }
  });

/**
 * Scheduled Function: Send Feedback Email (T+7 post-invite)
 * Runs daily at 9:00 AM to send feedback emails to users who got beta access 7 days ago
 */
exports.sendFeedbackEmailsT7 = functions.pubsub.schedule('0 9 * * *')
  .timeZone('Asia/Kuala_Lumpur')
  .onRun(async (context) => {
    console.log('📧 Running T+7 Feedback Email Job (post-invite)...');
    
    const db = admin.firestore();
    const landingPageUrl = functions.config().landing_page?.url || process.env.LANDING_PAGE_URL || 'https://waitlist-foodie-map-23842.web.app';
    
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const sevenDaysAgoEnd = new Date(sevenDaysAgo);
    sevenDaysAgoEnd.setHours(23, 59, 59, 999);
    
    try {
      const waitlistRef = db.collection('waitlist');
      const snapshot = await waitlistRef
        .where('betaAccessGranted', '==', true)
        .where('betaAccessDate', '>=', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
        .where('betaAccessDate', '<=', admin.firestore.Timestamp.fromDate(sevenDaysAgoEnd))
        .get();
      
      console.log(`📊 Found ${snapshot.size} users who got beta access 7 days ago`);
      
      let sentCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const waitlistId = doc.id;
        const email = data.email;
        const name = data.name || email.split('@')[0];
        
        // Check if email was already sent
        if (await wasEmailSent(waitlistId, 'feedback')) {
          console.log(`⏭️ Skipping ${email} - feedback email already sent`);
          skippedCount++;
          continue;
        }
        
        try {
          const template = getFeedbackEmailTemplate(name, landingPageUrl);
          await sendEmailViaSendGrid(
            email,
            template.subject,
            template.html,
            template.text,
            'feedback',
            waitlistId
          );
          sentCount++;
        } catch (error) {
          console.error(`❌ Error sending feedback email to ${email}:`, error);
          errorCount++;
        }
      }
      
      console.log(`✅ T+7 Feedback Email Job Complete: ${sentCount} sent, ${skippedCount} skipped, ${errorCount} errors`);
      return { sentCount, skippedCount, errorCount };
    } catch (error) {
      console.error('❌ Error in T+7 Feedback Email Job:', error);
      throw error;
    }
  });

/**
 * HTTP-triggered test functions for manual testing
 * These can be called via HTTP to test scheduled functions immediately
 */

/**
 * Test Function: Send Survey Emails (T+2)
 * HTTP GET/POST: https://{region}-{project}.cloudfunctions.net/testSendSurveyEmailsT2
 */
exports.testSendSurveyEmailsT2 = functions.https.onRequest(async (req, res) => {
  console.log('🧪 Testing T+2 Survey Email Function...');
  
  try {
    const db = admin.firestore();
    const mainAppUrl = functions.config().main_app?.url || process.env.MAIN_APP_URL || 'https://foodie-map-23842.web.app';
    
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);
    
    const twoDaysAgoEnd = new Date(twoDaysAgo);
    twoDaysAgoEnd.setHours(23, 59, 59, 999);
    
    const waitlistRef = db.collection('waitlist');
    const snapshot = await waitlistRef
      .where('signupDate', '>=', admin.firestore.Timestamp.fromDate(twoDaysAgo))
      .where('signupDate', '<=', admin.firestore.Timestamp.fromDate(twoDaysAgoEnd))
      .get();
    
    console.log(`📊 Found ${snapshot.size} users who signed up 2 days ago`);
    
    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const waitlistId = doc.id;
      const email = data.email;
      const name = data.name || email.split('@')[0];
      
      if (data.surveyCompleted) {
        console.log(`⏭️ Skipping ${email} - survey already completed`);
        skippedCount++;
        continue;
      }
      
      if (await wasEmailSent(waitlistId, 'survey')) {
        console.log(`⏭️ Skipping ${email} - survey email already sent`);
        skippedCount++;
        continue;
      }
      
      try {
        const template = getSurveyEmailTemplate(name, mainAppUrl);
        await sendEmailViaSendGrid(
          email,
          template.subject,
          template.html,
          template.text,
          'survey',
          waitlistId
        );
        sentCount++;
      } catch (error) {
        console.error(`❌ Error sending survey email to ${email}:`, error);
        errorCount++;
      }
    }
    
    const result = { sentCount, skippedCount, errorCount, totalFound: snapshot.size };
    console.log(`✅ Test Complete:`, result);
    
    res.status(200).json({
      success: true,
      message: 'T+2 Survey Email test completed',
      ...result
    });
  } catch (error) {
    console.error('❌ Error in test function:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Test Function: Send Community Emails (T+5)
 */
exports.testSendCommunityEmailsT5 = functions.https.onRequest(async (req, res) => {
  console.log('🧪 Testing T+5 Community Email Function...');
  
  try {
    const db = admin.firestore();
    const landingPageUrl = functions.config().landing_page?.url || process.env.LANDING_PAGE_URL || 'https://waitlist-foodie-map-23842.web.app';
    
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    fiveDaysAgo.setHours(0, 0, 0, 0);
    
    const fiveDaysAgoEnd = new Date(fiveDaysAgo);
    fiveDaysAgoEnd.setHours(23, 59, 59, 999);
    
    const waitlistRef = db.collection('waitlist');
    const snapshot = await waitlistRef
      .where('signupDate', '>=', admin.firestore.Timestamp.fromDate(fiveDaysAgo))
      .where('signupDate', '<=', admin.firestore.Timestamp.fromDate(fiveDaysAgoEnd))
      .get();
    
    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const waitlistId = doc.id;
      const email = data.email;
      const name = data.name || email.split('@')[0];
      
      if (await wasEmailSent(waitlistId, 'community')) {
        skippedCount++;
        continue;
      }
      
      try {
        const template = getCommunityEmailTemplate(name, landingPageUrl);
        await sendEmailViaSendGrid(
          email,
          template.subject,
          template.html,
          template.text,
          'community',
          waitlistId
        );
        sentCount++;
      } catch (error) {
        errorCount++;
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'T+5 Community Email test completed',
      sentCount,
      skippedCount,
      errorCount,
      totalFound: snapshot.size
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Test Function: Send Referral Reminder Emails (T+8)
 */
exports.testSendReferralReminderEmailsT8 = functions.https.onRequest(async (req, res) => {
  console.log('🧪 Testing T+8 Referral Reminder Email Function...');
  
  try {
    const db = admin.firestore();
    const landingPageUrl = functions.config().landing_page?.url || process.env.LANDING_PAGE_URL || 'https://waitlist-foodie-map-23842.web.app';
    
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    eightDaysAgo.setHours(0, 0, 0, 0);
    
    const eightDaysAgoEnd = new Date(eightDaysAgo);
    eightDaysAgoEnd.setHours(23, 59, 59, 999);
    
    const waitlistRef = db.collection('waitlist');
    const snapshot = await waitlistRef
      .where('signupDate', '>=', admin.firestore.Timestamp.fromDate(eightDaysAgo))
      .where('signupDate', '<=', admin.firestore.Timestamp.fromDate(eightDaysAgoEnd))
      .get();
    
    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const waitlistId = doc.id;
      const email = data.email;
      const name = data.name || email.split('@')[0];
      const referralCode = data.referralCode || 'N/A';
      
      if (await wasEmailSent(waitlistId, 'referral_reminder')) {
        skippedCount++;
        continue;
      }
      
      try {
        const template = getReferralReminderTemplate(name, referralCode, landingPageUrl);
        await sendEmailViaSendGrid(
          email,
          template.subject,
          template.html,
          template.text,
          'referral_reminder',
          waitlistId
        );
        sentCount++;
      } catch (error) {
        errorCount++;
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'T+8 Referral Reminder Email test completed',
      sentCount,
      skippedCount,
      errorCount,
      totalFound: snapshot.size
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Test Function: Send Feedback Emails (T+7)
 */
exports.testSendFeedbackEmailsT7 = functions.https.onRequest(async (req, res) => {
  console.log('🧪 Testing T+7 Feedback Email Function...');
  
  try {
    const db = admin.firestore();
    const landingPageUrl = functions.config().landing_page?.url || process.env.LANDING_PAGE_URL || 'https://waitlist-foodie-map-23842.web.app';
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const sevenDaysAgoEnd = new Date(sevenDaysAgo);
    sevenDaysAgoEnd.setHours(23, 59, 59, 999);
    
    const waitlistRef = db.collection('waitlist');
    const snapshot = await waitlistRef
      .where('betaAccessGranted', '==', true)
      .where('betaAccessDate', '>=', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
      .where('betaAccessDate', '<=', admin.firestore.Timestamp.fromDate(sevenDaysAgoEnd))
      .get();
    
    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const waitlistId = doc.id;
      const email = data.email;
      const name = data.name || email.split('@')[0];
      
      if (await wasEmailSent(waitlistId, 'feedback')) {
        skippedCount++;
        continue;
      }
      
      try {
        const template = getFeedbackEmailTemplate(name, landingPageUrl);
        await sendEmailViaSendGrid(
          email,
          template.subject,
          template.html,
          template.text,
          'feedback',
          waitlistId
        );
        sentCount++;
      } catch (error) {
        errorCount++;
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'T+7 Feedback Email test completed',
      sentCount,
      skippedCount,
      errorCount,
      totalFound: snapshot.size
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

