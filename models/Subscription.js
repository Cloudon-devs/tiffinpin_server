const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  time_frame: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true,
  },
  cost_price: {
    type: Number,
  },
  selling_price: {
    type: Number,
    required: true,
  },
  discount_percentage: {
    type: Number,
    required: true,
  },
  suggested_menu: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Meal',
        required: true,
      },
    ],
  },
  img_url: {
    type: String,
    default: true,
  }
});

// Instance methods

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
