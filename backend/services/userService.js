// backend/services/userService.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const userService = {
  // Get all users
  async getAllUsers() {
    try {
      return await User.find().select('-password');
    } catch (error) {
      throw error;
    }
  },

  // Get user by ID
  async getUserById(id) {
    try {
      return await User.findById(id).select('-password');
    } catch (error) {
      throw error;
    }
  },

  // Create new user
  async createUser(userData) {
    try {
      const { name, email, password, role } = userData;
      
      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = new User({
        name,
        email,
        password: hashedPassword,
        role: role || 'customer'
      });

      await user.save();
      return user;
    } catch (error) {
      throw error;
    }
  },

  // Update user
  async updateUser(id, updateData) {
    try {
      // Remove password from update data if present
      if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateData.password, salt);
      }

      return await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      ).select('-password');
    } catch (error) {
      throw error;
    }
  },

  // Delete user
  async deleteUser(id) {
    try {
      return await User.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  },

  // Find user by email (for login)
  async findByEmail(email) {
    try {
      return await User.findOne({ email });
    } catch (error) {
      throw error;
    }
  }
};

module.exports = userService;