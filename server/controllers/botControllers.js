const axios = require("axios");
const { Chat, User, Message } = require("../models/psqlSchema");

const Stream = async (req, res) => {
    try {
        const { model, messages, userId, chatId } = req.body;
        console.log(req.body);

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const chat = await Chat.findOne({ where: { id: chatId, UserId: userId } });
        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        // Save user's message
        await Message.create({
            ChatId: chat.id,
            role: "user",
            content: messages[messages.length - 1].content
        });

        // Generate title for new chat
        if (messages.length === 1) {
            generateChatTitle(messages[0].content, chat);
        }

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        let accumulatedText = "";
        let buffer = "";

        try {
            const ollamaResponse = await axios({
                method: "post",
                url: "https://api.cosinv.com/api/chat",
                responseType: "stream",
                data: { model, messages },
                headers: { "Content-Type": "application/json" },
            });

            // Handle stream disconnection/error
            ollamaResponse.data.on("error", async (error) => {
                console.error("Stream error:", error);
                res.write(`data: ${JSON.stringify({ error: "Stream disconnected" })}\n\n`);

                // Save partial response if we have content
                if (accumulatedText) {
                    await Message.create({
                        ChatId: chat.id,
                        role: "assistant",
                        content: accumulatedText + " [Response interrupted]"
                    });
                }

                res.write("data: [DONE]\n\n");
                res.end();
            });

            ollamaResponse.data.on("data", async (chunk) => {
                buffer += chunk.toString();

                const lines = buffer.split("\n");
                // Keep incomplete last line for next chunk
                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.trim()) continue;

                    try {
                        const json = JSON.parse(line);

                        if (json.message?.content) {
                            accumulatedText += json.message.content;
                            res.write(`data: ${JSON.stringify({ text: accumulatedText })}\n\n`);
                        }

                        if (json.done) {
                            await Message.create({
                                ChatId: chat.id,
                                role: "assistant",
                                content: accumulatedText
                            });

                            res.write("data: [DONE]\n\n");
                            res.end();
                            return;
                        }
                    } catch (err) {
                        console.warn("JSON parse error:", err, "Line:", line);
                    }
                }
            });

            // Handle end of stream without done: true
            ollamaResponse.data.on("end", async () => {
                if (buffer.trim()) {
                    try {
                        const json = JSON.parse(buffer);
                        if (json.message?.content) {
                            accumulatedText += json.message.content;
                        }
                    } catch (err) {
                        console.warn("JSON parse error on final buffer:", err);
                    }
                }

                // Only save and end if we haven't already done so
                if (res.writableEnded === false) {
                    if (accumulatedText) {
                        await Message.create({
                            ChatId: chat.id,
                            role: "assistant",
                            content: accumulatedText
                        });
                    }

                    res.write(`data: ${JSON.stringify({ text: accumulatedText })}\n\n`);
                    res.write("data: [DONE]\n\n");
                    res.end();
                }
            });

        } catch (streamError) {
            console.error("Error establishing stream:", streamError);
            res.status(500).json({ error: "Failed to connect to LLM service" });
        }

    } catch (error) {
        console.error("Error in Stream function:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

// Helper function to generate chat title
async function generateChatTitle(message, chat) {
    let titleBuffer = "";

    try {
        const titleResponse = await axios({
            method: "post",
            url: "https://api.cosinv.com/api/generate",
            responseType: "stream",
            data: {
                model: "llama3.2:1b",
                prompt: `Generate a concise and descriptive chat title (maximum 5 words) based on this message: ${message}`,
            },
            headers: { "Content-Type": "application/json" },
        });

        titleResponse.data.on("data", async (chunk) => {
            const jsonStrings = chunk.toString().trim().split("\n");

            for (const jsonString of jsonStrings) {
                if (!jsonString.trim()) continue;

                try {
                    const json = JSON.parse(jsonString);

                    if (json.response) {
                        titleBuffer += json.response;
                    }

                    if (json.done && titleBuffer) {
                        console.log("Generated Title:", titleBuffer);
                        await chat.update({ title: titleBuffer.trim() });
                    }
                } catch (error) {
                    console.warn("Error parsing title JSON:", error, "Data:", jsonString);
                }
            }
        });

        // Handle errors in title generation
        titleResponse.data.on("error", (error) => {
            console.error("Title generation stream error:", error);
        });

    } catch (titleError) {
        console.error("Error generating title:", titleError);
    }
}

const getChatDetails = async (req, res) => {
    const { chatId, userId } = req.body;

    if (!chatId || !userId) {
        return res.status(400).json({ error: 'chatId and userId are required' });
    }

    try {
        const chat = await Chat.findOne({
            where: { id: chatId, UserId: userId },
            attributes: ['id', 'title', 'createdAt'],
        });

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found or access denied' });
        }

        return res.status(200).json({ chat });
    } catch (error) {
        console.error('Error fetching chat details:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const NewChat = async (req, res) => {
    console.log("new hit")
    try {
        const { userId, title, firstMessage } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        let chatTitle = title || "New Chat";

        // Attempt to generate title if not provided
        if (!title && firstMessage) {
            try {
                const titleResponse = await axios.post("https://api.cosinv.com/api/generate", {
                    model: "llama3.2:1b",
                    prompt: `Generate a concise and descriptive chat title (maximum 5 words) based on this message and dont give quotes: ${firstMessage}`,
                });

                const generatedTitle = titleResponse.data.response.trim();
                if (generatedTitle) {
                    chatTitle = generatedTitle;
                }
            } catch (titleError) {
                console.error("Error generating title from API:", titleError.message || titleError);
            }
        }

        // Check if user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Log what we're about to create
        console.log("Creating chat with:", { title: chatTitle, UserId: userId });

        // Try to create chat
        let newChat;
        try {
            newChat = await Chat.create({
                title: chatTitle,
                UserId: userId
            });
        } catch (dbError) {
            console.error("Sequelize Chat.create error:", dbError);
            return res.status(500).json({
                error: "Chat creation failed",
                details: dbError.message
            });
        }

        // Success response
        res.status(200).json({
            message: "Chat created",
            chat: {
                id: newChat.id,
                title: newChat.title,
                createdAt: newChat.createdAt
            }
        });

    } catch (error) {
        console.error("Unexpected server error:", error);
        res.status(500).json({ message: "Server error", details: error.message });
    }
};

const FetchChats = async (req, res) => {
    const { userId } = req.body;

    try {
        const chats = await Chat.findAll({
            where: { UserId: userId },
            attributes: ['id', 'title', 'createdAt', 'updatedAt'],
            order: [['updatedAt', 'DESC']]
        });

        if (!chats.length) {
            return res.status(404).json({ message: 'No chats found for this user' });
        }

        res.json({
            message: 'Chats retrieved successfully',
            chats
        });
    } catch (error) {
        console.error('Error retrieving chats:', error);
        res.status(500).json({ message: 'Error retrieving chats', error: error.message });
    }
};

const FetchChatMessages = async (req, res) => {
    const { chatId, userId } = req.body;

    try {
        const chat = await Chat.findOne({
            where: { id: chatId, UserId: userId },
            include: [{
                model: Message,
                attributes: ['role', 'content', 'createdAt'],
                order: [['createdAt', 'ASC']]
            }]
        });

        if (!chat) {
            return res.status(404).json({ message: "Chat not found or unauthorized" });
        }

        const formattedMessages = chat.Messages.map(msg => ({
            sender: msg.role,
            text: msg.content,
            timestamp: msg.createdAt,
        }));

        res.json({
            message: "Messages retrieved successfully",
            chatId: chat.id,
            title: chat.title,
            createdAt: chat.createdAt,
            messages: formattedMessages
        });
    } catch (error) {
        console.error("❌ Backend Error:", error);
        res.status(500).json({ message: "Error retrieving messages", error: error.message });
    }
};

module.exports = { Stream, NewChat, FetchChats, FetchChatMessages, getChatDetails };