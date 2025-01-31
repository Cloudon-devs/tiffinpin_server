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
  isScratched: {
    type: Boolean,
    required: true,
  },
  expiryTime: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Instance methods

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
