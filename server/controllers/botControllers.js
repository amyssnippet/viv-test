const axios = require("axios");
const User =  require("../models/userSchema");

// const Stream = async (req, res) => {
//     try {
//         const { model, messages } = req.body;

//         console.log( req.body );

//         const ollamaResponse = await axios({
//             method: "post",
//             url: "https://api.cosinv.com/api/chat",
//             responseType: "stream",
//             data: { model, messages },
//             headers: { "Content-Type": "application/json" },
//         });

//         // Set headers for streaming response
//         res.setHeader("Content-Type", "text/event-stream");
//         res.setHeader("Cache-Control", "no-cache");
//         res.setHeader("Connection", "keep-alive");

//         let accumulatedText = "";

//         ollamaResponse.data.on("data", (chunk) => {
//             const jsonStrings = chunk.toString().trim().split("\n"); // Split by newlines

//             jsonStrings.forEach((jsonString) => {
//                 if (!jsonString.trim()) return; // Ignore empty lines

//                 try {
//                     console.log("Processing JSON:", jsonString);
//                     const json = JSON.parse(jsonString);

//                     if (json.message?.content) {
//                         accumulatedText += json.message.content;
//                         res.write(`data: ${JSON.stringify({ text: accumulatedText })}\n\n`);
//                     }

//                     // If Ollama signals completion, end the stream
//                     if (json.done) {
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

//         res.setHeader("Content-Type", "application/json");
//         res.status(500).json({ error: "Internal server error. Check logs for details." });
//     }
// };

const Stream = async (req, res) => {
    try {
        const { model, messages, userId } = req.body; // Ensure userId is sent from frontend

        console.log("Received request:", req.body);

        // Find the user in MongoDB
        let user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Get or create the latest chat session
        let chat = user.chats[user.chats.length - 1];

        if (!chat) {
            chat = { messages: [] };
            user.chats.push(chat);
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
                    console.log("Processing JSON:", jsonString);
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

module.exports = { Stream };