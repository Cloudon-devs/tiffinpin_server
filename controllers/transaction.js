const Transaction = require('../models/Transaction');
const catchAsync = require('../utils/catchAsync');
const crypto = require('crypto');

exports.verifyPayment = catchAsync(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const generatedSignature = hmac.digest('hex');

  if (generatedSignature !== razorpay_signature) {
    return next(new AppError('Payment verification failed', 400));
  }

  // Update order status in your database
  const order = await Order.findOneAndUpdate(
    { razorpay_order_id },
    { status: 'paid', razorpay_payment_id, razorpay_signature },
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    data: {
      order,
    },
  });
});

// Create a new transaction
exports.createTransaction = catchAsync(async (req, res) => {
  const newTransaction = await Transaction.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      transaction: newTransaction,
    },
  });
});

// Get all transactions
exports.getAllTransactions = catchAsync(async (req, res) => {
  const transactions = await Transaction.find().populate('user');
  res.status(200).json({
    status: 'success',
    results: transactions.length,
    data: {
      transactions,
    },
  });
});

// Get a single transaction by ID
exports.getTransaction = catchAsync(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id).populate(
    'user',
  );
  if (!transaction) {
    return res.status(404).json({
      status: 'fail',
      message: 'No transaction found with that ID',
    });
  }
  res.status(200).json({
    status: 'success',
    data: {
      transaction,
    },
  });
});

// Update a transaction by ID
exports.updateTransaction = catchAsync(async (req, res) => {
  const transaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  ).populate('user');
  if (!transaction) {
    return res.status(404).json({
      status: 'fail',
      message: 'No transaction found with that ID',
    });
  }
  res.status(200).json({
    status: 'success',
    data: {
      transaction,
    },
  });
});

// Delete a transaction by ID
exports.deleteTransaction = catchAsync(async (req, res) => {
  const transaction = await Transaction.findByIdAndDelete(req.params.id);
  if (!transaction) {
    return res.status(404).json({
      status: 'fail',
      message: 'No transaction found with that ID',
    });
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
