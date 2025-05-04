import nodemailer from 'nodemailer';

// Configure transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"LaunchPad" <noreply@launchpad.com>',
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

// Email Templates
export function startupCreationTemplate(startupName: string, startupSlug: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Startup Created: ${startupName}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #7c3aed;
          margin-bottom: 5px;
        }
        .content {
          padding: 20px 0;
        }
        .footer {
          text-align: center;
          padding: 20px 0;
          color: #888;
          font-size: 12px;
          border-top: 1px solid #f0f0f0;
        }
        .button {
          display: inline-block;
          background-color: #7c3aed;
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 4px;
          margin-top: 15px;
        }
        .startup-info {
          background-color: #f5f3ff;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">LaunchPad</div>
          <p>Startup Directory Platform</p>
        </div>
        <div class="content">
          <h2>New Startup Created</h2>
          <p>A new startup has been added to the platform and is awaiting approval.</p>
          
          <div class="startup-info">
            <p><strong>Startup Name:</strong> ${startupName}</p>
            <p><strong>Status:</strong> Pending Approval</p>
          </div>
          
          <p>Please review this startup at your earliest convenience.</p>
          
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://launchpad.com'}/admin/moderation" class="button">
            Review Startup
          </a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} LaunchPad. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
} 