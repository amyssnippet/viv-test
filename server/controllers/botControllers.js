const axios = require("axios");
const { Chat, User, Message } = require("../models/psqlSchema");
const { STRING } = require("sequelize");

async function generateChatTitle(prompt) {
    try {
        const res = await axios.post(
            "https://scoring-protein-vpn-warrior.trycloudflare.com/api/generate",
            {
                model: "llama3.2:1b-instruct-q4_1",
                prompt: `Generate a concise and descriptive chat title (maximum 5 words) based on this message and don't use quotes: ${prompt}`,
            },
            {
                headers: {
                    "Authorization": `Bearer 122c25b1d64f47ead0632bee3e4fae65e41ee234a8c1a538044799024004acc1`,
                    "Content-Type": "application/json",
                },
            }
        );

        const title = res.data?.response?.trim();

        if (title && title.length > 0) {
            return title;
        } else {
            console.warn("No valid title returned from the API.");
            return "Untitled Chat";
        }
    } catch (err) {
        console.error("Error generating chat title:", err.message || err);
        return "Untitled Chat";
    }
}

const Stream = async (req, res) => {
    try {
        const { model, messages, userId, chatId } = req.body;
        console.log(req.body);

        const user = await User.findByPk(String(userId));
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const chat = await Chat.findOne({ where: { id: String(chatId), UserId: String(userId) } });
        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        // Save user's message
        await Message.create({
            ChatId: chat.id,
            role: "user",
            content: messages[messages.length - 1].content
        });

        // Generate title for new chat if it's the first message
        if (messages.length === 1) {
            generateChatTitle(messages[0].content, chat);
        }

        // Set headers and immediately start streaming with "Thinking..."
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders(); // Ensure headers are sent immediately

        // Start stream with a status update
        res.write(`data: ${JSON.stringify({ text: "Thinking..." })}\n\n`);

        let accumulatedText = "";
        let buffer = "";
        let responseSaved = false;

        try {
            const ollamaResponse = await axios({
                method: "post",
                url: "https://scoring-protein-vpn-warrior.trycloudflare.com/api/chat",
                responseType: "stream",
                data: { model, messages },
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer 122c25b1d64f47ead0632bee3e4fae65e41ee234a8c1a538044799024004acc1`
                },
            });


            ollamaResponse.data.on("error", async (error) => {
                console.error("Stream error:", error);
                res.write(`data: ${JSON.stringify({ error: "Stream disconnected" })}\n\n`);

                if (accumulatedText && !responseSaved) {
                    responseSaved = true;
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
                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.trim()) continue;

                    try {
                        const json = JSON.parse(line);

                        if (json.message?.content) {
                            accumulatedText += json.message.content;

                            // 🔁 Token-by-token stream like Ollama
                            res.write(`data: ${JSON.stringify({
                                message: { role: "assistant", content: json.message.content },
                                done: false
                            })}\n\n`);
                        }

                        if (json.done && !responseSaved) {
                            responseSaved = true;

                            await Message.create({
                                ChatId: chat.id,
                                role: "assistant",
                                content: accumulatedText
                            });

                            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                            res.end();
                            return;
                        }
                    } catch (err) {
                        console.warn("JSON parse error:", err, "Line:", line);
                    }
                }
            });



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

                if (!responseSaved && accumulatedText) {
                    responseSaved = true;
                    await Message.create({
                        ChatId: chat.id,
                        role: "assistant",
                        content: accumulatedText
                    });

                    res.write(`data: ${JSON.stringify({ text: accumulatedText })}\n\n`);
                }

                res.write("data: [DONE]\n\n");
                res.end();
            });

        } catch (streamError) {
            console.error("Error establishing stream:", streamError);
            res.write(`data: ${JSON.stringify({ error: "LLM backend failed to respond." })}\n\n`);
            res.write("data: [DONE]\n\n");
            res.end();
        }

    } catch (error) {
        console.error("Error in Stream function:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

async function generateChatTitle(message, chat) {
    let titleBuffer = "";

    try {
        const titleResponse = await axios({
            method: "post",
            url: "https://scoring-protein-vpn-warrior.trycloudflare.com/api/generate",
            responseType: "stream",
            data: {
                model: "llama3.2:1b-instruct-q4_1",
                prompt: `Generate a concise and descriptive chat title (maximum 5 words) based on this message: ${message}`,
            },
            headers: { "Content-Type": "application/json", "Authorization": `Bearer 122c25b1d64f47ead0632bee3e4fae65e41ee234a8c1a538044799024004acc1` },
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
    console.log(req.body);
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
    const { userId, title, firstMessage } = req.body;
    const prompt = req.query.q || firstMessage;

    console.log("Incoming request:", req.body, req.query);

    try {
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const chatTitle = title || (prompt ? await generateChatTitle(prompt) : "New Chat")

        const user = await User.findByPk(String(userId));
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const newChat = await Chat.create({ title: chatTitle, UserId: userId });

        // Save user message
        if (prompt) {
            await Message.create({
                ChatId: newChat.id,
                role: "user",
                content: prompt,
            });

            // Start streaming assistant response
            axios({
                method: "post",
                url: "https://scoring-protein-vpn-warrior.trycloudflare.com/api/chat",
                responseType: "stream",
                data: {
                    model: "llama3.2:1b-instruct-q4_1",
                    messages: [{ role: "user", content: prompt }]
                },
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer 122c25b1d64f47ead0632bee3e4fae65e41ee234a8c1a538044799024004acc1`
                }
            }).then(response => {
                let buffer = "";
                let accumulated = "";

                response.data.on("data", async (chunk) => {
                    buffer += chunk.toString();
                    const lines = buffer.split("\n");
                    buffer = lines.pop(); // Save partial line

                    for (const line of lines) {
                        if (!line.trim()) continue;
                        try {
                            const json = JSON.parse(line);
                            if (json.message?.content) {
                                accumulated += json.message.content;
                                process.stdout.write(json.message.content); // ✅ Log to terminal live
                            }
                        } catch (err) {
                            console.warn("Stream parse error:", err.message);
                        }
                    }
                });

                response.data.on("end", async () => {
                    if (accumulated) {
                        await Message.create({
                            ChatId: newChat.id,
                            role: "assistant",
                            content: accumulated
                        });
                        console.log("\n✅ AI response saved to DB.");
                    }
                });

            }).catch(err => {
                console.error("Streaming error:", err.message);
            });
        }

        // Respond to client immediately
        res.status(200).json({
            message: "Chat created",
            chat: {
                id: newChat.id,
                title: newChat.title,
                createdAt: newChat.createdAt,
                originalPrompt: prompt
            }
        });

    } catch (err) {
        console.error("Unexpected server error:", err);
        res.status(500).json({ message: "Server error", details: err.message });
    }
};

