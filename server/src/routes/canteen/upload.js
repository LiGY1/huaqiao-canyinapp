const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const uploadService = require('../../services/canteen/uploadController');

// 文件上传路由
router.post('/', protect, upload.single('image'), uploadService.uploadImage);
router.post('/multiple', protect, upload.array('images', 10), uploadService.uploadMultipleImages);

module.exports = router;
