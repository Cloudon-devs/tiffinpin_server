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
  },
  reciever_mobile: {
    type: String,
  },
  pincode: {
    type: String,
    default: '201009',
  },
  building_name: {
    type: String,
  },
  locality: {
    type: String,
  },
  landmark: {
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
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
