const authService = require('./auth.service');
const { sendSuccess, sendError } = require('../../utils/responseHandler');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      console.warn('Register validation failed', { hasName: !!name, hasEmail: !!email, hasPassword: !!password });
      return sendError(res, 400, 'Please provide all required fields');
    }

    const user = await authService.registerUser(name, email, password);
    return sendSuccess(res, 201, 'Registration successful. OTP sent to email.', { requireOtp: true });
  } catch (error) {
    console.error('Register error', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      body: { name: req.body?.name, email: req.body?.email }
    });
    return sendError(res, 400, error.message);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return sendError(res, 400, 'Email and OTP are required');
    }

    const { user, token } = await authService.verifyOTP(email, otp);
    return sendSuccess(res, 200, 'OTP verified successfully', {
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required');
    }

    const result = await authService.loginUser(email, password);
    
    if (result.requireOtp) {
      return sendSuccess(res, 200, 'Please verify your OTP to continue.', { requireOtp: true });
    }

    return sendSuccess(res, 200, 'Login successful', {
      token: result.token,
      user: { id: result.user._id, name: result.user.name, email: result.user.email }
    });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }
    return sendSuccess(res, 200, 'User retrieved successfully', {
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 400, 'Email is required');
    }
    await authService.createAndSendOTP(email);
    return sendSuccess(res, 200, 'OTP resent successfully');
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

module.exports = {
  register,
  verifyOtp,
  login,
  getMe,
  resendOtp
};
