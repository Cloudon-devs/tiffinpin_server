const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  address: {
    type: Schema.Types.ObjectId,
    ref: 'Address',
    required: true,
  },
  meals: [
    {
      meal: {
        type: Schema.Types.ObjectId,
        ref: 'Meal',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
    },
  ],
  dishes: [
    {
      dish: {
        type: Schema.Types.ObjectId,
        ref: 'Dish',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
      sub_category: {
        type: String,
        required: true,
      },
    },
  ],
  transaction: {
    type: Schema.Types.ObjectId,
    ref: 'Transaction',
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
  status: {
    type: String,
    enum: ['Preparing', 'Out For Delivery', 'Delivered', 'Cancelled'],
    required: true,
    default: 'Preparing',
  },
  payment_method: {
    type: String,
    enum: ['COD', 'Prepaid'],
    required: true,
    default: 'COD',
  },
  coupon: {
    type: Schema.Types.ObjectId,
    ref: 'Coupon',
  },
  price: {
    type: Number,
  },
  amount: {
    type: Number,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
