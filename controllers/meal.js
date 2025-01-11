const Meal = require('../models/Meal');
const catchAsync = require('../utils/catchAsync');

// Create a new meal
exports.createMeal = catchAsync(async (req, res) => {
  const newMeal = await Meal.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      meal: newMeal,
    },
  });
});

// Get all meals
exports.getAllMeals = catchAsync(async (req, res) => {
  const meals = await Meal.find().populate('dishes');
  res.status(200).json({
    status: 'success',
    results: meals.length,
    data: {
      meals,
    },
  });
});

// Get a single meal by ID
exports.getMeal = catchAsync(async (req, res) => {
  const meal = await Meal.findById(req.params.id).populate('dishes');
  if (!meal) {
    return res.status(404).json({
      status: 'fail',
      message: 'No meal found with that ID',
    });
  }
  res.status(200).json({
    status: 'success',
    data: {
      meal,
    },
  });
});

// Update a meal by ID
exports.updateMeal = catchAsync(async (req, res) => {
  const meal = await Meal.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('dishes');
  if (!meal) {
    return res.status(404).json({
      status: 'fail',
      message: 'No meal found with that ID',
    });
  }
  res.status(200).json({
    status: 'success',
    data: {
      meal,
    },
  });
});

// Delete a meal by ID
exports.deleteMeal = catchAsync(async (req, res) => {
  const meal = await Meal.findByIdAndDelete(req.params.id);
  if (!meal) {
    return res.status(404).json({
      status: 'fail',
      message: 'No meal found with that ID',
    });
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
