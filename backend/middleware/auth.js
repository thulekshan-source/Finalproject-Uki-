const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

// protect routes — verify JWT
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.user = await prisma.user.findUnique({ where: { id: parseInt(decoded.id) } });

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

// authorize by userType(s)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: `User type '${req.user.userType}' is not authorized to access this route`
      });
    }
    next();
  };
};

//  routes use isFarmer
exports.isFarmer = (req, res, next) => {
  if (req.user.userType !== 'farmer' && req.user.userType !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only farmers can access this route' });
  }
  next();
};

//  routes use isAdmin
exports.isAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only admins can access this route' });
  }
  next();
};

// Simplified checkOwnership for Prisma
exports.checkOwnership = (modelName) => async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    let doc;

    if (modelName === 'Product') {
      doc = await prisma.product.findUnique({ where: { id } });
    } else if (modelName === 'Order') {
      doc = await prisma.order.findUnique({ where: { id } });
    }

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // admin can always proceed
    if (req.user.userType === 'admin') return next();

    const ownerId = doc.farmerId || doc.userId;
    if (ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this resource' });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect: exports.protect,
  authorize: exports.authorize,
  isFarmer: exports.isFarmer,
  isAdmin: exports.isAdmin,
  checkOwnership: exports.checkOwnership
};
