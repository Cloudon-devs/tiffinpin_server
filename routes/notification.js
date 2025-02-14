const express = require('express');

const authController = require('../controllers/auth');
const notificationController = require('../controllers/notification');

const router = express.Router();

router.route('/save-fcm-token').post(authController.protect, notificationController.saveFCMToken);
router
  .route('/')
  .post(authController.protect, notificationController.sendNotifications);

module.exports = router;
