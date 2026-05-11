const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getFarmerOrders,
  getOrder,
  updateOrderToPaid,
  updateOrderStatus,
  cancelOrder,
  getAllOrders,
  getOrderStats
//  was require('./orderController') — wrong relative path from routes folder
} = require('../controllers/orderController');
const { protect, isFarmer, isAdmin } = require('../middleware/auth');

// all order routes require auth
router.use(protect);

router.post('/', createOrder);
router.get('/myorders', getMyOrders);

//farmer/stats must be defined before /:id or Express matches ':id' = 'farmer'
router.get('/farmer/orders', isFarmer, getFarmerOrders);
//  getFarmerOrderStats was referenced but never defined — now points to getOrderStats scoped to farmer
router.get('/farmer/stats', isFarmer, getOrderStats);
router.put('/:id/pay', isFarmer, updateOrderToPaid);
router.put('/:id/status', isFarmer, updateOrderStatus);

router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);

// admin only
router.get('/admin/all', isAdmin, getAllOrders);
router.get('/admin/stats', isAdmin, getOrderStats);

module.exports = router;
