const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const uploadController = require('../../controllers/canteen/uploadController');

// 文件上传路由
router.post('/', protect, upload.single('image'), uploadController.uploadImage);
router.post('/multiple', protect, upload.array('images', 10), uploadController.uploadMultipleImages);

module.exports = router;
