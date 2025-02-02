const express = require('express');
const couponController = require('../controllers/coupon');
const authController = require('../controllers/auth');

const router = express.Router();

// Routes
router
  .route('/')
  .get(authController.protect, couponController.getAllCoupons)
  .post(couponController.createCoupon);

router
  .route('/:id')
  .get(couponController.getCoupon)
  .patch(couponController.updateCoupon)
  .delete(couponController.deleteCoupon);

module.exports = router;
