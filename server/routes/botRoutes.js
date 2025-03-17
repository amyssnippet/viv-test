const express = require('express');
const router = express.Router();

const { Stream } = require('../controllers/botControllers'); 

router.post('/chat/stream', Stream);

module.exports = router;