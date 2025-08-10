const express = require('express');
const router = express.Router();

const upload = require('../middlewares/uploadMiddleware');
const handleUpload = require('../controllers/imageController');

// POST /api/upload - handles image upload and classification
router.post('/upload', upload.single('image'), handleUpload);

module.exports = router;
