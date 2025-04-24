const axios = require("axios");
const User = require("../models/userSchema");

const Stream = async (req, res) => {
    try {
        const { model, messages, userId, chatId } = req.body;

        // Find the user in MongoDB
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Find the chat by chatId within the user's chats array
        let chat = user.chats.id(chatId); // This will get the chat from the user's `chats` array
        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        let titleBuffer = ""; // Initialize the title buffer to accumulate data

        if (messages.length === 1) {
            try {
                const titleResponse = await axios({
                    method: "post",
                    url: "https://api.cosinv.com/api/generate",
                    responseType: "stream",
                    data: {
                        model: "gentitle",
                        prompt: `Generate a concise and descriptive chat title (maximum 5 words) based on this message: ${messages[0].content}`,
                    },
                    headers: { "Content-Type": "application/json" },
                });

                // Process title stream
                titleResponse.data.on("data", async (chunk) => {
                    const jsonStrings = chunk.toString().trim().split("\n");
                    
                    jsonStrings.forEach(async (jsonString) => {
                        if (!jsonString.trim()) return;
                        
                        try {
                            const json = JSON.parse(jsonString);
                            
                            if (json.response) {
                                titleBuffer += json.response;
                            }

                            if (json.done) {
                                console.log("Generated Title:", titleBuffer);
                                
                                if (titleBuffer) {
                                    chat.title = titleBuffer.trim(); // Update the chat title
                                    await user.save(); // Save the updated title
                                }
                            }
                        } catch (error) {
                            console.warn("Error parsing title JSON:", error, "Data:", jsonString);
                        }
                    });
                });

            } catch (titleError) {
                console.error("Error generating title:", titleError);
            }
        }

        // Save the user's message to the chat's messages array
        chat.messages.push({
            role: "user",
            content: messages[messages.length - 1].content,
            timestamp: new Date(),
        });

        await user.save();  // Save the updated user document, including the updated chat

        // Stream response from AI model
        const ollamaResponse = await axios({
            method: "post",
            url: "https://api.cosinv.com/api/chat",
            responseType: "stream",
            data: { model, messages },
            headers: { "Content-Type": "application/json" },
        });

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        let accumulatedText = "";

        ollamaResponse.data.on("data", async (chunk) => {
            const jsonStrings = chunk.toString().trim().split("\n");

            jsonStrings.forEach(async (jsonString) => {
                if (!jsonString.trim()) return;

                try {
                    const json = JSON.parse(jsonString);

                    // Handle the assistant response
                    if (json.message?.content) {
                        accumulatedText += json.message.content;
                        res.write(`data: ${JSON.stringify({ text: accumulatedText })}\n\n`);
                    }

                    if (json.done) {
                        // Save assistant's response in MongoDB
                        chat.messages.push({
                            role: "assistant",
                            content: accumulatedText,
                            timestamp: new Date(),
                        });

                        await user.save();  // Save the updated user document

                        res.write("data: [DONE]\n\n");
                        res.end();
                    }
                } catch (error) {
                    console.warn("Error parsing JSON:", error, "Data:", jsonString);
                }
            });
        });

    } catch (error) {
        console.error("Error in Stream function:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

const NewChat = async (req, res) => {
    try {
        const { userId, title, firstMessage } = req.body;
        
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        // If no title is provided, generate one from the first message or use default
        let chatTitle = title || "New Chat";
        
        // If firstMessage is provided but no title, generate a title
        if (!title && firstMessage) {
            try {
                // Call Ollama API to generate a title
                const titleResponse = await axios.post("https://api.cosinv.com/api/generate", {
                    model: "gentitle",
                    prompt: `Generate a concise and descriptive chat title (maximum 5 words) based on this message and dont give quotes: ${firstMessage}`,
                });
                
                const generatedTitle = titleResponse.data.response.trim();
                if (generatedTitle) {
                    chatTitle = generatedTitle;
                }
            } catch (titleError) {
                console.error("Error generating title:", titleError);
                // Continue with default or provided title if there's an error
            }
        }

        // Create a chat with the determined title
        const newChat = {
            title: chatTitle,
            messages: [],
            createdAt: new Date(),
        };

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.chats.push(newChat);
        await user.save();

        res.status(201).json({ 
            message: "Chat created", 
            chat: user.chats[user.chats.length - 1] 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const FetchChats = async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await User.findById(userId).select('chats').lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Chats retrieved successfully',
            chats: user.chats
        });

    } catch (error) {
        res.status(500).json({ message: 'Error retrieving chats', error: error.message });
    }
};

const FetchChatMessages = async (req, res) => {
    const { chatId, userId } = req.body;

    try {
        // Find the user with the given chat ID
        const user = await User.findOne(
            { _id: userId, "chats._id": chatId },
            { "chats.$": 1 }
        ).lean();

        if (!user || !user.chats.length) {
            return res.status(404).json({ message: "Chat not found or unauthorized" });
        }

        const chat = user.chats[0];
        res.json({
            message: "Messages retrieved successfully",
            chatId: chat._id,
            title: chat.title,
            createdAt: chat.createdAt,
            messages: chat.messages
        });
    } catch (error) {
        console.error("❌ Backend Error:", error);
        res.status(500).json({ message: "Error retrieving messages", error: error.message });
    }
};

module.exports = { Stream, NewChat, FetchChats, FetchChatMessages };