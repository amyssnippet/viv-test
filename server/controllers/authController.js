const nodemailer = require("nodemailer");
const { Otp, User } = require("../models/psqlSchema");
require("dotenv").config();
const jwt = require("jsonwebtoken")

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
};

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Store OTP in database
    await Otp.create({
      otp,
      otpExpiry,
      email,
      UserId: user.id, // Associate with user
    });

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

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Find the OTP record
    const otpRecord = await Otp.findOne({ where: { email, otp } });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid OTP or email" });
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.otpExpiry) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // OTP verified, clean up the record
    await otpRecord.destroy();
    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};

exports.socialAuth = async (req, res) => {
  try {
    const { provider, providerId, name, email, profile } = req.body;

    if (!provider || !providerId || !email) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let user = await User.findOne({ where: { email, provider } });

    if (!user) {
      user = await User.create({
        fullName: name,
        email,
        profile: profile || 'https://avatars.githubusercontent.com/u/135108994?v=4',
        provider,
        providerId,
        count: 4000,
        isDeveloper: false
      });
    }

    const token = jwt.sign({ userId: user.id }, "your-secret-key", {
      expiresIn: "30d"
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Social Auth Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const axios = require('axios');
const qs = require('querystring');
const fs = require('fs');
const privateKey = fs.readFileSync('./Authkey.p8', 'utf8');

const team_id = 'YOUR_TEAM_ID';
const client_id = 'com.cosinv.auth';
const key_id = 'G5H3YNL8PS';
const redirect_uri = 'http://localhost:3000/apple/callback'; // Match exactly with frontend

exports.appleCallback = async (req, res) => {
  try {
    const { code } = req.query; // from Apple redirect

    const clientSecret = jwt.sign({}, privateKey, {
      algorithm: 'ES256',
      expiresIn: '24h',
      issuer: team_id,
      audience: 'https://appleid.apple.com',
      subject: client_id,
      keyid: key_id
    });

    const response = await axios.post('https://appleid.apple.com/auth/token', qs.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri,
      client_id,
      client_secret: clientSecret
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { id_token } = response.data;
    const appleUser = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64').toString());

    // Create or find the user
    const [user, created] = await User.findOrCreate({
      where: { provider: 'apple', providerId: appleUser.sub },
      defaults: {
        email: appleUser.email,
        fullName: appleUser.name || "Apple User",
        profile: "",
        provider: "apple",
        providerId: appleUser.sub
      }
    });

    // Generate your app's JWT or session
    const appToken = jwt.sign({ userId: user.id }, 'your_app_secret', { expiresIn: '7d' });

    // Redirect back to frontend with your app token (or store in cookie)
    res.redirect(`http://localhost:5173/login/success?token=${appToken}`);
  } catch (error) {
    console.error("Apple login error:", error);
    res.status(500).json({ error: "Apple Auth Failed", details: error.message });
  }
};