const FetchChats = async (req, res) => {
    const { userId } = req.body;
    console.log(req.body);
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
    console.log(req.body);

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

const deleteChat = async (req, res) => {
    const { userId, chatId } = req.body;
    console.log(req.body);

    try {
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const chat = await Chat.findOne({ where: { id: chatId, UserId: userId } });
        if (!chat) return res.status(404).json({ error: 'Chat not found' });

        // Delete chat (will also delete messages if cascade is set, otherwise handle manually)
        await chat.destroy();

        res.status(200).json({ message: 'Chat deleted' });
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({ error: 'Error deleting chat' });
    }
};

const UpdateChatTitle = async (req, res) => {
    const { userId, chatId, title } = req.body;

    try {
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const chat = await Chat.findOne({ where: { id: chatId, UserId: userId } });
        if (!chat) return res.status(404).json({ error: 'Chat not found' });

        chat.title = title;
        await chat.save();

        const updatedChats = await Chat.findAll({ where: { UserId: userId }, order: [['updatedAt', 'DESC']] });

        res.status(200).json({ chats: updatedChats });
    } catch (error) {
        console.error('Error updating chat title:', error);
        res.status(500).json({ error: 'Error updating chat title' });
    }
};

module.exports = { Stream, NewChat, FetchChats, FetchChatMessages, getChatDetails, deleteChat, UpdateChatTitle };