// backend/services/userService.js
const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');

const userService = {
  // Get all users
  async getAllUsers() {
    try {
      return await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          userType: true,
          phone: true,
          address: true,
          profileImage: true,
          farmName: true,
          location: true,
          bio: true,
          isVerified: true,
          isActive: true,
          totalEarnings: true,
          storageLimit: true,
          createdAt: true,
          updatedAt: true
        }
      });
    } catch (error) {
      throw error;
    }
  },

  // Get user by ID
  async getUserById(id) {
    try {
      return await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          name: true,
          email: true,
          userType: true,
          phone: true,
          address: true,
          profileImage: true,
          farmName: true,
          location: true,
          bio: true,
          isVerified: true,
          isActive: true,
          totalEarnings: true,
          storageLimit: true,
          createdAt: true,
          updatedAt: true
        }
      });
    } catch (error) {
      throw error;
    }
  },

  // Create new user
  async createUser(userData) {
    try {
      const { name, email, password, role } = userData;
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          userType: role || 'customer'
        }
      });

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

      return await prisma.user.update({
        where: { id: parseInt(id) },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          userType: true,
          phone: true,
          address: true,
          profileImage: true,
          farmName: true,
          location: true,
          bio: true,
          isVerified: true,
          isActive: true,
          totalEarnings: true,
          storageLimit: true,
          createdAt: true,
          updatedAt: true
        }
      });
    } catch (error) {
      throw error;
    }
  },

  // Delete user
  async deleteUser(id) {
    try {
      return await prisma.user.delete({
        where: { id: parseInt(id) }
      });
    } catch (error) {
      throw error;
    }
  },

  // Find user by email (for login)
  async findByEmail(email) {
    try {
      return await prisma.user.findUnique({ where: { email } });
    } catch (error) {
      throw error;
    }
  }
};

module.exports = userService;