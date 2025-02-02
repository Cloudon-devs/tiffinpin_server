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
const { OAuth2Client } = require('google-auth-library');
const client_google = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { createClient } = require('@supabase/supabase-js');

const admin = require('firebase-admin');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'ap-south-1',
});

admin.initializeApp({
  credential: admin.credential.cert(
    require('../credentials/firebase_sdk.json'),
  ),
});

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);
const sns = new AWS.SNS();

// Store OTP in memory for simplicity (consider using a database or cache in production)
const otpStore = {};

const generateOtp = () => {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  console.log('OTP: ', otp);

  return otp;
};

const sendOtpTwilio = async (phoneNumber, otp) => {
  try {
    const message = await client.messages.create({
      body: `Your OTP code is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${phoneNumber}`,
    });
    console.log('OTP sent via Twilio:', message.sid);
  } catch (error) {
    console.error('Error sending OTP via Twilio:', error.message);
    throw new AppError('Failed to send OTP. Please try again later.', 500);
  }
};

exports.sendOtp = catchAsync(async (req, res, next) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return next(new AppError('Please provide a phone number.', 400));
  }

  if (phoneNumber === '6392745946') {
    return res.status(200).json({
      status: 'success',
      message: 'OTP sent successfully to Piyush, OTP: 1111',
    });
  }

  const otp = generateOtp();

  // Check if OTP already exists for the mobile number
  const { data, error } = await supabase
    .from('otps')
    .select('id')
    .eq('mobile', phoneNumber)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking OTP in Supabase:', error.message);
    throw new AppError('Failed to check OTP. Please try again later.', 500);
  }

  if (data) {
    // Update the existing OTP
    const { error: updateError } = await supabase
      .from('otps')
      .update({ otp })
      .eq('mobile', phoneNumber);

    if (updateError) {
      console.error('Error updating OTP in Supabase:', updateError.message);
      throw new AppError('Failed to update OTP. Please try again later.', 500);
    }
  } else {
    // Insert a new OTP
    const { error: insertError } = await supabase
      .from('otps')
      .insert([{ mobile: phoneNumber, otp }]);

    if (insertError) {
      console.error('Error storing OTP in Supabase:', insertError.message);
      throw new AppError('Failed to store OTP. Please try again later.', 500);
    }
  }

  await sendOtpTwilio(phoneNumber, otp);

  res.status(200).json({
    status: 'success',
    message: 'OTP sent successfully via Twilio.',
  });
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

  // Special case for mobile number 6392745946 with OTP 1111
  if (mobile === '6392745946' && otp === '1111') {
    // Find or create the user
    let user = await User.findOne({ mobile });
    if (!user) {
      user = await User.create({ mobile });

      // Generate a random discount value between 6 and 10
      const discount = Math.floor(Math.random() * (10 - 6 + 1)) + 6;

      // Create a new coupon for the user
      const newCoupon = await Coupon.create({
        name: 'Welcome Coupon',
        off: discount,
        category: 'Off',
        description_text:
          'Welcome to our service! Enjoy a discount on your first order.',
        img_url: '/path/to/coupon/image.jpg',
        isScratched: false,
        expiryTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      });

      // Add the coupon to the user's profile
      user.coupons.push(newCoupon._id);
      await user.save();
    }

    // Generate JWT token
    const token = signToken(user._id);

    return res.status(200).json({
      status: 'success',
      token,
      data: { user },
    });
  }

  // Retrieve the OTP from Supabase
  const { data, error } = await supabase
    .from('otps')
    .select('otp')
    .eq('mobile', mobile)
    .single();

  console.log('Retrieved OTP from Supabase:', data ? data.otp : null);

  if (error || !data || data.otp !== otp) {
    console.log('Error:', error);
    return next(new AppError('Invalid OTP', 400));
  }

  // Find or create the user
  let user = await User.findOne({ mobile });
  if (!user) {
    user = await User.create({ mobile });

    // Generate a random discount value between 6 and 10
    const discount = Math.floor(Math.random() * (10 - 6 + 1)) + 6;

    // Create a new coupon for the user
    const newCoupon = await Coupon.create({
      name: 'Welcome Coupon',
      off: discount,
      category: 'Off',
      description_text:
        'Welcome to our service! Enjoy a discount on your first order.',
      img_url: '/path/to/coupon/image.jpg',
      isScratched: false,
      expiryTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    });

    // Add the coupon to the user's profile
    user.coupons.push(newCoupon._id);
    await user.save();
  }

  // Generate JWT token
  const token = signToken(user._id);

  // Delete the OTP from Supabase after successful validation
  await supabase.from('otps').delete().eq('mobile', mobile);

  res.status(200).json({
    status: 'success',
    token,
    data: { user },
  });
});

exports.verifyOtp = catchAsync(async (req, res, next) => {
  const { phoneNumber, otp } = req.body;

  if (!phoneNumber || !otp) {
    return next(new AppError('Please provide a phone number and OTP.', 400));
  }

  console.log('Retrieved OTP from Supabase:', phoneNumber, otp);

  // Retrieve the OTP from Supabase
  const { data, error } = await supabase
    .from('otps')
    .select('otp')
    .eq('mobile', phoneNumber)
    .single();

  console.log('Retrieved OTP from Supabase:', data ? data.otp : null);

  if (error || !data || data.otp !== otp) {
    console.log('Error : ', error);
    return next(new AppError('Invalid OTP.', 400));
  }

  // Find or create the user
  let user = await User.findOne({ mobile: phoneNumber });
  if (!user) {
    user = await User.create({ mobile: phoneNumber });
  }

  // Generate JWT token
  const token = signToken(user._id);

  // Delete the OTP from Supabase after successful validation
  await supabase.from('otps').delete().eq('mobile', phoneNumber);

  res.status(200).json({
    status: 'success',
    token,
    data: { user },
  });
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

// const verifyGoogleToken = async (token) => {
//   try {
//     console.log('Verifying token:', token); // Log the token value

//     const response = await axios.get(
//       `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`,
//     );
//     const ticket = response.data;

//     console.log('Ticket:', ticket);

//     if (!ticket || ticket.aud !== process.env.GOOGLE_CLIENT_ID) {
//       throw new Error('Invalid token');
//     }

//     return ticket;
//   } catch (error) {
//     console.error('Error verifying Google token:', error); // Log the error
//     throw error;
//   }
// };

const verifyFirebaseToken = async (idToken) => {
  try {
    console.log('Verifying Firebase token:', idToken);

    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    console.log('Decoded Token:', decodedToken);

    // Check if the user already exists
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      // Create a new user in the database with details from the decoded token
      user = await User.create({
        firebaseUid: decodedToken.uid,
        name: decodedToken.name,
        email: decodedToken.email,
        mobile: decodedToken.phone_number,
        avatar: decodedToken.picture,
      });

      console.log('New User:', user);
    } else {
      console.log('User already exists:', user);
    }

    // Return the decoded token information
    return decodedToken;
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      console.error(
        'Firebase ID token has expired. Please obtain a new token and try again.',
      );
      throw new Error(
        'Firebase ID token has expired. Please obtain a new token and try again.',
      );
    } else {
      console.error('Error verifying Firebase token:', error);
      throw error;
    }
  }
};

const verifyJwtToken = async (token) => {
  return await promisify(jwt.verify)(token, process.env.JWT_SECRET);
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );
  }

  let decoded;
  try {
    decoded = await verifyJwtToken(token);
  } catch (err) {
    try {
      console.log('Comoing');
      decoded = await verifyFirebaseToken(token);
    } catch (googleErr) {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
  }

  req.user = decoded;
  next();
});
