const Order = require('../models/Order');
const catchAsync = require('../utils/catchAsync');

// Create a new order
exports.createOrder = catchAsync(async (req, res) => {
  const newOrder = await Order.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      order: newOrder,
    },
  });
});

// Get all orders
exports.getAllOrders = catchAsync(async (req, res) => {
  const orders = await Order.find().populate('user meal transaction');
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
