const express = require('express');
const authController = require('../controllers/auth');
const orderController = require('../controllers/order');

const router = express.Router();

router
  .route('/create-cod-order')
  .post(authController.protect, orderController.createCodOrder);

router
  .route('/create-razorpay-order')
  .post(authController.protect, orderController.createRazorpayOrder);

router
  .route('/verify-payment')
  .post(authController.protect, orderController.verifyPayment);

router.get('/user-orders', authController.protect, orderController.getUserOrders);

router.get('/', authController.protect, orderController.getAllOrders);

router
  .route('/:id')
  .get(orderController.getOrder)
  .patch(orderController.updateOrder)
  .delete(orderController.deleteOrder);

module.exports = router;
