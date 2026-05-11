const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByFarmer,
  getProductsByCategory,
  getFeaturedProducts,
  getBestSellers,
  updateStock,
  updateImages,
  deleteImage
} = require('../controllers/productController'); 
const { protect, isFarmer, checkOwnership } = require('../middleware/auth');
const { uploadMultiple, handleUploadError, cleanupTempFiles } = require('../middleware/upload');
const Product = require('../models/Product');

// Public routes
router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/best-sellers', getBestSellers);
router.get('/category/:category', getProductsByCategory);
router.get('/farmer/:farmerId', getProductsByFarmer);
router.get('/:id', getProduct);

// Protected routes (require authentication)
router.use(protect);

// Farmer-only routes
router.post('/',
  isFarmer,
  uploadMultiple('images', 5),
  handleUploadError,
  createProduct,
  cleanupTempFiles
);

router.put('/:id', 
  isFarmer,
  checkOwnership(Product),
  updateProduct
);

router.delete('/:id', 
  isFarmer,
  checkOwnership(Product),
  deleteProduct
);

router.patch('/:id/stock', 
  isFarmer,
  checkOwnership(Product),
  updateStock
);

router.put('/:id/images',
  isFarmer,
  checkOwnership(Product),
  uploadMultiple('images', 5),
  handleUploadError,
  updateImages,
  cleanupTempFiles
);

router.delete('/:id/images/:imageIndex',
  isFarmer,
  checkOwnership(Product),
  deleteImage
);

module.exports = router;