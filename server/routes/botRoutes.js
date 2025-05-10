const express = require('express');
const router = express.Router();

const { Stream, NewChat, FetchChats, FetchChatMessages, getChatDetails } = require('../controllers/botControllers');

router.post('/chat/stream', Stream);
router.post('/chat/new', NewChat);
router.post('/chats', FetchChats);
router.post('/chat/messages', FetchChatMessages);
router.post('/chat/details', getChatDetails);
module.exports = router;