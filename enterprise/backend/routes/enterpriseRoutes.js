const express = require('express');
const router = express.Router();
const { registerEnterprise } = require('../controllers/enterpriseController');

router.post('/register', registerEnterprise);

module.exports = router;
