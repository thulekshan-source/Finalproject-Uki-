const prisma = require('../utils/prisma');

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
    const productIds = items.map(i => parseInt(i.product));
    const fetchedProducts = await prisma.product.findMany({ where: { id: { in: productIds } } });

    if (fetchedProducts.length === 0) {
      return res.status(404).json({ success: false, message: 'No products found' });
    }

    // Group items by farmer
    const farmerGroups = {};
    for (const item of items) {
      const product = fetchedProducts.find(p => p.id === parseInt(item.product));
      if (!product) continue;
      const farmerId = product.farmerId;
      if (!farmerGroups[farmerId]) farmerGroups[farmerId] = [];
      farmerGroups[farmerId].push({ ...item, productObj: product });
    }

    const createdOrders = [];
    for (const farmerId in farmerGroups) {
      const groupItems = farmerGroups[farmerId];
      
      // Calculate totals
      const itemsPrice = groupItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const taxPrice = itemsPrice * 0.05;
      const shippingPrice = itemsPrice > 1000 ? 0 : 50;
      const totalPrice = itemsPrice + taxPrice + shippingPrice;

      // Start a transaction for order creation and stock update
      const order = await prisma.$transaction(async (tx) => {
        // Create the order
        const newOrder = await tx.order.create({
          data: {
            userId: parseInt(req.user.id),
            farmerId: parseInt(farmerId),
            shippingAddress: shippingAddress,
            paymentMethod: paymentMethod || 'cash_on_delivery',
            notes: notes || '',
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'paid',
            isPaid: paymentMethod !== 'cash_on_delivery',
            items: {
              create: groupItems.map(item => ({
                productId: parseInt(item.product),
                name: item.name,
                quantity: parseFloat(item.quantity),
                price: parseFloat(item.price),
                unit: item.unit,
                image: item.image,
                totalPrice: parseFloat(item.price) * parseFloat(item.quantity)
              }))
            }
          }
        });

        // Update stock
        for (const item of groupItems) {
          await tx.product.update({
            where: { id: item.productObj.id },
            data: { stock: { decrement: parseFloat(item.quantity) } }
          });
        }

        return newOrder;
      });

      createdOrders.push(order);
    }

    res.status(201).json({ 
      success: true, 
      message: createdOrders.length > 1 
        ? `Successfully created ${createdOrders.length} orders (split by farmer)` 
        : 'Order created successfully', 
      data: createdOrders.length === 1 ? { ...createdOrders[0], _id: createdOrders[0].id } : createdOrders.map(o => ({ ...o, _id: o.id }))
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
    const orders = await prisma.order.findMany({
      where: { userId: parseInt(req.user.id) },
      include: { 
        farmer: { select: { name: true, farmName: true, profileImage: true } },
        items: { include: { product: { select: { name: true, images: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mappedOrders = orders.map(o => ({
      ...o,
      _id: o.id,
      farmer: { ...o.farmer, _id: o.farmerId },
      items: o.items.map(i => ({ ...i, _id: i.id }))
    }));

    res.status(200).json({ success: true, count: mappedOrders.length, data: mappedOrders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get farmer orders
// @route   GET /api/orders/farmer/orders
// @access  Private/Farmer
exports.getFarmerOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { farmerId: parseInt(req.user.id) },
      include: { 
        user: { select: { name: true, email: true, phone: true } },
        items: { include: { product: { select: { name: true, images: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mappedOrders = orders.map(o => ({
      ...o,
      _id: o.id,
      user: { ...o.user, _id: o.userId },
      items: o.items.map(i => ({ ...i, _id: i.id }))
    }));

    res.status(200).json({ success: true, count: mappedOrders.length, data: mappedOrders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        farmer: { select: { id: true, name: true, farmName: true, phone: true, profileImage: true } },
        items: { include: { product: { select: { name: true, images: true, category: true } } } }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (
      order.userId !== parseInt(req.user.id) &&
      order.farmerId !== parseInt(req.user.id) &&
      req.user.userType !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.status(200).json({ 
      success: true, 
      data: { 
        ...order, 
        _id: order.id, 
        user: { ...order.user, _id: order.user.id },
        farmer: { ...order.farmer, _id: order.farmer.id },
        items: order.items.map(i => ({ ...i, _id: i.id }))
      } 
    });
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
    const order = await prisma.order.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.farmerId !== parseInt(req.user.id) && req.user.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
    }

    const data = { orderStatus: status };
    if (status === 'delivered') {
      data.isDelivered = true;
      data.deliveredAt = new Date();
    }

    res.status(200).json({ success: true, message: 'Order status updated successfully', data: { ...updatedOrder, _id: updatedOrder.id } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true } },
        farmer: { select: { name: true, farmName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mappedOrders = orders.map(o => ({
      ...o,
      _id: o.id,
      user: { ...o.user, _id: o.userId },
      farmer: { ...o.farmer, _id: o.farmerId }
    }));

    res.status(200).json({ success: true, count: mappedOrders.length, data: mappedOrders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order stats
// @route   GET /api/orders/admin/stats  or  /api/orders/farmer/stats
// @access  Private/Admin or Private/Farmer
exports.getOrderStats = async (req, res, next) => {
  try {
    const isFarmer = req.user.userType === 'farmer';
    const where = isFarmer ? { farmerId: parseInt(req.user.id) } : {};
    
    const revenueStatuses = ['confirmed', 'processing', 'shipped', 'delivered'];

    const allOrders = await prisma.order.findMany({ where });

    let numOrders = allOrders.length;
    let totalSales = 0;
    let validSalesCount = 0;
    let minOrder = null;
    let maxOrder = null;

    const statusCounts = {};

    allOrders.forEach(order => {
      // count statuses
      statusCounts[order.orderStatus] = (statusCounts[order.orderStatus] || 0) + 1;

      // revenue logic
      if (revenueStatuses.includes(order.orderStatus)) {
        totalSales += order.totalPrice;
        validSalesCount++;
        
        if (minOrder === null || order.totalPrice < minOrder) minOrder = order.totalPrice;
        if (maxOrder === null || order.totalPrice > maxOrder) maxOrder = order.totalPrice;
      }
    });

    const avgOrderValue = validSalesCount > 0 ? totalSales / validSalesCount : null;

    const overall = {
      numOrders,
      totalSales,
      avgOrderValue,
      minOrder,
      maxOrder
    };

    const byStatus = Object.keys(statusCounts).map(status => ({
      _id: status,
      count: statusCounts[status]
    }));

    // Monthly stats (basic grouping in JS since prisma group by date is complex)
    const monthlyMap = {};
    allOrders.forEach(order => {
      const d = new Date(order.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { orders: 0, revenue: 0 };
      
      monthlyMap[key].orders++;
      if (revenueStatuses.includes(order.orderStatus)) {
        monthlyMap[key].revenue += order.totalPrice;
      }
    });

    const monthly = Object.keys(monthlyMap).map(key => {
      const [year, month] = key.split('-');
      return {
        _id: { year: parseInt(year), month: parseInt(month) },
        orders: monthlyMap[key].orders,
        revenue: monthlyMap[key].revenue
      };
    }).sort((a, b) => b._id.year - a._id.year || b._id.month - a._id.month).slice(0, 6);

    res.status(200).json({
      success: true,
      data: { overall, byStatus, monthly }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: parseInt(req.params.id) }, include: { items: true } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.userId !== parseInt(req.user.id) && order.farmerId !== parseInt(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
    }

    if (['shipped', 'delivered'].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const canceled = await tx.order.update({
        where: { id: order.id },
        data: { orderStatus: 'cancelled' }
      });

      // restore stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });
      }
      return canceled;
    });

    res.status(200).json({ success: true, message: 'Order cancelled successfully', data: { ...updatedOrder, _id: updatedOrder.id } });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private/Farmer
exports.updateOrderToPaid = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.farmerId !== parseInt(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        isPaid: true,
        paidAt: new Date(),
        paymentStatus: 'paid',
        paymentResult: {
          id: req.body.paymentId,
          status: req.body.status,
          update_time: req.body.update_time,
          email_address: req.body.email_address
        }
      }
    });
    res.status(200).json({ success: true, data: { ...updatedOrder, _id: updatedOrder.id } });
  } catch (error) {
    next(error);
  }
};
