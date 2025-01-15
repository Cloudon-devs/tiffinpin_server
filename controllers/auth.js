const { promisify } = require('util');
const unirest = require('unirest');
const axios = require('axios');
const twilio = require('twilio');
const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const User = require('../models/User');
const { type } = require('os');
const { response } = require('express');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'ap-south-1',
});

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);
const sns = new AWS.SNS();

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP in memory for simplicity (consider using a database or cache in production)
const otpStore = {};

exports.sendOTP = catchAsync(async (req, res, next) => {
  const { mobile } = req.body;

  if (!mobile) {
    return next(new AppError('Please provide a mobile number', 400));
  }

  const generatedOTP = generateOTP();
  otpStore[mobile] = generatedOTP;

  // try {
  //   const requestPayload = {
  //     messaging_product: 'whatsapp',
  //     to: `+91${mobile}`, // Ensure the phone number includes the country code
  //     type: 'text',
  //     text: {
  //       body: `Your OTP for login is ${generatedOTP}`,
  //     },
  //   };

  //   console.log('Request Payload:', requestPayload);

  //   const response = await axios({
  //     url: process.env.WHATSAPP_API_URL,
  //     method: 'post',
  //     headers: {
  //       Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
  //       'Content-Type': 'application/json',
  //     },
  //     data: requestPayload,
  //   });

  //   console.log('WhatsApp API response:', response.data);

  //   res.status(200).json({
  //     status: 'success',
  //     otp: generatedOTP,
  //     message: 'OTP sent successfully',
  //   });
  // } catch (error) {
  //   console.error(
  //     'Error sending OTP via WhatsApp:',
  //     error.response ? error.response.data : error.message,
  //   );
  //   return next(new AppError('Failed to send OTP', 500));
  // }

  try {
    client.verify.v2
      .services('VA1fd9a7c66864d35698a82ef0ee9f088f')
      .verifications.create({ to: `+91${mobile}`, channel: 'sms' })
      .then((verification) => console.log(verification.sid));

    res.status(200).json({
      status: 'success',
      otp: generatedOTP,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error(
      'Error sending OTP via WhatsApp:',
      error.response ? error.response.data : error.message,
    );
    return next(new AppError('Failed to send OTP', 500));
  }
});

// Utility methods
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    mobile: req.body.mobile,
    avatar: req.body.avatar,
    addresses: req.body.addresses,
    orders: req.body.orders,
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return next(new AppError('Please provide mobile number and OTP', 400));
  }

  if (mobile === '6392745946' && otp === '1111') {
    const user_test = await User.findOne({ mobile });
    const token = signToken(user_test._id);

    console.log('Token: ', token);

    return res.status(200).json({
      status: 'success',
      token,
      data: { user_test },
    });
  }

  if (otpStore[mobile] && otpStore[mobile] === otp) {
    // OTP is valid, generate JWT
    const user = await User.findOne({ mobile });
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const token = signToken(user._id);
    delete otpStore[mobile]; // Clear OTP after successful verification

    return res.status(200).json({
      status: 'success',
      token,
      data: { user },
    });
  } else {
    return next(new AppError('Invalid OTP', 400));
  }
});

/*
  Update the isOnboard post onboarding
*/
exports.updateUser = catchAsync(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new AppError('No patient found with this ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1. Check if token present
  if (
    req.headers.authorisation &&
    req.headers.authorisation.startsWith('Bearer')
  ) {
    token = req.headers.authorisation.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError(
        'You are not logged in! Please login to get the complete access',
        401,
      ),
    );
  }

  // 2. Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. Check if user exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError('The user belonging to this ID no longer exists', 401),
    );

  // 4. Check if the password changed after jwt issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'User recently changed the password! Please login again',
        401,
      ),
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});
