const express = require('express');
const kitchenController = require('../controllers/kitchen');

const router = express.Router();

router.route('/close').post(kitchenController.closeKitchen);

router.route('/reopen').post(kitchenController.reopenKitchen);

module.exports = router;
