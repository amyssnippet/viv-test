const mongoose = require('mongoose');

mongoose.connect(`mongodb+srv://bharatsharma98971:htmlpp123@cluster0.wwrbt.mongodb.net/`)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

//mongodb+srv://amolyadav:amol6125@cluster0.5oqld.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0 


// const generateImage = async () => {
//     if (!inputMessage.trim()) return;
//     if (!activeChat) {
//         setError("No active chat selected. Please create or select a chat first.");
//         return;
//     }

//     const userMessage = {
//         sender: "user",
//         text: inputMessage,
//         timestamp: new Date(),
//         isImage: false,
//     };
//     setMessages((prev) => [...prev, userMessage]);

//     setIsLoading(true);
//     setImage(null);
//     setError(null);

//     try {
//         const generatingMsg = {
//             sender: "assistant",
//             text: `Generating image based on: "${inputMessage}"...`,
//             timestamp: new Date(),
//             isImage: false,
//         };
//         setMessages((prev) => [...prev, generatingMsg]);

//         const token = Cookies.get("authToken");

//         const response = await fetch("https://cp.cosinv.com/api/v1/generate-image", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//                 prompt: inputMessage,
//                 chatId: activeChat,
//                 userId: userData.userId,
//             }),
//         });

//         if (!response.ok) throw new Error("Failed to generate image");

//         const data = await response.json();
//         const imageUrl = data.imageUrl;

//         // Save the imageUrl to localStorage
//         localStorage.setItem("imageUrl", imageUrl);

//         // Update the messages with the generated image URL
//         setMessages((prev) => {
//             const newMessages = [...prev];
//             newMessages[newMessages.length - 1] = {
//                 sender: "assistant",
//                 text: `Image generated from prompt: "${inputMessage}"`,
//                 timestamp: new Date(),
//                 isImage: true,
//                 imageUrl: imageUrl,
//             };
//             return newMessages;
//         });

//         setInputMessage('');
//     } catch (error) {
//         console.error("Error generating image:", error);
//         setError(`Failed to generate image: ${error.message}`);

//         // Update the generating message to show error
//         setMessages((prev) => {
//             const newMessages = [...prev];
//             newMessages[newMessages.length - 1].text = `Error generating image: ${error.message}`;
//             return newMessages;
//         });
//     } finally {
//         setIsLoading(false);
//     }
// };