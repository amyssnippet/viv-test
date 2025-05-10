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
import { Copy, ThumbsUp, ThumbsDown, Plus, MessageSquare, Home, Settings, LogOut, Edit, ChevronLeft, Send, MoreVertical } from 'lucide-react'

const ChatList = () => {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const [selected, setSelected] = useState("Precise")
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [model, setModel] = useState("numax")
  const [error, setError] = useState(null)
  const chatContainerRef = useRef(null)
  const inputRef = useRef(null)
  const userToken = Cookies.get("authToken")
  const [userData, setUserData] = useState(null)
  const [streamingChat, setStreamingChat] = useState(false)
  const [streamController, setStreamController] = useState(null)
  const [partialResponse, setPartialResponse] = useState("")
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
  }, [messages])

  // Auto-focus input field
  useEffect(() => {
    if (chatId) {
      inputRef.current?.focus()
    }

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
      if (e.key === "Enter" && streamingChat) {
        stopStreamingResponse()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => {
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [streamingChat])

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
          response.data.chat.title || `Chat from ${new Date(response.data.chat.createdAt).toLocaleDateString()}`
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
        setMessages([])
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

      setMessages(formattedMessages)
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

  const stopStreamingResponse = () => {
    if (streamController && streamingChat) {
      streamController.abort()
      setStreamingChat(false)

      // Update the message with [Response stopped by user] appended
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages]
        const lastMsg = updatedMessages[updatedMessages.length - 1]

        if (lastMsg?.sender === "assistant") {
          lastMsg.text = partialResponse + " [Response stopped by user]"
        }

        return updatedMessages
      })
    }
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
      navigate(`/chat/${data.chat._id}`)
      // Close sidebar on mobile after creating a new chat
      setSidebarOpen(false)
    } catch (error) {
      console.error("Error creating new chat:", error)
      setError(`Failed to create a new chat: ${error.message}`)
    }
  }

  const handleChatDelete = async (chatId, e) => {
    e.stopPropagation()
    e.preventDefault()

    if (confirm("Are you sure you want to delete this chat?")) {
      try {
        await axios.post(`${BACKENDURL}/chat/delete`, {
          userId: userData.userId,
          chatId,
        })
        // Refresh the chat list
        fetchChats()
        // If the deleted chat is the current one, navigate to the chat list
        if (chatId === useParams().chatId) {
          navigate("/chats")
        }
      } catch (error) {
        console.error("Error deleting chat:", error)
        setError(`Failed to delete chat: ${error.message}`)
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

    setMessages((prevMessages) => [...prevMessages, userMessage])
    setImage(null)
    setError(null)

    try {
      const generatingMsg = {
        sender: "assistant",
        text: `Generating image based on: "${inputMessage}"...`,
        timestamp: new Date(),
        isImage: false,
      }

      setMessages((prevMessages) => [...prevMessages, generatingMsg])

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
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages]
        updatedMessages[updatedMessages.length - 1] = {
          sender: "assistant",
          text: `Image generated from prompt: "${inputMessage}"`,
          timestamp: new Date(),
          isImage: true,
          imageUrl: imageUrl,
        }

        return updatedMessages
      })

      setInputMessage("")
    } catch (error) {
      console.error("Error generating image:", error)
      setError(`Failed to generate image: ${error.message}`)

      // Update the generating message to show error
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages]
        updatedMessages[updatedMessages.length - 1].text = `Error generating image: ${error.message}`

        return updatedMessages
      })
    } finally {
      setImageLoader(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    setLoadingChat(true)

    if (streamController) {
      streamController.abort()
    }

    if (!inputMessage.trim() || isLoading) return

    // Handle based on selected option
    if (selectedOption === "image") {
      await generateImage()
    } else {
      const userMessage = {
        sender: "user",
        text: inputMessage,
        timestamp: new Date(),
      }

      setMessages((prevMessages) => [...prevMessages, userMessage])
      const currentChatMessages = [...messages, userMessage]

      setInputMessage("")
      setIsLoading(true)
      setError(null)
      setPartialResponse("")

      try {
        const controller = new AbortController()
        setStreamController(controller)
        setStreamingChat(true)

        const response = await fetch(`${BACKENDURL}/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: currentChatMessages.map((msg) => ({
              role: msg.sender === "user" ? "user" : "assistant", // Ensure correct role format
              content: msg.text,
            })),
            userId: userData.userId,
            chatId: chatId,
          }),
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
              const json = JSON.parse(line.replace("data: ", "").trim())
              if (json.text) {
                accumulatedText = json.text
                setPartialResponse(accumulatedText)

                setMessages((prevMessages) => {
                  const updatedMessages = [...prevMessages]
                  const lastMsg = updatedMessages[updatedMessages.length - 1]

                  if (lastMsg?.sender === "assistant") {
                    lastMsg.text = accumulatedText
                    return updatedMessages
                  } else {
                    return [
                      ...updatedMessages,
                      {
                        sender: "assistant",
                        text: accumulatedText,
                        timestamp: new Date(),
                      },
                    ]
                  }
                })
              }
            } catch (error) {
              console.warn("Error parsing JSON chunk:", error, line)
            }
          })
        }

        // Generate title if this is a new chat with first response
        if (messages.length === 0 && !chatTitle) {
          fetchChatDetails()
        }
        
        // Refresh chat list to update last message time
        fetchChats()
      } catch (err) {
        if (err.name === "AbortError") {
          console.log("Response streaming was aborted by user")
        } else {
          console.error("Error calling backend:", err)
          setError(`Failed to get response: ${err.message}`)
        }
      } finally {
        setIsLoading(false)
        setStreamingChat(false)
        setStreamController(null)
        setLoadingChat(false)
      }
    }
  }

  // Determine if we're showing the chat view or a placeholder
  const showChatView = !!chatId
  const showChatPlaceholder = !chatId

  return (
    <div className="chat-app-container" style={{ height: "100vh", overflow: "hidden" }}>
      {/* Main layout with sidebar and content area */}
      <div className="d-flex h-100">
        {/* Sidebar - Desktop */}
        <div 
          className="sidebar d-none d-md-flex flex-column" 
          style={{ 
            width: "280px", 
            backgroundColor: "#171717", 
            color: "white",
            borderRight: "1px solid #333",
            height: "100vh",
            overflow: "hidden"
          }}
        >
          {/* Sidebar Header */}
          <div className="sidebar-header p-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <div className="bg-dark p-2 rounded me-2">
                <MessageSquare size={20} color="white" />
              </div>
              <div>
                <div className="fw-bold">Chat Threads</div>
                <div className="text-muted small">{chatlist.length} conversations</div>
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
                height: "44px"
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#333333"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#222222"}
            >
              <Plus size={16} className="me-2" />
              New Chat
            </button>
          </div>

          {/* Chat List */}
          <div className="sidebar-section-header px-3 py-2" style={{ color: "#6c757d", fontSize: "14px", fontWeight: 600 }}>
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
                    className={`chat-list-item ${chat.id === chatId ? 'active-chat' : ''}`}
                    style={{
                      cursor: "pointer",
                      padding: "10px 15px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: chat.id === chatId ? "#2a2a2a" : "#212020",
                      marginBottom: "8px",
                      borderRadius: "8px",
                      color: "white",
                      transition: "all 0.2s ease",
                      border: chat.id === chatId ? "1px solid #444" : "1px solid transparent",
                    }}
                    onMouseOver={(e) => {
                      if (chat.id !== chatId) {
                        e.currentTarget.style.backgroundColor = "#2a2a2a"
                      }
                    }}
                    onMouseOut={(e) => {
                      if (chat.id !== chatId) {
                        e.currentTarget.style.backgroundColor = "#212020"
                      }
                    }}
                  >
                    <span className="text-truncate">
                      {chat.title || `Chat from ${new Date(chat.createdAt).toLocaleDateString()}`}
                    </span>
                    <div className="dropdown">
                      <button
                        className="btn"
                        type="button"
                        id={`dropdown-${chat._id}`}
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: "white", padding: "2px" }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      <ul 
                        className="dropdown-menu" 
                        aria-labelledby={`dropdown-${chat._id}`}
                        style={{ backgroundColor: "#222", border: "1px solid #444" }}
                      >
                        <li>
                          <a
                            className="dropdown-item text-white"
                            href="#"
                            onClick={(e) => editChat(chat._id, e)}
                            style={{ fontSize: "14px" }}
                          >
                            <Edit size={14} className="me-2" /> Edit Chat
                          </a>
                        </li>
                        <li>
                          <a
                            className="dropdown-item text-white"
                            href="#"
                            onClick={(e) => handleChatDelete(chat._id, e)}
                            style={{ fontSize: "14px", color: "#ff6b6b" }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
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
                <Link to="/" className="btn btn-sm text-white me-2">
                  <Home size={20} />
                </Link>
                <Link to="/dashboard" className="btn btn-sm text-white">
                  <Settings size={20} />
                </Link>
              </div>
              <button 
                className="btn btn-sm text-white" 
                onClick={handleLogOut}
                style={{ backgroundColor: "#333" }}
              >
                <LogOut size={18} className="me-1" /> Logout
              </button>
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
          <div
            className="mobile-sidebar"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#171717",
              color: "white",
              width: "85%",
              height: "100vh",
              position: "fixed",
              top: 0,
              left: 0,
              zIndex: 1050,
              overflowY: "auto",
              transition: "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)",
              transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
              boxShadow: "0 0 20px rgba(0,0,0,0.5)",
            }}
          >
            {/* Mobile Sidebar Header */}
            <div className="p-3 d-flex justify-content-between align-items-center border-bottom border-dark">
              <div className="d-flex align-items-center">
                <div className="bg-dark p-2 rounded me-2">
                  <MessageSquare size={20} color="white" />
                </div>
                <div>
                  <div className="fw-bold">Chat Threads</div>
                  <div className="text-muted small">{chatlist.length} conversations</div>
                </div>
              </div>
              <button
                className="btn btn-sm"
                onClick={() => setSidebarOpen(false)}
                style={{ color: "white", backgroundColor: "#333" }}
              >
                <ChevronLeft size={20} />
              </button>
            </div>

            {/* Mobile New Chat Button */}
            <div className="p-3">
              <button
                className="btn w-100 d-flex align-items-center justify-content-center mb-3"
                onClick={handleNewChat}
                style={{ 
                  background: "#222222", 
                  color: "white", 
                  border: "none",
                  height: "44px"
                }}
              >
                <Plus size={16} className="me-2" />
                New Chat
              </button>
            </div>

            {/* Mobile Chat List */}
            <div className="sidebar-section-header px-3 py-2" style={{ color: "#6c757d", fontSize: "14px", fontWeight: 600 }}>
              Your Chats
            </div>

            <div className="chat-list px-3" style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
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
                      className={`chat-list-item ${chat.id === chatId ? 'active-chat' : ''}`}
                      style={{
                        cursor: "pointer",
                        padding: "10px 15px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: chat.id === chatId ? "#2a2a2a" : "#212020",
                        marginBottom: "8px",
                        borderRadius: "8px",
                        color: "white",
                        border: chat.id === chatId ? "1px solid #444" : "1px solid transparent",
                      }}
                    >
                      <span className="text-truncate">
                        {chat.title || `Chat from ${new Date(chat.createdAt).toLocaleDateString()}`}
                      </span>
                      <div className="dropdown">
                        <button
                          className="btn"
                          type="button"
                          id={`mobile-dropdown-${chat._id}`}
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: "white", padding: "2px" }}
                        >
                          <MoreVertical size={16} />
                        </button>
                        <ul 
                          className="dropdown-menu" 
                          aria-labelledby={`mobile-dropdown-${chat._id}`}
                          style={{ backgroundColor: "#222", border: "1px solid #444" }}
                        >
                          <li>
                            <a
                              className="dropdown-item text-white"
                              href="#"
                              onClick={(e) => editChat(chat._id, e)}
                              style={{ fontSize: "14px" }}
                            >
                              <Edit size={14} className="me-2" /> Edit Chat
                            </a>
                          </li>
                          <li>
                            <a
                              className="dropdown-item text-white"
                              href="#"
                              onClick={(e) => handleChatDelete(chat._id, e)}
                              style={{ fontSize: "14px", color: "#ff6b6b" }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
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

            {/* Mobile Sidebar Footer */}
            <div className="sidebar-footer p-3 mt-auto border-top border-dark" style={{ position: "sticky", bottom: 0, backgroundColor: "#171717" }}>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex">
                  <Link to="/" className="btn btn-sm text-white me-2">
                    <Home size={20} />
                  </Link>
                  <Link to="/dashboard" className="btn btn-sm text-white">
                    <Settings size={20} />
                  </Link>
                </div>
                <button 
                  className="btn btn-sm text-white" 
                  onClick={handleLogOut}
                  style={{ backgroundColor: "#333" }}
                >
                  <LogOut size={18} className="me-1" /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="main-content flex-grow-1 d-flex flex-column" style={{ backgroundColor: "#222222", height: "100vh", overflow: "hidden" }}>
          {/* Chat Header */}
          {showChatView && (
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

                <div
                  className="d-flex align-items-center"
                  onClick={handleEditTitle}
                  style={{ cursor: "pointer" }}
                >
                  <MessageSquare size={18} className="me-2 text-white" />
                  <h1
                    className="h5 mb-0 fw-bold chat-title"
                    style={{ color: "white" }}
                  >
                    {chatTitle?.length > 25
                      ? chatTitle.slice(0, 25) + "..."
                      : chatTitle || "Chat"}
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
                  <option value="numax">Numax</option>
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
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #444",
                        cursor: "pointer",
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/default-avatar.png";
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
              </div>
            </div>
          )}

          {/* Chat Content */}
          {showChatView ? (
            <div
              className="chat-content-wrapper flex-grow-1 d-flex flex-column"
              style={{ height: "calc(100vh - 70px)", overflow: "hidden" }}
            >
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
                          alignItems: i % 2 === 0 ? "flex-start" : "flex-end"
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
                ) : !messages || messages.length === 0 ? (
                  <div className="text-center py-5" style={{ color: "white" }}>
                    <h4>Start a conversation</h4>
                    <p>Type a message below to begin chatting.</p>
                    <div className="container d-flex justify-content-center mt-5">
                      <div
                        className="card p-3 shadow-sm border-0 model-type"
                        style={{
                          width: "100%",
                          maxWidth: "500px",
                          background: "#313031",
                          color: "white",
                          borderRadius: "12px",
                        }}
                      >
                        <p className="text-center mb-3">
                          Choose how you want the AI to respond
                        </p>
                        <div className="btn-group w-100 model-options">
                          {["Precise", "Balanced", "Creative"].map((option) => (
                            <button
                              key={option}
                              className={`btn ${selected === option ? "btn-dark" : "btn-outline-light"}`}
                              onClick={() => setSelected(option)}
                              style={{
                                transition: "all 0.2s ease",
                                borderColor: "#444",
                              }}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                        <p className="text-center mt-3 small text-muted">
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
                      className={`message-container ${msg.sender === "user" ? "user-message" : "assistant-message"}`}
                      style={{
                        textAlign: msg.sender === "user" ? "right" : "left",
                        marginBottom: "15px",
                        animation: index === messages.length - 1 ? "fadeIn 0.3s ease-in-out" : "none",
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
                                border: "1px solid rgba(255,255,255,0.1)"
                              }}
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <>
                            <ReactMarkdown
                              remarkPlugins={[
                                [remarkGfm, { singleTilde: false }],
                              ]}
                              components={{
                                code: ({ inline, className, children }) => {
                                  const language = className?.replace(
                                    "language-",
                                    ""
                                  );
                                  return inline ? (
                                    <code 
                                      className="bg-dark p-1 rounded"
                                      style={{ fontSize: "0.9em" }}
                                    >
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
                                          color: "#aaa"
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
                                  );
                                },
                              }}
                            >
                              {String(msg.text || "").trim()}
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
                                  className={`btn btn-sm ${feedback[index] === "like"
                                      ? "btn-success"
                                      : "btn-outline-success"
                                    }`}
                                  onClick={() => handleLike(index)}
                                  disabled={feedback[index] !== undefined}
                                  style={{ padding: "4px 8px", fontSize: "12px" }}
                                >
                                  <ThumbsUp size={14} />
                                </button>

                                <button
                                  className={`btn btn-sm ${feedback[index] === "dislike"
                                      ? "btn-danger"
                                      : "btn-outline-danger"
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
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                    <p style={{ color: "white", margin: 0 }}>
                      Generating image...
                    </p>
                  </div>
                ) : loadingChat && selectedOption === "text" ? (
                  <div className="loading-indicator d-flex align-items-center my-4 ps-3">
                    <div className="spinner me-3">
                      <div className="bounce1"></div>
                      <div className="bounce2"></div>
                      <div className="bounce3"></div>
                    </div>
                    <p style={{ color: "white", margin: 0 }}>
                      AI is thinking...
                    </p>
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
                <form
                  onSubmit={handleSendMessage}
                  className="d-flex align-items-center"
                >
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
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#333333"}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#171717"}
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
          ) : (
            // Placeholder when no chat is selected
            <div className="chat-placeholder d-flex flex-column justify-content-center align-items-center h-100 text-white">
              <div className="text-center p-4" style={{ maxWidth: "500px" }}>
                <MessageSquare size={48} className="mb-4 text-muted" />
                <h2>Select a chat or start a new conversation</h2>
                <p className="text-muted mb-4">Choose an existing chat from the sidebar or create a new one to get started.</p>
                <button
                  className="btn btn-light d-flex align-items-center justify-content-center mx-auto"
                  onClick={handleNewChat}
                  style={{ 
                    background: "#313031", 
                    color: "white", 
                    border: "none",
                    transition: "all 0.2s ease",
                    padding: "10px 20px",
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#444"}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#313031"}
                >
                  <Plus size={18} className="me-2" />
                  New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS for animations and loading indicators */}
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
      `}</style>
    </div>
  )
}

export default ChatList