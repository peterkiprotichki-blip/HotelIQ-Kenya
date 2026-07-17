import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4400';
    const verifyLink = `${frontendUrl}/login?verify=${token}`;

    await this.transporter.sendMail({
      from: `"SmartSeason" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Verify your SmartSeason account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #f8fafc; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 50px; height: 50px; background-color: #059669; border-radius: 12px; line-height: 50px; color: white; font-size: 22px;">🏠</div>
            <h1 style="color: #1e293b; margin-top: 12px; font-size: 24px;">SmartSeason</h1>
          </div>
          <div style="background: white; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-top: 0;">Welcome, ${name}!</h2>
            <p style="color: #475569; line-height: 1.6;">Thank you for signing up for SmartSeason. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyLink}" style="display: inline-block; padding: 12px 32px; background-color: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Verify Email</a>
            </div>
            <p style="color: #475569; line-height: 1.6; font-size: 13px;">After verification, an administrator will review and approve your account. You'll be notified once your account is activated.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 12px;">If you didn't create this account, you can safely ignore this email.</p>
          </div>
          <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">&copy; ${new Date().getFullYear()} SmartSeason. All rights reserved.</p>
        </div>
      `,
    });
  }

  async sendApprovalNotification(to: string, name: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4400';

    await this.transporter.sendMail({
      from: `"SmartSeason" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Your SmartSeason account has been approved!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #f8fafc; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 50px; height: 50px; background-color: #059669; border-radius: 12px; line-height: 50px; color: white; font-size: 22px;">🏠</div>
            <h1 style="color: #1e293b; margin-top: 12px; font-size: 24px;">SmartSeason</h1>
          </div>
          <div style="background: white; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-top: 0;">Good news, ${name}!</h2>
            <p style="color: #475569; line-height: 1.6;">Your SmartSeason account has been approved. You can now sign in and start managing fields.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/login" style="display: inline-block; padding: 12px 32px; background-color: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Sign In Now</a>
            </div>
          </div>
          <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">&copy; ${new Date().getFullYear()} SmartSeason. All rights reserved.</p>
        </div>
      `,
    });
  }

  async sendNewUserNotificationToAdmin(adminEmail: string, newUserName: string, newUserEmail: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4400';

    await this.transporter.sendMail({
      from: `\"SmartSeason\" <${process.env.SMTP_USER}>`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #f8fafc; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 50px; height: 50px; background-color: #059669; border-radius: 12px; line-height: 50px; color: white; font-size: 22px;">🏠</div>
            <h1 style=\"color: #1e293b; margin-top: 12px; font-size: 24px;\">SmartSeason</h1>
          </div>
          <div style="background: white; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-top: 0;">New User Signup</h2>
            <p style="color: #475569; line-height: 1.6;">A new user has signed up and is awaiting your approval:</p>
            <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 4px 0; color: #334155;"><strong>Name:</strong> ${newUserName}</p>
              <p style="margin: 4px 0; color: #334155;"><strong>Email:</strong> ${newUserEmail}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/users" style="display: inline-block; padding: 12px 32px; background-color: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Review Users</a>
            </div>
          </div>
          <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">&copy; ${new Date().getFullYear()} SmartSeason. All rights reserved.</p>
        </div>
      `,
    });
  }

  async sendInvitationEmail(to: string, name: string, organizationName: string, tempPassword?: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4400';
    const loginLink = `${frontendUrl}/login`;

    const passwordSection = tempPassword
      ? `
        <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0; color: #334155;"><strong>Your temporary password:</strong> ${tempPassword}</p>
          <p style="margin: 4px 0; color: #64748b; font-size: 13px;">Please change your password after your first login.</p>
        </div>
      `
      : `
        <p style="color: #475569; line-height: 1.6;">You can sign in using <strong>Google</strong> with this email address, or use the "Sign Up" option to create a password.</p>
      `;

    await this.transporter.sendMail({
      from: `"SmartSeason" <${process.env.SMTP_USER}>`,
      to,
      subject: `You've been invited to ${organizationName} on SmartSeason`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #f8fafc; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 50px; height: 50px; background-color: #059669; border-radius: 12px; line-height: 50px; color: white; font-size: 22px;">🏠</div>
            <h1 style="color: #1e293b; margin-top: 12px; font-size: 24px;">SmartSeason</h1>
          </div>
          <div style="background: white; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-top: 0;">Welcome, ${name}!</h2>
            <p style="color: #475569; line-height: 1.6;">You've been invited to join <strong>${organizationName}</strong> on SmartSeason.</p>
            ${passwordSection}
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginLink}" style="display: inline-block; padding: 12px 32px; background-color: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Sign In Now</a>
            </div>
          </div>
          <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">&copy; ${new Date().getFullYear()} SmartSeason. All rights reserved.</p>
        </div>
      `,
    });
  }
}
