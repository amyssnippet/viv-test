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

const requestLogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    ip: String,
    model: String,
    prompt: String,
    instructions: String,
    response: String,
    totalTokensUsed: Number
}, { _id: false });


const developerToolSchema = new mongoose.Schema({
    name: { type: String, required: true },
    endpoint: { type: String, required: true },
    token: { type: String, required: false },
    tokens: { type: Number, default: 1000 },
    createdAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date },
    lastRequestAt: { type: Date },
    lastRequestIP: { type: String },
    requestLogs: [requestLogSchema]
});

const userSchema = new mongoose.Schema({
    fullName: String,
    email: { type: String, required: true },
    profile: String,
    count: { type: Number, default: 4000 },
    password: { type: String, required: true },
    date: { type: Date, default: Date.now },
    chats: [chatSchema],
    isDeveloper: { type: Boolean, default: false },
    developerTools: {
        type: [developerToolSchema],
        validate: {
            validator: function (value) {
                return value.length <= 3;
            },
            message: 'A user can have a maximum of 3 developer tools (endpoints).'
        }
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
