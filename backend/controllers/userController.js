const prisma = require('../utils/prisma');
const fs = require('fs');
const path = require('path');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.user.id) } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: { ...user, _id: user.id } });
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

    const user = await prisma.user.update({
      where: { id: parseInt(req.user.id) },
      data: updateData
    });
    res.status(200).json({ success: true, message: 'Profile updated successfully', data: { ...user, _id: user.id } });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile image
// @route   PUT /api/users/profile/image
// @access  Private
exports.updateProfileImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload an image' });

    const user = await prisma.user.findUnique({ where: { id: parseInt(req.user.id) } });

    // Delete old local profile image if it exists
    if (user.profileImage) {
      const oldPath = path.join(__dirname, '..', user.profileImage);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { /* ignore */ }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { profileImage: `/uploads/profiles/${path.basename(req.file.path)}` }
    });

    res.status(200).json({ success: true, message: 'Profile image updated successfully', data: { ...updatedUser, _id: updatedUser.id } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user dashboard stats
// @route   GET /api/users/dashboard
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.user.id) } });
    let stats = {};

    if (user.userType === 'farmer') {
      const [productsCount, totalOrdersCount, revenueResult, pendingOrdersCount, processingOrdersCount, deliveredOrdersCount, recentOrders] = await Promise.all([
        prisma.product.count({ where: { farmerId: user.id } }),
        prisma.order.count({ where: { farmerId: user.id } }),
        prisma.order.aggregate({
          where: { farmerId: user.id, paymentStatus: 'paid' },
          _sum: { totalPrice: true }
        }),
        prisma.order.count({ where: { farmerId: user.id, orderStatus: 'pending' } }),
        prisma.order.count({ where: { farmerId: user.id, orderStatus: 'processing' } }),
        prisma.order.count({ where: { farmerId: user.id, orderStatus: 'delivered' } }),
        prisma.order.findMany({
          where: { farmerId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { user: { select: { name: true, email: true } } }
        })
      ]);

      const lowStockProducts = await prisma.product.findMany({
        where: { farmerId: user.id, stock: { lt: 10 }, isAvailable: true },
        take: 5
      });

      stats = {
        products: productsCount,
        totalOrders: totalOrdersCount,
        revenue: revenueResult._sum.totalPrice || 0,
        pendingOrders: pendingOrdersCount,
        processingOrders: processingOrdersCount,
        deliveredOrders: deliveredOrdersCount,
        recentOrders: recentOrders.map(o => ({ ...o, _id: o.id, user: { ...o.user, _id: o.user.id } })),
        lowStockProducts: lowStockProducts.map(p => ({ ...p, _id: p.id })),
        averageOrderValue: totalOrdersCount > 0 ? ((revenueResult._sum.totalPrice || 0) / totalOrdersCount).toFixed(2) : 0
      };
    } else {
      const [ordersCount, totalSpentResult, pendingOrdersCount, deliveredOrdersCount, recentOrders] = await Promise.all([
        prisma.order.count({ where: { userId: user.id } }),
        prisma.order.aggregate({
          where: { userId: user.id, paymentStatus: 'paid' },
          _sum: { totalPrice: true }
        }),
        prisma.order.count({ where: { userId: user.id, orderStatus: { in: ['pending', 'processing'] } } }),
        prisma.order.count({ where: { userId: user.id, orderStatus: 'delivered' } }),
        prisma.order.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { farmer: { select: { id: true, name: true, farmName: true } } }
        })
      ]);

      stats = {
        orders: ordersCount,
        totalSpent: totalSpentResult._sum.totalPrice || 0,
        pendingOrders: pendingOrdersCount,
        deliveredOrders: deliveredOrdersCount,
        recentOrders: recentOrders.map(o => ({ ...o, _id: o.id, farmer: { ...o.farmer, _id: o.farmer.id } })),
        favorites: [],
        averageOrderValue: ordersCount > 0 ? ((totalSpentResult._sum.totalPrice || 0) / ordersCount).toFixed(2) : 0
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
      orders = await prisma.order.findMany({
        where: { farmerId: parseInt(req.user.id) },
        include: { user: { select: { id: true, name: true, email: true, phone: true } }, items: { include: { product: { select: { name: true, images: true } } } } },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      orders = await prisma.order.findMany({
        where: { userId: parseInt(req.user.id) },
        include: { farmer: { select: { id: true, name: true, farmName: true, profileImage: true } }, items: { include: { product: { select: { name: true, images: true } } } } },
        orderBy: { createdAt: 'desc' }
      });
    }
    const mappedOrders = orders.map(o => ({
      ...o,
      _id: o.id,
      user: o.user ? { ...o.user, _id: o.user.id } : null,
      farmer: o.farmer ? { ...o.farmer, _id: o.farmer.id } : null,
      items: o.items.map(i => ({ ...i, _id: i.id }))
    }));
    res.status(200).json({ success: true, count: mappedOrders.length, data: mappedOrders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's products
// @route   GET /api/users/products
// @access  Private/Farmer
exports.getUserProducts = async (req, res, next) => {
  try {
    if (req.user.userType !== 'farmer') {
      return res.status(403).json({ success: false, message: 'Only farmers can view their products' });
    }
    const products = await prisma.product.findMany({
      where: { farmerId: parseInt(req.user.id) },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, count: products.length, data: products.map(p => ({ ...p, _id: p.id })) });
  } catch (error) {
    next(error);
  }
};

// @desc    Add to favorites
// @route   POST /api/users/favorites/:productId
// @access  Private
exports.addToFavorites = async (req, res, next) => {
  try {
    const existingFav = await prisma.favorite.findUnique({
      where: { userId_productId: { userId: parseInt(req.user.id), productId: parseInt(req.params.productId) } }
    });
    if (existingFav) {
      return res.status(400).json({ success: false, message: 'Product already in favorites' });
    }
    await prisma.favorite.create({
      data: { userId: parseInt(req.user.id), productId: parseInt(req.params.productId) }
    });
    res.status(200).json({ success: true, message: 'Product added to favorites' });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove from favorites
// @route   DELETE /api/users/favorites/:productId
// @access  Private
exports.removeFromFavorites = async (req, res, next) => {
  try {
    await prisma.favorite.delete({
      where: { userId_productId: { userId: parseInt(req.user.id), productId: parseInt(req.params.productId) } }
    });
    res.status(200).json({ success: true, message: 'Product removed from favorites' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get favorites
// @route   GET /api/users/favorites
// @access  Private
exports.getFavorites = async (req, res, next) => {
  try {
    const favs = await prisma.favorite.findMany({
      where: { userId: parseInt(req.user.id) },
      include: { product: true }
    });
    const products = favs.map(f => ({ ...f.product, _id: f.product.id }));
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json({ success: true, count: users.length, data: users.map(u => ({ ...u, _id: u.id, password: undefined })) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user (Admin)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: { ...user, _id: user.id, password: undefined } });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user (Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.password) delete data.password;
    const user = await prisma.user.update({ where: { id: parseInt(req.params.id) }, data });
    res.status(200).json({ success: true, data: { ...user, _id: user.id, password: undefined } });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    if (parseInt(req.params.id) === parseInt(req.user.id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
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
    const user = await prisma.user.update({ where: { id: parseInt(req.params.id) }, data: { isActive: false } });
    res.status(200).json({ success: true, message: 'User deactivated successfully', data: { ...user, _id: user.id } });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate user (Admin)
// @route   PUT /api/users/:id/activate
// @access  Private/Admin
exports.activateUser = async (req, res, next) => {
  try {
    const user = await prisma.user.update({ where: { id: parseInt(req.params.id) }, data: { isActive: true } });
    res.status(200).json({ success: true, message: 'User activated successfully', data: { ...user, _id: user.id } });
  } catch (error) {
    next(error);
  }
};
