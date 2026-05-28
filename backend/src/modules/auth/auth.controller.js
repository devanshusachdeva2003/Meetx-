const authService = require('./auth.service');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const user = await authService.registerUser(name, email, password);
    res.status(201).json({ 
      message: 'Registration successful. OTP sent to email.', 
      requireOtp: true 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const { user, token } = await authService.verifyOTP(email, otp);
    res.status(200).json({ 
      message: 'OTP verified successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.loginUser(email, password);
    
    if (result.requireOtp) {
      return res.status(200).json({ 
        message: 'Please verify your OTP to continue.', 
        requireOtp: true 
      });
    }

    res.status(200).json({ 
      message: 'Login successful', 
      token: result.token,
      user: { id: result.user._id, name: result.user.name, email: result.user.email }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  register,
  verifyOtp,
  login,
  getMe
};
