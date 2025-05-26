const express = require('express');
const router = express.Router();
const { createAdminAccount, adminLogin } = require('../controllers/adminController');

router.post('/create', createAdminAccount);
router.post('/login', adminLogin);

module.exports = router;
