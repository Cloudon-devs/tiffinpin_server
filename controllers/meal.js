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
  const meals = await Meal.find().populate('dishes').sort({ is_active: -1 });

  // Generate new pre-signed URLs for the images
  meals.forEach((meal) => {
    if (meal.asset_aws_key && meal.asset_aws_key.length > 0) {
      meal.img_url = meal.asset_aws_key.map((key) => generatePresignedUrl(key));
    }
  });

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

exports.getMealsForCurrentDate = catchAsync(async (req, res) => {
  const currentDate = new Date();
  const localDate = new Date(
    currentDate.getTime() - currentDate.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .split('T')[0]; // Get current date in local time zone in YYYY-MM-DD format

  const meals = await Meal.find().populate('dishes');

  // Filter meals based on the formatted date
  const filteredMeals = meals.filter((meal) => {
    const mealDate = meal.date.toISOString().split('T')[0];
    return mealDate === localDate;
  });

  res.status(200).json({
    status: 'success',
    data: {
      meals: filteredMeals,
    },
  });
});

exports.getMealsForCurrentDateAndTime = catchAsync(async (req, res) => {
  const currentDate = new Date();
  const localDate = new Date(
    currentDate.getTime() - currentDate.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .split('T')[0]; // Get current date in local time zone in YYYY-MM-DD format

  const localTime = new Date(
    currentDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
  );
  const currentHour = localTime.getHours(); // Get current hour in local time

  console.log('Current local date: ', localDate);
  console.log('Current local time: ', currentHour);

  const meals = await Meal.find({
    date: localDate,
    start_hour: { $lte: currentHour },
    end_hour: { $gte: currentHour },
  }).populate('dishes');

  res.status(200).json({
    status: 'success',
    data: {
      meals,
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
