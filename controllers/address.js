const Address = require('../models/Address');
const catchAsync = require('../utils/catchAsync');

// Create a new address
exports.createAddress = catchAsync(async (req, res) => {
  const newAddress = await Address.create(req.body);

  // Update the user's address array
  await User.findByIdAndUpdate(req.user.id, {
    $push: { addresses: newAddress._id },
  });

  res.status(201).json({
    status: 'success',
    data: {
      address: newAddress,
    },
  });
});

// Get all addresses
exports.getAllAddresses = catchAsync(async (req, res) => {
  const addresses = await Address.find();
  res.status(200).json({
    status: 'success',
    results: addresses.length,
    data: {
      addresses,
    },
  });
});

// Get a single address by ID
exports.getAddress = catchAsync(async (req, res) => {
  const address = await Address.findById(req.params.id);
  if (!address) {
    return res.status(404).json({
      status: 'fail',
      message: 'No address found with that ID',
    });
  }
  res.status(200).json({
    status: 'success',
    data: {
      address,
    },
  });
});

exports.getAllAddressesByUserId = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const addresses = await Address.find({ user_id: req.params.user_id });
  res.status(200).json({
    status: 'success',
    results: addresses.length,
    data: {
      addresses,
    },
  });
});

// Update an address by ID
exports.updateAddress = catchAsync(async (req, res) => {
  const address = await Address.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!address) {
    return res.status(404).json({
      status: 'fail',
      message: 'No address found with that ID',
    });
  }
  res.status(200).json({
    status: 'success',
    data: {
      address,
    },
  });
});

// Delete an address by ID
exports.deleteAddress = catchAsync(async (req, res) => {
  const address = await Address.findByIdAndDelete(req.params.id);
  if (!address) {
    return res.status(404).json({
      status: 'fail',
      message: 'No address found with that ID',
    });
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
