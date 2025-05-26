const express = require('express');
const router = express.Router();
const { verifyEnterprise } = require('../controllers/verificationController');

router.get('/verify/:token', verifyEnterprise);

module.exports = router;
