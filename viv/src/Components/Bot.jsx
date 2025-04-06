import { useState, useRef, useEffect } from "react"
import "bootstrap/dist/css/bootstrap.min.css"
import ReactMarkdown from "react-markdown"
import CustomMarkdown from "./Markdown"
import Cookies from "js-cookie"
import { jwtDecode } from "jwt-decode"
import { Mic, Plus, Search, Book, MoreVertical } from "lucide-react";

const BACKEND_URL = "http://localhost:4000/api/v1"

const ClaudeChatUI = () => {
  const [selected, setSelected] = useState("Precise")
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [model, setModel] = useState("numax")
  const [error, setError] = useState(null)
  const [activeChat, setActiveChat] = useState(null)
  const chatContainerRef = useRef(null)
  const inputRef = useRef(null)
  const [chatlist, setChatlist] = useState([])
  const userToken = Cookies.get("authToken")
  const isUserLoggedIn = !!userToken
  const [userData, setUserData] = useState(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamController, setStreamController] = useState(null)
  const [partialResponse, setPartialResponse] = useState("")
  const [image, setImage] = useState(null);
  const [selectedOption, setSelectedOption] = useState('text');

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
  };

  // const handleSendMessage = async (e) => {
  //   e.preventDefault();
  //   if (!inputMessage.trim() || isLoading) return;

  //   if (selectedOption === 'image') {
  //     // Generate image if 'image' option is selected
  //     await generateImage();
  //   } else {
  //     // Regular text message handling
  //     setIsLoading(true);
  //     // Simulate API call
  //     setTimeout(() => {
  //       console.log("Sending text message:", inputMessage);
  //       setInputMessage('');
  //       setIsLoading(false);
  //     }, 1000);
  //   }
  // };

  const generateImage = async () => {
    if (!inputMessage.trim()) return;
    if (!activeChat) {
      setError("No active chat selected. Please create or select a chat first.");
      return;
    }

    // Add user message to chat
    const userMessage = {
      sender: "user",
      text: inputMessage,
      timestamp: new Date(),
      isImage: false
    };
    setMessages(prev => [...prev, userMessage]);

    setIsLoading(true);
    setImage(null);
    setError(null);

    try {
      // Show a "generating image" message
      const generatingMsg = {
        sender: "assistant",
        text: `Generating image based on ${inputMessage}...`,
        timestamp: new Date(),
        isImage: false
      };
      setMessages(prev => [...prev, generatingMsg]);

      const response = await fetch("http://ec2-13-60-38-53.eu-north-1.compute.amazonaws.com:7000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: inputMessage }),
      });

      console.log(response);

      if (!response.ok) throw new Error("Failed to generate image");

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setImage(imageUrl);
      console.log(imageUrl);

      // Replace "generating" message with actual image response
      setMessages(prev => {
        const newMessages = [...prev];
        // Find and replace the "generating" message
        const lastIndex = newMessages.length - 1;
        if (newMessages[lastIndex].sender === "assistant") {
          newMessages[lastIndex] = {
            sender: "assistant",
            text: `Image generated from prompt: "${inputMessage}"`,
            timestamp: new Date(),
            isImage: true,
            imageUrl: imageUrl
          };
        }
        return newMessages;
      });

      // Store the image in chat history - you might need to implement this part
      // in your backend to properly save the image

      setInputMessage('');
    } catch (error) {
      console.error("Error generating image:", error);
      setError(`Failed to generate image: ${error.message}`);

      // Update the generating message to show error
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        if (newMessages[lastIndex].sender === "assistant" &&
          newMessages[lastIndex].text.includes("Generating image")) {
          newMessages[lastIndex].text = `Error generating image: ${error.message}`;
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && isStreaming) {
        stopStreamingResponse()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [isStreaming])

  // Function to stop streaming
  const stopStreamingResponse = () => {
    if (streamController && isStreaming) {
      streamController.abort()
      setIsStreaming(false)

      // Update the message with [Response stopped by user] appended
      setMessages((prev) => {
        const newMessages = [...prev]
        const lastMsg = newMessages[newMessages.length - 1]

        if (lastMsg?.sender === "assistant") {
          lastMsg.text = partialResponse + " [Response stopped by user]"
        }

        return [...newMessages]
      })
    }
  }

  // Decode user token on component mount
  useEffect(() => {
    if (isUserLoggedIn) {
      try {
        const decodedToken = jwtDecode(userToken)
        setUserData(decodedToken)
        // console.log("User data:", decodedToken)
      } catch (error) {
        console.error("Error decoding token:", error)
        setUserData(null)
      }
    }
  }, [isUserLoggedIn, userToken])

  // Fetch chat messages when active chat changes
  useEffect(() => {
    if (activeChat && userData) {
      fetchChatMessages(activeChat)
    }
  }, [activeChat, userData])

  // Fetch user's chats
  useEffect(() => {
    if (isUserLoggedIn && userData) {
      fetchChats()
    }
  }, [isUserLoggedIn, userData, chatlist])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Auto-focus input field
  useEffect(() => {
    inputRef.current?.focus()

    const handleGlobalKeyDown = (e) => {
      if (!inputRef.current.contains(document.activeElement) && e.key.length === 1) {
        inputRef.current.focus()
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown)
    }
  }, [])

  // Fetch chat messages - FIXED
  const fetchChatMessages = async (chatId) => {
    try {
      console.log("Fetching messages for chat:", chatId)
      console.log("User ID:", userData.userId)

      const response = await fetch(`${BACKEND_URL}/chat/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`, // Add auth token
        },
        body: JSON.stringify({
          chatId,
          userId: userData.userId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Error response:", data)
        throw new Error(data.message || "Failed to load messages")
      }

      console.log("Messages received:", data)

      // Format the messages with proper timestamps
      const formattedMessages = data.messages.map((msg) => ({
        sender: msg.role,
        text: msg.content,
        timestamp: new Date(msg.timestamp || Date.now()),
      }))

      setMessages(formattedMessages)
    } catch (error) {
      console.error("❌ Fetch Error:", error)
      setError(`Failed to load messages: ${error.message}`)
    }
  }

  // Fetch user's chats - FIXED
  const fetchChats = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`, // Add auth token
        },
        body: JSON.stringify({
          userId: userData.userId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to load chats")
      }

      // console.log("Chats received:", data)

      // Check if data.chats exists and is an array
      const chatsArray = Array.isArray(data.chats) ? data.chats : data && Array.isArray(data) ? data : []

      // Sort chats by creation date
      const sortedChats = chatsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      setChatlist(sortedChats)

      // Set the most recent chat as active if we have chats and no active chat
      if (sortedChats.length > 0 && !activeChat) {
        setActiveChat(sortedChats[0]._id)
      }
    } catch (error) {
      console.error("Error fetching chats:", error)
      setError(`Failed to load chats: ${error.message}`)
    }
  }

  // Create a new chat
  const handleNewChat = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/chat/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ userId: userData.userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to create chat")
      }

      // Clear messages and reset states
      setMessages([])
      setInputMessage("")
      setError(null)

      // Set the new chat as active
      setActiveChat(data.chat._id)

      // Add new chat to the list and refresh chat list
      fetchChats()
    } catch (error) {
      console.error("Error creating new chat:", error)
      setError(`Failed to create a new chat: ${error.message}`)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || isLoading) return;

    if (!activeChat) {
      setError("No active chat selected. Please create or select a chat first.");
      return;
    }

    // Handle based on selected option
    if (selectedOption === 'image') {
      // Generate image if 'image' option is selected
      await generateImage();
    } else {
      // Regular text message handling
      const userMessage = { sender: "user", text: inputMessage, timestamp: new Date() };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInputMessage("");
      setIsLoading(true);
      setError(null);
      setPartialResponse(""); // Reset partial response

      try {
        // Create an AbortController to handle stopping the stream
        const controller = new AbortController();
        setStreamController(controller);
        setIsStreaming(true);

        const response = await fetch(`${BACKEND_URL}/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            model: model,
            messages: updatedMessages.map((msg) => ({ role: msg.sender, content: msg.text })),
            userId: userData.userId,
            chatId: activeChat,
          }),
          signal: controller.signal // Add the signal to the fetch request
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to get response");
        }

        if (!response.body) throw new Error("Response body is null");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          chunk.split("\n").forEach((line) => {
            if (!line.trim() || line.startsWith("data: [DONE]")) return;

            try {
              const json = JSON.parse(line.replace("data: ", "").trim());
              if (json.text) {
                accumulatedText = json.text;
                setPartialResponse(accumulatedText); // Update partial response
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];

                  if (lastMsg?.sender === "assistant") {
                    lastMsg.text = accumulatedText;
                  } else {
                    newMessages.push({ sender: "assistant", text: accumulatedText, timestamp: new Date() });
                  }

                  return [...newMessages];
                });
              }
            } catch (error) {
              console.warn("Error parsing JSON chunk:", error, line);
            }
          });
        }

        // After we have the first AI response, generate a title if this is a new chat
        const currentMessages = updatedMessages.length + 1;
        if (currentMessages === 2 && activeChat) {
          setTimeout(() => generateChatTitle(activeChat), 500);
        }

      } catch (err) {
        // Check if this is an abort error (user stopped the stream)
        if (err.name === 'AbortError') {
          console.log('Response streaming was aborted by user');
        } else {
          console.error("Error calling backend:", err);
          setError(`Failed to get response: ${err.message}`);
        }
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        setStreamController(null);
      }
    }
  };

  // Send a message
  // const handleSendMessage = async (e) => {
  //   e.preventDefault();

  //   if (!inputMessage.trim()) return;
  //   if (!activeChat) {
  //     setError("No active chat selected. Please create or select a chat first.");
  //     return;
  //   }

  //   const userMessage = { sender: "user", text: inputMessage, timestamp: new Date() };
  //   const updatedMessages = [...messages, userMessage];
  //   setMessages(updatedMessages);
  //   setInputMessage("");
  //   setIsLoading(true);
  //   setError(null);
  //   setPartialResponse(""); // Reset partial response

  //   try {
  //     // Create an AbortController to handle stopping the stream
  //     const controller = new AbortController();
  //     setStreamController(controller);
  //     setIsStreaming(true);

  //     const response = await fetch(`${BACKEND_URL}/chat/stream`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${userToken}`,
  //       },
  //       body: JSON.stringify({
  //         model: model,
  //         messages: updatedMessages.map((msg) => ({ role: msg.sender, content: msg.text })),
  //         userId: userData.userId,
  //         chatId: activeChat,
  //       }),
  //       signal: controller.signal // Add the signal to the fetch request
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.message || "Failed to get response");
  //     }

  //     if (!response.body) throw new Error("Response body is null");

  //     const reader = response.body.getReader();
  //     const decoder = new TextDecoder();
  //     let accumulatedText = "";

  //     while (true) {
  //       const { done, value } = await reader.read();
  //       if (done) break;

  //       const chunk = decoder.decode(value, { stream: true });

  //       chunk.split("\n").forEach((line) => {
  //         if (!line.trim() || line.startsWith("data: [DONE]")) return;

  //         try {
  //           const json = JSON.parse(line.replace("data: ", "").trim());
  //           if (json.text) {
  //             accumulatedText = json.text;
  //             setPartialResponse(accumulatedText); // Update partial response
  //             setMessages((prev) => {
  //               const newMessages = [...prev];
  //               const lastMsg = newMessages[newMessages.length - 1];

  //               if (lastMsg?.sender === "assistant") {
  //                 lastMsg.text = accumulatedText;
  //               } else {
  //                 newMessages.push({ sender: "assistant", text: accumulatedText, timestamp: new Date() });
  //               }

  //               return [...newMessages];
  //             });
  //           }
  //         } catch (error) {
  //           console.warn("Error parsing JSON chunk:", error, line);
  //         }
  //       });
  //     }

  //     // After we have the first AI response, generate a title if this is a new chat
  //     const currentMessages = updatedMessages.length + 1;
  //     if (currentMessages === 2 && activeChat) {
  //       setTimeout(() => generateChatTitle(activeChat), 500);
  //     }

  //   } catch (err) {
  //     // Check if this is an abort error (user stopped the stream)
  //     if (err.name === 'AbortError') {
  //       console.log('Response streaming was aborted by user');
  //     } else {
  //       console.error("Error calling backend:", err);
  //       setError(`Failed to get response: ${err.message}`);
  //     }
  //   } finally {
  //     setIsLoading(false);
  //     setIsStreaming(false);
  //     setStreamController(null);
  //   }
  // };

  const handleKeyDown = (e) => {
    // Cmd+Enter or Ctrl+Enter to send message
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSendMessage(e)
    }
  }

  const handleChatClick = (chatId) => {
    setActiveChat(chatId)
  }

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        {/* Sidebar */}
        <div
          className="col-3 sidebar"
          style={{ backgroundColor: "white", borderRight: "1px solid #dee2e6", height: "100vh" }}
        >
          <div className="p-3 d-flex border-bottom">
            <div className="bg-dark p-2 rounded me-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="white"
                className="bi bi-chat-square-text"
                viewBox="0 0 16 16"
              >
                <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2.5a2 2 0 0 0-1.6.8L8 14.333 6.1 11.8a2 2 0 0 0-1.6-.8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2.5a1 1 0 0 1 .8.4l1.9 2.533a1 1 0 0 0 1.6 0l1.9-2.533a1 1 0 0 1 .8-.4H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                <path d="M3 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 6a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 6zm0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
              </svg>
            </div>
            <div>
              <div className="fw-bold">Chat Threads</div>
              <div className="text-muted small">{chatlist.length} conversations</div>
            </div>
          </div>

          <div
            className="sidebar-section-header"
            style={{ padding: "10px 15px", color: "#6c757d", fontSize: "14px", fontWeight: 600 }}
          >
            Your Chats
          </div>

          <div style={{ overflowY: 'scroll', height: '65vh' }}>
            {chatlist.map((chat) => (
              <div
                key={chat._id}
                className={`chat-list-item ${activeChat === chat._id ? "active" : ""}`}
                style={{
                  cursor: "pointer",
                  padding: "10px 15px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: activeChat === chat._id ? "#f1f1f1" : "transparent",
                }}
                onClick={() => handleChatClick(chat._id)}
              >
                <span className="text-truncate">
                  {chat.title || `Chat from ${new Date(chat.createdAt).toLocaleDateString()}`}
                </span>
                <button className="btn btn-sm text-muted p-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    className="bi bi-three-dots-vertical"
                    viewBox="0 0 16 16"
                  >
                    <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div
            className="sidebar-footer mt-auto"
            style={{
              borderTop: "1px solid #dee2e6",
              padding: "15px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <button
              className="btn btn-light border w-100 d-flex align-items-center justify-content-center"
              onClick={handleNewChat}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-plus me-2"
                viewBox="0 0 16 16"
              >
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
              </svg>
              New Chat
            </button>
          </div>

          <div className="d-flex justify-content-between p-3 border-top">
            <button className="btn btn-sm text-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                className="bi bi-house"
                viewBox="0 0 16 16"
              >
                <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5ZM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5 5 5Z" />
              </svg>
            </button>
            <button className="btn btn-sm text-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                className="bi bi-brightness-high"
                viewBox="0 0 16 16"
              >
                <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z" />
              </svg>
            </button>
            <button className="btn btn-sm text-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                className="bi bi-gear"
                viewBox="0 0 16 16"
              >
                <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
                <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Chat Content */}
        <div className="col-9" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
          {/* Header */}
          <div
            className="chat-header d-flex justify-content-between align-items-center"
            style={{ padding: "15px", backgroundColor: "white" }}
          >
            <div className="d-flex align-items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                className="bi bi-file-earmark me-2"
                viewBox="0 0 16 16"
              >
                <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
              </svg>
              <h1 className="h5 mb-0 fw-bold">
                {activeChat ? chatlist.find((c) => c._id === activeChat)?.title || "Chat" : "New Chat"}
              </h1>
            </div>

            <div className="form-group mb-0">
              <select className="form-control" value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="numax">Numax</option>
                <option value="codellama:13b">Codellama</option>
                <option value="gemma3:12b">Gemma 3</option>
              </select>
            </div>
          </div>

          <div className="container mt-2 mb-0 p-0">
            <div className="card h-auto p-0" style={{ border: "none", width: "100%" }}>
              <div
                className="card-body chat-content"
                ref={chatContainerRef}
                style={{ height: "550px", overflowY: "auto", width: "100%" }}
              >
                {messages.length === 0 ? (
                  <div className="text-center text-muted">
                    <h4>Start a conversation</h4>
                    <p>Type a message below to begin chatting.</p>
                    <div className="container d-flex justify-content-center mt-5">
                      <div className="card p-3 shadow-sm border-0" style={{ width: "50%" }}>
                        <p className="text-center mb-2">Choose how you want the AI to respond</p>
                        <div className="btn-group w-100">
                          {["Precise", "Balanced", "Creative"].map((option) => (
                            <button
                              key={option}
                              className={`btn ${selected === option ? "btn-dark" : "btn-light"} flex-fill`}
                              onClick={() => setSelected(option)}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                        <p className="text-center mt-2 text-muted">
                          {selected === "Precise"
                            ? "More deterministic and focused responses, best for factual or technical questions"
                            : selected === "Balanced"
                              ? "A mix of precision and creativity, suitable for most queries"
                              : "More open-ended and imaginative responses, great for brainstorming or storytelling"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`message ${msg.sender === "user" ? "user-message" : "ai-message"}`}
                      style={{
                        textAlign: msg.sender === "user" ? "right" : "left",
                        marginBottom: "15px",
                      }}
                    >
                      <div
                        style={{
                          display: "inline-block",
                          padding: "10px 15px",
                          borderRadius: "15px",
                          maxWidth: "70%",
                          backgroundColor: msg.sender === "user" ? "#007bff" : "#f1f1f1",
                          color: msg.sender === "user" ? "white" : "black",
                        }}
                      >
                        {msg.isImage ? (
                          <img
                            src={msg.imageUrl}
                            alt="Generated content"
                            style={{ maxWidth: "100%", borderRadius: "10px" }}
                          />
                        ) : typeof CustomMarkdown === "function" ? (
                          <CustomMarkdown text={String(msg.text || "").trim()} />
                        ) : (
                          <ReactMarkdown>{String(msg.text || "").trim()}</ReactMarkdown>
                        )}
                      </div>
                      <div className="timestamp text-muted small">{msg.timestamp.toLocaleTimeString()}</div>
                    </div>
                  ))
                )}

                {error && (
                  <div className="alert alert-danger mt-3" role="alert">
                    {error}
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger mt-3" role="alert">
                    {error}
                  </div>
                )}
              </div>

              <div className="card-footer bg-white" style={{ border: "none" }}>
                {/* <form onSubmit={handleSendMessage}>
                  <div className="input-group">
                    <input
                      ref={inputRef}
                      type="text"
                      className="form-control"
                      style={{ padding: "20px 20px" }}
                      placeholder="Type your message..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                    />
                    <button className="btn btn-primary" type="submit" disabled={isLoading}>
                      {isLoading ? "Sending..." : "Send"}
                    </button>
                  </div>
                </form> */}

                <form onSubmit={handleSendMessage} className="d-flex align-items-center">
                  <div className="input-group">
                    <div className="d-flex align-items-center bg-light rounded-pill w-100 px-2 py-1">
                      <button type="button" className="btn btn-sm rounded-circle me-1" style={{ width: "38px", height: "38px", backgroundColor: "#f2f2f2" }}>
                        <i className="bi bi-plus"></i>
                      </button>

                      <div className="d-flex me-auto">
                        <input
                          ref={inputRef}
                          type="text"
                          className="form-control border-0 bg-transparent shadow-none"
                          placeholder="Ask anything"
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          disabled={isLoading}
                          style={{ fontSize: "16px" }}
                        />
                      </div>

                      <div className="d-flex align-items-center">
                        <button type="button" className="btn btn-sm rounded-pill me-1" style={{ backgroundColor: "#f2f2f2", fontSize: "14px" }}>
                          <i className="bi bi-search me-1"></i>
                          <span className="d-none d-md-inline">Search</span>
                        </button>

                        <button type="button" className="btn btn-sm rounded-pill me-1" style={{ backgroundColor: "#f2f2f2", fontSize: "14px" }}>
                          <i className="bi bi-book me-1"></i>
                          <span className="d-none d-md-inline">Reason</span>
                        </button>

                        <select
                          className="form-select form-select-sm"
                          aria-label="Options"
                          style={{
                            width: "auto",
                            height: "38px",
                            backgroundColor: "#f2f2f2",
                            borderRadius: "50px",
                            paddingLeft: "10px",
                            paddingRight: "28px"
                          }}
                          value={selectedOption}
                          onChange={handleOptionChange}
                        >
                          <option value="text">Text</option>
                          <option value="image">Generate Image</option>
                        </select>
                        <button type="button" className="btn btn-sm rounded-circle ms-1" style={{ width: "42px", height: "42px", backgroundColor: "#5c5c5c" }}>
                          <i className="bi bi-mic-fill text-white"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
                <div className="text-muted text-center mt-2 small">
                  <p>
                    Press <span className="badge bg-light text-dark">⌘+Enter</span> or{" "}
                    <span className="badge bg-light text-dark">Ctrl+Enter</span> to send
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClaudeChatUI