const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const createUploadsDir = () => {
  const uploadDirs = ['uploads', 'uploads/profiles', 'uploads/products', 'uploads/temp'];
  
  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadsDir();

// Set storage engine
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    let folder = 'uploads/temp';
    
    if (file.fieldname === 'profileImage') {
      folder = 'uploads/profiles';
    } else if (file.fieldname === 'images') {
      folder = 'uploads/products';
    }
    
    // Ensure directory exists
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    
    cb(null, folder);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Check file type
function checkFileType(file, cb) {
  // Allowed extensions
  const filetypes = /jpeg|jpg|png|gif|webp/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Images only! (jpeg, jpg, png, gif, webp)'));
  }
}

// Init upload
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: parseInt(process.env.MAX_FILE_UPLOAD) || 5 * 1024 * 1024, // 5MB default
    files: 5 // Max 5 files
  },
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
});

// Upload single image
exports.uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

// Upload multiple images
exports.uploadMultiple = (fieldName, maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

// Handle upload errors
exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File size too large. Maximum size is ${process.env.MAX_FILE_UPLOAD || 5}MB`
      });
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: `Too many files. Maximum is ${err.limit} files`
      });
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// Clean up temporary files after upload
exports.cleanupTempFiles = (req, res, next) => {
  if (req.files) {
    req.files.forEach(file => {
      if (file.path && fs.existsSync(file.path) && file.path.includes('temp')) {
        fs.unlinkSync(file.path);
      }
    });
  }
  
  if (req.file && req.file.path && fs.existsSync(req.file.path) && req.file.path.includes('temp')) {
    fs.unlinkSync(req.file.path);
  }
  
  next();
};