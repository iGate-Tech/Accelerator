import nodemailer from "nodemailer";
import config from "../config.js";

/**
 * Email service for sending notifications and transactional emails
 */

// Create transporter based on provider
function createTransporter() {
  switch (config.email.provider) {
    case "sendgrid":
      return nodemailer.createTransporter({
        host: "smtp.sendgrid.net",
        port: 587,
        secure: false,
        auth: {
          user: "apikey",
          pass: config.email.sendgrid.apiKey,
        },
      });

    case "mailgun":
      return nodemailer.createTransporter({
        host: `smtp.mailgun.org`,
        port: 587,
        secure: false,
        auth: {
          user: `postmaster@${config.email.mailgun.domain}`,
          pass: config.email.mailgun.apiKey,
        },
      });

    case "smtp":
    default:
      return nodemailer.createTransporter({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: {
          user: config.email.smtp.user,
          pass: config.email.smtp.pass,
        },
      });
  }
}

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export async function sendEmail({ to, subject, html, text }) {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${config.email.fromName}" <${config.email.from}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);

    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
}

/**
 * Send welcome email to new user
 * @param {string} email - User email
 * @param {string} firstName - User first name
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export async function sendWelcomeEmail(email, firstName) {
  const subject = "Welcome to Accelerator AI!";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Welcome to Accelerator AI, ${firstName}!</h1>
      <p>Thank you for joining our platform. We're excited to help you turn your ideas into successful businesses.</p>

      <h2 style="color: #2563eb;">Getting Started</h2>
      <ul>
        <li><strong>Create your first idea:</strong> Start by describing your business concept</li>
        <li><strong>Build your business model:</strong> Use our AI-powered tools to develop comprehensive business plans</li>
        <li><strong>Generate reports:</strong> Create professional pitch decks and financial projections</li>
        <li><strong>Connect with the community:</strong> Get feedback and collaborate with other entrepreneurs</li>
      </ul>

      <p>You have <strong>1000 credits</strong> to get started. Use them to generate content, create reports, and explore all our features.</p>

      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Quick Links</h3>
        <p><a href="${process.env.APP_URL || "http://localhost:4000"}/dashboard" style="color: #2563eb;">Go to Dashboard</a></p>
        <p><a href="${process.env.APP_URL || "http://localhost:4000"}/ideas/new" style="color: #2563eb;">Create Your First Idea</a></p>
        <p><a href="${process.env.APP_URL || "http://localhost:4000"}/settings" style="color: #2563eb;">Update Your Profile</a></p>
      </div>

      <p>If you have any questions, feel free to reach out to our support team.</p>

      <p>Happy building!<br>The Accelerator AI Team</p>
    </div>
  `;

  return await sendEmail({ to: email, subject, html });
}

/**
 * Send password reset notification
 * @param {string} email - User email
 * @param {string} resetLink - Password reset link
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export async function sendPasswordResetEmail(email, resetLink) {
  const subject = "Reset Your Accelerator AI Password";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Password Reset Request</h1>
      <p>We received a request to reset your password for your Accelerator AI account.</p>

      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <a href="${resetLink}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
      </div>

      <p>This link will expire in 1 hour for security reasons.</p>
      <p>If you didn't request this password reset, please ignore this email.</p>

      <p>Best regards,<br>The Accelerator AI Team</p>
    </div>
  `;

  return await sendEmail({ to: email, subject, html });
}

/**
 * Send report generation notification
 * @param {string} email - User email
 * @param {string} firstName - User first name
 * @param {Object} reportInfo - Report information
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export async function sendReportGeneratedEmail(email, firstName, reportInfo) {
  const reportTypeDisplay = reportInfo.type
    .replace("-", " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
  const subject = `Your ${reportTypeDisplay} is Ready!`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Your Report is Ready, ${firstName}!</h1>
      <p>Your ${reportTypeDisplay.toLowerCase()} for "${reportInfo.ideaTitle}" has been successfully generated.</p>

      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Report Details</h3>
        <p><strong>Type:</strong> ${reportTypeDisplay}</p>
        <p><strong>Project:</strong> ${reportInfo.ideaTitle}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Credits Used:</strong> ${reportInfo.creditsUsed}</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.APP_URL || "http://localhost:4000"}/reports/view/${reportInfo.reportId}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 0 10px 10px 0;">
          View Report
        </a>
        <a href="${process.env.APP_URL || "http://localhost:4000"}/api/reports/${reportInfo.reportId}/download" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Download PDF
        </a>
      </div>

      <p>You can access all your reports from your <a href="${process.env.APP_URL || "http://localhost:4000"}/dashboard" style="color: #2563eb;">dashboard</a>.</p>

      <p>Best regards,<br>The Accelerator AI Team</p>
    </div>
  `;

  return await sendEmail({ to: email, subject, html });
}

/**
 * Send credit purchase confirmation
 * @param {string} email - User email
 * @param {string} firstName - User first name
 * @param {Object} purchaseInfo - Purchase information
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export async function sendCreditPurchaseEmail(email, firstName, purchaseInfo) {
  const subject = "Credit Purchase Confirmation";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Credit Purchase Confirmed, ${firstName}!</h1>
      <p>Thank you for your purchase. Your credits have been added to your account.</p>

      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Purchase Details</h3>
        <p><strong>Credits Purchased:</strong> ${purchaseInfo.credits}</p>
        <p><strong>Amount Paid:</strong> $${purchaseInfo.amount}</p>
        <p><strong>New Balance:</strong> ${purchaseInfo.newBalance} credits</p>
        <p><strong>Transaction ID:</strong> ${purchaseInfo.transactionId}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>

      <p>You can now use these credits to generate AI content, create reports, and access premium features.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.APP_URL || "http://localhost:4000"}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Start Using Credits
        </a>
      </div>

      <p>If you have any questions about your purchase, please contact our support team.</p>

      <p>Best regards,<br>The Accelerator AI Team</p>
    </div>
  `;

  return await sendEmail({ to: email, subject, html });
}

/**
 * Send package upgrade confirmation
 * @param {string} email - User email
 * @param {string} firstName - User first name
 * @param {Object} upgradeInfo - Upgrade information
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export async function sendPackageUpgradeEmail(email, firstName, upgradeInfo) {
  const subject = `Welcome to ${upgradeInfo.packageName}!`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Welcome to ${upgradeInfo.packageName}, ${firstName}!</h1>
      <p>Thank you for upgrading your Accelerator AI account. You now have access to premium features and enhanced capabilities.</p>

      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Your New Benefits</h3>
        <p><strong>Package:</strong> ${upgradeInfo.packageName}</p>
        <p><strong>Monthly Credits:</strong> ${upgradeInfo.monthlyCredits}</p>
        <p><strong>Bonus Credits:</strong> ${upgradeInfo.bonusCredits}</p>
        <p><strong>Valid Until:</strong> ${new Date(upgradeInfo.expiresAt).toLocaleDateString()}</p>
      </div>

      <h3>New Features Unlocked:</h3>
      <ul>
        <li>Advanced AI models for higher quality content</li>
        <li>Priority support and faster response times</li>
        <li>Export reports in multiple formats</li>
        <li>Team collaboration features</li>
        <li>Advanced analytics and insights</li>
      </ul>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.APP_URL || "http://localhost:4000"}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Explore New Features
        </a>
      </div>

      <p>Welcome to the next level of business planning!</p>

      <p>Best regards,<br>The Accelerator AI Team</p>
    </div>
  `;

  return await sendEmail({ to: email, subject, html });
}

/**
 * Send notification about idea validation threshold met
 * @param {string} email - User email
 * @param {string} firstName - User first name
 * @param {Object} ideaInfo - Idea information
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export async function sendIdeaValidatedEmail(email, firstName, ideaInfo) {
  const subject = `Congratulations! "${ideaInfo.title}" is Ready for Reports`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">🎉 Your Idea is Validated, ${firstName}!</h1>
      <p>Congratulations! Your idea "${ideaInfo.title}" has reached the validation threshold and is now eligible for professional reports.</p>

      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">What's Next?</h3>
        <p>You can now generate comprehensive reports including:</p>
        <ul>
          <li><strong>Business Plans</strong> - Complete business strategy documents</li>
          <li><strong>Pitch Decks</strong> - Investor-ready presentation materials</li>
          <li><strong>Valuation Reports</strong> - Professional financial assessments</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.APP_URL || "http://localhost:4000"}/reports/business-plan" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 0 10px 10px 0;">
          Create Business Plan
        </a>
        <a href="${process.env.APP_URL || "http://localhost:4000"}/reports/pitch-deck" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Build Pitch Deck
        </a>
      </div>

      <p>Keep up the great work!</p>

      <p>Best regards,<br>The Accelerator AI Team</p>
    </div>
  `;

  return await sendEmail({ to: email, subject, html });
}
