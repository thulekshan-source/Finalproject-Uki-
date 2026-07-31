const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/sendEmail');

// Helper to generate signed JWT token
const getSignedJwtToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'secretkey',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, userType, phone, address } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user with verification fields
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        userType: userType || 'customer',
        phone: phone || '',
        address: (typeof address === 'string' ? address : '') || '',
        verificationToken,
        verificationTokenExpires
      }
    });

    // Send verification email (best-effort)
    try {
      const verifyUrl = `${process.env.FRONTEND_URL || ''}/verify-email/${verificationToken}`;
      const html = `
        <p>Hello ${user.name || 'user'},</p>
        <p>Thanks for registering. Please verify your email by clicking the link below:</p>
        <a href="${verifyUrl}">Verify Email</a>
        <p>This link expires in 10 minutes.</p>
      `;

      await sendEmail({ email: user.email, subject: 'Verify your FreshFarm account', html });
    } catch (err) {
      console.error('Error sending verification email:', err);
    }

    // Generate JWT for immediate use (optional)
    const token = getSignedJwtToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Registration successful; verification email sent',
      token,
      user: {
        _id: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        phone: user.phone,
        address: user.address,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// @desc    Verify user's email
// @route   GET /api/auth/verify/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required' });
    }

    const user = await prisma.user.findFirst({ where: { verificationToken: token } });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    if (user.verificationTokenExpires && new Date(user.verificationTokenExpires) < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification token has expired' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null, verificationTokenExpires: null }
    });

    res.status(200).json({ success: true, message: 'Email successfully verified' });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify email' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = getSignedJwtToken(user.id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user.id, // Keep _id for frontend compatibility
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        phone: user.phone,
        address: user.address,
        profileImage: user.profileImage,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.user.id) } });

    res.status(200).json({
      success: true,
      user: {
        ...user,
        _id: user.id // Compatibility
      }
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user data'
    });
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address
    };

    const user = await prisma.user.update({
      where: { id: parseInt(req.user.id) },
      data: fieldsToUpdate
    });

    res.status(200).json({
      success: true,
      user: {
        ...user,
        _id: user.id
      }
    });

  } catch (error) {
    console.error('Update details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update details'
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.user.id) } });

    // Check current password
    const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);

    await prisma.user.update({
      where: { id: parseInt(req.user.id) },
      data: { password: hashedPassword }
    });

    const token = getSignedJwtToken(user.id);

    res.status(200).json({
      success: true,
      token,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password'
    });
  }
};