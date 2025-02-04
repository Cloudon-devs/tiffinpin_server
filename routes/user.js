const express = require('express');

const userController = require('../controllers/user'); // Ensure this path is correct
const authController = require('../controllers/auth');

const router = express.Router();

// Routes
router.route('/profile').get(authController.protect, userController.getUser);

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
