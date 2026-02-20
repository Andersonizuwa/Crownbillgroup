import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Debug logging
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? '[REDACTED]' : 'undefined');

    // Configure transporter - you can replace with your email service credentials
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `"CrownBillGroup" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      // Don't throw error to prevent breaking the flow
      // In production, you might want to log this to a monitoring service
    }
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px 30px; text-align: center; background-color: #0ea5e9;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">CrownBillGroup</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
                    <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                      We received a request to reset your password. Click the button below to create a new password.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${resetLink}" 
                             style="display: inline-block; padding: 12px 30px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color: #666; line-height: 1.6; margin-top: 30px; font-size: 14px;">
                      This link will expire in 15 minutes. If you didn't request this reset, you can safely ignore this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px; text-align: center;">
                      © 2026 CrownBillGroup. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `
      Password Reset Request
      
      We received a request to reset your password. Use the link below to create a new password:
      
      ${resetLink}
      
      This link will expire in 15 minutes. If you didn't request this reset, you can safely ignore this email.
      
      © 2026 CrownBillGroup. All rights reserved.
    `;

    await this.sendEmail({
      to: email,
      subject: 'Reset your CrownBillGroup password',
      html,
      text,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px 30px; text-align: center; background-color: #0ea5e9;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">CrownBillGroup</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #333; margin-top: 0;">Welcome to CrownBillGroup!</h2>
                    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                      Hi ${name},
                    </p>
                    <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                      Thank you for joining CrownBillGroup. You can now start exploring our platform and managing your investments.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${process.env.FRONTEND_URL || 'https://yourdomain.com'}/login" 
                             style="display: inline-block; padding: 12px 30px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Get Started
                          </a>
                        </td>
                      </tr>
                    </table>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px; text-align: center;">
                      © 2026 CrownBillGroup. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to CrownBillGroup!',
      html,
    });
  }

  async sendAlgoAccessGrantedEmail(options: {
    email: string;
    name: string;
    planName: string;
    returnPercentage: number;
    durationDays: number;
  }): Promise<void> {
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Allocation Profile Ready</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0b1120;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b1120; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: radial-gradient(circle at top, #0ea5e9 0, #020617 55%, #000 100%); border-radius: 16px; box-shadow: 0 20px 45px rgba(15,23,42,0.7); overflow: hidden;">
                <tr>
                  <td style="padding: 32px 32px 16px; text-align: center;">
                    <h1 style="color: #e5e7eb; margin: 0; font-size: 26px; letter-spacing: 0.08em; text-transform: uppercase;">CrownBill</h1>
                    <p style="color: #9ca3af; margin: 8px 0 0; font-size: 13px;">Proprietary Algorithm Access</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 32px 32px;">
                    <div style="background: rgba(15,23,42,0.85); border-radius: 12px; padding: 24px; border: 1px solid rgba(148,163,184,0.25);">
                      <p style="color: #e5e7eb; margin: 0 0 16px; font-size: 15px;">
                        Hi ${options.name || 'Investor'},
                      </p>
                      <p style="color: #9ca3af; margin: 0 0 16px; font-size: 14px; line-height: 1.6;">
                        Your <strong style="color:#e5e7eb;">CrownBill Proprietary Algorithm</strong> profile has been reviewed and your
                        personalized allocation tier is now live.
                      </p>
                      <div style="margin: 18px 0; padding: 16px 18px; border-radius: 10px; background: rgba(15,118,110,0.15); border: 1px solid rgba(45,212,191,0.4);">
                        <p style="color: #a5b4fc; margin: 0 0 6px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;">
                          Assigned Tier
                        </p>
                        <p style="color: #e5e7eb; margin: 0 0 4px; font-size: 15px; font-weight: 600;">
                          ${options.planName}
                        </p>
                        <p style="color: #9ca3af; margin: 0; font-size: 13px;">
                          Target return: <strong style="color:#e5e7eb;">${options.returnPercentage}%</strong> · Term: <strong style="color:#e5e7eb;">${options.durationDays} days</strong>
                        </p>
                      </div>
                      <p style="color: #9ca3af; margin: 0 0 24px; font-size: 13px; line-height: 1.6;">
                        You can now log in to your CrownBill dashboard to view this tier and allocate capital according
                        to your profile.
                      </p>
                      <div style="text-align: center; margin-bottom: 16px;">
                        <a href="${appUrl}/proprietary-algorithm"
                           style="display: inline-block; padding: 11px 26px; background: linear-gradient(90deg,#0ea5e9,#22c55e); color: #020617; text-decoration: none; border-radius: 999px; font-weight: 700; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;">
                          View My Allocation Profile
                        </a>
                      </div>
                      <p style="color: #6b7280; margin: 0; font-size: 11px; text-align: center;">
                        For security, we will never ask you to share your password or wallet keys over email.
                      </p>
                    </div>
                    <p style="color: #4b5563; margin: 18px 0 0; font-size: 11px; text-align: center;">
                      © 2026 CrownBillGroup. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `
Your CrownBill proprietary algorithm profile has been approved.

Assigned tier: ${options.planName}
Target return: ${options.returnPercentage}%
Term: ${options.durationDays} days

You can now log in to your dashboard to view and allocate into this tier:
${appUrl}/proprietary-algorithm

© 2026 CrownBillGroup. All rights reserved.
    `;

    await this.sendEmail({
      to: options.email,
      subject: 'Your CrownBill allocation profile is ready',
      html,
      text,
    });
  }

  async sendAdminNotification(subject: string, message: string, details?: any): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@crownbill.com';

    let detailsHtml = '';
    if (details) {
      detailsHtml = `
        <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #334155; font-size: 16px;">Details:</h3>
          <pre style="white-space: pre-wrap; word-break: break-all; color: #475569; font-size: 14px;">${JSON.stringify(details, null, 2)}</pre>
        </div>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Admin Notification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0ea5e9; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px;">Admin Alert</h2>
          <p style="font-size: 16px; font-weight: bold;">${subject}</p>
          <p>${message}</p>
          ${detailsHtml}
          <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
            This is an automated administrative notification from CrownBillGroup.
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: adminEmail,
      subject: `[ADMIN ALERT] ${subject}`,
      html,
    });
  }
}

export default new EmailService();