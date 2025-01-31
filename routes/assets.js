const express = require('express');
const assetController = require('../controllers/assets');
const router = express.Router();

router.post('/upload', assetController.uploadImage);
router.get('/images', assetController.getImages);

module.exports = router;
