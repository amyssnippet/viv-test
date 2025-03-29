const express = require('express');
const router = express.Router();

const { Stream, NewChat, FetchChats, FetchChatMessages } = require('../controllers/botControllers'); 

router.post('/chat/stream', Stream);
router.post('/chat/new', NewChat);
router.post('/chats', FetchChats);
router.post('/chat/messages', FetchChatMessages);
module.exports = router;