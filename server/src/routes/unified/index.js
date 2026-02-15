const express = require('express');
const router = express.Router();
const authService = require('../../services/unified/authController');
const { protect } = require('../../middleware/auth');

router.post('/login', authService.login);
router.get('/userinfo', protect, authService.getUserInfo);
router.get('/portal-config', authService.getPortalConfig);

module.exports = router;
