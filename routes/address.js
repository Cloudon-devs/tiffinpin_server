const express = require('express');
const addressController = require('../controllers/address');

const router = express.Router();

router
  .route('/')
  .get(addressController.getAllAddresses)
  .post(addressController.createAddress);

router
  .route('/:id')
  .get(addressController.getAddress)
  .patch(addressController.updateAddress)
  .delete(addressController.deleteAddress);

module.exports = router;