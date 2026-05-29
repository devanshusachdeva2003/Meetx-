const User = require('../../models/User');
const Otp = require('../../models/Otp');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { waitUntil } = require('@vercel/functions');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp) => {
  // If SMTP is not configured, just log to console as a mock
  if (!process.env.SMTP_HOST) {
    console.log(`\n================================`);
    console.log(`MOCK EMAIL SENT TO: ${email}`);
    console.log(`YOUR OTP IS: ${otp}`);
    console.log(`================================\n`);
    return true;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@meetx.com',
    to: email,
    subject: 'Meetx - Your OTP Verification Code',
    text: `Your OTP for Meetx is: ${otp}. It is valid for 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);
  return true;
};

const createAndSendOTP = async (email) => {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  await Otp.deleteMany({ email }); // Clear existing
  await Otp.create({ email, otp, expiresAt });
  
  await sendOTPEmail(email, otp);
};

const registerUser = async (name, email, password) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    passwordHash,
    isOtpVerified: false
  });

  waitUntil(
    createAndSendOTP(email).catch(err => console.error("OTP/email error", err))
  );

  return user;
};

const verifyOTP = async (email, otp) => {
  const otpRecord = await Otp.findOne({ email, otp });
  
  if (!otpRecord) {
    throw new Error('Invalid OTP');
  }

  if (otpRecord.expiresAt < new Date()) {
    await Otp.deleteMany({ email }); // Cleanup expired OTPs
    throw new Error('OTP has expired');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }

  user.isOtpVerified = true;
  await user.save();
  await Otp.deleteMany({ email }); // cleanup

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
  return { user, token };
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  if (!user.isOtpVerified) {
    waitUntil(
      createAndSendOTP(email).catch(err => console.error("OTP/email error", err))
    );
    return { requireOtp: true, user };
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
  return { token, user };
};

const getUserById = async (id) => {
  return await User.findById(id).select('-passwordHash');
};

module.exports = {
  registerUser,
  verifyOTP,
  loginUser,
  getUserById,
  createAndSendOTP
};
