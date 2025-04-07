const express = require('express');
const router = express.Router();
const User = require('../models/userSchema');
const { Signup, Login, UpdateUser } = require('../controllers/userController'); 

router.post('/signup', Signup);
router.post('/login', Login);
router.post('/chat/new', async (req, res) => {
    const { userId, messages } = req.body; // Get user ID and messages array from request

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const newChat = { messages }; // Create a new chat session
        user.chats.push(newChat);
        await user.save();

        res.status(201).json({ message: 'Chat started', chat: user.chats[user.chats.length - 1] });
    } catch (error) {
        res.status(500).json({ error: 'Error starting chat' });
    }
});
// Add a message to an existing chat
// router.post('/chat/message', async (req, res) => {
//     const { userId, chatId, message } = req.body; // Get data from request
//     console.log(req.body);
//     try {
//         const user = await User.findById(userId);
//         if (!user) return res.status(404).json({ error: 'User not found' });

//         const chat = user.chats.id(chatId);
//         if (!chat) return res.status(404).json({ error: 'Chat not found' });
//         console.log(message.inputMessage);
//         chat.messages.push(message.inputMessage);
//         await user.save();

//         res.status(200).json({ message: 'Message added', chat });
//     } catch (error) {
//         res.status(500).json({ error: 'Error adding message' });
//     }
// });

router.post('/chat/message', async (req, res) => {
    const { userId, chatId, message } = req.body; // message should contain { role, content }

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const chat = user.chats.id(chatId);
        if (!chat) return res.status(404).json({ error: 'Chat not found' });

        // Validate message structure
        // if (!message.role || !message.content) {
        //     return res.status(400).json({ error: 'Invalid message format' });
        // }

        // Add the complete message object
        chat.messages.push({content: message.inputMessage});

        await user.save();

        res.status(200).json({ message: 'Message added', chat });
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ error: 'Error adding message: ' + error.message });
    }
});

// Get all chats of a user
router.get('/chat/history/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('chats');
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.status(200).json({ chats: user.chats });
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving chat history' });
    }
});
// Delete a specific chat session
router.delete('/chat/delete', async (req, res) => {
    const { userId, chatId } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.chats = user.chats.filter(chat => chat._id.toString() !== chatId);
        await user.save();

        res.status(200).json({ message: 'Chat deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting chat' });
    }
});

router.put('/updateUser', UpdateUser);

module.exports = router;