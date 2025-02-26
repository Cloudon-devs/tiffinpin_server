const Coupon = require('../models/Coupon');
const catchAsync = require('../utils/catchAsync');

// Create a new coupon
exports.createCoupon = catchAsync(async (req, res) => {
  const newCoupon = await Coupon.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      coupon: newCoupon,
    },
  });
});

// Get all coupons
exports.getAllCoupons = catchAsync(async (req, res) => {
  const userId = req.user.id;

  console.log(userId);
  const coupons = await Coupon.find({ user: userId });
  res.status(200).json({
    status: 'success',
    results: coupons.length,
    data: {
      coupons,
    },
  });
});

// Get a single coupon by ID
exports.getCoupon = catchAsync(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    return res.status(404).json({
      status: 'fail',
      message: 'No coupon found with that ID',
    });
  }
  res.status(200).json({
    status: 'success',
    data: {
      coupon,
    },
  });
});

// Update a coupon by ID
exports.updateCoupon = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      status: 'fail',
      message: 'No user found with that ID',
    });
  }

  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!coupon) {
    return res.status(404).json({
      status: 'fail',
      message: 'No coupon found with that ID',
    });
  }
  res.status(200).json({
    status: 'success',
    data: {
      coupon,
    },
  });
});

// Delete a coupon by ID
exports.deleteCoupon = catchAsync(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) {
    return res.status(404).json({
      status: 'fail',
      message: 'No coupon found with that ID',
    });
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
