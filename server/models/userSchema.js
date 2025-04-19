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

const developerToolSchema = new mongoose.Schema({
    name: { type: String, required: true },
    endpoint: { type: String, required: true, unique: true },
    token: { type: String, required: false }, // ✅ This was Number before — should be String!
    tokens: { type: Number, default: 1000 },  // ✅ This is your numerical token balance
    createdAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date },
});

const userSchema = new mongoose.Schema({
    fullName: String,
    email: { type: String, unique: true, required: true },
    profile: String,
    password: { type: String, required: true },
    date: { type: Date, default: Date.now },
    chats: [chatSchema], // Array of chat sessions for each user
    isDeveloper: { type: Boolean, default: false }, // Mark if user is a developer
    developerTools: [developerToolSchema], // Only populated if isDeveloper is true
});

const User = mongoose.model('User', userSchema);
module.exports = User;
