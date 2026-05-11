const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const fs = require('fs');
const path = require('path');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res, next) => {
  try {
    const updateData = {};
    const allowed = ['name', 'phone', 'address', 'farmName', 'location', 'bio'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Profile updated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile image (local storage)
// @route   PUT /api/users/profile/image
// @access  Private
exports.updateProfileImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload an image' });

    const user = await User.findById(req.user.id);

    // Delete old local profile image if it exists
    if (user.profileImage) {
      const oldPath = path.join(__dirname, '..', user.profileImage);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { /* ignore */ }
      }
    }

    user.profileImage = `/uploads/profiles/${path.basename(req.file.path)}`;
    await user.save();

    res.status(200).json({ success: true, message: 'Profile image updated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user dashboard stats
// @route   GET /api/users/dashboard
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let stats = {};

    if (user.userType === 'farmer') {
      const products = await Product.countDocuments({ farmer: req.user.id });
      const totalOrders = await Order.countDocuments({ farmer: req.user.id });
      const revenueResult = await Order.aggregate([
        { $match: { farmer: req.user._id, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]);
      const pendingOrders = await Order.countDocuments({ farmer: req.user.id, orderStatus: 'pending' });
      const processingOrders = await Order.countDocuments({ farmer: req.user.id, orderStatus: 'processing' });
      const deliveredOrders = await Order.countDocuments({ farmer: req.user.id, orderStatus: 'delivered' });
      const recentOrders = await Order.find({ farmer: req.user.id })
        .sort('-createdAt').limit(5).populate('user', 'name email').select('orderStatus totalPrice createdAt');
      const lowStockProducts = await Product.find({ farmer: req.user.id, stock: { $lt: 10 }, isAvailable: true }).limit(5);

      stats = {
        products, totalOrders,
        revenue: revenueResult[0]?.total || 0,
        pendingOrders, processingOrders, deliveredOrders,
        recentOrders, lowStockProducts,
        averageOrderValue: revenueResult[0]?.total ? (revenueResult[0].total / totalOrders).toFixed(2) : 0
      };
    } else {
      const orders = await Order.countDocuments({ user: req.user.id });
      const totalSpentResult = await Order.aggregate([
        { $match: { user: req.user._id, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]);
      const pendingOrders = await Order.countDocuments({ user: req.user.id, orderStatus: { $in: ['pending', 'processing'] } });
      const deliveredOrders = await Order.countDocuments({ user: req.user.id, orderStatus: 'delivered' });
      const recentOrders = await Order.find({ user: req.user.id })
        .sort('-createdAt').limit(5).populate('farmer', 'name farmName').select('orderStatus totalPrice createdAt items');

      stats = {
        orders, totalSpent: totalSpentResult[0]?.total || 0,
        pendingOrders, deliveredOrders, recentOrders,
        favorites: user.favorites || [],
        averageOrderValue: totalSpentResult[0]?.total ? (totalSpentResult[0].total / orders).toFixed(2) : 0
      };
    }

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's orders
// @route   GET /api/users/orders
// @access  Private
exports.getUserOrders = async (req, res, next) => {
  try {
    let orders;
    if (req.user.userType === 'farmer') {
      orders = await Order.find({ farmer: req.user.id })
        .populate('user', 'name email phone').populate('items.product', 'name images').sort('-createdAt');
    } else {
      orders = await Order.find({ user: req.user.id })
        .populate('farmer', 'name farmName profileImage').populate('items.product', 'name images').sort('-createdAt');
    }
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's products (farmers only)
// @route   GET /api/users/products
// @access  Private/Farmer
exports.getUserProducts = async (req, res, next) => {
  try {
    if (req.user.userType !== 'farmer') {
      return res.status(403).json({ success: false, message: 'Only farmers can view their products' });
    }
    const products = await Product.find({ farmer: req.user.id }).sort('-createdAt');
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

// @desc    Add to favorites
// @route   POST /api/users/favorites/:productId
// @access  Private
exports.addToFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (user.favorites.includes(req.params.productId)) {
      return res.status(400).json({ success: false, message: 'Product already in favorites' });
    }
    user.favorites.push(req.params.productId);
    await user.save();
    res.status(200).json({ success: true, message: 'Product added to favorites', data: user.favorites });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove from favorites
// @route   DELETE /api/users/favorites/:productId
// @access  Private
exports.removeFromFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.favorites.includes(req.params.productId)) {
      return res.status(400).json({ success: false, message: 'Product not in favorites' });
    }
    user.favorites = user.favorites.filter(id => id.toString() !== req.params.productId);
    await user.save();
    res.status(200).json({ success: true, message: 'Product removed from favorites', data: user.favorites });
  } catch (error) {
    next(error);
  }
};

// @desc    Get favorites
// @route   GET /api/users/favorites
// @access  Private
exports.getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites');
    res.status(200).json({ success: true, count: user.favorites.length, data: user.favorites });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const users = await User.find().select('-password').skip(skip).limit(limit).sort('-createdAt');
    const total = await User.countDocuments();
    res.status(200).json({ success: true, count: users.length, total, totalPages: Math.ceil(total / limit), currentPage: page, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user (Admin)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user (Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    if (req.body.password) delete req.body.password;
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    await user.deleteOne();
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate user (Admin)
// @route   PUT /api/users/:id/deactivate
// @access  Private/Admin
exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = false;
    await user.save();
    res.status(200).json({ success: true, message: 'User deactivated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate user (Admin)
// @route   PUT /api/users/:id/activate
// @access  Private/Admin
exports.activateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = true;
    await user.save();
    res.status(200).json({ success: true, message: 'User activated successfully', data: user });
  } catch (error) {
    next(error);
  }
};
