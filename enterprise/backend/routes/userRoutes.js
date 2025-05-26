const express = require('express');
const router = express.Router();
const { createUser, userLogin } = require('../controllers/userController');

router.post('/create', createUser);
router.post('/login', userLogin);

module.exports = router;
