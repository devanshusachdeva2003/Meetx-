const authService = require('./auth.service');
const { sendSuccess, sendError } = require('../../utils/responseHandler');
const asyncHandler = require('../../utils/asyncHandler');
const cloudinary = require('../../utils/cloudinary');
const fs = require('fs');

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
      user
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
      user: result.user
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
    return sendSuccess(res, 200, 'User retrieved successfully', { user });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const updateMe = asyncHandler(async (req, res) => {
  const user = await authService.updateUserById(req.user.id, req.body);
  
  return sendSuccess(res, 200, 'Profile updated successfully', { user });
});

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

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 400, 'Email is required');
    }
    await authService.forgotPassword(email);
    return sendSuccess(res, 200, 'OTP sent to email successfully');
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return sendError(res, 400, 'Email, OTP, and new password are required');
    }
    await authService.resetPassword(email, otp, newPassword);
    return sendSuccess(res, 200, 'Password reset successfully');
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const getGoogleAuthUrl = (req, res) => {
  try {
    const url = authService.generateGoogleAuthUrl();
    return sendSuccess(res, 200, 'Google Auth URL generated', { url });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const googleLogin = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return sendError(res, 400, 'Authorization code is required');
    }
    const result = await authService.verifyGoogleTokenAndLogin(code);
    
    if (result.requireOtp) {
      return sendSuccess(res, 200, 'Please verify your OTP to continue.', { 
        requireOtp: true,
        email: result.user.email 
      });
    }

    return sendSuccess(res, 200, 'Login successful', {
      token: result.token,
      user: result.user
    });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const uploadAvatar = async (req, res) => {
  if (!req.file) {
    return sendError(res, 400, 'No file uploaded');
  }

  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'meetx_avatars',
      resource_type: 'image',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' }
      ]
    });

    fs.unlinkSync(req.file.path);

    const user = await authService.updateUserAvatar(req.user.id, result.secure_url);

    return sendSuccess(res, 200, 'Avatar updated successfully', { user });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return sendError(res, 400, 'Failed to upload avatar: ' + error.message);
  }
};

const removeAvatar = async (req, res) => {
  try {
    const user = await authService.updateUserAvatar(req.user.id, null);
    
    return sendSuccess(res, 200, 'Avatar removed successfully', { user });
  } catch (error) {
    return sendError(res, 400, 'Failed to remove avatar: ' + error.message);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return sendError(res, 400, 'Current password and new password are required');
    }
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    return sendSuccess(res, 200, 'Password changed successfully');
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const requestSetPasswordOtp = async (req, res) => {
  try {
    await authService.requestSetPasswordOtp(req.user.id);
    return sendSuccess(res, 200, 'OTP sent successfully');
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

const setPassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    if (!otp || !newPassword) {
      return sendError(res, 400, 'OTP and new password are required');
    }
    await authService.setPassword(req.user.id, otp, newPassword);
    return sendSuccess(res, 200, 'Password set successfully');
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

module.exports = {
  register,
  verifyOtp,
  login,
  getMe,
  updateMe,
  resendOtp,
  forgotPassword,
  resetPassword,
  getGoogleAuthUrl,
  googleLogin,
  uploadAvatar,
  removeAvatar,
  changePassword,
  requestSetPasswordOtp,
  setPassword
};
