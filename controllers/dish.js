const Dish = require('../models/Dish');
const catchAsync = require('../utils/catchAsync');
const { generatePresignedUrl } = require('../utils/s3');
const { getPresignedUrl } = require('./assets');

// Create a new dish
exports.createDish = catchAsync(async (req, res) => {
  const newDish = await Dish.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      dish: newDish,
    },
  });
});

// Get all dishes
exports.getAllDishes = catchAsync(async (req, res, next) => {
  const dishes = await Dish.find();

  // Generate new pre-signed URLs for the images
  dishes.forEach((dish) => {
    if (dish.img_url) {
      dish.img_url = dish.img_url.map(() =>
        generatePresignedUrl(dish?.asset_aws_key),
      );
    }
  });

  res.status(200).json({
    status: 'success',
    results: dishes.length,
    data: {
      dishes,
    },
  });
});

// Get a single dish by ID
exports.getDish = catchAsync(async (req, res) => {
  const dish = await Dish.findById(req.params.id);
  if (!dish) {
    return res.status(404).json({
      status: 'fail',
      message: 'No dish found with that ID',
    });
  }

  if (dish.img_url) {
    dish.img_url = dish.img_url.map((key) => getPresignedUrl(key));
  }

  res.status(200).json({
    status: 'success',
    data: {
      dish,
    },
  });
});

// Update a dish by ID
exports.updateDish = catchAsync(async (req, res, next) => {
  const dish = await Dish.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!dish) {
    return next(new AppError('No dish found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      dish,
    },
  });
});

// Delete a dish by ID
exports.deleteDish = catchAsync(async (req, res) => {
  const dish = await Dish.findByIdAndDelete(req.params.id);
  if (!dish) {
    return res.status(404).json({
      status: 'fail',
      message: 'No dish found with that ID',
    });
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
