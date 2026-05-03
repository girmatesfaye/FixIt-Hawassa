import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/#/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.FROM_EMAIL || '"FixIt Hawassa" <noreply@fixit-hawassa.com>',
    to: email,
    subject: "Password Reset Request - FixIt Hawassa",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #609966;">Password Reset Request</h2>
        <p>You requested a password reset for your FixIt Hawassa account.</p>
        <p>Please click the button below to set a new password. This link is valid for 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #609966; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 FixIt Hawassa. All rights reserved.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send reset password email:", error);
    throw new Error("Could not send recovery email. Please try again later.");
  }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  const mailOptions = {
    from: process.env.FROM_EMAIL || '"FixIt Hawassa" <noreply@fixit-hawassa.com>',
    to: email,
    subject: "Welcome to FixIt Hawassa!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #609966;">Welcome, ${name}!</h2>
        <p>Thank you for joining the FixIt Hawassa community. We're excited to help you find the best local professionals or grow your professional business.</p>
        <p>Log in to your dashboard to get started.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}" style="background-color: #609966; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Dashboard</a>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 FixIt Hawassa. All rights reserved.</p>
      </div>
    `,
  };
  try { await transporter.sendMail(mailOptions); } catch (e) { console.error("Welcome email failed", e); }
};

export const sendNewRequestEmail = async (workerEmail: string, workerName: string, category: string, area: string) => {
  const mailOptions = {
    from: process.env.FROM_EMAIL || '"FixIt Hawassa" <noreply@fixit-hawassa.com>',
    to: workerEmail,
    subject: "New Job Request! - FixIt Hawassa",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #609966;">New Request for ${category}</h2>
        <p>Hello ${workerName}, a client has requested your services in **${area}**.</p>
        <p>Log in to your Worker Hub to accept or decline the request.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/#/worker-hub" style="background-color: #609966; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Request</a>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 FixIt Hawassa. All rights reserved.</p>
      </div>
    `,
  };
  try { await transporter.sendMail(mailOptions); } catch (e) { console.error("New request email failed", e); }
};

export const sendBookingAcceptedEmail = async (clientEmail: string, clientName: string, workerName: string) => {
  const mailOptions = {
    from: process.env.FROM_EMAIL || '"FixIt Hawassa" <noreply@fixit-hawassa.com>',
    to: clientEmail,
    subject: "Booking Accepted! - FixIt Hawassa",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #609966;">Great News, ${clientName}!</h2>
        <p>**${workerName}** has accepted your job request.</p>
        <p>You can now start chatting with them to finalize the details.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/#/bookings" style="background-color: #609966; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Booking</a>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center;">&copy; 2026 FixIt Hawassa. All rights reserved.</p>
      </div>
    `,
  };
  try { await transporter.sendMail(mailOptions); } catch (e) { console.error("Booking accepted email failed", e); }
};
