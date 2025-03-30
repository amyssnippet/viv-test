const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'assistant'], required: true }, // Who sent the message
    content: { type: String, required: true }, // Message text
    // timestamp: { type: Date, default: Date.now }, // Time message was sent
});

const chatSchema = new mongoose.Schema({
    messages: [messageSchema], // Array of messages
    createdAt: { type: Date, default: Date.now }, // When the chat started
    title: { type: String, default: 'New Chat' }, // Chat title (optional)
});

const userSchema = new mongoose.Schema({
    fullName: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    date: { type: Date, default: Date.now },
    chats: [chatSchema], // Array of chat sessions for each user
});

const User = mongoose.model('User', userSchema);
module.exports = User;
