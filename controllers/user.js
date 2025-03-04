const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Route handlers
exports.getAllUsers = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  console.log('Received Query Params:', { startDate, endDate });

  // Create filter object
  let filter = {};
  if (startDate && endDate) {
    filter.createdAt = {
      $gte: new Date(startDate), // Greater than or equal to startDate
      $lte: new Date(endDate), // Less than or equal to endDate
    };
  }

  try {
    const users = await User.find(filter);

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

exports.getUser = catchAsync(async (req, res) => {
  // Extract the token from the Authorization header
  const token = req.headers.authorization.split(' ')[1];
  // Verify the token and extract the user ID
  const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use your JWT secret
  const userId = decoded.id;

  // Find the user by ID
  const user = await User.findById(userId).populate('coupons');

  if (!user) {
    return res.status(404).json({
      status: 'fail',
      message: 'User not found',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.getUserProfile = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const user = await User.findById(userId)
    .select('-password')
    .populate('coupons'); // Exclude password field
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.createUser = catchAsync(async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 12);

  const newUser = await User.create({
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword,
  });

  res.status(201).json({
    status: 'success',
    data: {
      user: newUser,
    },
  });
});

exports.updateUser = catchAsync(async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteUser = catchAsync(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
