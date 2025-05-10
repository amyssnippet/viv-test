"use client"

import { useState, useRef, useEffect } from "react"
import "bootstrap/dist/css/bootstrap.min.css"
import { Link, useNavigate } from "react-router-dom"
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
import { Copy, ThumbsUp, ThumbsDown } from "lucide-react"

const ClaudeChatUI = () => {
  const navigate = useNavigate()
  const [selected, setSelected] = useState("Precise")
  const [messages, setMessages] = useState({})
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
  const [streamingChats, setStreamingChats] = useState({})
  const [streamController, setStreamController] = useState(null)
  const [partialResponse, setPartialResponse] = useState("")
  const [image, setImage] = useState(null)
  const [selectedOption, setSelectedOption] = useState("text")
  const [showMobileOptions, setShowMobileOptions] = useState(false)
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [loadingChats, setLoadingChats] = useState({})
  const [chatLoader, setChatLoader] = useState(false)
  const dropdownRef = useRef(null)
  const [imageLoader, setImageLoader] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const activeTitle = chatlist.find((c) => c._id === activeChat)?.title
  const [feedback, setFeedback] = useState({})
  const [title, setTitle] = useState("")
  const [chat, setChat] = useState(null)
  const [onChatUpdate, setOnChatUpdate] = useState(null)
  const [generateChatTitle, setGenerateChatTitle] = useState(() => { })

  const handleLike = (index) => {
    alert("Thanks for your response!")
    setFeedback((prev) => ({ ...prev, [index]: "like" }))
  }

  const handleDislike = (index) => {
    alert("Thanks for your response!")
    setFeedback((prev) => ({ ...prev, [index]: "dislike" }))
  }

  function editChat(chatId) {
    const newTitle = prompt("Enter new chat title:")
    if (!newTitle) return

    axios
      .post(`${BACKENDURL}/chat/update/title`, {
        chatId: chatId,
        title: newTitle,
        userId: userData.userId,
      })
      .then((response) => {
        alert("Chat title updated successfully!")
        // Optionally update the UI or reload
      })
      .catch((error) => {
        console.error(error)
        alert("Error updating chat title.")
      })
  }

  const handleChatDelete = async (chatId) => {
    if (confirm("Are you sure you want to delete this chat?")) {
      const res = axios.post(`${BACKENDURL}/chat/delete`, { userId: userData.userId, chatId })
      console.log(res)
    }
  }

  const handleEditSave = async (e) => {
    e.stopPropagation()
    if (!title.trim()) return

    try {
      await axios.put(`/api/chat/${chat._id}/edit`, {
        title: title.trim(),
      })
      setIsEditing(false)
      if (onChatUpdate) onChatUpdate(chat._id, title.trim())
    } catch (error) {
      console.error("Edit failed:", error)
      alert("Failed to update chat title")
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Copied to clipboard!")
      })
      .catch((err) => {
        alert("Failed to copy text: ", err)
      })
  }

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value)
  }

  const generateImage = async () => {
    setImageLoader(true)
    if (!inputMessage.trim()) return
    if (!activeChat) {
      setError("No active chat selected. Please create or select a chat first.")
      return
    }

    const userMessage = {
      sender: "user",
      text: inputMessage,
      timestamp: new Date(),
      isImage: false,
    }

    // Update messages for active chat
    setMessages((prevMessages) => ({
      ...prevMessages,
      [activeChat]: [...(prevMessages[activeChat] || []), userMessage],
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
      setMessages((prevMessages) => ({
        ...prevMessages,
        [activeChat]: [...(prevMessages[activeChat] || []), generatingMsg],
      }))

      const token = Cookies.get("authToken")

      const response = await fetch(`${BACKENDURL}/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: inputMessage,
          chatId: activeChat,
          userId: userData.userId,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate image")

      const data = await response.json()
      const imageUrl = data.imageUrl

      // Save the imageUrl to localStorage
      localStorage.setItem("imageUrl", imageUrl)

      // Update the messages with the generated image URL for active chat
      setMessages((prevMessages) => {
        const chatMessages = [...(prevMessages[activeChat] || [])]
        chatMessages[chatMessages.length - 1] = {
          sender: "assistant",
          text: `Image generated from prompt: "${inputMessage}"`,
          timestamp: new Date(),
          isImage: true,
          imageUrl: imageUrl,
        }

        return {
          ...prevMessages,
          [activeChat]: chatMessages,
        }
      })

      setInputMessage("")
    } catch (error) {
      console.error("Error generating image:", error)
      setError(`Failed to generate image: ${error.message}`)

      // Update the generating message to show error for active chat
      setMessages((prevMessages) => {
        const chatMessages = [...(prevMessages[activeChat] || [])]
        chatMessages[chatMessages.length - 1].text = `Error generating image: ${error.message}`

        return {
          ...prevMessages,
          [activeChat]: chatMessages,
        }
      })
    } finally {
      setImageLoader(false)
    }
  }

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "Enter" && streamingChats[activeChat]) {
        stopStreamingResponse()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => {
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [streamingChats, activeChat])

  // Function to stop streaming
  const stopStreamingResponse = () => {
    if (streamController && streamingChats[activeChat]) {
      streamController.abort() // Safely stop the previous stream
      setStreamingChats((prev) => ({ ...prev, [activeChat]: false }))

      // Update the message with [Response stopped by user] appended for the active chat only
      setMessages((prevMessages) => {
        const chatMessages = [...(prevMessages[activeChat] || [])]
        const lastMsg = chatMessages[chatMessages.length - 1]

        if (lastMsg?.sender === "assistant") {
          lastMsg.text = partialResponse + " [Response stopped by user]"
        }

        return {
          ...prevMessages,
          [activeChat]: chatMessages,
        }
      })
    }
  }

  // Decode user token on component mount
  useEffect(() => {
    if (isUserLoggedIn) {
      try {
        const decodedToken = jwtDecode(userToken)
        setUserData(decodedToken)
        console.log(userData)
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
    inputRef.current?.focus() // Focus initially if needed

    const handleGlobalKeyDown = (e) => {
      // Prevent new line on Enter key press and handle message send
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault() // Prevents new line
        handleSendMessage(e) // Call message send function
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown)
    }
  }, [inputMessage, messages])

  // Fetch chat messages - FIXED
  const fetchChatMessages = async (chatId) => {
    try {
      setChatLoader(true)
      console.log("Fetching messages for chat:", chatId)
      console.log("User ID:", userData.userId)

      const response = await fetch(`${BACKENDURL}/chat/messages`, {
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

      // Store messages by chatId
      setMessages((prevMessages) => ({
        ...prevMessages,
        [chatId]: formattedMessages,
      }))
    } catch (error) {
      setChatLoader(false)
      console.error("❌ Fetch Error:", error)
      setError(`Failed to load messages: ${error.message}`)
    } finally {
      setChatLoader(false)
    }
  }

  // Fetch user's chats - FIXED
  const fetchChats = async () => {
    try {
      const response = await fetch(`${BACKENDURL}/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`, // Ensure token is valid on backend
        },
        body: JSON.stringify({
          userId: userData.userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load chats");
      }

      const chatsArray = Array.isArray(data.chats) ? data.chats : [];

      // Sort chats by updatedAt or createdAt (based on backend logic)
      const sortedChats = chatsArray.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      setChatlist(sortedChats);

      // Use 'id' instead of '_id' from Sequelize/Postgres
      if (sortedChats.length > 0 && !activeChat) {
        setActiveChat(sortedChats[0].id);
      }

    } catch (error) {
      console.error("Error fetching chats:", error);
      setError(`Failed to load chats: ${error.message}`);
    }
  };


  // Create a new chat
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

      // Create a new empty messages array for this chat
      setMessages((prevMessages) => ({
        ...prevMessages,
        [data.chat._id]: [],
      }))

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
    setLoadingChats((prev) => ({ ...prev, [activeChat]: true }))
    e.preventDefault()

    if (streamController) {
      streamController.abort() // Safely stop the previous stream
    }

    if (!inputMessage.trim() || isLoading) return

    if (!activeChat) {
      setError("No active chat selected. Please create or select a chat first.")
      return
    }

    // Handle based on selected option
    if (selectedOption === "image") {
      // Generate image if 'image' option is selected
      await generateImage()
    } else {
      // Regular text message handling
      const userMessage = {
        sender: "user",
        text: inputMessage,
        timestamp: new Date(),
      }

      // Update messages for the active chat
      setMessages((prevMessages) => ({
        ...prevMessages,
        [activeChat]: [...(prevMessages[activeChat] || []), userMessage],
      }))

      const currentChatMessages = [...(messages[activeChat] || []), userMessage]

      setInputMessage("")
      setIsLoading(true)
      setError(null)
      setPartialResponse("") // Reset partial response

      try {
        // Create an AbortController to handle stopping the stream
        const controller = new AbortController()
        setStreamController(controller)
        setStreamingChats((prev) => ({ ...prev, [activeChat]: true }))

        const response = await fetch(`${BACKENDURL}/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            model: model,
            messages: currentChatMessages.map((msg) => ({
              role: msg.sender,
              content: msg.text,
            })),
            userId: userData.userId,
            chatId: activeChat,
          }),
          signal: controller.signal, // Add the signal to the fetch request
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
                setPartialResponse(accumulatedText) // Update partial response

                // Update messages for the active chat only
                setMessages((prevMessages) => {
                  const chatMessages = [...(prevMessages[activeChat] || [])]
                  const lastMsg = chatMessages[chatMessages.length - 1]

                  if (lastMsg?.sender === "assistant") {
                    lastMsg.text = accumulatedText
                    return {
                      ...prevMessages,
                      [activeChat]: chatMessages,
                    }
                  } else {
                    return {
                      ...prevMessages,
                      [activeChat]: [
                        ...chatMessages,
                        {
                          sender: "assistant",
                          text: accumulatedText,
                          timestamp: new Date(),
                        },
                      ],
                    }
                  }
                })
              }
            } catch (error) {
              console.warn("Error parsing JSON chunk:", error, line)
            }
          })
        }

        // After we have the first AI response, generate a title if this is a new chat
        const currentMessages = currentChatMessages.length + 1
        if (currentMessages === 2 && activeChat) {
          setTimeout(() => generateChatTitle(activeChat), 500)
        }
      } catch (err) {
        // Check if this is an abort error (user stopped the stream)
        if (err.name === "AbortError") {
          console.log("Response streaming was aborted by user")
        } else {
          console.error("Error calling backend:", err)
          setError(`Failed to get response: ${err.message}`)
        }
      } finally {
        setIsLoading(false)
        setStreamingChats((prev) => ({ ...prev, [activeChat]: false }))
        setStreamController(null)
        setLoadingChats((prev) => ({ ...prev, [activeChat]: false }))
      }
    }
  }

  const handleChatClick = (chatId) => {
    setActiveChat(chatId)
  }

  const [user, setUser] = useState(null)

  const fetchUser = async () => {
    // console.log(userData.userId)
    try {
      const response = await axios.post(`${BACKENDURL}/fetch/user`, {
        id: userData.userId,
      })

      if (response.data) {
        setUser(response.data)
      }
    } catch (error) {
      // console.error("Error fetching user:", error);
    }
  }

  useEffect(() => {
    fetchUser()
  })

  const handleLogOut = () => {
    // Remove token from localStorage or cookies
    Cookies.remove("authToken") // If stored in cookies

    // Redirect to login or home page
    navigate("/auth")
    toast.success("Logged out sucessfull")

    // Optionally clear any app state (e.g., context or Redux)
  }

  useEffect(() => {
    const messagesContainer = chatContainerRef.current
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    }

    const messageElements = document.querySelectorAll(".message")
    messageElements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add("visible")
      }, index * 100) // Delay each message by 100ms
    })
  }, [messages])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMobileOptions(false) // 👈 Close dropdown
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

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        {/* Mobile view */}
        <div
          className={`mobile-sidebar-overlay ${isSidebarOpen ? "open" : ""} d-md-none`}
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
              transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
            }}
          >
            <div
              className="col-3 sidebar"
              style={{
                backgroundColor: "#171717",
                color: "white",
                height: "100vh",
              }}
            >
              <div className="p-3 d-flex">
                <div className="bg-dark p-2 rounded me-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="white"
                    className="bi bi-chat-square-text"
                    viewBox="0 0 16 16"
                  >
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
                  fontWeight: 600,
                }}
              >
                Your Chats
              </div>

              <div className="customer-scrollbar" style={{ overflowY: "scroll", height: "65vh" }}>
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
                  padding: "15px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <button
                  className="btn btn-light w-100 d-flex align-items-center justify-content-center"
                  onClick={handleNewChat}
                  style={{
                    background: "#222222",
                    color: "white",
                    border: "none",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="white"
                    className="bi bi-plus me-2"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                  </svg>
                  New Chat
                </button>
              </div>

              <div className="d-flex justify-content-between p-3">
                <Link to="/">
                  <button className="btn btn-sm text-muted">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="white"
                      className="bi bi-house"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5Z" />
                    </svg>
                  </button>
                </Link>

                <Link to="/dashboard">
                  <button className="btn btn-sm text-muted">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="white"
                      className="bi bi-gear"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
                      <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592..." />
                    </svg>
                  </button>
                </Link>
              </div>
            </div>
            {/* Your original sidebar content here (like what you sent above) */}
          </div>
        </div>

        {/* Desktop */}
        <div
          className="col-3 sidebar d-none d-md-block"
          style={{
            backgroundColor: "#171717",
            color: "white",
            height: "100vh",
          }}
        >
          <div className="p-3 d-flex">
            <div className="bg-dark p-2 rounded me-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="white"
                className="bi bi-chat-square-text"
                viewBox="0 0 16 16"
              >
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
              fontWeight: 600,
            }}
          >
            Your Chats
          </div>

          <div className="customer-scrollbar" style={{ overflowY: "scroll", height: "65vh" }}>
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
                <div class="dropdown">
                  <button
                    class="btn"
                    type="button"
                    id="dropdownMenuButton1"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
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
                  <ul class="dropdown-menu bg-black" aria-labelledby="dropdownMenuButton1">
                    <li onClick={(e) => editChat(chat._id)}>
                      <a class="dropdown-item text-white bg-black" href="#">
                        Edit Chat
                      </a>
                    </li>
                    <li onClick={(e) => handleChatDelete(chat._id)}>
                      <a class="dropdown-item text-white bg-black" href="#">
                        Delete Chat
                      </a>
                    </li>
                    <li></li>
                  </ul>
                </div>
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
              style={{ background: "#222222", color: "white", border: "none" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="white"
                className="bi bi-plus me-2"
                viewBox="0 0 16 16"
              >
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
              </svg>
              New Chat
            </button>
          </div>

          <div className="d-flex justify-content-between p-3">
            <Link to="/">
              <button className="btn btn-sm text-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="white"
                  className="bi bi-house"
                  viewBox="0 0 16 16"
                >
                  <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5Z" />
                </svg>
              </button>
            </Link>
            <Link to="/dashboard">
              <button className="btn btn-sm text-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="white"
                  className="bi bi-gear"
                  viewBox="0 0 16 16"
                >
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
              <h1 className="h5 mb-0 fw-bold chat-title" style={{ color: "white" }}>
                {activeChat
                  ? (activeTitle?.length > 25 ? activeTitle.slice(0, 25) + "..." : activeTitle) || "Chat"
                  : "New Chat"}
              </h1>
            </div>
            <div className="form-group mb-0 d-flex align-items-center gap-3">
              {/* Model Selector */}
              <select
                className="form-control"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={{
                  background: "#2E2F2E",
                  border: "none",
                  color: "white",
                }}
              >
                {/* <option value="numax">Numax</option>
                <option value="codellama:13b">Codellama</option> */}
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
                      width: "55px",
                      height: "35px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #ccc",
                      cursor: "pointer",
                    }}
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "/default-avatar.png"
                    }}
                  />
                )}
                <ul className="dropdown-menu dropdown-menu-end" style={{ backgroundColor: "#2E2F2E" }}>
                  <li>
                    <button
                      className="dropdown-item text-white"
                      style={{ backgroundColor: "transparent" }}
                      onClick={handleLogOut}
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div
            className="card h-auto p-0"
            style={{
              border: "none",
              width: "100%",
              background: "#222222",
              borderRadius: "0px",
            }}
          >
            <div
              className="card-body chat-content customer-scrollbar"
              ref={chatContainerRef}
              style={{ height: "591px", overflowY: "auto", width: "100%" }}
            >
              {chatLoader ? (
                <div className="chat-skeleton-container">
                  {[1, 2, 3, 4, 5, 6].map((item, i) => (
                    <div key={i} className={`chat-skeleton ${i % 2 === 0 ? "left" : "right"}`}>
                      <div
                        className="bubble"
                        style={{
                          height: "60px", // Fixed height
                          width: "60%", // Fixed width
                        }}
                      ></div>
                    </div>
                  ))}
                </div>
              ) : !messages[activeChat] || messages[activeChat].length === 0 ? (
                <div className="text-center" style={{ color: "white" }}>
                  <h4>Start a conversation</h4>
                  <p>Type a message below to begin chatting.</p>
                  <div className="container d-flex justify-content-center mt-5">
                    <div
                      className="card p-3 shadow-sm border-0 model-type"
                      style={{
                        width: "50%",
                        background: "#313031",
                        color: "white",
                        borderRadius: "20px",
                      }}
                    >
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
                messages[activeChat].map((msg, index) => (
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
                        color: "white",
                      }}
                    >
                      {msg.isImage ? (
                        <img
                          src={msg.imageUrl || "/placeholder.svg"}
                          alt="Generated content"
                          style={{ maxWidth: "100%", borderRadius: "10px" }}
                        />
                      ) : (
                        <>
                          <ReactMarkdown
                            remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
                            components={{
                              code: ({ inline, className, children }) => {
                                const language = className?.replace("language-", "")
                                return inline ? (
                                  <code className="bg-gray-200 p-1 rounded">{children}</code>
                                ) : (
                                  <div style={{ position: "relative" }}>
                                    <button
                                      onClick={() => handleCopy(String(children))}
                                      style={{
                                        position: "absolute",
                                        top: "10px",
                                        right: "10px",
                                        background: "#333",
                                        color: "white",
                                        border: "none",
                                        padding: "5px 10px",
                                        borderRadius: "5px",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                      }}
                                    >
                                      Copy
                                    </button>
                                    <SyntaxHighlighter language={language} style={dracula}>
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
                            <div className="d-flex justify-content-start mt-2 gap-2">
                              <button className="btn btn-sm btn-outline-light" onClick={() => handleCopy(msg.text)}>
                                <i className="bi bi-clipboard"></i> <Copy />
                              </button>

                              <button
                                className={`btn btn-sm ${feedback[index] === "like" ? "btn-success" : "btn-outline-success"}`}
                                onClick={() => handleLike(index)}
                                disabled={feedback[index] !== undefined}
                              >
                                <i className="bi bi-hand-thumbs-up"></i> <ThumbsUp />
                              </button>

                              <button
                                className={`btn btn-sm ${feedback[index] === "dislike" ? "btn-danger" : "btn-outline-danger"}`}
                                onClick={() => handleDislike(index)}
                                disabled={feedback[index] !== undefined}
                              >
                                <i className="bi bi-hand-thumbs-down"></i> <ThumbsDown />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="timestamp text-white small">{msg.timestamp.toLocaleTimeString()}</div>
                  </div>
                ))
              )}

              {imageLoader && selectedOption === "image" ? (
                <div className="my-4">
                  <p
                    style={{
                      color: "white",
                      marginTop: "10px",
                      padding: "0px 20px",
                    }}
                  >
                    Image is generating...
                  </p>
                </div>
              ) : loadingChats[activeChat] && selectedOption === "text" ? (
                <div className="my-4">
                  <p
                    style={{
                      color: "white",
                      marginTop: "10px",
                      padding: "0px 20px",
                    }}
                  >
                    AI is thinking...
                  </p>
                </div>
              ) : null}

              {error && (
                <div className="alert alert-danger mt-3" role="alert">
                  {error}
                </div>
              )}
            </div>

            <div className="card-footer" style={{ border: "none" }}>
              <form onSubmit={handleSendMessage} className="d-flex align-items-center">
                <div className="input-group">
                  <div
                    className="d-flex align-items-center w-100 px-2 py-1"
                    style={{ background: "#313031", borderRadius: "10px" }}
                  >
                    <div className="d-flex me-auto" style={{ width: "100%" }}>
                      <textarea
                        ref={inputRef}
                        rows={2}
                        className="form-control border-0 bg-transparent shadow-none input-textarea"
                        placeholder="Ask anything"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        style={{
                          fontSize: "16px",
                          color: "white",
                          resize: "none",
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
                        type="button"
                        className="btn btn-sm rounded-circle ms-1"
                        style={{
                          width: "42px",
                          height: "42px",
                          backgroundColor: "#171717",
                          color: "white",
                        }}
                      >
                        <i className="bi bi-mic-fill text-white"></i>
                      </button>
                    </div>

                    {/* Mobile View - Dropdown Toggle */}
                    <div className="d-flex d-md-none align-items-center position-relative">
                      <button
                        className="btn btn-dark d-flex align-items-center justify-content-center"
                        onClick={handleSendMessage}
                        style={{ fontSize: "16px", background: "#171717" }}
                      >
                        <i className="bi bi-send-fill me-2"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm rounded-circle"
                        style={{
                          width: "42px",
                          height: "42px",
                          backgroundColor: "#171717",
                          color: "white",
                        }}
                        onClick={() => setShowMobileOptions(!showMobileOptions)}
                      >
                        <i className="bi bi-three-dots-vertical"></i>
                      </button>
                      {/* Dropdown menu */}
                      {showMobileOptions && (
                        <div
                          className="position-absolute end-0 mt-2 p-2 rounded shadow"
                          style={{ backgroundColor: "#171717", zIndex: 1000 }}
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
                            <option value="image">Image</option>
                          </select>
                          <button
                            type="button"
                            className="btn btn-sm text-white w-100"
                            style={{ backgroundColor: "#2a2a2a" }}
                          >
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
  )
}

export default ClaudeChatUI
