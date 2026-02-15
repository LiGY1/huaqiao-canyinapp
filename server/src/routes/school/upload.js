const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const uploadEducation = require('../../middleware/uploadEducation');
const uploadService = require('../../services/school/uploadController');

// 文件上传相关路由
router.post('/education', protect, uploadEducation.single('file'), uploadService.uploadEducationFile);
router.post('/education/multiple', protect, uploadEducation.array('files', 10), uploadService.uploadMultipleFiles);

module.exports = router;
