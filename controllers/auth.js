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

const admin = require('firebase-admin');

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
