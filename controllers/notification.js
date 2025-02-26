const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(
    require('../credentials/firebase_sdk.json'),
  ),
});

exports.saveFCMToken = catchAsync(async (req, res) => {
  const { fcmToken } = req.body;
  const userId = req.user.id;

  console.log(req.body);

  await User.findByIdAndUpdate(userId, { fcmToken }, { upsert: true });

  res.status(201).json({
    status: 'success',
    data: {
      message: 'FCM token saved successfully!',
    },
  });
});

exports.sendNotificationByPhone = catchAsync(async (req, res) => {
  const { phoneNumber, title, body } = req.body;

  const user = await User.findOne({ mobile: phoneNumber });
  if (!user || !user.fcmToken) {
    return res.status(404).json({
      status: 'fail',
      message: 'User not found or FCM token not available',
    }); 
  }

  const message = {
    notification: {
      title,
      body,
    },
    token: user.fcmToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Notification sent successfully:", response);
    res.status(200).json({
      status: 'success',
      data: { messageId: response },
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

exports.sendNotifications = catchAsync(async (req, res) => {
  const { userId, title, body } = req.body;

  console.log('Sending notification to user:', userId);
  console.log('Notification title:', title);
  console.log('Notification body:', body);

  const user = await User.findOne({ _id: userId });
  if (!user || !user.fcmToken) {
    console.error('User or FCM token not found for userId:', userId);
    return res.status(404).json({
      status: 'fail',
      message: 'User or FCM token not found',
    });
  }

  // Send the notification
  await sendNotification(user.fcmToken, title, body);

  res.status(200).json({
    status: 'success',
    data: {
      message: 'Notification sent successfully',
    },
  });
});
