const express = require('express');
const mealController = require('../controllers/meal');

const router = express.Router();

router
  .route('/')
  .get(mealController.getAllMeals)
  .post(mealController.createMeal);

router
  .route('/:id')
  .get(mealController.getMeal)
  .patch(mealController.updateMeal)
  .delete(mealController.deleteMeal);

module.exports = router;
