const Razorpay = require('razorpay');
const Order = require('../models/Order');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const mongoose = require('mongoose');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const admin = require('firebase-admin');
const { generatePresignedUrl } = require('../utils/s3');
const { sendOrderNotificationEmail } = require('./email');
// const serviceAccount = require('../../credentials/firebase_keys.json');

// Initialize Firebase instance
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

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
  const {
    meals,
    dishes,
    address,
    price,
    amount,
    currency,
    receipt,
    status,
    couponId,
  } = req.body;

  // Log the entire request body for debugging
  console.log('Request body: ', req.body);

  // Extract the address ID if the address is an object
  const addressId = address._id ? address._id : address;

  // Validate address
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    return next(new AppError('Invalid address ID', 400));
  }

  // Validate and convert meal IDs
  const validMeals = meals.map((meal) => {
    if (!mongoose.Types.ObjectId.isValid(meal.meal_id)) {
      throw new AppError(`Invalid meal ID: ${meal.meal_id}`, 400);
    }
    return {
      meal: new mongoose.Types.ObjectId(meal.meal_id),
      quantity: meal.quantity,
    };
  });

  // Validate and convert dish IDs
  const validDishes = dishes.map((dish) => {
    if (!mongoose.Types.ObjectId.isValid(dish.dish_id)) {
      throw new AppError(`Invalid dish ID: ${dish.dish_id}`, 400);
    }
    return {
      dish: new mongoose.Types.ObjectId(dish.dish_id),
      quantity: dish.quantity,
      sub_category: dish.sub_category,
    };
  });

  // Validate and convert coupon ID
  if (couponId && !mongoose.Types.ObjectId.isValid(couponId)) {
    return next(new AppError('Invalid coupon ID', 400));
  }

  // Create a new order in your database
  const newOrder = await Order.create({
    user: req.user.id,
    address: addressId,
    meals: validMeals,
    dishes: validDishes,
    price,
    amount,
    currency,
    receipt,
    status,
    payment_method: 'COD',
    time: new Date().toTimeString().split(' ')[0],
    coupon: couponId, // Add coupon ID to the order
  });

  // Update the coupon to mark it as used
  if (couponId) {
    console.log('Coupon ID: ', couponId);
    await Coupon.findByIdAndUpdate(couponId, { is_used: true });
  }

  const discount = Math.floor(Math.random() * (11 - 5 + 1)) + 5;

  const newCoupon = await Coupon.create({
    name: 'Recurring',
    off: discount,
    category: 'Off',
    description_text:
      'Thank you for your order! Enjoy a discount on your next purchase.',
    img_url: '/path/to/coupon/image.jpg',
    isScratched: false,
    is_used: false,
    expiryTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    user: req.user.id,
  });

  await User.findByIdAndUpdate(req.user.id, {
    $push: { coupons: newCoupon._id },
  });

  /* 
    Email notifications
  */
  // Populate necessary fields for email
  const populatedOrder = await Order.findById(newOrder._id)
    .populate('user')
    .populate('address')
    .populate({
      path: 'meals.meal',
      model: 'Meal',
    })
    .populate({
      path: 'dishes.dish',
      model: 'Dish',
    });

  console.log('Populated Order:', populatedOrder);

  await sendOrderNotificationEmail(populatedOrder);

  /* 
    Push notifications
  */
  const message = {
    notification: {
      title: 'New Order Received',
      body: 'You have a new order. Please check your dashboard.',
    },
    token: 'flexkz1_XYovgupPxDSq6n:APA91bHZyxpkuhu19lOh8kwWe77-H17tKJSwaKAkNBOSqueJBJqtp0DdrJCfhS6XuCO9nll49yYCx0gtvqpoiBXT3hS0uu7rK742pN5xuYDv00C0n6kJRv0', // Replace with the actual FCM token
  };

  admin
    .messaging()
    .send(message)
    .then((response) => {
      console.log('Successfully sent message:', response);
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });

  res.status(201).json({
    status: 'success',
    data: {
      order: newOrder,
      new_coupon: newCoupon,
    },
  });
});

exports.getUserOrders = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const orders = await Order.find({ user: userId })
    .populate({
      path: 'meals.meal',
      model: 'Meal',
    })
    .populate({
      path: 'dishes.dish',
      model: 'Dish',
    })
    .sort({ createdAt: -1 });

  // Generate new pre-signed URLs for the images
  orders.forEach((order) => {
    // Handle meals
    order.meals.forEach((mealOrder) => {
      if (
        mealOrder.meal?.asset_aws_key &&
        mealOrder.meal.asset_aws_key.length > 0
      ) {
        mealOrder.meal.img_url = mealOrder.meal.asset_aws_key.map((key) =>
          generatePresignedUrl(key),
        );
      }
    });

    // Handle dishes
    order.dishes.forEach((dishOrder) => {
      if (
        dishOrder.dish?.asset_aws_key &&
        dishOrder.dish.asset_aws_key.length > 0
      ) {
        dishOrder.dish.img_url = dishOrder.dish.asset_aws_key.map((key) =>
          generatePresignedUrl(key),
        );
      }
    });
  });

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
  const { startDate, endDate } = req.query;

  // Create filter object
  let filter = {};
  if (startDate && endDate) {
    filter.createdAt = {
      $gte: new Date(startDate), // Greater than or equal to startDate
      $lte: new Date(endDate), // Less than or equal to endDate
    };
  }

  console.log(filter);

  const orders = await Order.find(filter)
    .populate({
      path: 'meals.meal',
      model: 'Meal',
    })
    .populate({
      path: 'dishes.dish',
      model: 'Dish',
    })
    .populate('address')
    .populate('user')
    .sort({ createdAt: 1 });

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
  console.log('Fetching order with ID:', req.params.id);
  const order = await Order.findById(req.params.id)
    .populate({
      path: 'meals.meal',
      model: 'Meal',
      options: { strictPopulate: false },
    })
    .populate({
      path: 'dishes.dish',
      model: 'Dish',
      options: { strictPopulate: false },
    })
    .populate('address')
    .populate('user')
    .populate('coupon')
    .sort({ createdAt: 1 });

  if (!order) {
    console.error('No order found with ID:', req.params.id);
    return res.status(404).json({
      status: 'fail',
      message: 'No order found with that ID',
    });
  }

  // Generate presigned URLs for img_url in meals
  order.meals.forEach((meal) => {
    if (meal.meal.asset_aws_key && meal.meal.asset_aws_key.length > 0) {
      meal.meal.img_url = meal.meal.asset_aws_key.map((key) =>
        generatePresignedUrl(key),
      );
    }
  });

  console.log('Order fetched successfully:', order);
  res.status(200).json({
    status: 'success',
    data: {
      order,
    },
  });
});

exports.getAllOrdersByUserId = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const orders = await Order.find({ user_id: userId }).sort('');
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
  })
    .populate('user')
    .populate({
      path: 'meals.meal',
      model: 'Meal',
    })
    .populate({
      path: 'dishes.dish',
      model: 'Dish',
    })
    .populate('transaction');

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
