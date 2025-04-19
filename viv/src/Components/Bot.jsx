import { useState, useRef, useEffect } from "react"
import "bootstrap/dist/css/bootstrap.min.css"
import ReactMarkdown from "react-markdown"
import { Link, useNavigate } from "react-router-dom"
import CustomMarkdown from "./Markdown"
import Cookies from "js-cookie"
import toast from 'react-hot-toast'
import { jwtDecode } from "jwt-decode"
import { Mic, Plus, Search, Book, MoreVertical } from "lucide-react";
import axios from 'axios'
import { ThreeDots } from 'react-loader-spinner';

const BACKEND_URL = "https://cp.cosinv.com/api/v1"

const ClaudeChatUI = () => {
  const navigate = useNavigate();
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
  const [showMobileOptions, setShowMobileOptions] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const activeTitle = chatlist.find((c) => c._id === activeChat)?.title;


  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
  };

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

      const response = await fetch("http://13.60.170.223:7000/generate", {
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

  const handleKeyDown = (e) => {
    // Cmd+Enter or Ctrl+Enter to send message
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage(e)
    }
  }

  const handleChatClick = (chatId) => {
    setActiveChat(chatId)
  }

  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    // console.log(userData.userId)
    try {
      const response = await axios.post("https://cp.cosinv.com/api/v1/fetch/user", {
        id: userData.userId,
      });

      if (response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  useEffect(() => {
    fetchUser();
  },);

  const handleLogOut = () => {
    // Remove token from localStorage or cookies
    Cookies.remove("authToken"); // If stored in cookies

    // Redirect to login or home page
    navigate("/auth");
    toast.success("Logged out sucessfull");

    // Optionally clear any app state (e.g., context or Redux)
  };

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">

        {/* Mobile view */}
        <div
          className={`mobile-sidebar-overlay ${isSidebarOpen ? 'open' : ''} d-md-none`}
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="mobile-sidebar"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#171717",
              color: "white",
              width: "75%",
              height: "100vh",
              position: "fixed",
              top: 0,
              left: 0,
              zIndex: 1050,
              overflowY: "auto",
              transition: "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
              transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)"
            }}
          >
            <div
              className="col-3 sidebar"
              style={{ backgroundColor: "#171717", color: 'white', height: "100vh" }}
            >
              <div className="p-3 d-flex">
                <div className="bg-dark p-2 rounded me-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" className="bi bi-chat-square-text" viewBox="0 0 16 16">
                    <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2.5a2 2 0 0 0-1.6.8L8 14.333 6.1 11.8a2 2 0 0 0-1.6-.8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12z" />
                    <path d="M3 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 6a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 6zm0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
                  </svg>
                </div>
                <div>
                  <div className="fw-bold">Chat Threads</div>
                  <div className="text small">{chatlist.length} conversations</div>
                </div>
              </div>

              <div
                className="sidebar-section-header"
                style={{
                  padding: "10px 15px",
                  color: "#6c757d",
                  fontSize: "14px",
                  fontWeight: 600
                }}
              >
                Your Chats
              </div>

              <div className="customer-scrollbar" style={{ overflowY: 'scroll', height: '65vh' }}>
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
                      backgroundColor: activeChat === chat._id ? "#212020" : "transparent",
                    }}
                    onClick={() => handleChatClick(chat._id)}
                  >
                    <span className="text-truncate">
                      {chat.title || `Chat from ${new Date(chat.createdAt).toLocaleDateString()}`}
                    </span>
                    <button className="btn btn-sm text-muted p-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-three-dots-vertical" viewBox="0 0 16 16">
                        <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <div
                className="sidebar-footer mt-auto"
                style={{
                  padding: "15px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <button
                  className="btn btn-light w-100 d-flex align-items-center justify-content-center"
                  onClick={handleNewChat}
                  style={{ background: '#222222', color: 'white', border: 'none' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" className="bi bi-plus me-2" viewBox="0 0 16 16">
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                  </svg>
                  New Chat
                </button>
              </div>

              <div className="d-flex justify-content-between p-3">
                <button className="btn btn-sm text-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" className="bi bi-house" viewBox="0 0 16 16">
                    <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5Z" />
                  </svg>
                </button>
                <button className="btn btn-sm text-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" className="bi bi-brightness-high" viewBox="0 0 16 16">
                    <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                    <path d="M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zM8 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8z" />
                  </svg>
                </button>
                <button className="btn btn-sm text-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" className="bi bi-gear" viewBox="0 0 16 16">
                    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
                    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592..." />
                  </svg>
                </button>
              </div>
            </div>
            {/* Your original sidebar content here (like what you sent above) */}
          </div>
        </div>

        {/* Desktop */}
        <div
          className="col-3 sidebar d-none d-md-block"
          style={{ backgroundColor: "#171717", color: 'white', height: "100vh" }}
        >
          <div className="p-3 d-flex">
            <div className="bg-dark p-2 rounded me-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" className="bi bi-chat-square-text" viewBox="0 0 16 16">
                <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2.5a2 2 0 0 0-1.6.8L8 14.333 6.1 11.8a2 2 0 0 0-1.6-.8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12z" />
                <path d="M3 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 6a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 6zm0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
              </svg>
            </div>
            <div>
              <div className="fw-bold">Chat Threads</div>
              <div className="text small">{chatlist.length} conversations</div>
            </div>
          </div>

          <div
            className="sidebar-section-header"
            style={{
              padding: "10px 15px",
              color: "#6c757d",
              fontSize: "14px",
              fontWeight: 600
            }}
          >
            Your Chats
          </div>

          <div className="customer-scrollbar" style={{ overflowY: 'scroll', height: '65vh' }}>
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
                  backgroundColor: activeChat === chat._id ? "#212020" : "transparent",
                }}
                onClick={() => handleChatClick(chat._id)}
              >
                <span className="text-truncate">
                  {chat.title || `Chat from ${new Date(chat.createdAt).toLocaleDateString()}`}
                </span>
                <button className="btn btn-sm text-muted p-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-three-dots-vertical" viewBox="0 0 16 16">
                    <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div
            className="sidebar-footer mt-auto"
            style={{
              padding: "15px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <button
              className="btn btn-light w-100 d-flex align-items-center justify-content-center"
              onClick={handleNewChat}
              style={{ background: '#222222', color: 'white', border: 'none' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" className="bi bi-plus me-2" viewBox="0 0 16 16">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
              </svg>
              New Chat
            </button>
          </div>

          <div className="d-flex justify-content-between p-3">
            <Link to="/">
              <button className="btn btn-sm text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" className="bi bi-house" viewBox="0 0 16 16">
                  <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5Z" />
                </svg>
              </button>
            </Link>
            <Link to="/dashboard">
              <button className="btn btn-sm text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" className="bi bi-gear" viewBox="0 0 16 16">
                  <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
                  <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592..." />
                </svg>
              </button>
            </Link>
          </div>
        </div>

        {/* Main Chat Content */}
        <div className="col-9 main-div" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
          {/* Header */}
          <div
            className="chat-header d-flex justify-content-between align-items-center"
            style={{ padding: "15px", backgroundColor: "#222222" }}
          >
            <div className="d-flex align-items-center">
              <button className="btn text-white d-md-none" onClick={() => setSidebarOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" className="bi bi-list" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M2.5 12.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm0-4a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm0-4a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11z" />
                </svg>
              </button>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="white"
                className="bi bi-file-earmark me-2"
                viewBox="0 0 16 16"
              >
                <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
              </svg>
              <h1 className="h5 mb-0 fw-bold chat-title" style={{ color: 'white' }} >
              {activeChat ? (activeTitle?.length > 25 ? activeTitle.slice(0, 25) + "..." : activeTitle) || "Chat" : "New Chat"}

              </h1>
            </div>
            <div className="form-group mb-0 d-flex align-items-center gap-3">

              {/* Model Selector */}
              <select
                className="form-control"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={{ background: '#2E2F2E', border: 'none', color: 'white' }}
              >
                {/* <option value="numax">Numax</option>
                <option value="codellama:13b">Codellama</option> */}
                <option value="gemma3">Gemma 3</option>
              </select>

              {/* Profile Dropdown */}
              <div className="dropdown">
                {!user?.profile ? (
                  <ThreeDots
                    height="35"
                    width="35"
                    radius="9"
                    color="#ffffff"
                    ariaLabel="three-dots-loading"
                    wrapperStyle={{}}
                    visible={true}
                  />
                ) : (
                  <img
                    src={user.profile}
                    alt="Profile"
                    className="dropdown-toggle"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{
                      width: "35px",
                      height: "35px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #ccc",
                      cursor: "pointer",
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/default-avatar.png";
                    }}
                  />
                )}
                <ul className="dropdown-menu dropdown-menu-end" style={{ backgroundColor: '#2E2F2E' }}>
                  <li>
                    <button
                      className="dropdown-item text-white"
                      style={{ backgroundColor: 'transparent' }}
                      onClick={handleLogOut}
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="container mb-0 p-0">
            <div className="card h-auto p-0" style={{ border: "none", width: "100%", background: '#222222', borderRadius: '0px' }}>
              <div
                className="card-body chat-content customer-scrollbar"
                ref={chatContainerRef}
                style={{ height: "549px", overflowY: "auto", width: "100%" }}
              >
                {messages.length === 0 ? (
                  <div className="text-center" style={{ color: 'white' }}>
                    <h4>Start a conversation</h4>
                    <p>Type a message below to begin chatting.</p>
                    <div className="container d-flex justify-content-center mt-5">
                      <div className="card p-3 shadow-sm border-0 model-type" style={{ width: "50%", background: '#313031', color: 'white', borderRadius: '20px' }}>
                        <p className="text-center mb-2">Choose how you want the AI to respond</p>
                        <div className="btn-group w-100 model-options">
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
                        <p className="text-center mt-2">
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
                        className="response"
                        style={{
                          display: "inline-block",
                          padding: "10px 15px",
                          borderRadius: "15px",
                          maxWidth: "70%",
                          backgroundColor: msg.sender === "user" ? "#2E2F2E" : "",
                          color: msg.sender === "user" ? "white" : "white",
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
                      <div className="timestamp text-white small">{msg.timestamp.toLocaleTimeString()}</div>
                    </div>
                  ))
                )}

                {/* {error && (
                  <div className="alert alert-danger mt-3" role="alert">
                    {error}
                  </div>
                )} */}
              </div>

              <div className="card-footer" style={{ border: "none" }}>
                <form onSubmit={handleSendMessage} className="d-flex align-items-center">
                  <div className="input-group">
                    <div className="d-flex align-items-center rounded-pill w-100 px-2 py-1" style={{ background: "#313031" }}  >
                      {/* <button type="button" className="btn btn-sm rounded-circle me-1" style={{ width: "38px", height: "38px", backgroundColor: "#171717", color: 'white' }}>
                        <i className="bi bi-plus"></i>
                      </button> */}

                      <div className="d-flex me-auto">
                        <input
                          ref={inputRef}
                          type="text"
                          className="form-control border-0 bg-transparent shadow-none"
                          placeholder="Ask anything"
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          style={{ fontSize: "16px", color: 'white' }}
                        />
                      </div>

                      {/* Button Group - Desktop View */}
                      <div className="d-none d-md-flex align-items-center">
                        {/* <button type="button" className="btn btn-sm rounded-pill me-1" style={{ backgroundColor: "#171717", fontSize: "14px", color: 'white' }}>
                          <i className="bi bi-search me-1"></i>
                          <span className="d-none d-md-inline">Search</span>
                        </button> */}

                        {/* <button type="button" className="btn btn-sm rounded-pill me-1" style={{ backgroundColor: "#171717", fontSize: "14px", color: 'white' }}>
                          <i className="bi bi-book me-1"></i>
                          <span className="d-none d-md-inline">Reason</span>
                        </button> */}

                        <select
                          className="form-select form-select-sm"
                          aria-label="Options"
                          style={{
                            width: "auto",
                            height: "38px",
                            backgroundColor: "#171717",
                            borderRadius: "50px",
                            paddingLeft: "10px",
                            paddingRight: "28px",
                            color: 'white',
                            border: 'none'
                          }}
                          value={selectedOption}
                          onChange={handleOptionChange}
                        >
                          <option value="text">Text</option>
                          <option value="image">Generate Image</option>
                        </select>

                        <button type="button" className="btn btn-sm rounded-circle ms-1" style={{ width: "42px", height: "42px", backgroundColor: "#171717", color: 'white' }}>
                          <i className="bi bi-mic-fill text-white"></i>
                        </button>
                      </div>

                      {/* Mobile View - Dropdown Toggle */}
                      <div className="d-flex d-md-none align-items-center position-relative">
                        <button
                          type="button"
                          className="btn btn-sm rounded-circle"
                          style={{ width: "42px", height: "42px", backgroundColor: "#171717", color: "white" }}
                          onClick={() => setShowMobileOptions(!showMobileOptions)}
                        >
                          <i className="bi bi-three-dots-vertical"></i>
                        </button>

                        {/* Dropdown menu */}
                        {showMobileOptions && (
                          <div
                            className="position-absolute end-0 mt-2 p-2 rounded shadow"
                            style={{ backgroundColor: "#171717", zIndex: 1000 }}
                          >
                            <button type="button" className="btn btn-sm text-white w-100 mb-1" style={{ backgroundColor: "#2a2a2a" }}>
                              <i className="bi bi-search me-1"></i>
                            </button>
                            <button type="button" className="btn btn-sm text-white w-100 mb-1" style={{ backgroundColor: "#2a2a2a" }}>
                              <i className="bi bi-book me-1"></i>
                            </button>
                            <select
                              className="form-select form-select-sm mb-1"
                              value={selectedOption}
                              onChange={handleOptionChange}
                              style={{ backgroundColor: "#2a2a2a", color: "white", border: "none" }}
                            >
                              <option value="text">Text</option>
                              <option value="image">Image</option>
                            </select>
                            <button type="button" className="btn btn-sm text-white w-100" style={{ backgroundColor: "#2a2a2a" }}>
                              <i className="bi bi-mic-fill me-1"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClaudeChatUI