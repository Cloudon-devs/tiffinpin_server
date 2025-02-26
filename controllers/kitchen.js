const Meal = require('../models/Meal');
const Dish = require('../models/Dish');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.closeKitchen = catchAsync(async (req, res) => {
  const { reason } = req.body;

  // Update all meals to inactive
  const updatedMeals = await Meal.updateMany(
    {},
    {
      is_active: false,
    },
  );

  // Update all dishes to inactive
  const updatedDishes = await Dish.updateMany(
    {},
    {
      is_active: false,
    },
  );

  console.log('Kitchen closure - Updated meals:', updatedMeals.modifiedCount);
  console.log('Kitchen closure - Updated dishes:', updatedDishes.modifiedCount);

  res.status(200).json({
    status: 'success',
    data: {
      message: 'Kitchen closed successfully',
      updatedMeals: updatedMeals.modifiedCount,
      updatedDishes: updatedDishes.modifiedCount,
      reason,
    },
  });
});

exports.reopenKitchen = catchAsync(async (req, res) => {
  // Update all meals to active
  const updatedMeals = await Meal.updateMany(
    {},
    {
      is_active: true,
      is_show: true,
    },
  );

  // Update all dishes to active
  const updatedDishes = await Dish.updateMany(
    {},
    {
      is_active: true,
      is_show: true,
    },
  );

  console.log('Kitchen reopening - Updated meals:', updatedMeals.modifiedCount);
  console.log(
    'Kitchen reopening - Updated dishes:',
    updatedDishes.modifiedCount,
  );

  res.status(200).json({
    status: 'success',
    data: {
      message: 'Kitchen reopened successfully',
      updatedMeals: updatedMeals.modifiedCount,
      updatedDishes: updatedDishes.modifiedCount,
    },
  });
});
