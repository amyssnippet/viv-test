const { DataTypes } = require('sequelize');
const sequelize = require('../conn/psql');
const crypto = require('crypto');

const generate18DigitId = () => {
    return Math.floor(Math.random() * 9e17 + 1e17).toString(); // ensures 18 digits
};

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: generate18DigitId
    },
    role: { type: DataTypes.ENUM('user', 'assistant'), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { timestamps: false });

const Chat = sequelize.define('Chat', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: generate18DigitId
    },
    title: { type: DataTypes.STRING, defaultValue: 'New Chat' },
}, { timestamps: true });

Chat.hasMany(Message);
Message.belongsTo(Chat);


const RequestLog = sequelize.define('RequestLog', {
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    ip: DataTypes.STRING,
    model: DataTypes.STRING,
    prompt: DataTypes.TEXT,
    instructions: DataTypes.TEXT,
    response: DataTypes.TEXT,
    totalTokensUsed: DataTypes.INTEGER
}, { timestamps: false });

const DeveloperTool = sequelize.define('DeveloperTool', {
    name: { type: DataTypes.STRING, allowNull: false },
    endpoint: { type: DataTypes.STRING, allowNull: false },
    token: { type: DataTypes.STRING },
    tokens: { type: DataTypes.INTEGER, defaultValue: 1000 },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    lastUsedAt: DataTypes.DATE,
    lastRequestAt: DataTypes.DATE,
    lastRequestIP: DataTypes.STRING
}, { timestamps: false });

DeveloperTool.hasMany(RequestLog);
RequestLog.belongsTo(DeveloperTool);

const User = sequelize.define('User', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: generate18DigitId
    },
    fullName: DataTypes.STRING,
    email: { type: DataTypes.STRING, allowNull: false },
    profile: DataTypes.TEXT,
    password: { type: DataTypes.STRING },
    provider: { type: DataTypes.STRING }, // google | facebook | apple
    providerId: { type: DataTypes.STRING },
    count: { type: DataTypes.INTEGER, defaultValue: 4000 },
    date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    isDeveloper: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { timestamps: false });

User.hasMany(Chat);
Chat.belongsTo(User);

User.hasMany(DeveloperTool);
DeveloperTool.belongsTo(User);

const Otp = sequelize.define('Otp', {
    otp: { type: DataTypes.STRING, allowNull: false },
    otpExpiry: { type: DataTypes.DATE, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { timestamps: false });

User.hasMany(Otp);
Otp.belongsTo(User);

module.exports = { sequelize, User, Chat, Message, DeveloperTool, RequestLog, Otp };
