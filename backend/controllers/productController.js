const prisma = require('../utils/prisma');
const fs = require('fs');
const path = require('path');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res, next) => {
  try {
    const { page, sort, limit, search, minPrice, maxPrice, category, available, organic, featured, bestSeller } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { farmName: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (category) where.category = category;
    if (available === 'true') where.isAvailable = true;
    else if (available === 'false') where.isAvailable = false;
    if (organic === 'true') where.isOrganic = true;
    if (featured === 'true') where.isFeatured = true;
    if (bestSeller === 'true') where.isBestSeller = true;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    let orderBy = { createdAt: 'desc' };
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortOrder = sort.startsWith('-') ? 'desc' : 'asc';
      orderBy = { [sortField]: sortOrder };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          farmer: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
              farmName: true,
              location: true
            }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    // Map id to _id for frontend compatibility
    const mappedProducts = products.map(p => ({
      ...p,
      _id: p.id,
      farmer: { ...p.farmer, _id: p.farmer.id }
    }));

    res.status(200).json({
      success: true,
      count: mappedProducts.length,
      total,
      totalPages,
      currentPage: pageNum,
      pageSize: limitNum,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
      data: mappedProducts
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
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            farmName: true,
            location: true,
            profileImage: true,
            bio: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Prisma doesn't auto-increment views easily without a separate update
    // but we can do it here
    await prisma.product.update({
      where: { id: product.id },
      data: { numReviews: { increment: 0 } } // Placeholder if views not in schema
    });

    res.status(200).json({ 
      success: true, 
      data: { ...product, _id: product.id, farmer: { ...product.farmer, _id: product.farmer.id } } 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Farmer
exports.createProduct = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.user.id) } });
    if (user.userType !== 'farmer') {
      return res.status(403).json({ success: false, message: 'Only farmers can create products' });
    }

    const { name, description, price, category, unit, stock, images, isOrganic, tags, minOrderQuantity, maxOrderQuantity, isFeatured } = req.body;

    // Check storage limit
    const farmerProducts = await prisma.product.findMany({ where: { farmerId: user.id } });
    const currentTotalStock = farmerProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
    const newStock = parseFloat(stock) || 0;
    
    if (currentTotalStock + newStock > (user.storageLimit || 1000)) {
      return res.status(400).json({ 
        success: false, 
        message: `Storage limit exceeded. Current storage: ${currentTotalStock}/${user.storageLimit || 1000}. Cannot add ${newStock} more.` 
      });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category,
        unit,
        stock: parseFloat(stock),
        farmerId: user.id,
        farmName: user.farmName || user.name,
        images: images || [],
        isOrganic: isOrganic === 'true' || isOrganic === true,
        tags: tags || [],
        minOrderQuantity: parseFloat(minOrderQuantity) || 1,
        maxOrderQuantity: parseFloat(maxOrderQuantity) || 100,
        isFeatured: isFeatured === 'true' || isFeatured === true,
      }
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { ...product, _id: product.id }
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
    let product = await prisma.product.findUnique({ where: { id: parseInt(req.params.id) } });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.farmerId !== parseInt(req.user.id) && req.user.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    }

    const updateData = { ...req.body };
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.stock) updateData.stock = parseFloat(updateData.stock);

    // Check storage limit if stock is being updated
    if (updateData.stock !== undefined) {
      const user = await prisma.user.findUnique({ where: { id: parseInt(req.user.id) } });
      const farmerProducts = await prisma.product.findMany({ where: { farmerId: user.id } });
      const otherProductsStock = farmerProducts
        .filter(p => p.id !== parseInt(req.params.id))
        .reduce((sum, p) => sum + (p.stock || 0), 0);
      const newStock = parseFloat(updateData.stock) || 0;

      if (otherProductsStock + newStock > (user.storageLimit || 1000)) {
        return res.status(400).json({ 
          success: false, 
          message: `Storage limit exceeded. Current storage: ${otherProductsStock + (product.stock || 0)}/${user.storageLimit || 1000}. Cannot set stock to ${newStock}.` 
        });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      include: { farmer: { select: { name: true, email: true } } }
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { ...updatedProduct, _id: updatedProduct.id }
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
    const product = await prisma.product.findUnique({ where: { id: parseInt(req.params.id) } });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.farmerId !== parseInt(req.user.id) && req.user.userType !== 'admin') {
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

    await prisma.product.delete({ where: { id: product.id } });

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
    const products = await prisma.product.findMany({
      where: { farmerId: parseInt(req.params.farmerId) },
      include: { farmer: { select: { id: true, name: true, email: true, profileImage: true, farmName: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const mappedProducts = products.map(p => ({ ...p, _id: p.id, farmer: { ...p.farmer, _id: p.farmer.id } }));
    res.status(200).json({ success: true, count: mappedProducts.length, data: mappedProducts });
  } catch (error) {
    next(error);
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { category: req.params.category, isAvailable: true },
      include: { farmer: { select: { id: true, name: true, email: true, profileImage: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const mappedProducts = products.map(p => ({ ...p, _id: p.id, farmer: { ...p.farmer, _id: p.farmer.id } }));
    res.status(200).json({ success: true, count: mappedProducts.length, data: mappedProducts });
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
    const products = await prisma.product.findMany({
      where: { isAvailable: true, isFeatured: true },
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: { farmer: { select: { id: true, name: true, email: true, profileImage: true } } }
    });

    const mappedProducts = products.map(p => ({ ...p, _id: p.id, farmer: { ...p.farmer, _id: p.farmer.id } }));
    res.status(200).json({ success: true, count: mappedProducts.length, data: mappedProducts });
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
    const products = await prisma.product.findMany({
      where: { isAvailable: true, isBestSeller: true },
      orderBy: [{ numReviews: 'desc' }, { rating: 'desc' }],
      take: limit,
      include: { farmer: { select: { id: true, name: true, email: true, profileImage: true } } }
    });

    const mappedProducts = products.map(p => ({ ...p, _id: p.id, farmer: { ...p.farmer, _id: p.farmer.id } }));
    res.status(200).json({ success: true, count: mappedProducts.length, data: mappedProducts });
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
    const product = await prisma.product.findUnique({ where: { id: parseInt(req.params.id) } });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.farmerId !== parseInt(req.user.id) && req.user.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    }

    // Check storage limit
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.user.id) } });
    const farmerProducts = await prisma.product.findMany({ where: { farmerId: user.id } });
    const otherProductsStock = farmerProducts
      .filter(p => p.id !== parseInt(req.params.id))
      .reduce((sum, p) => sum + (p.stock || 0), 0);
    const newStock = parseFloat(stock) || 0;

    if (otherProductsStock + newStock > (user.storageLimit || 1000)) {
      return res.status(400).json({ 
        success: false, 
        message: `Storage limit exceeded. Current storage: ${otherProductsStock + (product.stock || 0)}/${user.storageLimit || 1000}. Cannot set stock to ${newStock}.` 
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: { stock: parseFloat(stock) }
    });

    res.status(200).json({ success: true, message: 'Stock updated successfully', data: { ...updatedProduct, _id: updatedProduct.id } });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product images
// @route   PUT /api/products/:id/images
// @access  Private/Farmer
exports.updateImages = async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: parseInt(req.params.id) } });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.farmerId !== parseInt(req.user.id) && req.user.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file =>
        `/uploads/products/${path.basename(file.path)}`
      );
      const updatedProduct = await prisma.product.update({
        where: { id: product.id },
        data: { images: [...product.images, ...newImages] }
      });
      res.status(200).json({ success: true, message: 'Images updated successfully', data: { ...updatedProduct, _id: updatedProduct.id } });
    } else {
      res.status(400).json({ success: false, message: 'No images uploaded' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageIndex
// @access  Private/Farmer
exports.deleteImage = async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: parseInt(req.params.id) } });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.farmerId !== parseInt(req.user.id) && req.user.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    }

    const imageIndex = parseInt(req.params.imageIndex);
    if (imageIndex < 0 || imageIndex >= product.images.length) {
      return res.status(400).json({ success: false, message: 'Invalid image index' });
    }

    const newImages = [...product.images];
    const removedImage = newImages.splice(imageIndex, 1)[0];

    // Delete local file if it exists
    const filePath = path.join(__dirname, '..', removedImage);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: { images: newImages }
    });

    res.status(200).json({ success: true, message: 'Image deleted successfully', data: { ...updatedProduct, _id: updatedProduct.id } });
  } catch (error) {
    next(error);
  }
};
