const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items provided' });
    }

    // Fetch all products to group them by farmer
    const productIds = items.map(i => i.product);
    const fetchedProducts = await Product.find({ _id: { $in: productIds } });

    if (fetchedProducts.length === 0) {
      return res.status(404).json({ success: false, message: 'No products found' });
    }

    // Group items by farmer
    const farmerGroups = {};
    for (const item of items) {
      const product = fetchedProducts.find(p => p._id.toString() === item.product.toString());
      if (!product) continue;
      const farmerId = product.farmer.toString();
      if (!farmerGroups[farmerId]) farmerGroups[farmerId] = [];
      farmerGroups[farmerId].push(item);
    }

    const createdOrders = [];
    for (const farmerId in farmerGroups) {
      const groupItems = farmerGroups[farmerId];
      const order = await Order.create({
        user: req.user.id,
        farmer: farmerId,
        items: groupItems.map(item => ({
          product: item.product,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.price * item.quantity,
          unit: item.unit,
          image: item.image
        })),
        shippingAddress,
        paymentMethod,
        notes,
        paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'paid',
        isPaid: paymentMethod !== 'cash_on_delivery'
      });
      createdOrders.push(order);
    }

    res.status(201).json({ 
      success: true, 
      message: createdOrders.length > 1 
        ? `Successfully created ${createdOrders.length} orders (split by farmer)` 
        : 'Order created successfully', 
      data: createdOrders.length === 1 ? createdOrders[0] : createdOrders 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('farmer', 'name farmName profileImage')
      .populate('items.product', 'name images')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get farmer orders
// @route   GET /api/orders/farmer/orders
// @access  Private/Farmer
exports.getFarmerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ farmer: req.user.id })
      .populate('user', 'name email phone')
      .populate('items.product', 'name images')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('farmer', 'name farmName phone profileImage')
      .populate('items.product', 'name images category');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    //  was req.user.role — should be req.user.userType
    if (
      order.user._id.toString() !== req.user.id &&
      order.farmer._id.toString() !== req.user.id &&
      req.user.userType !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private/Farmer
exports.updateOrderToPaid = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.farmer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentStatus = 'paid';
    order.paymentResult = {
      id: req.body.paymentId,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.email_address
    };

    const updatedOrder = await order.save();
    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Farmer
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // was req.user.role — should be req.user.userType
    if (order.farmer.toString() !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
    }

    order.orderStatus = status;
    if (status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    // Update farmer revenue if status becomes confirmed for the first time
    if (status === 'confirmed' && !order.revenueAdded) {
      const farmer = await User.findById(order.farmer);
      if (farmer) {
        farmer.totalEarnings = (farmer.totalEarnings || 0) + order.totalPrice;
        await farmer.save();
        order.revenueAdded = true;
      }
    }

    const updatedOrder = await order.save();
    res.status(200).json({ success: true, message: 'Order status updated successfully', data: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.user.toString() !== req.user.id && order.farmer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
    }

    if (['shipped', 'delivered'].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    }

    order.orderStatus = 'cancelled';

    // restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    // Reverse revenue if it was previously added
    if (order.revenueAdded) {
      const farmer = await User.findById(order.farmer);
      if (farmer) {
        farmer.totalEarnings = Math.max(0, (farmer.totalEarnings || 0) - order.totalPrice);
        await farmer.save();
        order.revenueAdded = false;
      }
    }

    const updatedOrder = await order.save();
    res.status(200).json({ success: true, message: 'Order cancelled successfully', data: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('farmer', 'name farmName')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order stats
// @route   GET /api/orders/admin/stats  or  /api/orders/farmer/stats
// @access  Private/Admin or Private/Farmer
exports.getOrderStats = async (req, res, next) => {
  try {
    // farmers see only their own stats
    const matchStage = req.user.userType === 'farmer'
      ? { $match: { farmer: req.user._id } }
      : { $match: {} };

    // Define status filter for revenue
    const revenueStatuses = ['confirmed', 'processing', 'shipped', 'delivered'];

    const stats = await Order.aggregate([
      matchStage,
      {
        $group: {
          _id: null,
          numOrders: { $sum: 1 },
          totalSales: { 
            $sum: { 
              $cond: [
                { $in: ['$orderStatus', revenueStatuses] },
                '$totalPrice',
                0
              ] 
            } 
          },
          avgOrderValue: { 
            $avg: { 
              $cond: [
                { $in: ['$orderStatus', revenueStatuses] },
                '$totalPrice',
                null
              ] 
            } 
          },
          minOrder: { $min: '$totalPrice' },
          maxOrder: { $max: '$totalPrice' }
        }
      }
    ]);

    const statusStats = await Order.aggregate([
      matchStage,
      { $group: { _id: '$orderStatus', count: { $sum: 1 }, total: { $sum: '$totalPrice' } } }
    ]);

    const monthlyStats = await Order.aggregate([
      matchStage,
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { 
            $sum: { 
              $cond: [
                { $in: ['$orderStatus', revenueStatuses] },
                '$totalPrice',
                0
              ] 
            } 
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]);

    res.status(200).json({
      success: true,
      data: { overall: stats[0] || {}, byStatus: statusStats, monthly: monthlyStats }
    });
  } catch (error) {
    next(error);
  }
};
