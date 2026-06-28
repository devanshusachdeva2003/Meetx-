const User = require('./user.model');
const Otp = require('./otp.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { waitUntil } = require('@vercel/functions');
const { OAuth2Client } = require('google-auth-library');

const getGoogleClient = () => {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const rawUser = typeof userDoc.toObject === 'function' ? userDoc.toObject() : { ...userDoc };
  return {
    id: rawUser._id,
    name: rawUser.name,
    email: rawUser.email,
    phone: rawUser.phone,
    avatar: rawUser.avatar,
    requiresTwoFactorAuth: rawUser.requiresTwoFactorAuth || false,
    hasPassword: !!rawUser.passwordHash
  };
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
  
  // Hash the OTP securely
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(otp, salt);
  
  await Otp.deleteMany({ email }); // Clear existing
  await Otp.create({ email, otpHash, expiresAt });
  
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

  return sanitizeUser(user);
};

const verifyOTP = async (email, otp) => {
  // Find the latest OTP record for this email
  const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });
  
  if (!otpRecord) {
    throw new Error('Invalid OTP');
  }

  if (otpRecord.expiresAt < new Date()) {
    await Otp.deleteMany({ email }); // Cleanup expired OTPs
    throw new Error('OTP has expired');
  }

  // Securely verify the hash
  const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);
  if (!isMatch) {
    throw new Error('Invalid OTP');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }

  user.isOtpVerified = true;
  await user.save();
  await Otp.deleteMany({ email }); // cleanup

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
  return { user: sanitizeUser(user), token };
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.passwordHash) {
    if (user.googleId) {
      throw new Error('This account was created with Google. Please log in with Google.');
    }
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  // Force OTP if they haven't verified their email yet OR if they explicitly enabled 2FA
  if (!user.isOtpVerified || user.requiresTwoFactorAuth) {
    waitUntil(
      createAndSendOTP(email).catch(err => console.error("OTP/email error", err))
    );
    return { requireOtp: true, user: sanitizeUser(user) };
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
  return { token, user: sanitizeUser(user) };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User with this email does not exist');
  }

  waitUntil(
    createAndSendOTP(email).catch(err => console.error("OTP/email error", err))
  );

  return true;
};

const resetPassword = async (email, otp, newPassword) => {
  const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });
  
  if (!otpRecord) {
    throw new Error('Invalid OTP');
  }

  if (otpRecord.expiresAt < new Date()) {
    await Otp.deleteMany({ email });
    throw new Error('OTP has expired');
  }

  const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);
  if (!isMatch) {
    throw new Error('Invalid OTP');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  await user.save();
  await Otp.deleteMany({ email });

  return true;
};

const getUserById = async (id) => {
  const user = await User.findById(id);
  return sanitizeUser(user);
};

const updateUserById = async (id, data) => {
  // Only allow updating specific fields
  const updates = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.requiresTwoFactorAuth !== undefined) updates.requiresTwoFactorAuth = data.requiresTwoFactorAuth;
  
  const user = await User.findByIdAndUpdate(id, updates, { new: true });
  if (!user) {
    throw new Error('User not found');
  }
  return sanitizeUser(user);
};

const updateUserAvatar = async (id, avatarUrl) => {
  const user = await User.findByIdAndUpdate(id, { avatar: avatarUrl }, { new: true });
  if (!user) {
    throw new Error('User not found');
  }
  return sanitizeUser(user);
};

const changePassword = async (id, currentPassword, newPassword) => {
  const user = await User.findById(id);
  if (!user) {
    throw new Error('User not found');
  }
  
  if (!user.passwordHash) {
    throw new Error('No password set for this account. Please use Set Password instead.');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid current password');
  }
  
  const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])\S{8,}$/;
  if (!passwordComplexityRegex.test(newPassword)) {
    throw new Error('Password must be at least 8 characters long and contain at least one uppercase, lowercase, number, and special character.');
  }

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  await user.save();
  return true;
};

const requestSetPasswordOtp = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');
  if (user.passwordHash) throw new Error('Password already set');
  
  await createAndSendOTP(user.email);
  return true;
};

const setPassword = async (id, otp, newPassword) => {
  const user = await User.findById(id);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.passwordHash) {
    throw new Error('Password already set. Please use Change Password instead.');
  }
  
  // Verify OTP
  const otpRecord = await Otp.findOne({ email: user.email }).sort({ createdAt: -1 });
  if (!otpRecord) throw new Error('Invalid OTP');
  if (otpRecord.expiresAt < new Date()) {
    await Otp.deleteMany({ email: user.email });
    throw new Error('OTP has expired');
  }
  
  const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);
  if (!isMatch) throw new Error('Invalid OTP');

  const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])\S{8,}$/;
  if (!passwordComplexityRegex.test(newPassword)) {
    throw new Error('Password must be at least 8 characters long and contain at least one uppercase, lowercase, number, and special character.');
  }

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  await user.save();
  await Otp.deleteMany({ email: user.email }); // Cleanup OTP

  return true;
};

const generateGoogleAuthUrl = () => {
  const client = getGoogleClient();
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email']
  });
  return url;
};

const verifyGoogleTokenAndLogin = async (code) => {
  const client = getGoogleClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  
  const payload = ticket.getPayload();
  const { sub: googleId, email, name, picture: avatar, email_verified } = payload;
  
  let user = await User.findOne({ email });
  if (user) {
    // Always sync googleId and mark email as verified for Google users.
    // Google has already verified the email — OTP bypass is safe.
    let changed = false;
    if (!user.googleId) { user.googleId = googleId; changed = true; }
    if (!user.avatar && avatar) { user.avatar = avatar; changed = true; }
    if (!user.isOtpVerified) { user.isOtpVerified = true; changed = true; }
    if (changed) await user.save();
  } else {
    user = await User.create({
      name,
      email,
      googleId,
      avatar,
      isOtpVerified: true,
    });
  }

  // Bypass OTP verification completely for Google login, even if requiresTwoFactorAuth is true
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
  return { token, user: sanitizeUser(user) };
};

module.exports = {
  registerUser,
  loginUser,
  verifyOTP,
  createAndSendOTP,
  forgotPassword,
  resetPassword,
  getUserById,
  updateUserById,
  updateUserAvatar,
  generateGoogleAuthUrl,
  verifyGoogleTokenAndLogin,
  changePassword,
  requestSetPasswordOtp,
  setPassword
};

