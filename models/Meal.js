const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mealSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String, // Breakfast, Lunch, Dinner
    required: true,
  },
  dishes: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Dish',
        required: true,
      },
    ],
  },
  description: {
    type: String, // Roti, Rice, Curry, Dry sabji, etc
    required: true,
  },
  cost_price: {
    type: Number,
    required: true,
  },
  selling_price: {
    type: Number,
    required: true,
  },
  discount_percentage: {
    type: Number,
    required: true,
  },
  img_url: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Instance methods

const Meal = mongoose.model('Meal', mealSchema);

module.exports = Meal;
