const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  meals: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Meal',
      required: true,
    },
  ],
  transaction: {
    type: Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: () => {
      const currentDate = new Date();
      return new Date(
        currentDate.getTime() - currentDate.getTimezoneOffset() * 60000,
      );
    },
  },
  time: {
    type: String,
    required: true,
  },
  timstamp: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Instance methods

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
