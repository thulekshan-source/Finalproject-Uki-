const Product = require('../models/Product');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res, next) => {
  try {
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search', 'minPrice', 'maxPrice'];
    excludedFields.forEach(el => delete queryObj[el]);

    if (req.query.search) {
      queryObj.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { farmName: { $regex: req.query.search, $options: 'i' } },
        { tags: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.minPrice || req.query.maxPrice) {
      queryObj.price = {};
      if (req.query.minPrice) queryObj.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) queryObj.price.$lte = parseFloat(req.query.maxPrice);
    }

    if (req.query.category) queryObj.category = req.query.category;
    if (req.query.available === 'true') queryObj.isAvailable = true;
    else if (req.query.available === 'false') queryObj.isAvailable = false;
    if (req.query.organic === 'true') queryObj.isOrganic = true;
    if (req.query.featured === 'true') queryObj.isFeatured = true;
    if (req.query.bestSeller === 'true') queryObj.isBestSeller = true;

    let query = Product.find(queryObj).populate('farmer', 'name email profileImage farmName location');

    if (req.query.sort) {
      query = query.sort(req.query.sort.split(',').join(' '));
    } else {
      query = query.sort('-createdAt');
    }

    if (req.query.fields) {
      query = query.select(req.query.fields.split(',').join(' '));
    } else {
      query = query.select('-__v');
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || process.env.DEFAULT_PAGE_SIZE || 12;
    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(queryObj);

    query = query.skip(skip).limit(limit);
    const products = await query;
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages,
      currentPage: page,
      pageSize: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('farmer', 'name email phone farmName location profileImage bio');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.views = (product.views || 0) + 1;
    await product.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Farmer
exports.createProduct = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.userType !== 'farmer') {
      return res.status(403).json({ success: false, message: 'Only farmers can create products' });
    }

    const productData = {
      ...req.body,
      farmer: req.user.id,
      farmName: user.farmName || user.name
    };

    // Check storage limit
    const farmerProducts = await Product.find({ farmer: req.user.id });
    const currentTotalStock = farmerProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
    const newStock = parseInt(req.body.stock) || 0;
    
    if (currentTotalStock + newStock > (user.storageLimit || 1000)) {
      return res.status(400).json({ 
        success: false, 
        message: `Storage limit exceeded. Current storage: ${currentTotalStock}/${user.storageLimit || 1000}. Cannot add ${newStock} more.` 
      });
    }

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Farmer
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.farmer.toString() !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    }

    const updateData = { ...req.body };
    delete updateData.farmer;

    // Check storage limit if stock is being updated
    if (updateData.stock !== undefined) {
      const user = await User.findById(req.user.id);
      const farmerProducts = await Product.find({ farmer: req.user.id });
      const otherProductsStock = farmerProducts
        .filter(p => p._id.toString() !== req.params.id)
        .reduce((sum, p) => sum + (p.stock || 0), 0);
      const newStock = parseInt(updateData.stock) || 0;

      if (otherProductsStock + newStock > (user.storageLimit || 1000)) {
        return res.status(400).json({ 
          success: false, 
          message: `Storage limit exceeded. Current storage: ${otherProductsStock + (product.stock || 0)}/${user.storageLimit || 1000}. Cannot set stock to ${newStock}.` 
        });
      }
    }

    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).populate('farmer', 'name email');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Farmer
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.farmer.toString() !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this product' });
    }

    // Delete local image files if they exist
    if (product.images && product.images.length > 0) {
      product.images.forEach(imageUrl => {
        const filePath = path.join(__dirname, '..', imageUrl);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
        }
      });
    }

    await product.deleteOne();

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get products by farmer
// @route   GET /api/products/farmer/:farmerId
// @access  Public
exports.getProductsByFarmer = async (req, res, next) => {
  try {
    const products = await Product.find({ farmer: req.params.farmerId })
      .populate('farmer', 'name email profileImage farmName')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const products = await Product.find({ category: req.params.category, isAvailable: true })
      .populate('farmer', 'name email profileImage')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const products = await Product.find({ isAvailable: true, isFeatured: true })
      .sort('-rating -createdAt')
      .limit(limit)
      .populate('farmer', 'name email profileImage');

    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

// @desc    Get best seller products
// @route   GET /api/products/best-sellers
// @access  Public
exports.getBestSellers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const products = await Product.find({ isAvailable: true, isBestSeller: true })
      .sort('-numReviews -rating')
      .limit(limit)
      .populate('farmer', 'name email profileImage');

    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product stock
// @route   PATCH /api/products/:id/stock
// @access  Private/Farmer
exports.updateStock = async (req, res, next) => {
  try {
    const { stock } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.farmer.toString() !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    }

    // Check storage limit
    const user = await User.findById(req.user.id);
    const farmerProducts = await Product.find({ farmer: req.user.id });
    const otherProductsStock = farmerProducts
      .filter(p => p._id.toString() !== req.params.id)
      .reduce((sum, p) => sum + (p.stock || 0), 0);
    const newStock = parseInt(stock) || 0;

    if (otherProductsStock + newStock > (user.storageLimit || 1000)) {
      return res.status(400).json({ 
        success: false, 
        message: `Storage limit exceeded. Current storage: ${otherProductsStock + (product.stock || 0)}/${user.storageLimit || 1000}. Cannot set stock to ${newStock}.` 
      });
    }

    product.stock = stock;
    await product.save();

    res.status(200).json({ success: true, message: 'Stock updated successfully', data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product images
// @route   PUT /api/products/:id/images
// @access  Private/Farmer
exports.updateImages = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.farmer.toString() !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file =>
        `/uploads/products/${path.basename(file.path)}`
      );
      product.images = [...product.images, ...newImages];
      await product.save();
    }

    res.status(200).json({ success: true, message: 'Images updated successfully', data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageIndex
// @access  Private/Farmer
exports.deleteImage = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.farmer.toString() !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    }

    const imageIndex = parseInt(req.params.imageIndex);
    if (imageIndex < 0 || imageIndex >= product.images.length) {
      return res.status(400).json({ success: false, message: 'Invalid image index' });
    }

    const removedImage = product.images.splice(imageIndex, 1)[0];

    // Delete local file if it exists
    const filePath = path.join(__dirname, '..', removedImage);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    }

    await product.save();

    res.status(200).json({ success: true, message: 'Image deleted successfully', data: product });
  } catch (error) {
    next(error);
  }
};
