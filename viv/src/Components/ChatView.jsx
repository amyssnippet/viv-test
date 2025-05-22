"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import Cookies from "js-cookie"
import toast from "react-hot-toast"
import { jwtDecode } from "jwt-decode"
import axios from "axios"
import { ThreeDots } from "react-loader-spinner"
import remarkGfm from "remark-gfm"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism"
import BACKENDURL from "./urls"
import {
  Copy,
  ThumbsUp,
  ThumbsDown,
  Plus,
  MessageSquare,
  Home,
  Settings,
  LogOut,
  Edit,
  ChevronLeft,
  Send,
  MoreVertical,
} from "lucide-react"

const ChatView = () => {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const [selected, setSelected] = useState("Precise")
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [model, setModel] = useState("numax")
  const [modelOptions] = useState([
    { value: "numax", label: "Numax" },
    { value: "mcp", label: "Jarvis" },
  ])
  const [error, setError] = useState(null)
  const chatContainerRef = useRef(null)
  const inputRef = useRef(null)
  const userToken = Cookies.get("authToken")
  const [userData, setUserData] = useState(null)
  const [image, setImage] = useState(null)
  const [selectedOption, setSelectedOption] = useState("text")
  const [showMobileOptions, setShowMobileOptions] = useState(false)
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [loadingChat, setLoadingChat] = useState(false)
  const [chatLoader, setChatLoader] = useState(false)
  const dropdownRef = useRef(null)
  const [imageLoader, setImageLoader] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [chatTitle, setChatTitle] = useState("")
  const [feedback, setFeedback] = useState({})
  const [title, setTitle] = useState("")
  const [user, setUser] = useState(null)
  const [chatlist, setChatlist] = useState([])
  const [loadingChats, setLoadingChats] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(400) // Fixed width at 400px

  // Local state for messages and streaming (similar to Bot.jsx approach)
  const [messages, setMessages] = useState({})
  const [streamingChats, setStreamingChats] = useState({})
  const [streamController, setStreamController] = useState(null)
  const [partialResponse, setPartialResponse] = useState("")

  // Get messages for current chat
  const currentMessages = messages[chatId] || []

  // Decode user token on component mount
  useEffect(() => {
    if (userToken) {
      try {
        const decodedToken = jwtDecode(userToken)
        setUserData(decodedToken)
      } catch (error) {
        console.error("Error decoding token:", error)
        setUserData(null)
      }
    } else {
      navigate("/auth")
    }
  }, [userToken, navigate])

  // Fetch chat messages when chatId changes
  useEffect(() => {
    if (chatId && userData) {
      fetchChatMessages()
      fetchChatDetails()
    }
  }, [chatId, userData])

  // Fetch chat list when userData changes
  useEffect(() => {
    if (userData) {
      fetchChats()
      fetchUser()
    }
  }, [userData])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [currentMessages])

  // Auto-focus input field
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === "Enter" && !e.shiftKey && document.activeElement === inputRef.current) {
        e.preventDefault()
        handleSendMessage(e)
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown)
    }
  }, [inputMessage, messages, chatId])

  // Handle key press to stop streaming
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "Enter" && streamingChats[chatId]) {
        stopStreamingResponse()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => {
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [streamingChats, chatId, partialResponse])

  // Handle click outside for mobile options
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMobileOptions(false)
      }
    }

    if (showMobileOptions) {
      document.addEventListener("mousedown", handleClickOutside)
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showMobileOptions])

  const fetchUser = async () => {
    try {
      const response = await axios.post(`${BACKENDURL}/fetch/user`, {
        id: userData.userId,
      })
      console.log(response)
      if (response.data) {
        setUser(response.data)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }

  const fetchChatDetails = async () => {
    try {
      const response = await axios.post(`${BACKENDURL}/chat/details`, {
        chatId,
        userId: userData.userId,
      })

      if (response.data && response.data.chat) {
        setChatTitle(
          response.data.chat.title || `Chat from ${new Date(response.data.chat.createdAt).toLocaleDateString()}`,
        )
      }
    } catch (error) {
      console.error("Error fetching chat details:", error)
    }
  }

  const fetchChatMessages = async () => {
    try {
      setChatLoader(true)
      const response = await fetch(`${BACKENDURL}/chat/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          userId: userData.userId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to load messages")
      }

      // Check if data.messages exists and is an array
      if (!data.messages || !Array.isArray(data.messages)) {
        console.error("No messages found in response:", data)
        setMessages((prev) => ({
          ...prev,
          [chatId]: [],
        }))
        return
      }

      // Format the messages with proper timestamps
      const formattedMessages = data.messages.map((msg) => ({
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        isImage: msg.isImage || false,
        imageUrl: msg.imageUrl || null,
      }))

      setMessages((prev) => ({
        ...prev,
        [chatId]: formattedMessages,
      }))
    } catch (error) {
      console.error("❌ Fetch Error:", error)
      setError(`Failed to load messages: ${error.message}`)
    } finally {
      setChatLoader(false)
    }
  }

  const fetchChats = async () => {
    try {
      setLoadingChats(true)
      const response = await fetch(`${BACKENDURL}/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          userId: userData.userId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to load chats")
      }

      const chatsArray = Array.isArray(data.chats) ? data.chats : []
      const sortedChats = chatsArray.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      setChatlist(sortedChats)
    } catch (error) {
      console.error("Error fetching chats:", error)
      setError(`Failed to load chats: ${error.message}`)
    } finally {
      setLoadingChats(false)
    }
  }

  const isStreamingChat = (chatId) => {
    return streamingChats[chatId] || false
  }

  const stopStreamingResponse = () => {
    if (streamController && streamingChats[chatId]) {
      streamController.abort() // Safely stop the previous stream
      setStreamingChats((prev) => ({ ...prev, [chatId]: false }))

      // Update the message with [Response stopped by user] appended
      setMessages((prev) => {
        const chatMessages = [...(prev[chatId] || [])]
        const lastMsg = chatMessages[chatMessages.length - 1]

        if (lastMsg?.sender === "assistant") {
          lastMsg.text = partialResponse + " [Response stopped by user]"
          lastMsg.isThinking = false // Ensure thinking state is cleared
        }

        return {
          ...prev,
          [chatId]: chatMessages,
        }
      })
    }
  }

  const handleLike = (index) => {
    toast.success("Thanks for your feedback!")
    setFeedback((prev) => ({ ...prev, [index]: "like" }))
  }

  const handleDislike = (index) => {
    toast.success("Thanks for your feedback!")
    setFeedback((prev) => ({ ...prev, [index]: "dislike" }))
  }

  const handleCopy = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Copied to clipboard!")
      })
      .catch((err) => {
        toast.error("Failed to copy text")
      })
  }

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value)
  }

  const handleEditTitle = async () => {
    const newTitle = prompt("Enter new chat title:", chatTitle)
    if (!newTitle) return

    try {
      await axios.post(`${BACKENDURL}/chat/update/title`, {
        chatId: chatId,
        title: newTitle,
        userId: userData.userId,
      })

      setChatTitle(newTitle)
      toast.success("Chat title updated successfully!")
      fetchChats() // Refresh chat list
    } catch (error) {
      console.error(error)
      toast.error("Error updating chat title.")
    }
  }

  const handleLogOut = () => {
    Cookies.remove("authToken")
    navigate("/auth")
    toast.success("Logged out successfully")
  }

  const handleNewChat = async () => {
    try {
      const response = await fetch(`${BACKENDURL}/chat/new`, {
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

      // Navigate to the new chat
      navigate(`/chat/${data.chat.id}`)
      // Close sidebar on mobile after creating a new chat
      setSidebarOpen(false)
    } catch (error) {
      console.error("Error creating new chat:", error)
      setError(`Failed to create a new chat: ${error.message}`)
    }
  }

  const handleChatDelete = async (chatToDeleteId, e) => {
    e.stopPropagation()
    e.preventDefault()

    if (confirm("Are you sure you want to delete this chat?")) {
      try {
        await axios.post(`${BACKENDURL}/chat/delete`, {
          userId: userData.userId,
          chatId: chatToDeleteId,
        })

        // If the deleted chat is the currently open chat, navigate away
        if (chatToDeleteId === chatId) {
          navigate("/chats")
        }

        // Refresh chat list regardless
        fetchChats()
        toast.success("Chat deleted successfully!")
      } catch (error) {
        console.error("Error deleting chat:", error)
        setError(`Failed to delete chat: ${error.response?.data?.error || error.message}`)
        toast.error("Failed to delete chat")
      }
    }
  }

  const editChat = async (chatId, e) => {
    e.stopPropagation()
    e.preventDefault()

    const newTitle = prompt("Enter new chat title:")
    if (!newTitle) return

    try {
      await axios.post(`${BACKENDURL}/chat/update/title`, {
        chatId: chatId,
        title: newTitle,
        userId: userData.userId,
      })

      toast.success("Chat title updated successfully!")
      fetchChats()
      if (chatId === useParams().chatId) {
        setChatTitle(newTitle)
      }
    } catch (error) {
      console.error(error)
      toast.error("Error updating chat title.")
    }
  }

  const generateImage = async () => {
    setImageLoader(true)
    if (!inputMessage.trim()) return

    const userMessage = {
      sender: "user",
      text: inputMessage,
      timestamp: new Date(),
      isImage: false,
    }

    // Update messages for active chat
    setMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), userMessage],
    }))

    setImage(null)
    setError(null)

    try {
      const generatingMsg = {
        sender: "assistant",
        text: `Generating image based on: "${inputMessage}"...`,
        timestamp: new Date(),
        isImage: false,
      }

      // Add generating message to active chat
      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), generatingMsg],
      }))

      const response = await fetch(`${BACKENDURL}/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: inputMessage,
          chatId: chatId,
          userId: userData.userId,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate image")

      const data = await response.json()
      const imageUrl = data.imageUrl

      // Update the messages with the generated image URL
      setMessages((prev) => {
        const chatMessages = [...(prev[chatId] || [])]
        chatMessages[chatMessages.length - 1] = {
          sender: "assistant",
          text: `Image generated from prompt: "${inputMessage}"`,
          timestamp: new Date(),
          isImage: true,
          imageUrl: imageUrl,
        }

        return {
          ...prev,
          [chatId]: chatMessages,
        }
      })

      setInputMessage("")
    } catch (error) {
      console.error("Error generating image:", error)
      setError(`Failed to generate image: ${error.message}`)

      // Update the generating message to show error
      setMessages((prev) => {
        const chatMessages = [...(prev[chatId] || [])]
        chatMessages[chatMessages.length - 1].text = `Error generating image: ${error.message}`

        return {
          ...prev,
          [chatId]: chatMessages,
        }
      })
    } finally {
      setImageLoader(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    setLoadingChat(true)

    // If there's an active stream, stop it
    if (streamController && streamingChats[chatId]) {
      streamController.abort()
      setStreamingChats((prev) => ({ ...prev, [chatId]: false }))
    }

    if (!inputMessage.trim() || isLoading) return

    // Handle based on selected option
    if (selectedOption === "image") {
      await generateImage()
      setLoadingChat(false) // Make sure to reset loading state after image generation
    } else {
      const userMessage = {
        sender: "user",
        text: inputMessage,
        timestamp: new Date(),
      }

      // Update messages for the active chat
      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), userMessage],
      }))

      setInputMessage("")
      setIsLoading(true)
      setError(null)
      setPartialResponse("") // Reset partial response

      try {
        // Create an AbortController to handle stopping the stream
        const controller = new AbortController()
        setStreamController(controller)
        setStreamingChats((prev) => ({ ...prev, [chatId]: true }))

        // Add a temporary thinking message that will be updated
        const thinkingMessage = {
          sender: "assistant",
          text: "Thinking...",
          timestamp: new Date(),
          isThinking: true, // Add this flag to identify thinking state
        }

        // Get current messages and add thinking message
        const currentChatMessages = [...(messages[chatId] || []), userMessage]
        const messagesWithThinking = [...currentChatMessages, thinkingMessage]

        setMessages((prev) => ({
          ...prev,
          [chatId]: messagesWithThinking,
        }))

        let endpoint = `${BACKENDURL}/chat/stream`
        let requestBody = {}

        if (model === "mcp") {
          endpoint = "https://jarvis.cosinv.com/mcp"
          requestBody = {
            question: inputMessage,
          }
        } else {
          // Default numax model
          requestBody = {
            model: model,
            messages: currentChatMessages.map((msg) => ({
              role: msg.sender === "user" ? "user" : "assistant",
              content: msg.text,
            })),
            userId: userData.userId,
            chatId: chatId,
          }
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to get response")
        }

        if (!response.body) throw new Error("Response body is null")

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let accumulatedText = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })

          chunk.split("\n").forEach((line) => {
            if (!line.trim() || line.startsWith("data: [DONE]")) return

            try {
              let parsedResponse
              let responseText

              if (model === "mcp") {
                // For MCP model, the response is a direct JSON object
                try {
                  parsedResponse = JSON.parse(line)
                  responseText = parsedResponse.answer
                } catch (e) {
                  // If it's not valid JSON yet (partial response), just use the line
                  responseText = line
                }
              } else {
                // For numax model, the response is in the streaming format
                parsedResponse = JSON.parse(line.replace("data: ", "").trim())
                responseText = parsedResponse.text
              }

              if (responseText) {
                accumulatedText = responseText
                setPartialResponse(accumulatedText)

                // Update the thinking message with the current text
                setMessages((prev) => {
                  const chatMessages = [...(prev[chatId] || [])]
                  const lastMsg = chatMessages[chatMessages.length - 1]

                  if (lastMsg && lastMsg.isThinking) {
                    lastMsg.text = accumulatedText
                    lastMsg.isThinking = false // No longer in thinking state
                  }

                  return {
                    ...prev,
                    [chatId]: chatMessages,
                  }
                })
              }
            } catch (error) {
              console.warn("Error parsing response chunk:", error, line)
            }
          })
        }

        // When streaming is complete, ensure the message is finalized
        setMessages((prev) => {
          const chatMessages = [...(prev[chatId] || [])]
          const lastMessage = chatMessages[chatMessages.length - 1]

          if (lastMessage && (lastMessage.isThinking || lastMessage.text === "Thinking...")) {
            chatMessages[chatMessages.length - 1] = {
              sender: "assistant",
              text: accumulatedText,
              timestamp: new Date(),
              isThinking: false,
            }
          }

          return {
            ...prev,
            [chatId]: chatMessages,
          }
        })

        // Generate title if this is a new chat with first response
        if ((messages[chatId]?.length || 0) === 0 && !chatTitle) {
          fetchChatDetails()
        }

        // Refresh chat list to update last message time
        fetchChats()
      } catch (err) {
        if (err.name === "AbortError") {
          console.log("Response streaming was aborted by user")

          // Clean up the thinking message if aborted
          setMessages((prev) => {
            const chatMessages = [...(prev[chatId] || [])]
            return {
              ...prev,
              [chatId]: chatMessages.filter((msg) => !msg.isThinking),
            }
          })
        } else {
          console.error("Error calling backend:", err)
          setError(`Failed to get response: ${err.message}`)

          // Clean up the thinking message if there's an error
          setMessages((prev) => {
            const chatMessages = [...(prev[chatId] || [])]
            return {
              ...prev,
              [chatId]: chatMessages.filter((msg) => !msg.isThinking),
            }
          })
        }
      } finally {
        setIsLoading(false)
        setStreamingChats((prev) => ({ ...prev, [chatId]: false }))
        setStreamController(null)
        setLoadingChat(false)
      }
    }
  }

  return (
    <div className="chat-app-container" style={{ height: "100vh", overflow: "hidden" }}>
      {/* Main layout with sidebar and content area */}
      <div className="d-flex h-100" style={{ minHeight: "100vh" }}>
        {/* Sidebar - Desktop */}
        <div
          className="sidebar d-none d-md-flex flex-column"
          style={{
            width: "400px", // Fixed width
            minWidth: "400px", // Add this to prevent shrinking
            flex: "0 0 400px", // Add this to make it fixed width
            backgroundColor: "#171717",
            color: "white",
            borderRight: "1px solid #333",
            height: "100vh",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Sidebar Header */}
          <div className="sidebar-header p-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <div className="bg-dark p-2 rounded me-2">
                <MessageSquare size={20} color="white" />
              </div>
              <div>
                <div className="fw-bold">Chat History</div>
                <div className="small">{chatlist.length} conversations</div>
              </div>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-3">
            <button
              className="btn w-100 d-flex align-items-center justify-content-center mb-3"
              onClick={handleNewChat}
              style={{
                background: "#222222",
                color: "white",
                border: "none",
                transition: "all 0.2s ease",
                height: "44px",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#333333")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#222222")}
            >
              <Plus size={16} className="me-2" />
              New Chat
            </button>
          </div>

          {/* Chat List */}
          <div
            className="sidebar-section-header px-3 py-2"
            style={{ color: "#6c757d", fontSize: "14px", fontWeight: 600 }}
          >
            Your Chats
          </div>

          <div className="chat-list flex-grow-1 overflow-auto px-3" style={{ maxHeight: "calc(100vh - 220px)" }}>
            {loadingChats ? (
              <div className="d-flex justify-content-center py-4">
                <ThreeDots color="#ffffff" height={30} width={30} />
              </div>
            ) : chatlist.length === 0 ? (
              <div className="text-center p-4 text-muted">No chats yet. Create a new chat to get started.</div>
            ) : (
              chatlist.map((chat) => (
                <Link
                  key={chat.id}
                  to={`/chat/${chat.id}`}
                  className="text-decoration-none"
                  onClick={() => setSidebarOpen(false)}
                >
                  <div
                    className={`chat-list-item ${chat.id === chatId ? "active-chat" : ""} ${isStreamingChat(chat.id) ? "streaming-chat" : ""}`}
                    style={{
                      cursor: "pointer",
                      padding: "10px 15px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor:
                        chat.id === chatId ? "#2a2a2a" : isStreamingChat(chat.id) ? "#2d3748" : "#212020",
                      marginBottom: "8px",
                      borderRadius: "8px",
                      color: "white",
                      transition: "all 0.2s ease",
                      border:
                        chat.id === chatId
                          ? "1px solid #444"
                          : isStreamingChat(chat.id)
                            ? "1px solid #4299e1"
                            : "1px solid transparent",
                    }}
                    onMouseOver={(e) => {
                      if (chat.id !== chatId) {
                        e.currentTarget.style.backgroundColor = "#2a2a2a"
                      }
                    }}
                    onMouseOut={(e) => {
                      if (chat.id !== chatId) {
                        e.currentTarget.style.backgroundColor = isStreamingChat(chat.id) ? "#2d3748" : "#212020"
                      }
                    }}
                  >
                    <span className="text-truncate">
                      {chat.title || `Chat from ${new Date(chat.createdAt).toLocaleDateString()}`}
                      {isStreamingChat(chat.id) && <span className="ms-2 badge bg-info">Streaming</span>}
                    </span>
                    <div className="dropdown">
                      <button
                        className="btn"
                        type="button"
                        id={`dropdown-${chat.id}`}
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: "white", padding: "2px" }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      <ul
                        className="dropdown-menu"
                        aria-labelledby={`dropdown-${chat.id}`}
                        style={{ backgroundColor: "#222", border: "1px solid #444" }}
                      >
                        <li>
                          <a
                            className="dropdown-item text-white"
                            href="#"
                            onClick={(e) => editChat(chat.id, e)}
                            style={{ fontSize: "14px" }}
                          >
                            <Edit size={14} className="me-2" /> Edit Chat
                          </a>
                        </li>
                        <li>
                          <a
                            className="dropdown-item text-white"
                            href="#"
                            onClick={(e) => handleChatDelete(chat.id, e)}
                            style={{ fontSize: "14px", color: "#ff6b6b" }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="me-2"
                            >
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                            Delete Chat
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="sidebar-footer p-3 mt-auto border-top border-dark">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex">
                <Link to="/chats" className="btn btn-sm text-white me-2">
                  <Home size={20} />
                </Link>
                <Link to="/dashboard" className="btn btn-sm text-white me-2">
                  <Settings size={20} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        <div
          className={`mobile-sidebar-overlay ${isSidebarOpen ? "open" : ""} d-md-none`}
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1040,
            opacity: isSidebarOpen ? 1 : 0,
            visibility: isSidebarOpen ? "visible" : "hidden",
            transition: "opacity 0.3s ease, visibility 0.3s ease",
          }}
        >
          {/* Mobile sidebar content - similar to desktop sidebar */}
          {/* ... (mobile sidebar content) ... */}
        </div>

        {/* Main Content Area */}
        <div
          className="main-content flex-grow-1 d-flex flex-column"
          style={{ backgroundColor: "#222222", height: "100vh", overflow: "hidden" }}
        >
          {/* Chat Header */}
          <div
            className="chat-header d-flex justify-content-between align-items-center"
            style={{ padding: "15px", backgroundColor: "#222222", borderBottom: "1px solid #333" }}
          >
            <div className="d-flex align-items-center">
              <button
                className="btn text-white d-md-none me-2"
                onClick={() => setSidebarOpen(true)}
                style={{ padding: "5px" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="white"
                  className="bi bi-list"
                  viewBox="0 0 16 16"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.5 12.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm0-4a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm0-4a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11z"
                  />
                </svg>
              </button>

              <Link to="/chats" className="btn text-white me-2" style={{ padding: "5px" }}>
                <ChevronLeft size={20} />
              </Link>

              <div className="d-flex align-items-center" onClick={handleEditTitle} style={{ cursor: "pointer" }}>
                <MessageSquare size={18} className="me-2 text-white" />
                <h1 className="h5 mb-0 fw-bold chat-title" style={{ color: "white" }}>
                  {chatTitle?.length > 25 ? chatTitle.slice(0, 25) + "..." : chatTitle || "Chat"}
                </h1>
                <Edit size={14} className="ms-2 text-white" />
              </div>
            </div>
            <div className="form-group mb-0 d-flex align-items-center gap-3">
              {/* Model Selector */}
              <select
                className="form-select form-select-sm"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={{
                  background: "#2E2F2E",
                  border: "none",
                  color: "white",
                  borderRadius: "4px",
                  padding: "6px 12px",
                  fontSize: "14px",
                }}
              >
                {modelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
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
                    src={user.profile || "/placeholder.svg"}
                    alt="Profile"
                    className="dropdown-toggle"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{
                      width: "65px",
                      height: "40px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #444",
                      cursor: "pointer",
                    }}
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "/default-avatar.png"
                    }}
                  />
                )}
                <ul
                  className="dropdown-menu dropdown-menu-end"
                  style={{ backgroundColor: "#2E2F2E", border: "1px solid #444" }}
                >
                  <li>
                    <button
                      className="dropdown-item text-white"
                      style={{ backgroundColor: "transparent" }}
                      onClick={handleLogOut}
                    >
                      <LogOut size={14} className="me-2" /> Logout
                    </button>
                  </li>
                </ul>
              </div>
              {/* Debug button */}
            </div>
          </div>

          {/* Chat Messages */}
          <div
            className="chat-messages flex-grow-1 overflow-auto p-3"
            ref={chatContainerRef}
            style={{ scrollBehavior: "smooth" }}
          >
            {chatLoader ? (
              <div className="chat-skeleton-container">
                {[1, 2, 3, 4, 5, 6].map((item, i) => (
                  <div
                    key={i}
                    className={`chat-skeleton ${i % 2 === 0 ? "left" : "right"}`}
                    style={{
                      marginBottom: "20px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: i % 2 === 0 ? "flex-start" : "flex-end",
                    }}
                  >
                    <div
                      className="bubble"
                      style={{
                        height: "60px",
                        width: "60%",
                        backgroundColor: "#2a2a2a",
                        borderRadius: "12px",
                        animation: "pulse 1.5s infinite ease-in-out",
                      }}
                    ></div>
                    <div
                      className="timestamp"
                      style={{
                        height: "10px",
                        width: "50px",
                        backgroundColor: "#2a2a2a",
                        marginTop: "5px",
                        borderRadius: "3px",
                        animation: "pulse 1.5s infinite ease-in-out",
                      }}
                    ></div>
                  </div>
                ))}
              </div>
            ) : !currentMessages || currentMessages.length === 0 ? (
              <div className="text-center py-5" style={{ color: "white", width: "100%" }}>
                <h2>Hello {user?.name || userData?.name || "there"}!</h2>
                <p>Type a message below to begin chatting.</p>
              </div>
            ) : (
              currentMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`message-container ${msg.sender === "user" ? "user-message" : "assistant-message"}`}
                  style={{
                    textAlign: msg.sender === "user" ? "right" : "left",
                    marginBottom: "15px",
                    animation: index === currentMessages.length - 1 ? "fadeIn 0.3s ease-in-out" : "none",
                  }}
                >
                  <div
                    className="message-bubble"
                    style={{
                      display: "inline-block",
                      padding: "12px 16px",
                      borderRadius: "16px",
                      maxWidth: "75%",
                      backgroundColor: msg.sender === "user" ? "#2E2F2E" : "#3a3a3a",
                      color: "white",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    {msg.isImage ? (
                      <div className="image-container">
                        <img
                          src={msg.imageUrl || "/placeholder.svg"}
                          alt="Generated content"
                          style={{
                            maxWidth: "100%",
                            borderRadius: "8px",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <>
                        <ReactMarkdown
                          remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
                          components={{
                            code: ({ inline, className, children }) => {
                              const language = className?.replace("language-", "")
                              return inline ? (
                                <code className="bg-dark p-1 rounded" style={{ fontSize: "0.9em" }}>
                                  {children}
                                </code>
                              ) : (
                                <div style={{ position: "relative", marginTop: "10px", marginBottom: "10px" }}>
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: "0",
                                      right: "0",
                                      backgroundColor: "#222",
                                      borderRadius: "0 4px 0 4px",
                                      padding: "2px 8px",
                                      fontSize: "12px",
                                      color: "#aaa",
                                    }}
                                  >
                                    {language || "code"}
                                  </div>
                                  <button
                                    onClick={() => handleCopy(String(children))}
                                    style={{
                                      position: "absolute",
                                      top: "8px",
                                      right: "8px",
                                      background: "rgba(51, 51, 51, 0.8)",
                                      color: "white",
                                      border: "none",
                                      padding: "4px 8px",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                      fontSize: "12px",
                                      zIndex: 1,
                                    }}
                                  >
                                    <Copy size={14} />
                                  </button>
                                  <SyntaxHighlighter
                                    language={language}
                                    style={dracula}
                                    customStyle={{
                                      borderRadius: "6px",
                                      marginTop: "0",
                                      fontSize: "14px",
                                    }}
                                  >
                                    {children}
                                  </SyntaxHighlighter>
                                </div>
                              )
                            },
                          }}
                        >
                          {msg.isThinking ? "Thinking..." : String(msg.text || "").trim()}
                        </ReactMarkdown>

                        {/* Action buttons: only show for AI messages */}
                        {msg.sender !== "user" && (
                          <div className="message-actions d-flex justify-content-start mt-2 gap-2">
                            <button
                              className="btn btn-sm btn-outline-light"
                              onClick={() => handleCopy(msg.text)}
                              style={{ padding: "4px 8px", fontSize: "12px" }}
                            >
                              <Copy size={14} />
                            </button>

                            <button
                              className={`btn btn-sm ${
                                feedback[index] === "like" ? "btn-success" : "btn-outline-success"
                              }`}
                              onClick={() => handleLike(index)}
                              disabled={feedback[index] !== undefined}
                              style={{ padding: "4px 8px", fontSize: "12px" }}
                            >
                              <ThumbsUp size={14} />
                            </button>

                            <button
                              className={`btn btn-sm ${
                                feedback[index] === "dislike" ? "btn-danger" : "btn-outline-danger"
                              }`}
                              onClick={() => handleDislike(index)}
                              disabled={feedback[index] !== undefined}
                              style={{ padding: "4px 8px", fontSize: "12px" }}
                            >
                              <ThumbsDown size={14} />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div
                    className="timestamp text-white small"
                    style={{
                      marginTop: "4px",
                      opacity: 0.7,
                      fontSize: "12px",
                      paddingLeft: msg.sender === "user" ? "0" : "12px",
                      paddingRight: msg.sender === "user" ? "12px" : "0",
                    }}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))
            )}

            {/* Loading indicators */}
            {imageLoader && selectedOption === "image" ? (
              <div className="loading-indicator d-flex align-items-center my-4 ps-3">
                <div className="spinner me-3">
                  <div className="bounce1"></div>
                  <div className="bounce2"></div>
                  <div className="bounce3"></div>
                </div>
                <p style={{ color: "white", margin: 0 }}>Generating image...</p>
              </div>
            ) : streamingChats[chatId] &&
              !currentMessages.some((msg) => msg.isThinking) &&
              selectedOption === "text" ? (
              <div className="loading-indicator d-flex align-items-center my-4 ps-3">
                <div className="spinner me-3">
                  <div className="bounce1"></div>
                  <div className="bounce2"></div>
                  <div className="bounce3"></div>
                </div>
                <p style={{ color: "white", margin: 0 }}>Thinking...</p>
              </div>
            ) : null}

            {error && (
              <div
                className="alert alert-danger mt-3"
                role="alert"
                style={{
                  backgroundColor: "rgba(220, 53, 69, 0.2)",
                  color: "#ff6b6b",
                  border: "1px solid rgba(220, 53, 69, 0.3)",
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div
            className="chat-input-container p-3"
            style={{
              borderTop: "1px solid #333",
              backgroundColor: "#222222",
            }}
          >
            <form onSubmit={handleSendMessage} className="d-flex align-items-center">
              <div className="input-group">
                <div
                  className="d-flex align-items-center w-100 px-2 py-1"
                  style={{
                    background: "#313031",
                    borderRadius: "12px",
                    border: "1px solid #444",
                  }}
                >
                  <div className="d-flex me-auto" style={{ width: "100%" }}>
                    <textarea
                      ref={inputRef}
                      rows={1}
                      className="form-control border-0 bg-transparent shadow-none input-textarea"
                      placeholder="Ask anything..."
                      value={inputMessage}
                      onChange={(e) => {
                        setInputMessage(e.target.value)
                        // Auto-resize textarea
                        e.target.style.height = "auto"
                        e.target.style.height = Math.min(120, e.target.scrollHeight) + "px"
                      }}
                      style={{
                        fontSize: "16px",
                        color: "white",
                        resize: "none",
                        overflow: "auto",
                        maxHeight: "120px",
                      }}
                    />
                  </div>

                  {/* Button Group - Desktop View */}
                  <div className="d-none d-md-flex align-items-center">
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
                        color: "white",
                        border: "none",
                      }}
                      value={selectedOption}
                      onChange={handleOptionChange}
                    >
                      <option value="text">Text</option>
                      <option value="image">Generate Image</option>
                    </select>

                    <button
                      type="submit"
                      className="btn btn-sm rounded-circle ms-2"
                      style={{
                        width: "42px",
                        height: "42px",
                        backgroundColor: "#171717",
                        color: "white",
                        transition: "all 0.2s ease",
                      }}
                      disabled={!inputMessage.trim() || isLoading}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#333333")}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#171717")}
                    >
                      <Send size={16} />
                    </button>
                  </div>

                  {/* Mobile View - Dropdown Toggle */}
                  <div className="d-flex d-md-none align-items-center position-relative">
                    <button
                      className="btn btn-dark d-flex align-items-center justify-content-center"
                      type="submit"
                      style={{
                        fontSize: "16px",
                        background: "#171717",
                        transition: "all 0.2s ease",
                      }}
                      disabled={!inputMessage.trim() || isLoading}
                    >
                      <Send size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm rounded-circle ms-1"
                      style={{
                        width: "42px",
                        height: "42px",
                        backgroundColor: "#171717",
                        color: "white",
                      }}
                      onClick={() => setShowMobileOptions(!showMobileOptions)}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {/* Dropdown menu */}
                    {showMobileOptions && (
                      <div
                        className="position-absolute end-0 bottom-100 mb-2 p-2 rounded shadow"
                        style={{
                          backgroundColor: "#171717",
                          zIndex: 1000,
                          border: "1px solid #444",
                          minWidth: "150px",
                        }}
                        ref={dropdownRef}
                      >
                        <select
                          className="form-select form-select-sm mb-1"
                          value={selectedOption}
                          onChange={handleOptionChange}
                          style={{
                            backgroundColor: "#2a2a2a",
                            color: "white",
                            border: "none",
                          }}
                        >
                          <option value="text">Text</option>
                          <option value="image">Generate Image</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      ; ;
      <style jsx>{`
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 0.3; }
        100% { opacity: 0.6; }
      }
      
      .spinner {
        display: flex;
        align-items: center;
      }
      
      .spinner > div {
        width: 8px;
        height: 8px;
        margin: 0 2px;
        background-color: #fff;
        border-radius: 100%;
        display: inline-block;
        animation: bounce 1.4s infinite ease-in-out both;
      }
      
      .spinner .bounce1 {
        animation-delay: -0.32s;
      }
      
      .spinner .bounce2 {
        animation-delay: -0.16s;
      }
      
      @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1.0); }
      }
      
      .customer-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      
      .customer-scrollbar::-webkit-scrollbar-track {
        background: #222;
      }
      
      .customer-scrollbar::-webkit-scrollbar-thumb {
        background-color: #444;
        border-radius: 6px;
      }
      
      .input-textarea:focus {
        outline: none;
        box-shadow: none;
      }
      
      .streaming-chat {
        animation: pulse-border 2s infinite;
      }
      
      @keyframes pulse-border {
        0% { border-color: #4299e1; }
        50% { border-color: #90cdf4; }
        100% { border-color: #4299e1; }
      }
    `}</style>
    </div>
  )
}

export default ChatView
