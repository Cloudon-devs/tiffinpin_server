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
  tag: {
    type: String, // Best seller
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
    type: String,
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
  discounted_price: {
    type: Number,
    required: true,
  },
  discount_percentage: {
    type: Number,
    // required: true,
  },
  is_active: {
    type: Boolean,
    default: false,
  },
  tag: {
    type: String,
    default: ""
  },
  img_url: {
    type: [String],
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    set: (value) => {
      // Ensure the date is stored in YYYY-MM-DD format
      return new Date(value).toISOString().split('T')[0];
    },
  },
  start_hour: {
    type: Number,
    required: true,
  },
  end_hour: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual property to format the date as YYYY-MM-DD
mealSchema.virtual('formattedDate').get(function () {
  return this.date.toISOString().split('T')[0];
});

mealSchema.set('toJSON', { virtuals: true });
mealSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Meal', mealSchema);
