"use client"

import { useState, useRef, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import Cookies from "js-cookie"
import toast from "react-hot-toast"
import { jwtDecode } from "jwt-decode"
import axios from "axios"
import { ThreeDots } from "react-loader-spinner"
import remarkGfm from "remark-gfm"
import Markdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism"
import BACKENDURL from "./urls"
import {
  Copy,
  ThumbsUp,
  ThumbsDown,
  Plus,
  MessageSquare,
  Settings,
  LogOut,
  Edit,
  ChevronLeft,
  Send,
  MoreVertical,
  X,
  ExternalLink,
  LayoutDashboardIcon,
  Menu,
  Dot,
} from "lucide-react"
import ProfileModal from "./profile-modal"

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
  const [sidebarWidth, setSidebarWidth] = useState(400)
  const params = useParams()

  // Local state for messages and streaming
  const [messages, setMessages] = useState({})
  const [streamingChats, setStreamingChats] = useState({})
  const [streamController, setStreamController] = useState(null)
  const [partialResponse, setPartialResponse] = useState("")

  // Profile Modal States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  const [isMobile, setIsMobile] = useState(false)
  const [viewportHeight, setViewportHeight] = useState(0)

  // Add this after the existing state declarations
  const [typingSpeed, setTypingSpeed] = useState(50) // milliseconds between character updates
  const [isTyping, setIsTyping] = useState(false)

  // Get messages for current chat
  const currentMessages = messages[chatId] || []

  // Handle viewport height changes for mobile
  useEffect(() => {
    const updateViewportHeight = () => {
      // Use the smaller of window.innerHeight and screen.height for mobile
      const vh = window.innerHeight
      setViewportHeight(vh)

      // Set CSS custom property for consistent height usage
      document.documentElement.style.setProperty("--vh", `${vh * 0.01}px`)
    }

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial setup
    updateViewportHeight()
    checkMobile()

    // Add event listeners
    window.addEventListener("resize", () => {
      updateViewportHeight()
      checkMobile()
    })

    // Handle orientation change on mobile
    window.addEventListener("orientationchange", () => {
      setTimeout(updateViewportHeight, 100)
    })

    return () => {
      window.removeEventListener("resize", updateViewportHeight)
      window.removeEventListener("resize", checkMobile)
      window.removeEventListener("orientationchange", updateViewportHeight)
    }
  }, [])

  // Initialize profile data when user data changes
  useEffect(() => {
    if (userData && user) {
    }
  }, [userData, user])

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
  }, [currentMessages, partialResponse])

  // Auto-focus input field and handle Enter key
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

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSidebarOpen && !event.target.closest(".mobile-sidebar-content")) {
        setSidebarOpen(false)
      }
    }

    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = "hidden"
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
      document.body.style.overflow = "unset"
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.body.style.overflow = "unset"
    }
  }, [isSidebarOpen])

  // Close profile modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isProfileModalOpen &&
        !event.target.closest(".profile-modal-content") &&
        !event.target.closest("[data-profile-toggle]")
      ) {
        if (isMobile) {
          // On mobile, only close if clicking on overlay
          if (event.target.classList.contains("profile-modal-overlay")) {
          }
        } else {
        }
      }
    }

    if (isProfileModalOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      if (isMobile) {
        document.body.style.overflow = "hidden"
      }
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
      if (isMobile) {
        document.body.style.overflow = "unset"
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      if (isMobile) {
        document.body.style.overflow = "unset"
      }
    }
  }, [isProfileModalOpen, isMobile])

  const fetchUser = async () => {
    try {
      const response = await axios.post(`${BACKENDURL}/fetch/user`, {
        id: userData.userId,
      })
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

      if (!data.messages || !Array.isArray(data.messages)) {
        console.error("No messages found in response:", data)
        setMessages((prev) => ({
          ...prev,
          [chatId]: [],
        }))
        return
      }

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
      // Sort by updatedAt in descending order (most recent first)
      const sortedChats = chatsArray.sort((a, b) => {
        const dateA = new Date(a.updatedAt)
        const dateB = new Date(b.updatedAt)
        return dateB.getTime() - dateA.getTime()
      })
      setChatlist(sortedChats)
    } catch (error) {
      console.error("Error fetching chats:", error)
      setError(`Failed to load chats: ${error.message}`)
    } finally {
      setLoadingChats(false)
    }
  }

  const handleOpenProfileModal = () => {
    setIsProfileModalOpen(true)
  }

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false)
  }

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser)
    // Update userData as well
    if (userData) {
      setUserData({
        ...userData,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        profilePic: updatedUser.profile,
      })
    }
  }

  const isStreamingChat = (chatId) => {
    return streamingChats[chatId] || false
  }

  const stopStreamingResponse = () => {
    if (streamController && streamingChats[chatId]) {
      streamController.abort()
      setStreamingChats((prev) => ({ ...prev, [chatId]: false }))

      setMessages((prev) => {
        const chatMessages = [...(prev[chatId] || [])]
        const lastMsg = chatMessages[chatMessages.length - 1]

        if (lastMsg?.sender === "assistant") {
          lastMsg.text = partialResponse + " [Response stopped by user]"
          lastMsg.isThinking = false
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
      fetchChats()
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

      navigate(`/chat/${data.chat.id}`)
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

        if (chatToDeleteId === chatId) {
          navigate("/")
        }

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
      if (chatId === params.chatId) {
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

    if (streamController && streamingChats[chatId]) {
      streamController.abort()
      setStreamingChats((prev) => ({ ...prev, [chatId]: false }))
    }

    if (!inputMessage.trim() || isLoading) return

    if (selectedOption === "image") {
      await generateImage()
      setLoadingChat(false)
    } else {
      const userMessage = {
        sender: "user",
        text: inputMessage,
        timestamp: new Date(),
      }

      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), userMessage],
      }))

      setInputMessage("")
      setIsLoading(true)
      setError(null)
      setPartialResponse("")

      try {
        const controller = new AbortController()
        setStreamController(controller)
        setStreamingChats((prev) => ({ ...prev, [chatId]: true }))

        // Add a single thinking message
        const thinkingMessage = {
          sender: "assistant",
          text: "",
          timestamp: new Date(),
          isThinking: true,
        }

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

        console.log("Response received:", response)

        // Handle MCP response differently from streaming response
        if (model === "mcp") {
          // MCP returns a single JSON response, not a stream
          const jsonResponse = await response.json()
          console.log("MCP Response:", jsonResponse)

          const responseText = jsonResponse.answer || "No response received"

          // Update the message immediately with the full response
          setMessages((prev) => {
            const chatMessages = [...(prev[chatId] || [])]
            const lastMsg = chatMessages[chatMessages.length - 1]

            if (lastMsg && lastMsg.isThinking) {
              chatMessages[chatMessages.length - 1] = {
                ...lastMsg,
                text: responseText,
                isThinking: false,
                isStreaming: false,
                timestamp: new Date(),
              }
            }

            return {
              ...prev,
              [chatId]: chatMessages,
            }
          })
        } else {
          // Handle streaming response for other models
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
                // Handle the streaming format
                const cleanLine = line.replace("data: ", "").trim()
                if (!cleanLine) return

                const parsedResponse = JSON.parse(cleanLine)

                // Check if it's the thinking message
                if (parsedResponse.text && parsedResponse.text === "Thinking...") {
                  return // Skip thinking messages
                }

                let responseText = ""

                // Handle the new message format
                if (parsedResponse.message && parsedResponse.message.content) {
                  responseText = parsedResponse.message.content
                  // Accumulate the text pieces
                  accumulatedText += responseText
                } else if (parsedResponse.text) {
                  // Fallback for old format
                  accumulatedText = parsedResponse.text
                }

                if (accumulatedText && accumulatedText !== "Thinking...") {
                  setPartialResponse(accumulatedText)

                  // Update the message immediately
                  setMessages((prev) => {
                    const chatMessages = [...(prev[chatId] || [])]
                    const lastMsg = chatMessages[chatMessages.length - 1]

                    if (lastMsg && (lastMsg.isThinking || lastMsg.sender === "assistant")) {
                      // Update the last message with accumulated text
                      chatMessages[chatMessages.length - 1] = {
                        ...lastMsg,
                        text: accumulatedText,
                        isThinking: false,
                        isStreaming: true,
                        timestamp: lastMsg.timestamp || new Date(),
                      }
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

          // Final update to mark streaming as complete
          setMessages((prev) => {
            const chatMessages = [...(prev[chatId] || [])]
            const lastMessage = chatMessages[chatMessages.length - 1]

            if (lastMessage && lastMessage.sender === "assistant") {
              chatMessages[chatMessages.length - 1] = {
                ...lastMessage,
                text: accumulatedText,
                timestamp: new Date(),
                isThinking: false,
                isStreaming: false,
              }
            }

            return {
              ...prev,
              [chatId]: chatMessages,
            }
          })
        }

        if ((messages[chatId]?.length || 0) === 0 && !chatTitle) {
          fetchChatDetails()
        }

        fetchChats()
      } catch (err) {
        if (err.name === "AbortError") {
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

  // Sidebar content component to avoid duplication
  const SidebarContent = ({ isMobile = false }) => (
    <>
      {/* Sidebar Header */}
      <div
        className={`sidebar-header p-3 d-flex justify-content-between align-items-center ${isMobile ? "border-bottom border-secondary" : ""}`}
      >
        <div className="d-flex align-items-center">
          <div className="bg-dark p-2 rounded me-2">
            <MessageSquare size={20} color="white" />
          </div>
          <div>
            <div className="fw-bold">Chat History</div>
            <div className="small">{chatlist.length} conversations</div>
          </div>
        </div>
        {isMobile && (
          <button
            className="btn btn-sm text-white"
            onClick={() => setSidebarOpen(false)}
            style={{ padding: "4px 8px" }}
          >
            <X size={20} />
          </button>
        )}
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
      <div className="sidebar-section-header px-3 py-2" style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}>
        Your Chats
      </div>

      <div
        className="chat-list flex-grow-1 overflow-auto px-3"
        style={{
          maxHeight: isMobile ? "calc(var(--vh, 1vh) * 100 - 280px)" : "calc(var(--vh, 1vh) * 100 - 220px)",
        }}
      >
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
                  backgroundColor: chat.id === chatId ? "#2a2a2a" : isStreamingChat(chat.id) ? "#2d3748" : "#212020",
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
            <Link to="/dashboard" className="btn btn-sm text-white me-2">
              <LayoutDashboardIcon size={20} />
            </Link>
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
                  src={user?.profile || "/placeholder.svg"}
                  referrerPolicy="no-referrer"
                  alt="Profile"
                  className="dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{
                    width: "30px",
                    height: "30px",
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
                className="dropdown-menu dropdown-menu-end p-2"
                style={{
                  backgroundColor: "#2E2F2E",
                  border: "1px solid #444",
                  minWidth: "250px",
                  fontSize: "14px",
                }}
              >
                <li className="text-white px-3 py-2" style={{ fontWeight: "bold" }}>
                  {user?.email}
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item text-white d-flex align-items-center"
                    style={{ backgroundColor: "transparent" }}
                    onClick={handleOpenProfileModal}
                    data-profile-toggle
                  >
                    <Settings className="me-2" size={16} /> Settings
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <a
                    href="/faq"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dropdown-item text-white d-flex align-items-center"
                    style={{ backgroundColor: "transparent" }}
                  >
                    <ExternalLink className="me-2" size={16} /> Help & FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="/release-notes"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dropdown-item text-white d-flex align-items-center"
                    style={{ backgroundColor: "transparent" }}
                  >
                    <ExternalLink className="me-2" size={16} /> Release notes
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dropdown-item text-white d-flex align-items-center"
                    style={{ backgroundColor: "transparent" }}
                  >
                    <ExternalLink className="me-2" size={16} /> Terms & policies
                  </a>
                </li>

                <li>
                  <hr className="dropdown-divider" />
                </li>

                <li>
                  <button
                    onClick={handleLogOut}
                    className="dropdown-item text-white d-flex align-items-center"
                    style={{ backgroundColor: "transparent" }}
                  >
                    <LogOut className="me-2" size={16} /> Log out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="chat-app-container" style={{ height: "calc(var(--vh, 1vh) * 100)", overflow: "hidden" }}>
      {/* Main layout with sidebar and content area */}
      <div className="d-flex h-100" style={{ minHeight: "calc(var(--vh, 1vh) * 100)" }}>
        {/* Sidebar - Desktop */}
        <div
          className="sidebar d-none d-md-flex flex-column"
          style={{
            width: "400px",
            minWidth: "400px",
            flex: "0 0 400px",
            backgroundColor: "#171717",
            color: "white",
            borderRight: "1px solid #333",
            height: "calc(var(--vh, 1vh) * 100)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <SidebarContent />
        </div>

        {/* Mobile Sidebar Overlay */}
        <div
          className={`mobile-sidebar-overlay ${isSidebarOpen ? "open" : ""} d-md-none`}
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
          {/* Mobile sidebar content */}
          <div
            className="mobile-sidebar-content d-flex flex-column"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "85%",
              maxWidth: "350px",
              height: "calc(var(--vh, 1vh) * 100)",
              backgroundColor: "#171717",
              color: "white",
              borderRight: "1px solid #333",
              transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
              transition: "transform 0.3s ease",
              overflow: "hidden",
              zIndex: 1050,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent isMobile={true} />
          </div>
        </div>

        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={handleCloseProfileModal}
          userData={userData}
          user={user}
          onUserUpdate={handleUserUpdate}
        />

        {/* Main Content Area */}
        <div
          className="main-content flex-grow-1 d-flex flex-column"
          style={{
            backgroundColor: "#222222",
            height: "calc(var(--vh, 1vh) * 100)",
            overflow: "hidden",
          }}
        >
          {/* Chat Header */}
          <div
            className="chat-header d-flex justify-content-between align-items-center flex-shrink-0"
            style={{
              padding: isMobile ? "12px 15px" : "15px",
              backgroundColor: "#222222",
              borderBottom: "1px solid #333",
              minHeight: isMobile ? "60px" : "70px",
            }}
          >
            <div className="d-flex align-items-center flex-grow-1 me-3">
              <button
                className="btn text-white d-md-none me-2 p-1"
                onClick={() => setSidebarOpen(true)}
                style={{ minWidth: "auto" }}
              >
                <Menu size={20} />
              </button>

              <Link to="/" className="btn text-white me-2 p-1 d-none d-md-inline-flex" style={{ minWidth: "auto" }}>
                <ChevronLeft size={20} />
              </Link>

              <div
                className="d-flex align-items-center flex-grow-1"
                onClick={handleEditTitle}
                style={{ cursor: "pointer", minWidth: 0 }}
              >
                <MessageSquare size={18} className="me-2 text-white flex-shrink-0" />
                <h1
                  className="h6 mb-0 fw-bold chat-title text-truncate"
                  style={{
                    color: "white",
                    fontSize: isMobile ? "14px" : "16px",
                  }}
                >
                  {isMobile && chatTitle?.length > 20
                    ? chatTitle.slice(0, 20) + "..."
                    : chatTitle?.length > 35
                      ? chatTitle.slice(0, 35) + "..."
                      : chatTitle || "Chat"}
                </h1>
                <Edit size={12} className="ms-2 text-white flex-shrink-0" />
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 flex-shrink-0">
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
                  padding: isMobile ? "4px 8px" : "6px 12px",
                  fontSize: isMobile ? "12px" : "14px",
                  minWidth: isMobile ? "80px" : "auto",
                }}
              >
                {modelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {isMobile ? option.label.slice(0, 6) : option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chat Messages */}
          <div
            className="chat-messages flex-grow-1 overflow-auto p-3"
            ref={chatContainerRef}
            style={{
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch", // Better scrolling on iOS
            }}
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
                <h2 style={{ fontSize: isMobile ? "1.5rem" : "2rem" }}>
                  Hello {user?.name || userData?.name || "there"}!
                </h2>
                <p style={{ fontSize: isMobile ? "14px" : "16px" }}>Type a message below to begin chatting.</p>
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
                      padding: isMobile ? "10px 14px" : "12px 16px",
                      borderRadius: "16px",
                      maxWidth: isMobile ? "90%" : "75%",
                      backgroundColor: msg.sender === "user" ? "#2E2F2E" : "#3a3a3a",
                      color: "white",
                      boxShadow: msg.isStreaming ? "0 0 15px rgba(102, 179, 255, 0.2)" : "0 1px 2px rgba(0,0,0,0.1)",
                      border: msg.isStreaming
                        ? "1px solid rgba(102, 179, 255, 0.3)"
                        : "1px solid rgba(255,255,255,0.05)",
                      fontSize: isMobile ? "14px" : "16px",
                      wordBreak: "break-word",
                      transition: "all 0.3s ease",
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
                    ) : msg.isThinking ? (
                      <div className="thinking-indicator d-flex align-items-center">
                        <div className="spinner me-2">
                          <div className="bounce1"></div>
                          <div className="bounce2"></div>
                          <div className="bounce3"></div>
                        </div>
                        <span>Thinking...</span>
                      </div>
                    ) : (
                      <div className={msg.isStreaming ? "streaming-text" : ""}>
                        <Markdown
                          remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
                          components={{
                            code: ({ inline, className, children }) => {
                              const language = className?.replace("language-", "") || "text"
                              return inline ? (
                                <code
                                  style={{
                                    background: "#2a2a2a",
                                    padding: "3px 6px",
                                    borderRadius: "4px",
                                    color: "#ffcccb",
                                    border: "1px solid #444",
                                    fontSize: "14px",
                                  }}
                                >
                                  {children}
                                </code>
                              ) : (
                                <div
                                  style={{
                                    position: "relative",
                                    margin: "15px 0",
                                    background: "#1e1e1e",
                                    borderRadius: "8px",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                                  }}
                                >
                                  <div
                                    style={{
                                      background: "#2a2a2a",
                                      padding: "8px 15px",
                                      borderTopLeftRadius: "8px",
                                      borderTopRightRadius: "8px",
                                      color: "#ffffff",
                                      fontSize: "14px",
                                      textTransform: "capitalize",
                                    }}
                                  >
                                    {language}
                                  </div>
                                  <div style={{ position: "relative" }}>
                                    <button
                                      onClick={() => handleCopy(String(children))}
                                      style={{
                                        position: "absolute",
                                        top: "10px",
                                        right: "10px",
                                        background: "#444",
                                        color: "white",
                                        border: "none",
                                        padding: "5px 10px",
                                        borderRadius: "5px",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        transition: "background 0.2s",
                                      }}
                                    >
                                      Copy
                                    </button>
                                    <SyntaxHighlighter
                                      language={language}
                                      style={dracula}
                                      customStyle={{
                                        margin: 0,
                                        background: "transparent",
                                        fontSize: "14px",
                                        padding: "15px",
                                      }}
                                    >
                                      {children}
                                    </SyntaxHighlighter>
                                  </div>
                                </div>
                              )
                            },
                            h1: ({ children }) => (
                              <h1
                                style={{
                                  fontSize: "2em",
                                  margin: "0.8em 0.4em",
                                  color: "#ffffff",
                                  borderBottom: "2px solid #66b3ff",
                                  paddingBottom: "8px",
                                  fontWeight: "700",
                                }}
                              >
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2
                                style={{
                                  fontSize: "1.7em",
                                  margin: "0.7em 0.3em",
                                  color: "#e6e6e6",
                                  borderBottom: "1px solid #555",
                                  paddingBottom: "6px",
                                  fontWeight: "600",
                                }}
                              >
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3
                                style={{
                                  fontSize: "1.4em",
                                  margin: "0.6em 0.3em",
                                  color: "#d4d4d4",
                                  fontWeight: "500",
                                }}
                              >
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p
                                style={{
                                  margin: "0.5em 0",
                                  lineHeight: "1.6",
                                  color: "#d4d4d4",
                                }}
                              >
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul
                                style={{
                                  margin: "0.8em 0",
                                  paddingLeft: "20px",
                                  color: "#d4d4d4",
                                }}
                              >
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol style={{ margin: "0.8em 0", paddingLeft: "20px", color: "#d4d4d4" }}>{children}</ol>
                            ),
                            li: ({ ordered, children }) => (
                              <li
                                style={{
                                  margin: "0.4em 0",
                                  color: "#d4d4d4",
                                  position: "relative",
                                }}
                              >
                                {!ordered && (
                                  <span
                                    style={{
                                      position: "absolute",
                                      left: "-20px",
                                      top: "0",
                                      color: "#ffffff",
                                    }}
                                  >
                                    <Dot size={20} />
                                  </span>
                                )}
                                {children}
                              </li>
                            ),
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                style={{
                                  color: "#66b3ff",
                                  textDecoration: "none",
                                  fontWeight: "500",
                                }}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {children}
                                <span style={{ marginLeft: "3px", fontSize: "0.9em" }}>↗</span>
                              </a>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote
                                style={{
                                  borderLeft: "3px solid #66b3ff",
                                  padding: "10px 15px",
                                  margin: "1em 0",
                                  color: "#d4d4d4",
                                  fontStyle: "italic",
                                  background: "rgba(255, 255, 255, 0.02)",
                                  borderRadius: "0 5px 5px 0",
                                }}
                              >
                                {children}
                              </blockquote>
                            ),
                            table: ({ children }) => (
                              <div style={{ overflowX: "auto", margin: "1em 0" }}>
                                <table
                                  style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    background: "#2a2a2a",
                                    borderRadius: "5px",
                                    overflow: "hidden",
                                  }}
                                >
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }) => <thead style={{ background: "#3a3b3c" }}>{children}</thead>,
                            tbody: ({ children }) => <tbody>{children}</tbody>,
                            tr: ({ children }) => <tr>{children}</tr>,
                            th: ({ children }) => (
                              <th
                                style={{
                                  padding: "10px",
                                  textAlign: "left",
                                  color: "#ffffff",
                                  borderBottom: "1px solid #444",
                                  fontWeight: "600",
                                }}
                              >
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td
                                style={{
                                  padding: "10px",
                                  color: "#d4d4d4",
                                  borderBottom: "1px solid #444",
                                }}
                              >
                                {children}
                              </td>
                            ),
                            strong: ({ children }) => (
                              <strong
                                style={{
                                  fontWeight: "700",
                                  color: "#ffffff",
                                }}
                              >
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em
                                style={{
                                  fontStyle: "italic",
                                  color: "#cccccc",
                                }}
                              >
                                {children}
                              </em>
                            ),
                            hr: () => (
                              <hr
                                style={{
                                  border: "none",
                                  height: "1px",
                                  background: "#444",
                                  margin: "1.5em 0",
                                }}
                              />
                            ),
                          }}
                        >
                          {String(msg.text || "").trim()}
                        </Markdown>

                        {/* Action buttons: only show for AI messages that are not streaming */}
                        {msg.sender === "user" && (
                          <div className="d-flex justify-content-start mt-3 gap-2">
                            <button
                              className="btn btn-sm action-btn edit-btn"
                              onClick={async () => {
                                const newText = prompt("Edit your message:", msg.text)
                                if (newText && newText !== msg.text) {
                                  // Update the user message
                                  const updatedMessages = [...currentMessages]
                                  updatedMessages[index] = { ...msg, text: newText }

                                  // Remove all messages after this user message (AI responses)
                                  const messagesToKeep = updatedMessages.slice(0, index + 1)

                                  setMessages((prev) => ({
                                    ...prev,
                                    [chatId]: messagesToKeep,
                                  }))

                                  // Set the input to the new message and trigger resend
                                  setInputMessage(newText)

                                  // Simulate form submission with the new message
                                  setTimeout(() => {
                                    setInputMessage("")
                                    handleSendMessage({ preventDefault: () => { } })
                                  }, 100)

                                  toast.success("Message edited and resent!")
                                }
                              }}
                              title="Edit and resend message"
                            >
                              <Edit size={14} />
                              <span className="action-text">Edit</span>
                            </button>
                            <button
                              className="btn btn-sm action-btn copy-btn"
                              onClick={() => handleCopy(msg.text)}
                              title="Copy message"
                            >
                              <Copy size={14} />
                              <span className="action-text">Copy</span>
                            </button>
                          </div>
                        )}
                        {msg.sender !== "user" && !msg.isStreaming && (
                          <div className="message-actions d-flex justify-content-start mt-3 gap-2">
                            <button
                              className="btn btn-sm action-btn copy-btn"
                              onClick={() => handleCopy(msg.text)}
                              title="Copy message"
                            >
                              <Copy size={14} />
                              <span className="action-text">Copy</span>
                            </button>

                            <button
                              className={`btn btn-sm action-btn like-btn ${feedback[index] === "like" ? "active" : ""}`}
                              onClick={() => handleLike(index)}
                              disabled={feedback[index] !== undefined}
                              title="Like this response"
                            >
                              <ThumbsUp size={14} />
                              <span className="action-text">Like</span>
                            </button>

                            <button
                              className={`btn btn-sm action-btn dislike-btn ${feedback[index] === "dislike" ? "active" : ""
                                }`}
                              onClick={() => handleDislike(index)}
                              disabled={feedback[index] !== undefined}
                              title="Dislike this response"
                            >
                              <ThumbsDown size={14} />
                              <span className="action-text">Dislike</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div
                    className="timestamp text-white small"
                    style={{
                      marginTop: "4px",
                      opacity: 0.7,
                      fontSize: isMobile ? "10px" : "12px",
                      paddingLeft: msg.sender === "user" ? "0" : "12px",
                      paddingRight: msg.sender === "user" ? "12px" : "0",
                    }}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))
            )}

            {error && (
              <div
                className="alert alert-danger mt-3"
                role="alert"
                style={{
                  backgroundColor: "rgba(220, 53, 69, 0.2)",
                  color: "#ff6b6b",
                  border: "1px solid rgba(220, 53, 69, 0.3)",
                  fontSize: isMobile ? "14px" : "16px",
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div
            className="chat-input-container p-3 flex-shrink-0"
            style={{
              borderTop: "1px solid #333",
              backgroundColor: "#222222",
              paddingBottom: isMobile ? "calc(env(safe-area-inset-bottom) + 12px)" : "12px",
            }}
          >
            <form onSubmit={handleSendMessage} className="d-flex align-items-center">
              <div className="input-group w-100">
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
                        // Reset height first to get accurate scrollHeight
                        e.target.style.height = "auto"
                        // Set height based on content, with a maximum of 120px
                        const newHeight = Math.min(120, e.target.scrollHeight)
                        e.target.style.height = `${newHeight}px`
                      }}
                      style={{
                        fontSize: "16px", // Keep 16px on mobile to prevent zoom
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
                      {/* <option value="image">Generate Image</option> */}
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
                    >
                      <Send size={16} />
                    </button>
                  </div>

                  {/* Mobile View - Simplified */}
                  <div className="d-flex d-md-none align-items-center position-relative">
                    <button
                      className="btn btn-dark d-flex align-items-center justify-content-center me-1"
                      type="submit"
                      style={{
                        fontSize: "16px",
                        background: "#171717",
                        transition: "all 0.2s ease",
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                      }}
                      disabled={!inputMessage.trim() || isLoading}
                    >
                      <Send size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm rounded-circle"
                      style={{
                        width: "40px",
                        height: "40px",
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

      <style jsx>
        {`
        /* CSS Custom Properties for viewport height */
        :root {
          --vh: 1vh;
        }
        
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
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

        /* Mobile sidebar specific styles */
        .mobile-sidebar-overlay.open {
          pointer-events: auto;
        }
        
        .mobile-sidebar-overlay:not(.open) {
          pointer-events: none;
        }
        
        /* Prevent scrolling when mobile sidebar is open */
        body.sidebar-open {
          overflow: hidden;
        }

        /* Mobile Responsive Adjustments */
        @media (max-width: 767px) {
          .profile-modal-content {
            margin: 1rem;
            max-height: calc(var(--vh, 1vh) * 100 - 2rem);
          }

          .profile-modal-body {
            padding: 1rem;
          }

          .profile-modal-header,
          .profile-modal-footer {
            padding: 1rem;
          }

          .profile-picture-container {
            width: 120px;
            height: 120px;
          }

          .profile-picture-actions {
            flex-direction: column;
            align-items: center;
          }

          .chat-messages {
            padding: 1rem !important;
          }

          .message-bubble {
            font-size: 14px !important;
          }

          .chat-header {
            padding: 0.75rem !important;
          }

          .chat-input-container {
            padding: 0.75rem !important;
          }

          .table-responsive-wrapper {
            display: block;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          
          .table-responsive-wrapper table {
            max-width: 100%;
            width: auto;
            min-width: 100%;
          }
          
          .table-responsive-wrapper th,
          .table-responsive-wrapper td {
            white-space: nowrap;
            min-width: 100px;
          }
        }

        /* Very small screens */
        @media (max-width: 480px) {
          .profile-modal-content.mobile-drawer {
            max-height: calc(var(--vh, 1vh) * 90);
          }

          .chat-header {
            min-height: 50px !important;
          }

          .message-bubble {
            max-width: 95% !important;
            padding: 8px 12px !important;
          }
        }

        /* iOS Safari specific fixes */
        @supports (-webkit-touch-callout: none) {
          .chat-app-container {
            height: -webkit-fill-available;
          }
          
          .main-content {
            height: -webkit-fill-available;
          }
          
          .sidebar {
            height: -webkit-fill-available;
          }
          
          .mobile-sidebar-content {
            height: -webkit-fill-available;
          }
        }

        /* Smooth scrolling for better UX */
        .chat-messages {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }

        /* Better touch targets for mobile */
        @media (max-width: 767px) {
          .btn {
            min-height: 44px;
            min-width: 44px;
          }
          
          .btn-sm {
            min-height: 36px;
            min-width: 36px;
          }
        }
        
        /* Thinking indicator styles */
        .thinking-indicator-container {
          padding: 10px;
          border-radius: 16px;
          background-color: #3a3a3a;
          display: inline-block;
          margin-bottom: 15px;
          animation: fadeIn 0.3s ease-in-out;
        }

        /* Add these new styles to the existing style section */
        .streaming-text {
          position: relative;
        }

        .streaming-text::after {
          content: '|';
          animation: blink 1s infinite;
          color: #66b3ff;
          font-weight: bold;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .streaming-text p:last-child::after {
          content: '';
        }

        /* Smooth text appearance */
        .streaming-text * {
          animation: fadeInText 0.1s ease-in;
        }

        @keyframes fadeInText {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }

        /* Improved message bubble animation */
        .message-bubble {
          transition: all 0.2s ease-out;
        }

        .message-bubble.streaming {
          border-left: 3px solid #66b3ff;
          box-shadow: 0 0 10px rgba(102, 179, 255, 0.1);
        }

        /* Smooth scrolling enhancement */
        .chat-messages {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }

        /* Performance optimization for streaming */
        .streaming-text * {
          will-change: contents;
          transform: translateZ(0); /* Force hardware acceleration */
        }

/* Enhanced Action Buttons */
.message-actions {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  min-height: 32px;
}

.action-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.action-btn:active {
  transform: translateY(0);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.copy-btn:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
  color: #60a5fa;
}

.edit-btn:hover:not(:disabled) {
  background: rgba(168, 85, 247, 0.15);
  border-color: rgba(168, 85, 247, 0.3);
  color: #c084fc;
}

.like-btn:hover:not(:disabled) {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.3);
  color: #4ade80;
}

.like-btn.active {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.4);
  color: #4ade80;
}

.dislike-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.dislike-btn.active {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #f87171;
}

.action-text {
  font-size: 0.75rem;
  font-weight: 500;
}

/* Mobile responsive action buttons */
@media (max-width: 767px) {
  .action-btn {
    padding: 0.375rem 0.5rem;
    font-size: 0.6875rem;
    min-height: 28px;
  }
  
  .action-text {
    display: none;
  }
  
  .message-actions {
    gap: 0.375rem;
  }
}

/* Very small screens - stack buttons */
@media (max-width: 480px) {
  .message-actions {
    justify-content: center;
  }
  
  .action-btn {
    flex: 1;
    justify-content: center;
    max-width: 60px;
  }
}
`}
      </style>
    </div>
  )
}

export default ChatView
