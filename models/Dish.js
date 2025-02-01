const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String, // Breakfast, Lunch, Dinner
    required: true,
  },
  sub_category: {
    type: String, // Roti, Rice, Curry, Dry sabji, etc
    required: true,
  },
  ingrident: {
    type: [String],
  },
  calories: {
    type: Number,
  },
  exemptions: {
    type: [String],
  },
  img_url: {
    type: [String],
    required: true,
  },
  cost_price: {
    type: Number,
    required: true,
  },
  selling_price: {
    type: Number,
  },
  description: {
    type: String, 
    required: true,
  },
  rating: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Instance methods

const Dish = mongoose.model('Dish', dishSchema);

module.exports = Dish;
