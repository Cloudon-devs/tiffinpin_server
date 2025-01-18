const express = require('express');
const authController = require('../controllers/auth');
const addressController = require('../controllers/address');

const router = express.Router();

router
  .route('/')
  .get(addressController.getAllAddresses)
  .post(authController.protect, addressController.createAddress);

router
  .route('/')
  .get(authController.protect, addressController.getAllAddressesByUserId);

router
  .route('/:id')
  .get(addressController.getAddress)
  .patch(addressController.updateAddress)
  .delete(addressController.deleteAddress);

module.exports = router;
