const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function (v) {
        return validator.isEmail(v);
      },
      message: (props) => `${props.value} is not a valid email!`,
    },
  },
  mobile: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return validator.isMobilePhone(v, 'en-IN');
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },
  avatar: {
    type: String,
    default: '/drawables/default_avatar.svg',
  },
  addresses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      default: [],
    },
  ],
  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: [], // Empty array
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Instance methods

const User = mongoose.model('User', userSchema);

module.exports = User;
