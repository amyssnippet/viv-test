const axios = require("axios");
const User = require("../models/userSchema");

// const Stream = async (req, res) => {
//     try {
//         const { model, messages, userId, chatId } = req.body;

//         // Find the user in MongoDB
//         let user = await User.findById(userId);

//         if (!user) {
//             return res.status(404).json({ error: "User not found" });
//         }

//         // Find the specific chat by chatId
//         let chatIndex = user.chats.findIndex(chat => chat._id.toString() === chatId);
        
//         if (chatIndex === -1) {
//             return res.status(404).json({ error: "Chat not found" });
//         }

//         let chat = user.chats[chatIndex];

//         // Save the user's message
//         chat.messages.push({
//             role: "user",
//             content: messages[messages.length - 1].content,
//             timestamp: new Date(),
//         });

//         await user.save();

//         // Stream response from AI model
//         const ollamaResponse = await axios({
//             method: "post",
//             url: "https://api.cosinv.com/api/chat",
//             responseType: "stream",
//             data: { model, messages },
//             headers: { "Content-Type": "application/json" },
//         });

//         res.setHeader("Content-Type", "text/event-stream");
//         res.setHeader("Cache-Control", "no-cache");
//         res.setHeader("Connection", "keep-alive");

//         let accumulatedText = "";

//         ollamaResponse.data.on("data", async (chunk) => {
//             const jsonStrings = chunk.toString().trim().split("\n");

//             jsonStrings.forEach(async (jsonString) => {
//                 if (!jsonString.trim()) return;

//                 try {
//                     const json = JSON.parse(jsonString);

//                     if (json.message?.content) {
//                         accumulatedText += json.message.content;
//                         res.write(`data: ${JSON.stringify({ text: accumulatedText })}\n\n`);
//                     }

//                     if (json.done) {
//                         // Save assistant's response in MongoDB
//                         chat.messages.push({
//                             role: "assistant",
//                             content: accumulatedText,
//                             timestamp: new Date(),
//                         });

//                         await user.save();

//                         res.write("data: [DONE]\n\n");
//                         res.end();
//                     }
//                 } catch (error) {
//                     console.warn("Error parsing JSON:", error, "Data:", jsonString);
//                 }
//             });
//         });

//     } catch (error) {
//         console.error("Error in Stream function:", error);
//         res.status(500).json({ error: "Internal server error." });
//     }
// };

const Stream = async (req, res) => {
    try {
        const { model, messages, userId, chatId } = req.body;

        // Find the user in MongoDB
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        let chat;
        let chatIndex;

        if (chatId) {
            // Find the specific chat by chatId
            chatIndex = user.chats.findIndex(chat => chat._id.toString() === chatId);
            if (chatIndex === -1) {
                return res.status(404).json({ error: "Chat not found" });
            }
            chat = user.chats[chatIndex];
        } else {
            // Create a new chat if no chatId is provided
            let chatTitle = "New Chat";
            if (messages.length > 0) {
                try {
                    const titleResponse = await axios.post("https://api.cosinv.com/api/generate", {
                        model: "llama3.2:1b",
                        prompt: `Generate a concise and descriptive chat title (maximum 5 words) based on this message: "${messages[0].content}"`,
                    });

                    const generatedTitle = titleResponse.data.response.trim();

                    console.log(generatedTitle)
                    if (generatedTitle) {
                        chatTitle = generatedTitle;
                    }
                } catch (titleError) {
                    console.error("Error generating title:", titleError);
                }
            }

            chat = {
                title: chatTitle,
                messages: [],
                createdAt: new Date(),
            };

            user.chats.push(chat);
            chatIndex = user.chats.length - 1;
        }

        // Save the user's message
        chat.messages.push({
            role: "user",
            content: messages[messages.length - 1].content,
            timestamp: new Date(),
        });

        await user.save();

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

                        await user.save();

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
                    model: "llama3.2:1b",
                    prompt: `Generate a concise and descriptive chat title (maximum 5 words) based on this message: "${firstMessage}"`,
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
        // Fetch the user along with their chats
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