const express = require('express');

const authController = require('./../controllers/auth');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/send-otp', authController.sendOtp);
router.post('/login', authController.login);
router.patch('/onboard/:id', authController.updateUser);

module.exports = router;
