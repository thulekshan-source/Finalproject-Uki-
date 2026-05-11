const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  unit: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price cannot be negative']
  }
});

const shippingAddressSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    default: ''
  },
  postalCode: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: 'Sri Lanka'
  },
  instructions: {
    type: String,
    default: ''
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  shippingAddress: shippingAddressSchema,
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash_on_delivery', 'card', 'online_banking', 'wallet'],
    default: 'cash_on_delivery'
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  discount: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  orderStatus: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false
  },
  paidAt: Date,
  isDelivered: {
    type: Boolean,
    required: true,
    default: false
  },
  deliveredAt: Date,
  notes: String,
  trackingNumber: String,
  shippingMethod: {
    type: String,
    enum: ['standard', 'express', 'next_day'],
    default: 'standard'
  },
  estimatedDelivery: Date,
  cancellationReason: String,
  refundAmount: Number,
  refundedAt: Date,
  revenueAdded: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate total price before validation
orderSchema.pre('validate', function(next) {
  // Calculate items price
  this.itemsPrice = this.items.reduce((acc, item) => {
    return acc + (item.price * item.quantity);
  }, 0);
  
  // Calculate shipping price
  if (this.itemsPrice > 1000) {
    this.shippingPrice = 0; // Free shipping above 1000
  } else if (this.itemsPrice > 500) {
    this.shippingPrice = 20;
  } else {
    this.shippingPrice = 50;
  }
  
  // Calculate tax (5%)
  this.taxPrice = this.itemsPrice * 0.05;
  
  // Apply discount
  const discountedAmount = this.itemsPrice * (this.discount / 100);
  
  // Calculate total
  this.totalPrice = this.itemsPrice + this.shippingPrice + this.taxPrice - discountedAmount;
  
  // Update item total prices
  this.items.forEach(item => {
    item.totalPrice = item.price * item.quantity;
  });
  
  this.updatedAt = Date.now();
  next();
});

// Update product stock when order is created or cancelled
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Decrease stock for new orders
    for (const item of this.items) {
      const product = await mongoose.model('Product').findById(item.product);
      if (product) {
        product.stock -= item.quantity;
        if (product.stock < 0) {
          throw new Error(`Insufficient stock for ${product.name}. Only ${product.stock + item.quantity} units available in store.`);
        }
        await product.save();
      }
    }
  } else if (this.isModified('orderStatus') && this.orderStatus === 'cancelled') {
    // Increase stock for cancelled orders
    for (const item of this.items) {
      const product = await mongoose.model('Product').findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }
  }
  next();
});

// Virtual for order summary
orderSchema.virtual('orderSummary').get(function() {
  return {
    totalItems: this.items.length,
    totalQuantity: this.items.reduce((sum, item) => sum + item.quantity, 0),
    status: this.orderStatus,
    estimatedDelivery: this.estimatedDelivery
  };
});

// Indexes for better query performance
orderSchema.index({ user: 1 });
orderSchema.index({ farmer: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ totalPrice: 1 });
orderSchema.index({ 'items.product': 1 });

// Compound indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ farmer: 1, orderStatus: 1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);