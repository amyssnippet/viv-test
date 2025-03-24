const express = require('express');
const router = express.Router();

const { Stream, NewChat, FetchChats } = require('../controllers/botControllers'); 

router.post('/chat/stream', Stream);
router.post('/chat/new', NewChat);
router.post('/chats', FetchChats);
module.exports = router;