const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  off: {
    type: Number,
    required: true,
  },
  category: {
    type: String, // 'Extra' or 'Off'
  },
  description_text: {
    type: String,
    required: true,
  },
  img_url: {
    type: String,
  },
  is_scratched: {
    type: Boolean,
    required: false,
  },
  is_used: {
    type: Boolean,
    required: false,
  },
  expiryTime: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
  },
});

// Instance methods

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
