const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config();

// In-memory storage for demo. Use DB in production.
const users = {}; // Format: { [email]: { otp, otpExpiry } }

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
};

const transporter = nodemailer.createTransport({
  service: "Gmail", // or use SendGrid, Mailgun, etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendOTP = async (req, res) => {
  const { email } = req.body;
  const otp = generateOTP();
  const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 min

  // Store in "DB"
  users[email] = { otp, otpExpiry };

  const mailOptions = {
    from: `"${process.env.COMPANY_NAME || 'Cosinv AI LLP'}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your One-Time Password (OTP) for Email Verification",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Dear User,</p>
        <p>Thank you for signing up with ${process.env.COMPANY_NAME || 'Cosinv AI LLP'}. Please use the following One-Time Password (OTP) to verify your email address:</p>
        <p style="font-size: 24px; font-weight: bold; color: #2d2d2d; text-align: center; margin: 20px 0;">${otp}</p>
        <p>This code is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
        <p>Best regards,<br>${process.env.COMPANY_NAME || 'Cosinv AI LLP'}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

exports.verifyOTP = (req, res) => {
  const { email, otp } = req.body;
  const user = users[email];

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  if (Date.now() > user.otpExpiry) {
    return res.status(400).json({ message: "OTP expired" });
  }

  if (user.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // OTP verified
  delete users[email]; // Clean up
  res.status(200).json({ message: "Email verified successfully" });
};
