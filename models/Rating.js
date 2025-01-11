const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ratingSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  meal: {
    type: Schema.Types.ObjectId,
    ref: 'Meal',
    required: true,
  },
  rating: {
    type: String,
    required: true,
  },
  comments: {
    type: [String],
  },
  time_stamp: {
    type: Date,
    default: Date.now,
  },
  is_certified_buyer: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Instance methods

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;
