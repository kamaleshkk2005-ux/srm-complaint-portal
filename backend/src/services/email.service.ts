import transporter from '../config/nodemailer';
import logger from '../config/logger';

// Shared styles for all emails
const header = `
  <div style="background-color: #4f46e5; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-family: Arial, sans-serif;">College Complaint System</h1>
  </div>
`;

const footer = `
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; font-family: Arial, sans-serif;">
    <p>This is an automated message, please do not reply to this email.</p>
    <p>&copy; ${new Date().getFullYear()} College Complaint Management System. All rights reserved.</p>
  </div>
`;

const getBaseHtml = (content: string) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="background-color: #f8fafc; padding: 20px; font-family: Arial, sans-serif; line-height: 1.6; color: #334155;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        ${header}
        <div style="padding: 30px;">
          ${content}
        </div>
        ${footer}
      </div>
    </body>
  </html>
`;

export const emailService = {
  /**
   * Send Welcome Email
   */
  sendWelcomeEmail: async (to: string, name: string) => {
    try {
      const content = `
        <h2 style="color: #1e293b; margin-top: 0;">Welcome, ${name}!</h2>
        <p>Your account has been successfully created on the College Complaint Management System.</p>
        <p>You can now log in to submit complaints, track their status, and communicate with the staff regarding any issues you face on campus.</p>
        <a href="${process.env.FRONTEND_URL}/auth/login" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; font-weight: bold;">Login to your account</a>
      `;
      
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject: 'Welcome to College Complaint System',
        html: getBaseHtml(content),
      });
      return true;
    } catch (error) {
      logger.error('Email sending failed:', error);
      return false;
    }
  },

  /**
   * Send Password Reset Email
   */
  sendPasswordResetEmail: async (to: string, name: string, resetUrl: string) => {
    try {
      const content = `
        <h2 style="color: #1e293b; margin-top: 0;">Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
        <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; margin-bottom: 15px; font-weight: bold;">Reset Password</a>
        <p style="font-size: 14px; color: #64748b;">Or copy and paste this URL into your browser:<br/>
        <a href="${resetUrl}" style="color: #4f46e5; word-break: break-all;">${resetUrl}</a></p>
      `;
      
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject: 'Reset Your Password - College Complaint System',
        html: getBaseHtml(content),
      });
      return true;
    } catch (error) {
      logger.error('Email sending failed:', error);
      return false;
    }
  },

  /**
   * Send Complaint Submitted Email (to student)
   */
  sendComplaintSubmittedEmail: async (to: string, name: string, complaintId: string, title: string) => {
    try {
      const content = `
        <h2 style="color: #1e293b; margin-top: 0;">Complaint Submitted Successfully</h2>
        <p>Hi ${name},</p>
        <p>Your complaint has been successfully registered in our system.</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; border-left: 4px solid #4f46e5; margin: 20px 0;">
          <p style="margin: 0 0 5px 0;"><strong>Complaint ID:</strong> ${complaintId}</p>
          <p style="margin: 0;"><strong>Title:</strong> ${title}</p>
        </div>
        <p>You can track the status of your complaint by logging into your dashboard.</p>
        <a href="${process.env.FRONTEND_URL}/student/complaints/${complaintId}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px; font-weight: bold;">Track Complaint</a>
      `;
      
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject: `Complaint Submitted - ${complaintId}`,
        html: getBaseHtml(content),
      });
      return true;
    } catch (error) {
      logger.error('Email sending failed:', error);
      return false;
    }
  },

  /**
   * Send Complaint Assigned Email (to staff)
   */
  sendComplaintAssignedEmail: async (to: string, staffName: string, complaintId: string, title: string) => {
    try {
      const content = `
        <h2 style="color: #1e293b; margin-top: 0;">New Complaint Assigned</h2>
        <p>Dear ${staffName},</p>
        <p>A new complaint has been assigned to you for resolution.</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <p style="margin: 0 0 5px 0;"><strong>Complaint ID:</strong> ${complaintId}</p>
          <p style="margin: 0;"><strong>Title:</strong> ${title}</p>
        </div>
        <p>Please log in to your dashboard to review the details and take necessary action.</p>
        <a href="${process.env.FRONTEND_URL}/staff/complaints/${complaintId}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px; font-weight: bold;">View Complaint</a>
      `;
      
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject: `Action Required: New Complaint Assigned - ${complaintId}`,
        html: getBaseHtml(content),
      });
      return true;
    } catch (error) {
      logger.error('Email sending failed:', error);
      return false;
    }
  },

  /**
   * Send Complaint Status Update Email (to student)
   */
  sendComplaintStatusUpdateEmail: async (to: string, name: string, complaintId: string, title: string, oldStatus: string, newStatus: string) => {
    try {
      const content = `
        <h2 style="color: #1e293b; margin-top: 0;">Complaint Status Updated</h2>
        <p>Hi ${name},</p>
        <p>The status of your complaint has been updated.</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; margin: 20px 0;">
          <p style="margin: 0 0 5px 0;"><strong>Complaint ID:</strong> ${complaintId}</p>
          <p style="margin: 0 0 5px 0;"><strong>Title:</strong> ${title}</p>
          <p style="margin: 0;"><strong>Status:</strong> ${oldStatus} &rarr; <span style="color: #4f46e5; font-weight: bold;">${newStatus}</span></p>
        </div>
        <p>Log in to view more details or any comments added by the staff.</p>
        <a href="${process.env.FRONTEND_URL}/student/complaints/${complaintId}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px; font-weight: bold;">View Details</a>
      `;
      
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject: `Status Update on your Complaint - ${complaintId}`,
        html: getBaseHtml(content),
      });
      return true;
    } catch (error) {
      logger.error('Email sending failed:', error);
      return false;
    }
  },

  /**
   * Send Complaint Resolved Email (to student)
   */
  sendComplaintResolvedEmail: async (to: string, name: string, complaintId: string, title: string) => {
    try {
      const content = `
        <h2 style="color: #1e293b; margin-top: 0;">Complaint Resolved</h2>
        <p>Hi ${name},</p>
        <p>Good news! Your complaint has been marked as <strong>RESOLVED</strong> by the assigned staff.</p>
        <div style="background-color: #ecfdf5; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981; margin: 20px 0;">
          <p style="margin: 0 0 5px 0;"><strong>Complaint ID:</strong> ${complaintId}</p>
          <p style="margin: 0;"><strong>Title:</strong> ${title}</p>
        </div>
        <p>Please review the resolution. If you are not satisfied, you can contact the administration or submit a follow-up complaint.</p>
        <a href="${process.env.FRONTEND_URL}/student/complaints/${complaintId}" style="display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px; font-weight: bold;">View Resolution</a>
      `;
      
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject: `Resolved: Your Complaint - ${complaintId}`,
        html: getBaseHtml(content),
      });
      return true;
    } catch (error) {
      logger.error('Email sending failed:', error);
      return false;
    }
  }
};
