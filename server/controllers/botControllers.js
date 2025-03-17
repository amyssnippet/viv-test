const axios = require("axios");

const Stream = async (req, res) => {
    try {
        const { model, messages } = req.body;

        console.log("Sending request to Ollama API:", { model, messages });

        const ollamaResponse = await axios({
            method: "post",
            url: "https://api.cosinv.com/api/chat",
            responseType: "stream",
            data: { model, messages },
            headers: { "Content-Type": "application/json" },
        });

        // Set headers for streaming response
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        let accumulatedText = "";

        ollamaResponse.data.on("data", (chunk) => {
            const jsonStrings = chunk.toString().trim().split("\n"); // Split by newlines

            jsonStrings.forEach((jsonString) => {
                if (!jsonString.trim()) return; // Ignore empty lines

                try {
                    console.log("Processing JSON:", jsonString);
                    const json = JSON.parse(jsonString);

                    if (json.message?.content) {
                        accumulatedText += json.message.content;
                        res.write(`data: ${JSON.stringify({ text: accumulatedText })}\n\n`);
                    }

                    // If Ollama signals completion, end the stream
                    if (json.done) {
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

        res.setHeader("Content-Type", "application/json");
        res.status(500).json({ error: "Internal server error. Check logs for details." });
    }
};

module.exports = { Stream };
