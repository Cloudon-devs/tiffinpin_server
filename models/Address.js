const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new mongoose.Schema({
  // Address on which ID
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reciever_name: {
    type: String,
    required: true,
  },
  reciever_mobile: {
    type: String,
    required: true,
  },
  pincode: {
    type: String,
    required: true,
  },
  building_name: {
    type: String,
    required: true,
  },
  locality: {
    type: String,
    required: true,
  },
  landmark: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  alias: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Instance methods

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
