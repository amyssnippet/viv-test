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
  X,
  ChevronRightSquare,
  ArrowUpRight,
  ExternalLink,
  Shield,
  Repeat,
  LayoutDashboardIcon,
  LucideLayoutDashboard,
} from "lucide-react"

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
  const [isEditing, setIsEditing] = useState([])
  const [chatTitle, setChatTitle] = useState("")
  const [feedback, setFeedback] = useState({})
  const [title, setTitle] = useState("")
  const [user, setUser] = useState(null)
  const [chatlist, setChatlist] = useState([])
  const [loadingChats, setLoadingChats] = useState(true)
  const params = useParams()
  const { chatId: currentChatId } = params
  const currentParams = useParams()

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

  // Auto-focus input field on desktop only
  useEffect(() => {
    if (chatId && window.innerWidth > 768) {
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

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSidebarOpen && !event.target.closest(".mobile-sidebar") && !event.target.closest("[data-sidebar-toggle]")) {
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
        setMessages([])
        return
      }

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
    setShowMobileOptions(false)
  }

  const stopStreamingResponse = () => {
    if (streamController && streamingChat) {
      streamController.abort()
      setStreamingChat(false)

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
      fetchChats()
      if (chatId === currentParams.chatId) {
        setChatTitle(newTitle)
      }
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

  const handleChatDelete = async (chatId, e) => {
    e.stopPropagation()
    e.preventDefault()

    if (confirm("Are you sure you want to delete this chat?")) {
      try {
        await axios.post(`${BACKENDURL}/chat/delete`, {
          userId: userData.userId,
          chatId,
        })
        fetchChats()
        if (chatId === currentChatId) {
          navigate("/")
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
              role: msg.sender === "user" ? "user" : "assistant",
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

        if (messages.length === 0 && !chatTitle) {
          fetchChatDetails()
        }

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

  const showChatView = !!chatId
  const showChatPlaceholder = !chatId

  return (
    <div className="chat-app-container">
      {/* Main layout with sidebar and content area */}
      <div className="chat-layout">
        {/* Sidebar - Desktop */}
        <div className="sidebar desktop-sidebar">
          {/* Sidebar Header */}
          <div className="sidebar-header">
            <div className="sidebar-header-content">
              <div className="sidebar-icon">
                <MessageSquare size={20} color="white" />
              </div>
              <div className="sidebar-title">
                <div className="sidebar-title-main">Chat History</div>
                <div className="sidebar-title-sub">{chatlist.length} conversations</div>
              </div>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="new-chat-container">
            <button className="new-chat-btn" onClick={handleNewChat}>
              <Plus size={16} className="new-chat-icon" />
              New Chat
            </button>
          </div>

          {/* Chat List */}
          <div className="chat-list-header">Your Chats</div>

          <div className="chat-list-container">
            {loadingChats ? (
              <div className="loading-container">
                <ThreeDots color="#ffffff" height={30} width={30} />
              </div>
            ) : chatlist.length === 0 ? (
              <div className="empty-chats">No chats yet. Create a new chat to get started.</div>
            ) : (
              chatlist.map((chat) => (
                <Link key={chat.id} to={`/chat/${chat.id}`} className="chat-link" onClick={() => setSidebarOpen(false)}>
                  <div className={`chat-item ${chat.id === chatId ? "active" : ""}`}>
                    <span className="chat-title">
                      {chat.title || `Chat from ${new Date(chat.createdAt).toLocaleDateString()}`}
                    </span>
                    <div className="dropdown">
                      <button
                        className="chat-menu-btn"
                        type="button"
                        id={`dropdown-${chat.id}`}
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical size={16} />
                      </button>
                      <ul className="dropdown-menu chat-dropdown">
                        <li>
                          <a className="dropdown-item" href="#" onClick={(e) => editChat(chat.id, e)}>
                            <Edit size={14} className="dropdown-icon" /> Edit Chat
                          </a>
                        </li>
                        <li>
                          <a
                            className="dropdown-item delete-item"
                            href="#"
                            onClick={(e) => handleChatDelete(chat.id, e)}
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
                              className="dropdown-icon"
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
          <div className="sidebar-footer">
            <div className="sidebar-footer-content">
              <div className="d-flex">
                <Link to="/dashboard" className="btn btn-sm text-white me-2">
                  <LucideLayoutDashboard size={20} />
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
                    <li><hr className="dropdown-divider" /></li>

                    <li>
                      <button className="dropdown-item text-white d-flex align-items-center" style={{ backgroundColor: "transparent" }}>
                        <Shield className="me-2" size={16} /> Upgrade Plan
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item text-white d-flex align-items-center" style={{ backgroundColor: "transparent" }}>
                        <Repeat className="me-2" size={16} /> Customize
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item text-white d-flex align-items-center" style={{ backgroundColor: "transparent" }}>
                        <Settings className="me-2" size={16} /> Settings
                      </button>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <a href="/faq" target="_blank" rel="noopener noreferrer" className="dropdown-item text-white d-flex align-items-center" style={{ backgroundColor: "transparent" }}>
                        <ExternalLink className="me-2" size={16} /> Help & FAQ
                      </a>
                    </li>
                    <li>
                      <a href="/release-notes" target="_blank" rel="noopener noreferrer" className="dropdown-item text-white d-flex align-items-center" style={{ backgroundColor: "transparent" }}>
                        <ExternalLink className="me-2" size={16} /> Release notes
                      </a>
                    </li>
                    <li>
                      <a href="/terms" target="_blank" rel="noopener noreferrer" className="dropdown-item text-white d-flex align-items-center" style={{ backgroundColor: "transparent" }}>
                        <ExternalLink className="me-2" size={16} /> Terms & policies
                      </a>
                    </li>

                    <li><hr className="dropdown-divider" /></li>

                    <li>
                      <button onClick={handleLogOut} className="dropdown-item text-white d-flex align-items-center" style={{ backgroundColor: "transparent" }}>
                        <LogOut className="me-2" size={16} /> Log out
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        <div className={`mobile-overlay ${isSidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)}>
          <div className="mobile-sidebar" onClick={(e) => e.stopPropagation()}>
            {/* Mobile Sidebar Header */}
            <div className="mobile-sidebar-header">
              <div className="sidebar-header-content">
                <div className="sidebar-icon">
                  <MessageSquare size={20} color="white" />
                </div>
                <div className="sidebar-title">
                  <div className="sidebar-title-main">Chat Threads</div>
                  <div className="sidebar-title-sub">{chatlist.length} conversations</div>
                </div>
              </div>
              <button className="mobile-close-btn" onClick={() => setSidebarOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Mobile New Chat Button */}
            <div className="new-chat-container">
              <button className="new-chat-btn" onClick={handleNewChat}>
                <Plus size={16} className="new-chat-icon" />
                New Chat
              </button>
            </div>

            {/* Mobile Chat List */}
            <div className="chat-list-header">Your Chats</div>

            <div className="chat-list-container mobile">
              {loadingChats ? (
                <div className="loading-container">
                  <ThreeDots color="#ffffff" height={30} width={30} />
                </div>
              ) : chatlist.length === 0 ? (
                <div className="empty-chats">No chats yet. Create a new chat to get started.</div>
              ) : (
                chatlist.map((chat) => (
                  <Link
                    key={chat.id}
                    to={`/chat/${chat.id}`}
                    className="chat-link"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className={`chat-item ${chat.id === chatId ? "active" : ""}`}>
                      <span className="chat-title">
                        {chat.title || `Chat from ${new Date(chat.createdAt).toLocaleDateString()}`}
                      </span>
                      <div className="dropdown">
                        <button
                          className="chat-menu-btn"
                          type="button"
                          id={`mobile-dropdown-${chat.id}`}
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical size={16} />
                        </button>
                        <ul className="dropdown-menu chat-dropdown">
                          <li>
                            <a className="dropdown-item" href="#" onClick={(e) => editChat(chat.id, e)}>
                              <Edit size={14} className="dropdown-icon" /> Edit Chat
                            </a>
                          </li>
                          <li>
                            <a
                              className="dropdown-item delete-item"
                              href="#"
                              onClick={(e) => handleChatDelete(chat.id, e)}
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
                                className="dropdown-icon"
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

            {/* Mobile Sidebar Footer */}
            <div className="sidebar-footer mobile">
              <div className="sidebar-footer-content">
                <div className="sidebar-nav-buttons">
                  <Link to="/" className="sidebar-nav-btn">
                    <Home size={20} />
                  </Link>
                  <Link to="/dashboard" className="sidebar-nav-btn">
                    <Settings size={20} />
                  </Link>
                </div>
                <button className="logout-btn" onClick={handleLogOut}>
                  <LogOut size={18} className="logout-icon" /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="main-content">
          {/* Chat Header */}
          {showChatView && (
            <div className="chat-header">
              <div className="chat-header-left">
                <button
                  className="mobile-sidebar-toggle"
                  data-sidebar-toggle
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open chat sidebar"
                >
                  <Menu size={24} />
                </button>

                <Link to="/" className="back-btn">
                  <ChevronLeft size={20} />
                </Link>

                <div className="chat-title-container" onClick={handleEditTitle}>
                  <MessageSquare size={18} className="chat-icon" />
                  <h1 className="chat-title-text">
                    {chatTitle?.length > 25 ? chatTitle.slice(0, 25) + "..." : chatTitle || "Chat"}
                  </h1>
                  <Edit size={14} className="edit-icon" />
                </div>
              </div>

              <div className="chat-header-right">
                {/* Model Selector */}
                <select className="model-select" value={model} onChange={(e) => setModel(e.target.value)}>
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
                      className="profile-img dropdown-toggle"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = "/default-avatar.png"
                      }}
                    />
                  )}
                  <ul className="dropdown-menu dropdown-menu-end profile-dropdown">
                    <li>
                      <button className="dropdown-item" onClick={handleLogOut}>
                        <LogOut size={14} className="dropdown-icon" /> Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Chat Content */}
          {showChatView ? (
            <div className="chat-content-wrapper">
              <div className="chat-messages" ref={chatContainerRef}>
                {chatLoader ? (
                  <div className="chat-skeleton-container">
                    {[1, 2, 3, 4, 5, 6].map((item, i) => (
                      <div key={i} className={`chat-skeleton ${i % 2 === 0 ? "left" : "right"}`}>
                        <div className="skeleton-bubble"></div>
                        <div className="skeleton-timestamp"></div>
                      </div>
                    ))}
                  </div>
                ) : !messages || messages.length === 0 ? (
                  <div className="empty-chat">
                    <h4>Start a conversation</h4>
                    <p>Type a message below to begin chatting.</p>
                    <div className="model-type-container">
                      <div className="model-type-card">
                        <p className="model-type-title">Choose how you want the AI to respond</p>
                        <div className="model-options">
                          {["Precise", "Balanced", "Creative"].map((option) => (
                            <button
                              key={option}
                              className={`model-option-btn ${selected === option ? "active" : ""}`}
                              onClick={() => setSelected(option)}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                        <p className="model-description">
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
                    <div key={index} className={`message-container ${msg.sender === "user" ? "user" : "assistant"}`}>
                      <div className="message-bubble">
                        {msg.isImage ? (
                          <div className="image-container">
                            <img
                              src={msg.imageUrl || "/placeholder.svg"}
                              alt="Generated content"
                              className="message-image"
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
                                    <code className="inline-code">{children}</code>
                                  ) : (
                                    <div className="code-block-container">
                                      <div className="code-language">{language || "code"}</div>
                                      <button onClick={() => handleCopy(String(children))} className="code-copy-btn">
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
                              {String(msg.text || "").trim()}
                            </ReactMarkdown>

                            {/* Action buttons: only show for AI messages */}
                            {msg.sender !== "user" && (
                              <div className="message-actions">
                                <button className="action-btn copy-btn" onClick={() => handleCopy(msg.text)}>
                                  <Copy size={14} />
                                </button>

                                <button
                                  className={`action-btn like-btn ${feedback[index] === "like" ? "active" : ""}`}
                                  onClick={() => handleLike(index)}
                                  disabled={feedback[index] !== undefined}
                                >
                                  <ThumbsUp size={14} />
                                </button>

                                <button
                                  className={`action-btn dislike-btn ${feedback[index] === "dislike" ? "active" : ""}`}
                                  onClick={() => handleDislike(index)}
                                  disabled={feedback[index] !== undefined}
                                >
                                  <ThumbsDown size={14} />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="message-timestamp">
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  ))
                )}

                {/* Loading indicators */}
                {(imageLoader && selectedOption === "image") || (loadingChat && selectedOption === "text") ? (
                  <div className="loading-indicator">
                    <div className="spinner">
                      <div className="bounce1"></div>
                      <div className="bounce2"></div>
                      <div className="bounce3"></div>
                    </div>
                    <p className="loading-text">{imageLoader ? "Generating image..." : "AI is thinking..."}</p>
                  </div>
                ) : null}

                {error && <div className="error-message">{error}</div>}
              </div>

              {/* Chat Input */}
              <div className="chat-input-container">
                <form onSubmit={handleSendMessage} className="chat-input-form">
                  <div className="input-wrapper">
                    <div className="input-content">
                      <textarea
                        ref={inputRef}
                        rows={1}
                        className="message-input"
                        placeholder="Ask anything..."
                        value={inputMessage}
                        onChange={(e) => {
                          setInputMessage(e.target.value)
                          // Auto-resize textarea
                          e.target.style.height = "auto"
                          e.target.style.height = Math.min(120, e.target.scrollHeight) + "px"
                        }}
                      />

                      {/* Desktop Controls */}
                      <div className="desktop-controls">
                        <select className="option-select" value={selectedOption} onChange={handleOptionChange}>
                          <option value="text">Text</option>
                          <option value="image">Generate Image</option>
                        </select>

                        <button type="submit" className="send-btn" disabled={!inputMessage.trim() || isLoading}>
                          <Send size={16} />
                        </button>
                      </div>

                      {/* Mobile Controls */}
                      <div className="mobile-controls">
                        <button className="send-btn mobile" type="submit" disabled={!inputMessage.trim() || isLoading}>
                          <Send size={16} />
                        </button>
                        <button
                          type="button"
                          className="options-btn"
                          onClick={() => setShowMobileOptions(!showMobileOptions)}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* Mobile Options Dropdown */}
                        {showMobileOptions && (
                          <div className="mobile-options-dropdown" ref={dropdownRef}>
                            <select
                              className="mobile-option-select"
                              value={selectedOption}
                              onChange={handleOptionChange}
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
            <div className="chat-placeholder">
              {/* Mobile Sidebar Toggle for Placeholder */}
              <button className="mobile-fab-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open chat list">
                <MessageSquare size={24} />
              </button>

              <div className="placeholder-content">
                <MessageSquare size={48} className="placeholder-icon" />
                <h2>Select a chat or start a new conversation</h2>
                <p>Choose an existing chat from the sidebar or create a new one to get started.</p>
                <button className="placeholder-new-chat-btn" onClick={handleNewChat}>
                  <Plus size={18} className="placeholder-btn-icon" />
                  New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .chat-app-container {
          height: 100vh;
          overflow: hidden;
          
        }

        .chat-layout {
          display: flex;
          height: 100vh;
        }

        /* Sidebar Styles */
        .sidebar {
          width: 400px;
          background-color: #171717;
          color: white;
          border-right: 1px solid #333;
          height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .desktop-sidebar {
          display: none;
        }

        @media (min-width: 768px) {
          .desktop-sidebar {
            display: flex;
          }
        }

        .sidebar-header {
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sidebar-header-content {
          display: flex;
          align-items: center;
        }

        .sidebar-icon {
          background-color: #333;
          padding: 0.5rem;
          border-radius: 0.5rem;
          margin-right: 0.5rem;
        }

        .sidebar-title-main {
          font-weight: bold;
        }

        .sidebar-title-sub {
          color: #ccc;
          font-size: 0.875rem;
        }

        .new-chat-container {
          padding: 0 1rem 1rem;
        }

        .new-chat-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #222222;
          color: white;
          border: none;
          border-radius: 0.5rem;
          padding: 0.75rem;
          transition: all 0.2s ease;
          height: 44px;
          font-size: 0.875rem;
        }

        .new-chat-btn:hover {
          background-color: #333333;
        }

        .new-chat-icon {
          margin-right: 0.5rem;
        }

        .chat-list-header {
          padding: 0.5rem 1rem;
          color: #6c757d;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .chat-list-container {
          flex-grow: 1;
          overflow-y: auto;
          padding: 0 1rem;
          max-height: calc(100vh - 220px);
        }

        .chat-list-container.mobile {
          max-height: calc(100vh - 220px);
        }

        .loading-container {
          display: flex;
          justify-content: center;
          padding: 1rem 0;
        }

        .empty-chats {
          text-align: center;
          padding: 1rem;
          color: #6c757d;
        }

        .chat-link {
          text-decoration: none;
          color: inherit;
        }

        .chat-item {
          cursor: pointer;
          padding: 0.75rem 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #212020;
          margin-bottom: 0.5rem;
          border-radius: 0.5rem;
          color: white;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .chat-item:hover {
          background-color: #2a2a2a;
        }

        .chat-item.active {
          background-color: #2a2a2a;
          border-color: #444;
        }

        .chat-title {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .chat-menu-btn {
          background: none;
          border: none;
          color: white;
          padding: 0.25rem;
          border-radius: 0.25rem;
          cursor: pointer;
        }

        .chat-dropdown {
          background-color: #222;
          border: 1px solid #444;
        }

        .dropdown-item {
          color: white;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
        }

        .dropdown-item:hover {
          background-color: #333;
          color: white;
        }

        .dropdown-icon {
          margin-right: 0.5rem;
        }

        .delete-item {
          color: #ff6b6b;
        }

        .sidebar-footer {
          padding: 1rem;
          margin-top: auto;
          border-top: 1px solid #333;
        }

        .sidebar-footer.mobile {
          position: sticky;
          bottom: 0;
          background-color: #171717;
        }

        .sidebar-footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sidebar-nav-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .sidebar-nav-btn {
          color: white;
          text-decoration: none;
          padding: 0.5rem;
          border-radius: 0.25rem;
          transition: background-color 0.2s ease;
        }

        .sidebar-nav-btn:hover {
          background-color: #333;
          color: white;
        }

        .logout-btn {
          background-color: #333;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .logout-btn:hover {
          background-color: #444;
        }

        .logout-icon {
          margin-right: 0.25rem;
        }

        /* Mobile Sidebar */
        .mobile-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1040;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }

        .mobile-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        .mobile-sidebar {
          background-color: #171717;
          color: white;
          width: 85%;
          max-width: 350px;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1050;
          overflow-y: auto;
          transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
          transform: translateX(-100%);
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
        }

        .mobile-overlay.open .mobile-sidebar {
          transform: translateX(0);
        }

        .mobile-sidebar-header {
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #333;
        }

        .mobile-close-btn {
          background-color: #333;
          color: white;
          border: none;
          padding: 0.5rem;
          border-radius: 0.25rem;
          cursor: pointer;
        }

        @media (min-width: 768px) {
          .mobile-overlay {
            display: none;
          }
        }

        /* Main Content */
        .main-content {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          background-color: #222222;
          height: 100vh;
          overflow: hidden;
        }

        /* Chat Header */
        .chat-header {
          padding: 1rem;
          background-color: #222222;
          border-bottom: 1px solid #333;
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-height: 70px;
        }

        .chat-header-left {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .mobile-menu-btn {
          background: none;
          border: none;
          color: white;
          padding: 0.25rem;
          margin-right: 0.5rem;
          cursor: pointer;
          display: block;
        }

        @media (min-width: 768px) {
          .mobile-menu-btn {
            display: none;
          }
        }

        .back-btn {
          color: white;
          text-decoration: none;
          padding: 0.25rem;
          margin-right: 0.5rem;
          border-radius: 0.25rem;
          transition: background-color 0.2s ease;
        }

        .back-btn:hover {
          background-color: #333;
          color: white;
        }

        .chat-title-container {
          display: flex;
          align-items: center;
          cursor: pointer;
          flex: 1;
          min-width: 0;
        }

        .chat-icon {
          margin-right: 0.5rem;
          color: white;
          flex-shrink: 0;
        }

        .chat-title-text {
          font-size: 1.125rem;
          font-weight: bold;
          color: white;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 767px) {
          .chat-title-text {
            font-size: 1rem;
          }
        }

        .edit-icon {
          margin-left: 0.5rem;
          color: white;
          flex-shrink: 0;
        }

        .chat-header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .model-select {
          background: #2E2F2E;
          border: none;
          color: white;
          border-radius: 0.25rem;
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
        }

        .profile-img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #444;
          cursor: pointer;
        }

        .profile-dropdown {
          background-color: #2E2F2E;
          border: 1px solid #444;
        }

        /* Chat Content */
        .chat-content-wrapper {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          height: calc(100vh - 70px);
          overflow: hidden;
        }

        .chat-messages {
          flex-grow: 1;
          overflow-y: auto;
          padding: 1rem;
          scroll-behavior: smooth;
        }

        /* Chat Skeleton */
        .chat-skeleton-container {
          padding: 1rem 0;
        }

        .chat-skeleton {
          margin-bottom: 1.25rem;
          display: flex;
          flex-direction: column;
        }

        .chat-skeleton.left {
          align-items: flex-start;
        }

        .chat-skeleton.right {
          align-items: flex-end;
        }

        .skeleton-bubble {
          height: 60px;
          width: 60%;
          background-color: #2a2a2a;
          border-radius: 0.75rem;
          animation: pulse 1.5s infinite ease-in-out;
        }

        .skeleton-timestamp {
          height: 10px;
          width: 50px;
          background-color: #2a2a2a;
          margin-top: 0.25rem;
          border-radius: 0.1875rem;
          animation: pulse 1.5s infinite ease-in-out;
        }

        /* Empty Chat */
        .empty-chat {
          text-align: center;
          padding: 2rem 1rem;
          color: white;
        }

        .empty-chat h4 {
          margin-bottom: 0.5rem;
        }

        .empty-chat p {
          margin-bottom: 2rem;
          color: #ccc;
        }

        .model-type-container {
          display: flex;
          justify-content: center;
          margin-top: 2rem;
        }

        .model-type-card {
          width: 100%;
          max-width: 500px;
          background: #313031;
          color: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
        }

        .model-type-title {
          text-align: center;
          margin-bottom: 1rem;
        }

        .model-options {
          display: flex;
          width: 100%;
          border-radius: 0.5rem;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .model-option-btn {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #444;
          background: transparent;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .model-option-btn:first-child {
          border-top-left-radius: 0.5rem;
          border-bottom-left-radius: 0.5rem;
        }

        .model-option-btn:last-child {
          border-top-right-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }

        .model-option-btn.active {
          background-color: #444;
        }

        .model-option-btn:hover {
          background-color: #333;
        }

        .model-description {
          text-align: center;
          margin: 0;
          font-size: 0.875rem;
          color: #ccc;
        }

        /* Messages */
        .message-container {
          margin-bottom: 1rem;
          animation: fadeIn 0.3s ease-in-out;
        }

        .message-container.user {
          text-align: right;
        }

        .message-container.assistant {
          text-align: left;
        }

        .message-bubble {
          display: inline-block;
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          max-width: 75%;
          color: white;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .message-container.user .message-bubble {
          background-color: #2E2F2E;
        }

        .message-container.assistant .message-bubble {
          background-color: #3a3a3a;
        }

        @media (max-width: 767px) {
          .message-bubble {
            max-width: 90%;
            padding: 0.625rem 0.875rem;
          }
        }

        .message-image {
          max-width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .inline-code {
          background-color: #333;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.9em;
        }

        .code-block-container {
          position: relative;
          margin: 0.625rem 0;
        }

        .code-language {
          position: absolute;
          top: 0;
          right: 0;
          background-color: #222;
          border-radius: 0 0.25rem 0 0.25rem;
          padding: 0.125rem 0.5rem;
          font-size: 0.75rem;
          color: #aaa;
        }

        .code-copy-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: rgba(51, 51, 51, 0.8);
          color: white;
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.75rem;
          z-index: 1;
        }

        .message-actions {
          display: flex;
          justify-content: flex-start;
          margin-top: 0.5rem;
          gap: 0.5rem;
        }

        .action-btn {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          border: 1px solid #555;
          background: transparent;
          color: white;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          background-color: #444;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .like-btn.active {
          background-color: #28a745;
          border-color: #28a745;
        }

        .dislike-btn.active {
          background-color: #dc3545;
          border-color: #dc3545;
        }

        .message-timestamp {
          margin-top: 0.25rem;
          opacity: 0.7;
          font-size: 0.75rem;
          color: white;
        }

        .message-container.user .message-timestamp {
          padding-right: 0.75rem;
        }

        .message-container.assistant .message-timestamp {
          padding-left: 0.75rem;
        }

        /* Loading Indicator */
        .loading-indicator {
          display: flex;
          align-items: center;
          margin: 1rem 0;
          padding-left: 0.75rem;
        }

        .spinner {
          display: flex;
          align-items: center;
          margin-right: 0.75rem;
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

        .bounce1 {
          animation-delay: -0.32s;
        }

        .bounce2 {
          animation-delay: -0.16s;
        }

        .loading-text {
          color: white;
          margin: 0;
        }

        /* Error Message */
        .error-message {
          background-color: rgba(220, 53, 69, 0.2);
          color: #ff6b6b;
          border: 1px solid rgba(220, 53, 69, 0.3);
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }

        /* Chat Input */
        .chat-input-container {
          padding: 1rem;
          border-top: 1px solid #333;
          background-color: #222222;
        }

        .chat-input-form {
          display: flex;
          align-items: center;
        }

        .input-wrapper {
          width: 100%;
        }

        .input-content {
          display: flex;
          align-items: flex-end;
          background: #313031;
          border-radius: 0.75rem;
          border: 1px solid #444;
          padding: 0.5rem;
        }

        .message-input {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          font-size: 1rem;
          resize: none;
          overflow: auto;
          max-height: 120px;
          padding: 0.5rem;
          outline: none;
        }

        .message-input::placeholder {
          color: #999;
        }

        @media (max-width: 767px) {
          .message-input {
            font-size: 16px; /* Prevents zoom on iOS */
          }
        }

        .desktop-controls {
          display: none;
          align-items: center;
          gap: 0.5rem;
        }

        @media (min-width: 768px) {
          .desktop-controls {
            display: flex;
          }
        }

        .mobile-controls {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          position: relative;
        }

        @media (min-width: 768px) {
          .mobile-controls {
            display: none;
          }
        }

        .option-select {
          width: auto;
          height: 38px;
          background-color: #171717;
          border-radius: 50px;
          padding: 0 1rem 0 0.625rem;
          color: white;
          border: none;
          font-size: 0.875rem;
        }

        .send-btn {
          width: 42px;
          height: 42px;
          background-color: #171717;
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .send-btn:hover:not(:disabled) {
          background-color: #333333;
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .send-btn.mobile {
          background-color: #171717;
        }

        .options-btn {
          width: 42px;
          height: 42px;
          background-color: #171717;
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-options-dropdown {
          position: absolute;
          right: 0;
          bottom: 100%;
          margin-bottom: 0.5rem;
          padding: 0.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          background-color: #171717;
          z-index: 1000;
          border: 1px solid #444;
          min-width: 150px;
        }

        .mobile-option-select {
          background-color: #2a2a2a;
          color: white;
          border: none;
          border-radius: 0.25rem;
          padding: 0.5rem;
          width: 100%;
          font-size: 0.875rem;
        }

        /* Chat Placeholder */
        .chat-placeholder {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100%;
          color: white;
          text-align: center;
        }

        .placeholder-content {
          padding: 2rem;
          max-width: 500px;
        }

        .placeholder-icon {
          margin-bottom: 1rem;
          color: #6c757d;
        }

        .placeholder-content h2 {
          margin-bottom: 1rem;
        }

        .placeholder-content p {
          margin-bottom: 1.5rem;
          color: #f2f2f2;
        }

        .placeholder-new-chat-btn {
          background: #313031;
          color: white;
          border: none;
          border-radius: 0.5rem;
          padding: 0.75rem 1.25rem;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          cursor: pointer;
        }

        .placeholder-new-chat-btn:hover {
          background-color: #444;
        }

        .placeholder-btn-icon {
          margin-right: 0.5rem;
        }

        /* Animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0% {
            opacity: 0.6;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            opacity: 0.6;
          }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1.0);
          }
        }

        /* Scrollbar Styles */
        .chat-messages::-webkit-scrollbar,
        .chat-list-container::-webkit-scrollbar {
          width: 6px;
        }

        .chat-messages::-webkit-scrollbar-track,
        .chat-list-container::-webkit-scrollbar-track {
          background: #222;
        }

        .chat-messages::-webkit-scrollbar-thumb,
        .chat-list-container::-webkit-scrollbar-thumb {
          background-color: #444;
          border-radius: 6px;
        }

        /* Mobile Responsive Adjustments */
        @media (max-width: 767px) {
          .chat-input-container {
            padding: 0.75rem;
          }

          .input-content {
            padding: 0.375rem;
          }

          .message-input {
            padding: 0.375rem;
          }

          .chat-header {
            padding: 0.75rem;
          }

          .chat-messages {
            padding: 0.75rem;
          }

          .model-type-card {
            padding: 1rem;
            margin: 0 0.5rem;
          }

          .model-options {
            flex-direction: column;
          }

          .model-option-btn {
            border-radius: 0.5rem !important;
            margin-bottom: 0.5rem;
          }

          .model-option-btn:last-child {
            margin-bottom: 0;
          }

          .chat-header-right {
            gap: 0.5rem;
          }

          .model-select {
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
          }

          .profile-img {
            width: 35px;
            height: 35px;
          }
        }

        /* Very small screens */
        @media (max-width: 480px) {
          .sidebar {
            width: 350px;
          }

          .mobile-sidebar {
            width: 90%;
          }

          .chat-title-text {
            font-size: 0.875rem;
          }

          .message-bubble {
            max-width: 95%;
          }

          .model-type-card {
            margin: 0 0.25rem;
          }
        }

        /* Landscape mobile adjustments */
        @media (max-height: 500px) and (orientation: landscape) {
          .chat-messages {
            padding: 0.5rem;
          }

          .chat-input-container {
            padding: 0.5rem;
          }

          .chat-header {
            padding: 0.5rem 0.75rem;
            min-height: 60px;
          }

          .empty-chat {
            padding: 1rem;
          }

          .model-type-container {
            margin-top: 1rem;
          }

          .model-type-card {
            padding: 1rem;
          }
        }

        /* High DPI displays */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .message-input {
            font-size: 16px;
          }
        }

        /* Focus states for accessibility */
        .message-input:focus,
        .option-select:focus,
        .mobile-option-select:focus,
        .model-select:focus {
          outline: 2px solid #0066cc;
          outline-offset: 2px;
        }

        .send-btn:focus,
        .options-btn:focus,
        .new-chat-btn:focus,
        .logout-btn:focus {
          outline: 2px solid #0066cc;
          outline-offset: 2px;
        }

        /* Reduce motion for users who prefer it */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* Enhanced Mobile Sidebar Toggle */
        .mobile-sidebar-toggle {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          padding: 0.5rem;
          margin-right: 0.75rem;
          cursor: pointer;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
          min-width: 44px;
          min-height: 44px;
        }

        .mobile-sidebar-toggle:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }

        .mobile-sidebar-toggle:active {
          transform: scale(0.95);
        }

        @media (min-width: 768px) {
          .mobile-sidebar-toggle {
            display: none;
          }
        }

        /* Floating Action Button for Mobile */
        .mobile-fab-toggle {
          position: fixed;
          top: 1rem;
          left: 1rem;
          z-index: 1000;
          background: #171717;
          border: none;
          color: white;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .mobile-fab-toggle:hover {
          background: #333;
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }

        .mobile-fab-toggle:active {
          transform: scale(0.95);
        }

        @media (min-width: 768px) {
          .mobile-fab-toggle {
            display: none;
          }
        }

        /* Enhanced Mobile Sidebar Animations */
        .mobile-sidebar {
          background-color: #171717;
          color: white;
          width: 85%;
          max-width: 350px;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1050;
          overflow-y: auto;
          transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
          transform: translateX(-100%);
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          border-right: 2px solid #333;
        }

        .mobile-overlay.open .mobile-sidebar {
          transform: translateX(0);
        }

        /* Improved Mobile Close Button */
        .mobile-close-btn {
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }

        .mobile-close-btn:hover {
          background-color: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }

        /* Mobile Sidebar Header Enhancement */
        .mobile-sidebar-header {
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #333;
          background: linear-gradient(135deg, #171717 0%, #1a1a1a 100%);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        /* Better Mobile Chat Item Styling */
        .chat-item {
          cursor: pointer;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #212020;
          margin-bottom: 0.5rem;
          border-radius: 0.75rem;
          color: white;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          min-height: 60px;
        }

        @media (max-width: 767px) {
          .chat-item {
            padding: 1rem 0.75rem;
            min-height: 56px;
          }
        }

        /* Mobile Sidebar Indicator */
        .sidebar-indicator {
          position: fixed;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
          width: 4px;
          height: 40px;
          background: linear-gradient(to bottom, #0066cc, #004499);
          border-radius: 0 4px 4px 0;
          z-index: 999;
          opacity: 0.7;
          transition: opacity 0.3s ease;
        }

        @media (min-width: 768px) {
          .sidebar-indicator {
            display: none;
          }
        }

        /* Swipe Gesture Hint */
        .swipe-hint {
          position: fixed;
          bottom: 2rem;
          left: 1rem;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-size: 0.75rem;
          z-index: 1001;
          animation: fadeInOut 3s ease-in-out;
          pointer-events: none;
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0; }
          20%, 80% { opacity: 1; }
        }

        @media (min-width: 768px) {
          .swipe-hint {
            display: none;
          }
        }

        /* Enhanced Mobile Responsiveness */
        @media (max-width: 480px) {
          .mobile-sidebar {
            width: 95%;
            max-width: none;
          }
          
          .mobile-fab-toggle {
            width: 52px;
            height: 52px;
            top: 0.75rem;
            left: 0.75rem;
          }
          
          .mobile-sidebar-toggle {
            margin-right: 0.5rem;
            min-width: 40px;
            min-height: 40px;
          }
        }

        /* Accessibility improvements for mobile */
        @media (max-width: 767px) {
          .mobile-sidebar-toggle:focus,
          .mobile-fab-toggle:focus,
          .mobile-close-btn:focus {
            outline: 2px solid #0066cc;
            outline-offset: 2px;
          }
          
          /* Ensure touch targets are at least 44px */
          .chat-menu-btn,
          .sidebar-nav-btn,
          .action-btn {
            min-width: 44px;
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}

export default ChatList
