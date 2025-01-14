const express = require('express');
const mealController = require('../controllers/meal');

const router = express.Router();

// Define specific routes before the :id route
router.route('/current-date').get(mealController.getMealsForCurrentDate);

router
  .route('/current-date-time')
  .get(mealController.getMealsForCurrentDateAndTime);

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
