const Razorpay = require('razorpay');
const Order = require('../models/Order');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createRazorpayOrder = catchAsync(async (req, res, next) => {
  const { amount, currency, receipt } = req.body;

  // console.log('Coming herader: ', req.body);

  // Create a new Razorpay order
  const razorpayOrder = await razorpay.orders.create({
    amount: amount * 100, // Amount in paise
    currency,
    receipt,
  });

  if (!razorpayOrder) {
    return next(new AppError('Failed to create Razorpay order', 500));
  }

  res.status(201).json({
    status: 'success',
    data: {
      razorpayOrder,
    },
  });
});

exports.verifyPayment = catchAsync(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const generatedSignature = hmac.digest('hex');

  if (generatedSignature !== razorpay_signature) {
    return next(new AppError('Payment verification failed', 400));
  }

  // Create a new order in your database
  const newOrder = await Order.create({
    ...req.body,
    user_id: req.user.id,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    status: 'paid',
  });

  res.status(200).json({
    status: 'success',
    data: {
      order: newOrder,
    },
  });
});

/* 
  Create COD Order
*/
exports.createCodOrder = catchAsync(async (req, res, next) => {
  const { meals, total_price, amount, currency, receipt } = req.body;

  // Create a new order in your database
  const newOrder = await Order.create({
    user: req.user.id,
    meals: meals.map((meal) => meal.meal_id),
    total_price,
    amount,
    currency,
    receipt,
    status: 'pending',
    payment_method: 'COD',
    time: new Date().toTimeString().split(' ')[0],
  });

  res.status(201).json({
    status: 'success',
    data: {
      order: newOrder,
    },
  });
});

exports.getUserOrders = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const orders = await Order.find({ user: userId }).populate('meals');

  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: {
      orders,
    },
  });
});

// Get all orders
exports.getAllOrders = catchAsync(async (req, res) => {
  const orders = await Order.find().populate('meals');
  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: {
      orders,
    },
  });
});

// Get a single order by ID
exports.getOrder = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user meal transaction',
  );
  if (!order) {
    return res.status(404).json({
      status: 'fail',
      message: 'No order found with that ID',
    });
  }
  res.status(200).json({
    status: 'success',
    data: {
      order,
    },
  });
});

exports.getAllOrdersByUserId = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const orders = await Order.find({ user_id: userId });
  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: {
      orders,
    },
  });
});

// Update an order by ID
exports.updateOrder = catchAsync(async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('user meal transaction');
  if (!order) {
    return res.status(404).json({
      status: 'fail',
      message: 'No order found with that ID',
    });
  }
  res.status(200).json({
    status: 'success',
    data: {
      order,
    },
  });
});

// Delete an order by ID
exports.deleteOrder = catchAsync(async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) {
    return res.status(404).json({
      status: 'fail',
      message: 'No order found with that ID',
    });
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
