const jwt = require('jsonwebtoken');
const User = require('../models/User');
const File = require('../models/File');
const Log = require('../models/Log');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @desc Register user
 * @route POST /api/auth/register
 * @access Public
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a username, email, and password',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'Username or email already registered',
      });
    }

    // Create user (pre-save hook hashes password)
    const user = await User.create({
      username,
      email,
      hashedPassword: password,
    });

    // Log the registration event
    await Log.create({
      userId: user._id,
      username: user.username,
      action: 'User Registration',
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Log in user
 * @route POST /api/auth/login
 * @access Public
 */
const login = async (req, res, next) => {
  try {
    const { identity, password } = req.body; // identity can be email or username

    if (!identity || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide username/email and password',
      });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ email: identity.toLowerCase() }, { username: identity }],
    });

    const ip = req.ip || req.connection.remoteAddress || 'Unknown';

    if (!user) {
      // Log failed attempt (User not found)
      await Log.create({
        username: identity,
        action: 'Failed Login Attempt',
        ipAddress: ip,
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Log failed attempt (Wrong password)
      await Log.create({
        userId: user._id,
        username: user.username,
        action: 'Failed Login Attempt',
        ipAddress: ip,
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Create log entry for successful login
    await Log.create({
      userId: user._id,
      username: user.username,
      action: 'User Login',
      ipAddress: ip,
    });

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Log out user
 * @route POST /api/auth/logout
 * @access Protected
 */
const logout = async (req, res, next) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';

    // Log the logout action
    await Log.create({
      userId: req.user._id,
      username: req.user.username,
      action: 'User Logout',
      ipAddress: ip,
    });

    res.status(200).json({
      success: true,
      message: 'Successfully logged out',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get user profile
 * @route GET /api/auth/profile
 * @access Protected
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-hashedPassword');
    
    // Count the files uploaded by this user
    const filesCount = await File.countDocuments({ owner: req.user.id });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        filesCount: filesCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
};
