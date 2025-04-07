import { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import MDEditor from "@uiw/react-md-editor";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { Mic, Plus, Search, Book, MoreVertical, FileCode2, Image } from "lucide-react";
import "./Bot.css";
import { FileJson } from "lucide-react";
import { Link } from "react-router-dom";

const BACKEND_URL = "http://localhost:4000/api/v1";

const ClaudeChatUI = () => {
  const [selected, setSelected] = useState("Precise");
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState("numax");
  const [error, setError] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [chatlist, setChatlist] = useState([]);
  const userToken = Cookies.get("authToken");
  const isUserLoggedIn = !!userToken;
  const [userData, setUserData] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamController, setStreamController] = useState(null);
  const [partialResponse, setPartialResponse] = useState("");
  const [image, setImage] = useState(null);
  const [selectedOption, setSelectedOption] = useState("text");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("File uploaded:", file.name);
      setIsDropdownOpen(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const photo = e.target.files[0];
    if (photo) {
      console.log("Photo uploaded:", photo.name);
      setIsDropdownOpen(false);
    }
  };

  // Skeleton Loader Component with Shine, Breathing Blocks, Circular Loader, and Block Reveal
  const SkeletonLoader = ({ isComplete = false, imageUrl = null }) => {
    return (
      <div
        style={{
          width: "420px",
          borderRadius: "8px",
          position: "relative",
          overflow: "hidden",
          margin: "15px 0",
          padding: "10px",
          backgroundColor: "#f0f0f0",
        }}
      >
        {/* Shine Effect on "Generation Started" */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "5px 0",
            textAlign: "start",
          }}
        >
          <span
            style={{
              color: "#666",
              fontSize: "1.2rem",
              fontWeight: "500",
              display: "inline-block",
            }}
          >
            Generation Started
          </span>
          {!isComplete && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "-100%",
                width: "50%",
                height: "100%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)",
                animation: "shine 1.5s infinite",
              }}
            />
          )}
        </div>

        {/* Container for Blocks and Logo */}
        <div
          style={{
            position: "relative",
            height: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Breathing Blocks */}
          {!isComplete && (
            <>
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#e0e0e0",
                  animation: "breatheColor 2s ease-in-out infinite",
                  zIndex: 1,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  width: "80%",
                  height: "80%",
                  backgroundColor: "#e5e5e5",
                  animation: "breatheColor 2s ease-in-out infinite 0.5s",
                  zIndex: 2,
                }}
              />
            </>
          )}

          {/* Logo with Circular Loader */}
          {!isComplete && (
            <div style={{ position: "relative", zIndex: 3 }}>
              <Image/>
              <div
                style={{
                  position: "absolute",
                  alignItems: "center",
                  top: "-10px",
                  left: "-10px",
                  width: "50px",
                  height: "55px",
                  border: "3px solid transparent",
                  borderTop: "3px solid #666",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            </div>
          )}

          {/* Block Reveal Effect for Image */}
          {isComplete && imageUrl && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                overflow: "hidden",
              }}
            >
              <img
                src={imageUrl}
                alt="Generated content"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  animation: "revealImage 0.5s ease-in-out",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#e0e0e0",
                  animation: "blockReveal 0.5s ease-in-out forwards",
                }}
              />
            </div>
          )}
        </div>

        <style>
          {`
            @keyframes shine {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(300%); }
            }
            @keyframes breatheColor {
              0% { background-color: #e0e0e0; }
              50% { background-color: #e8e8e8; }
              100% { background-color: #e0e0e0; }
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes revealImage {
              0% { opacity: 0; }
              100% { opacity: 1; }
            }
            @keyframes blockReveal {
              0% { transform: scaleY(1); }
              100% { transform: scaleY(0); transform-origin: top; }
            }
          `}
        </style>
      </div>
    );
  };

  const generateImage = async () => {
    if (!inputMessage.trim()) return;
    if (!activeChat) {
      setError("No active chat selected. Please create or select a chat first.");
      return;
    }

    const userMessage = { sender: "user", text: inputMessage, timestamp: new Date(), isImage: false };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setImage(null);
    setError(null);

    try {
      const generatingMsg = { 
        sender: "assistant", 
        text: <SkeletonLoader />, 
        timestamp: new Date(), 
        isImage: false 
      };
      setMessages((prev) => [...prev, generatingMsg]);

      console.log("Sending request to generate image with prompt:", inputMessage);
      const response = await fetch("http://ec2-13-60-38-53.eu-north-1.compute.amazonaws.com:7000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: inputMessage }),
      });

      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to generate image: ${errorText}`);
      }

      const blob = await response.blob();
      console.log("Blob received:", blob);
      const imageUrl = URL.createObjectURL(blob);
      console.log("Generated image URL:", imageUrl);
      setImage(imageUrl);

      setMessages((prev) => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        if (newMessages[lastIndex].sender === "assistant") {
          newMessages[lastIndex] = {
            sender: "assistant",
            text: <SkeletonLoader isComplete={true} imageUrl={imageUrl} />,
            timestamp: new Date(),
            isImage: true,
            imageUrl: imageUrl,
          };
        }
        return newMessages;
      });

      setInputMessage("");
    } catch (error) {
      console.error("Error generating image:", error);
      setError(`Failed to generate image: ${error.message}`);
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        if (newMessages[lastIndex].sender === "assistant") {
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
      if (e.key === "Enter" && isStreaming) stopStreamingResponse();
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isStreaming]);

  const stopStreamingResponse = () => {
    if (streamController && isStreaming) {
      streamController.abort();
      setIsStreaming(false);
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg?.sender === "assistant") {
          lastMsg.text = partialResponse + " [Response stopped by user]";
        }
        return [...newMessages];
      });
    }
  };

  useEffect(() => {
    if (isUserLoggedIn) {
      try {
        const decodedToken = jwtDecode(userToken);
        setUserData(decodedToken);
      } catch (error) {
        console.error("Error decoding token:", error);
        setUserData(null);
      }
    }
  }, [isUserLoggedIn, userToken]);

  useEffect(() => {
    if (activeChat && userData) fetchChatMessages(activeChat);
  }, [activeChat, userData]);

  useEffect(() => {
    if (isUserLoggedIn && userData) fetchChats();
  }, [isUserLoggedIn, userData, chatlist]);

  useEffect(() => {
    if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
    const handleGlobalKeyDown = (e) => {
      if (!inputRef.current.contains(document.activeElement) && e.key.length === 1) inputRef.current.focus();
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const fetchChatMessages = async (chatId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/chat/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${userToken}` },
        body: JSON.stringify({ chatId, userId: userData.userId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load messages");
      const formattedMessages = data.messages.map((msg) => ({
        sender: msg.role,
        text: msg.content,
        timestamp: new Date(msg.timestamp || Date.now()),
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error("❌ Fetch Error:", error);
      setError(`Failed to load messages: ${error.message}`);
    }
  };

  const fetchChats = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${userToken}` },
        body: JSON.stringify({ userId: userData.userId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load chats");
      const chatsArray = Array.isArray(data.chats) ? data.chats : data && Array.isArray(data) ? data : [];
      const sortedChats = chatsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setChatlist(sortedChats);
      if (sortedChats.length > 0 && !activeChat) setActiveChat(sortedChats[0]._id);
    } catch (error) {
      console.error("Error fetching chats:", error);
      setError(`Failed to load chats: ${error.message}`);
    }
  };

  const handleNewChat = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/chat/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${userToken}` },
        body: JSON.stringify({ userId: userData.userId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create chat");
      setMessages([]);
      setInputMessage("");
      setError(null);
      setActiveChat(data.chat._id);
      fetchChats();
    } catch (error) {
      console.error("Error creating new chat:", error);
      setError(`Failed to create a new chat: ${error.message}`);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    if (!activeChat) {
      setError("No active chat selected. Please create or select a chat first.");
      return;
    }

    if (selectedOption === "image") {
      await generateImage();
    } else {
      const userMessage = { sender: "user", text: inputMessage, timestamp: new Date() };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInputMessage("");
      setIsLoading(true);
      setError(null);
      setPartialResponse("");

      try {
        const controller = new AbortController();
        setStreamController(controller);
        setIsStreaming(true);

        const response = await fetch(`${BACKEND_URL}/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${userToken}` },
          body: JSON.stringify({
            model: model,
            messages: updatedMessages.map((msg) => ({ role: msg.sender, content: msg.text })),
            userId: userData.userId,
            chatId: activeChat,
          }),
          signal: controller.signal,
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
                setPartialResponse(accumulatedText);
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

        const currentMessages = updatedMessages.length + 1;
        if (currentMessages === 2 && activeChat) setTimeout(() => generateChatTitle(activeChat), 500);
      } catch (err) {
        if (err.name === "AbortError") {
          console.log("Response streaming was aborted by user");
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
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSendMessage(e);
  };

  const handleChatClick = (chatId) => setActiveChat(chatId);

  const generateChatTitle = (chatId) => console.log("Generate chat title for:", chatId);

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-3 sidebar" style={{ backgroundColor: "white", borderRight: "1px solid #dee2e6", height: "100vh" }}>
          <div className="p-3 d-flex border-bottom">
            <div className="bg-dark p-2 rounded me-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" className="bi bi-chat-square-text" viewBox="0 0 16 16">
                <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2.5a2 2 0 0 0-1.6.8L8 14.333 6.1 11.8a2 2 0 0 0-1.6-.8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2.5a1 1 0 0 1 .8.4l1.9 2.533a1 1 0 0 0 1.6 0l1.9-2.533a1 1 0 0 1 .8-.4H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                <path d="M3 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 6a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 6zm0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
              </svg>
            </div>
            <div>
              <div className="fw-bold">Chat Threads</div>
              <div className="text-muted small">{chatlist.length} conversations</div>
            </div>
          </div>

          <div className="sidebar-section-header" style={{ padding: "10px 15px", color: "#6c757d", fontSize: "14px", fontWeight: 600 }}>
            Your Chats
          </div>

          <div style={{ overflowY: "scroll", height: "65vh" }}>
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
                  <MoreVertical size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="sidebar-footer mt-auto" style={{ borderTop: "1px solid #dee2e6", padding: "15px" }}>
            <button className="btn btn-light border w-100 d-flex align-items-center justify-content-center" onClick={handleNewChat}>
              <Plus size={16} className="me-2" />
              New Chat
            </button>
          </div>

          <div className="d-flex justify-content-between p-3 border-top">
            <button className="btn btn-sm text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-house" viewBox="0 0 16 16">
                <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5ZM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5.5V7.207l5-5 5 5Z" />
              </svg>
            </button>
            <button className="btn btn-sm text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-brightness-high" viewBox="0 0 16 16">
                <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 0 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z" />
              </svg>
            </button>
            <Link to='/dashboard'>
              <button className="btn btn-sm text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-gear" viewBox="0 0 16 16">
                  <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
                  <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c-1.79-.527-1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z" />
                </svg>
              </button>
            </Link>
          </div>
        </div>

        {/* Main Chat Content */}
        <div className="col-9" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
          <div className="chat-header d-flex justify-content-between align-items-center" style={{ padding: "15px", backgroundColor: "white" }}>
            <div className="d-flex align-items-center gap-2">
              <FileCode2 size={30} />
              <h1 className="h5 mb-0 fw-bold">
                {activeChat ? chatlist.find((c) => c._id === activeChat)?.title || `Chat` : `New Chat`}
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
              <div className="card-body chat-content" ref={chatContainerRef} style={{ height: "550px", overflowY: "auto", width: "100%" }}>
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
                      style={{ textAlign: msg.sender === "user" ? "right" : "left", marginBottom: "15px", fontSize: "1.2rem", color: "black" }}
                    >
                      <div
                        style={{
                          display: "inline-block",
                          padding: "10px 15px",
                          borderRadius: "15px",
                          maxWidth: "70%",
                          backgroundColor: msg.sender === "user" ? "#97C8EB" : "#E6E6E9",
                          color: msg.sender === "user" ? "white" : "black",
                          position: "relative",
                        }}
                      >
                        {msg.sender === "assistant" && isStreaming && index === messages.length - 1 && (
                          <span
                            className="spinner"
                            style={{
                              position: "absolute",
                              top: "5px",
                              left: "5px",
                              width: "16px",
                              height: "16px",
                              border: "2px solid #ccc",
                              borderTop: "2px solid #007bff",
                              borderRadius: "50%",
                              animation: "spin 1s linear infinite",
                            }}
                          />
                        )}
                        {msg.isImage && typeof msg.text !== "string" ? (
                          msg.text // Render SkeletonLoader with image
                        ) : msg.isImage ? (
                          <img src={msg.imageUrl} alt="Generated content" style={{ maxWidth: "100%", borderRadius: "40px" }} />
                        ) : typeof msg.text === "string" ? (
                          <MDEditor.Markdown source={msg.text.trim()} style={{ background: "transparent" }} />
                        ) : (
                          msg.text // Render SkeletonLoader during generation
                        )}
                      </div>
                      <div className="timestamp text-muted small mt-1">{msg.timestamp.toLocaleTimeString()}</div>
                    </div>
                  ))
                )}
                {error && (
                  <div className="alert alert-danger mt-3" role="alert">
                    <MDEditor.Markdown source={error} />
                  </div>
                )}
              </div>

              <div className="card-footer bg-white" style={{ border: "none" }}>
                <form onSubmit={handleSendMessage} className="w-100 py-3 px-2 mt-5 shadow-lg rounded-4">
                  <div className="input-group mx-auto" style={{ maxWidth: "1200px" }}>
                    <div className="d-flex align-items-center bg-white rounded-pill w-100 px-3 py-2 shadow-sm position-relative">
                      <div className="dropdown">
                        <button
                          type="button"
                          className="btn btn-sm rounded-circle me-2 transition-all hover:scale-105"
                          style={{ width: "36px", height: "36px", backgroundColor: "#e9ecef", border: "none" }}
                          onClick={toggleDropdown}
                        >
                          <Plus size={20} />
                        </button>
                        {isDropdownOpen && (
                          <div
                            className="dropdown-menu show"
                            style={{ position: "absolute", left: "0", bottom: "40px" }}
                          >
                            <label className="dropdown-item" style={{ cursor: "pointer" }}>
                              Upload File
                              <input
                                type="file"
                                style={{ display: "none" }}
                                accept=".txt,.pdf,.doc,.docx"
                                onChange={handleFileUpload}
                              />
                            </label>
                            <label className="dropdown-item" style={{ cursor: "pointer" }}>
                              Upload Photo
                              <input
                                type="file"
                                style={{ display: "none" }}
                                accept="image/*"
                                onChange={handlePhotoUpload}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                      <div className="flex-grow-1 mx-2">
                        <input
                          ref={inputRef}
                          type="text"
                          className="form-control border-0 bg-transparent shadow-none"
                          placeholder="Ask anything"
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyDown={handleKeyDown}
                          disabled={isLoading}
                          style={{ fontSize: "1rem", color: "#212529" }}
                        />
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm rounded-pill transition-all hover:bg-gray-200"
                          style={{ backgroundColor: "#e9ecef", padding: "6px 12px", border: "none" }}
                        >
                          <Search size={16} className="me-1 text-dark" />
                          <span className="d-none d-md-inline fw-medium text-dark">Search</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm rounded-pill transition-all hover:bg-gray-200"
                          style={{ backgroundColor: "#e9ecef", padding: "6px 12px", border: "none" }}
                        >
                          <Book size={16} className="me-1 text-dark" />
                          <span className="d-none d-md-inline fw-medium text-dark">Reason</span>
                        </button>
                        <select
                          className="form-select form-select-sm transition-all"
                          aria-label="Options"
                          style={{
                            width: "auto",
                            height: "36px",
                            backgroundColor: "#e9ecef",
                            borderRadius: "20px",
                            padding: "0 25px 0 12px",
                            border: "none",
                            cursor: "pointer",
                          }}
                          value={selectedOption}
                          onChange={handleOptionChange}
                        >
                          <option value="text">Text</option>
                          <option value="image">Generate Image</option>
                        </select>
                        <button
                          type="button"
                          className="btn btn-sm rounded-circle transition-all hover:scale-105"
                          style={{ width: "40px", height: "40px", backgroundColor: "#495057", border: "none" }}
                        >
                          <Mic size={20} className="text-white" />
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
  );
};

export default ClaudeChatUI;