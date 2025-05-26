const express = require('express');
const router = express.Router();
const { sendChat, getChats } = require('../controllers/chatController');
const { authMiddleware } = require('../middlewares/auth');

router.post('/send', authMiddleware, sendChat);
router.get('/history', authMiddleware, getChats);

module.exports = router;
