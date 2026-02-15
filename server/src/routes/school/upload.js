const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const uploadEducation = require('../../middleware/uploadEducation');
const uploadController = require('../../controllers/school/uploadController');

// 文件上传相关路由
router.post('/education', protect, uploadEducation.single('file'), uploadController.uploadEducationFile);
router.post('/education/multiple', protect, uploadEducation.array('files', 10), uploadController.uploadMultipleFiles);

module.exports = router;
