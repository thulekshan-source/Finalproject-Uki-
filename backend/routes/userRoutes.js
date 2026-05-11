const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  updateProfileImage,
  getDashboardStats,
  getUserOrders,
  getUserProducts,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser
//  was require('./userController') — wrong relative path from routes folder
} = require('../controllers/userController');
const { protect, authorize, isFarmer, isAdmin } = require('../middleware/auth');
const { uploadSingle, handleUploadError, cleanupTempFiles } = require('../middleware/upload');

// all user routes require auth
router.use(protect);

router.route('/profile')
  .get(getUserProfile)
  .put(updateUserProfile);

router.route('/profile/image')
  .put(uploadSingle('profileImage'), handleUploadError, updateProfileImage, cleanupTempFiles);

router.get('/dashboard', getDashboardStats);
router.get('/orders', getUserOrders);
router.get('/favorites', getFavorites);
router.post('/favorites/:productId', addToFavorites);
router.delete('/favorites/:productId', removeFromFavorites);

// farmer only
router.get('/products', isFarmer, getUserProducts);

// admin only — must come after specific routes
router.use(isAdmin);
router.get('/', getAllUsers);
router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);
router.put('/:id/deactivate', deactivateUser);
router.put('/:id/activate', activateUser);

module.exports = router;
