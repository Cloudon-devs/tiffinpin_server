const express = require('express');

const dishController = require('../controllers/dish');

const router = express.Router();

router
  .route('/')
  .get(dishController.getAllDishes)
  .post(dishController.createDish);

router
  .route('/:id')
  .get(dishController.getDish)
  .patch(dishController.updateDish)
  .delete(dishController.deleteDish);

module.exports = router;
