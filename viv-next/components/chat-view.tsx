"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Cookies from "js-cookie"
import toast from "react-hot-toast"
import { jwtDecode } from "jwt-decode"
import axios from "axios"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  LayoutDashboard,
  Menu,
  Loader2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const BACKENDURL = "https://cp.cosinv.com/api/v1"

interface Message {
  sender: "user" | "assistant"
  text: string
  timestamp: Date
  isImage?: boolean
  imageUrl?: string
  isThinking?: boolean
}

interface Chat {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

interface User {
  name: string
  email: string
  profile: string
}

interface ChatViewProps {
  chatId: string
}

export default function ChatView({ chatId }: ChatViewProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [model, setModel] = useState("numax")
  const [error, setError] = useState<string | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const userToken = Cookies.get("authToken")
  const [userData, setUserData] = useState<any>(null)
  const [streamingChat, setStreamingChat] = useState(false)
  const [streamController, setStreamController] = useState<AbortController | null>(null)
  const [partialResponse, setPartialResponse] = useState("")
  const [selectedOption, setSelectedOption] = useState("text")
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [loadingChat, setLoadingChat] = useState(false)
  const [chatLoader, setChatLoader] = useState(false)
  const [imageLoader, setImageLoader] = useState(false)
  const [chatTitle, setChatTitle] = useState("")
  const [feedback, setFeedback] = useState<Record<number, "like" | "dislike">>({})
  const [user, setUser] = useState<User | null>(null)
  const [chatlist, setChatlist] = useState<Chat[]>([])
  const [loadingChats, setLoadingChats] = useState(true)

  const modelOptions = [
    { value: "numax", label: "Numax" },
    { value: "mcp", label: "Jarvis" },
  ]

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
      router.push("/auth")
    }
  }, [userToken, router])

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

      const formattedMessages = data.messages.map((msg: any) => ({
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        isImage: msg.isImage || false,
        imageUrl: msg.imageUrl || null,
      }))

      setMessages(formattedMessages)
    } catch (error) {
      console.error("❌ Fetch Error:", error)
      setError(`Failed to load messages: ${error instanceof Error ? error.message : "Unknown error"}`)
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
      const sortedChats = chatsArray.sort((a: Chat, b: Chat) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      setChatlist(sortedChats)
    } catch (error) {
      console.error("Error fetching chats:", error)
      setError(`Failed to load chats: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoadingChats(false)
    }
  }

  const handleLike = (index: number) => {
    toast.success("Thanks for your feedback!")
    setFeedback((prev) => ({ ...prev, [index]: "like" }))
  }

  const handleDislike = (index: number) => {
    toast.success("Thanks for your feedback!")
    setFeedback((prev) => ({ ...prev, [index]: "dislike" }))
  }

  const handleCopy = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Copied to clipboard!")
      })
      .catch(() => {
        toast.error("Failed to copy text")
      })
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
    router.push("/auth")
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

      router.push(`/chat/${data.chat.id}`)
      setSidebarOpen(false)
    } catch (error) {
      console.error("Error creating new chat:", error)
      setError(`Failed to create a new chat: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingChat(true)

    if (streamController) {
      streamController.abort()
    }

    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      sender: "user",
      text: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)
    setError(null)
    setPartialResponse("")

    try {
      const controller = new AbortController()
      setStreamController(controller)
      setStreamingChat(true)

      const thinkingMessage: Message = {
        sender: "assistant",
        text: "Thinking...",
        timestamp: new Date(),
        isThinking: true,
      }

      setMessages((prev) => [...prev, thinkingMessage])

      let endpoint = `${BACKENDURL}/chat/stream`
      let requestBody: any = {}

      if (model === "mcp") {
        endpoint = "https://jarvis.cosinv.com/mcp"
        requestBody = {
          question: inputMessage,
        }
      } else {
        requestBody = {
          model: model,
          messages: [...messages, userMessage].map((msg) => ({
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
              try {
                parsedResponse = JSON.parse(line)
                responseText = parsedResponse.answer
              } catch (e) {
                responseText = line
              }
            } else {
              parsedResponse = JSON.parse(line.replace("data: ", "").trim())
              responseText = parsedResponse.text
            }

            if (responseText) {
              accumulatedText = responseText
              setPartialResponse(accumulatedText)

              setMessages((prev) => {
                const updatedMessages = [...prev]
                const lastMsg = updatedMessages[updatedMessages.length - 1]

                if (lastMsg && lastMsg.isThinking) {
                  lastMsg.text = accumulatedText
                  lastMsg.isThinking = false
                }

                return updatedMessages
              })
            }
          } catch (error) {
            console.warn("Error parsing response chunk:", error, line)
          }
        })
      }

      if (messages.length === 0 && !chatTitle) {
        fetchChatDetails()
      }

      fetchChats()
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Response streaming was aborted by user")
      } else {
        console.error("Error calling backend:", err)
        setError(`Failed to get response: ${err.message}`)
      }

      setMessages((prev) => prev.filter((msg) => !msg.isThinking))
    } finally {
      setIsLoading(false)
      setStreamingChat(false)
      setStreamController(null)
      setLoadingChat(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#222222]">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-96 bg-[#171717] border-r border-[#333] flex-col">
        {/* Sidebar content similar to ChatList but condensed */}
        <div className="p-4 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="bg-[#333] p-2 rounded-lg">
              <MessageSquare size={20} className="text-white" />
            </div>
            <div>
              <div className="text-white font-semibold">Chat History</div>
              <div className="text-gray-400 text-sm">{chatlist.length} conversations</div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <Button onClick={handleNewChat} className="w-full bg-[#222222] hover:bg-[#333333] text-white border-none">
            <Plus size={16} className="mr-2" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1 px-4">
          {loadingChats ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          ) : (
            <div className="space-y-2">
              {chatlist.map((chat) => (
                <Link key={chat.id} href={`/chat/${chat.id}`}>
                  <div
                    className={`group flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                      chat.id === chatId ? "bg-[#2a2a2a] border border-[#444]" : "bg-[#212020] hover:bg-[#2a2a2a]"
                    }`}
                  >
                    <span className="text-white truncate flex-1">
                      {chat.title || `Chat from ${new Date(chat.createdAt).toLocaleDateString()}`}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#333]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-white hover:bg-[#333]">
                  <LayoutDashboard size={20} />
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0">
                    {user?.profile ? (
                      <img
                        src={user.profile || "/placeholder.svg"}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover border-2 border-[#444]"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#444] flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#2E2F2E] border-[#444] min-w-[250px]">
                  <div className="px-3 py-2 text-white font-semibold">{user?.email}</div>
                  <DropdownMenuSeparator className="bg-[#444]" />
                  <DropdownMenuItem className="text-white hover:bg-[#333]">
                    <Settings size={16} className="mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#444]" />
                  <DropdownMenuItem onClick={handleLogOut} className="text-white hover:bg-[#333]">
                    <LogOut size={16} className="mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden fixed top-4 left-4 z-50 bg-[#171717] text-white hover:bg-[#333]"
          >
            <Menu size={20} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 bg-[#171717] border-[#333] p-0">
          {/* Mobile sidebar content */}
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 bg-[#222222] border-b border-[#333]">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link href="/" className="text-white hover:text-gray-300">
              <ChevronLeft size={20} />
            </Link>

            <div className="flex items-center gap-2 cursor-pointer flex-1 min-w-0" onClick={handleEditTitle}>
              <MessageSquare size={18} className="text-white flex-shrink-0" />
              <h1 className="text-white font-semibold truncate">{chatTitle || "Chat"}</h1>
              <Edit size={14} className="text-white flex-shrink-0" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-32 bg-[#2E2F2E] border-none text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2E2F2E] border-[#444]">
                {modelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-white">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4" ref={chatContainerRef}>
          {chatLoader ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((item, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                  <div className="w-3/4 h-16 bg-[#2a2a2a] rounded-lg animate-pulse-custom"></div>
                </div>
              ))}
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-white text-xl font-semibold mb-2">
                  Hello {user?.name || userData?.name || "there"}!
                </h2>
                <p className="text-gray-400">Type a message below to begin chatting.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-4 ${
                      msg.sender === "user" ? "bg-[#2E2F2E] text-white" : "bg-[#3a3a3a] text-white"
                    }`}
                  >
                    {msg.isImage ? (
                      <div className="image-container">
                        <img
                          src={msg.imageUrl || "/placeholder.svg"}
                          alt="Generated content"
                          className="max-w-full rounded-lg border border-white/10"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <>
                        <ReactMarkdown
                          remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
                          components={{
                            code: ({ className, children, ...props }) => {
                              const language = className?.replace("language-", "")
                              return (
                                <div className="relative mt-2 mb-2">
                                  <div className="absolute top-0 right-0 bg-[#222] rounded-tr-md rounded-bl-md px-2 py-1 text-xs text-gray-400">
                                    {language || "code"}
                                  </div>
                                  <Button
                                    onClick={() => handleCopy(String(children))}
                                    className="absolute top-2 right-2 h-6 w-6 p-0 bg-black/20 hover:bg-black/40"
                                    variant="ghost"
                                  >
                                    <Copy size={12} />
                                  </Button>
                                  {/* <SyntaxHighlighter
                                    language={language}
                                    style={dracula}
                                    customStyle={{
                                      borderRadius: "6px",
                                      marginTop: "0",
                                      fontSize: "14px",
                                    }}
                                  > */}
                                    {children}
                                  {/* </SyntaxHighlighter> */}
                                </div>
                              )
                            },
                          }}
                        >
                          {msg.isThinking ? "Thinking..." : String(msg.text || "").trim()}
                        </ReactMarkdown>

                        {/* Action buttons: only show for AI messages */}
                        {msg.sender !== "user" && !msg.isThinking && (
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              onClick={() => handleCopy(msg.text)}
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs hover:bg-white/10"
                            >
                              <Copy size={12} />
                            </Button>

                            <Button
                              onClick={() => handleLike(index)}
                              disabled={feedback[index] !== undefined}
                              variant="ghost"
                              size="sm"
                              className={`h-6 px-2 text-xs hover:bg-white/10 ${
                                feedback[index] === "like" ? "text-green-400" : ""
                              }`}
                            >
                              <ThumbsUp size={12} />
                            </Button>

                            <Button
                              onClick={() => handleDislike(index)}
                              disabled={feedback[index] !== undefined}
                              variant="ghost"
                              size="sm"
                              className={`h-6 px-2 text-xs hover:bg-white/10 ${
                                feedback[index] === "dislike" ? "text-red-400" : ""
                              }`}
                            >
                              <ThumbsDown size={12} />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicators */}
              {(imageLoader && selectedOption === "image") || (loadingChat && selectedOption === "text") ? (
                <div className="flex items-center gap-3 py-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce-custom"></div>
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-bounce-custom"
                      style={{ animationDelay: "-0.16s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-white rounded-full animate-bounce-custom"
                      style={{ animationDelay: "-0.32s" }}
                    ></div>
                  </div>
                  <p className="text-white">{imageLoader ? "Generating image..." : "AI is thinking..."}</p>
                </div>
              ) : null}

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-lg">{error}</div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Chat Input */}
        <div className="p-4 border-t border-[#333] bg-[#222222]">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <div className="flex-1 bg-[#313031] border border-[#444] rounded-lg p-2">
              <Textarea
                ref={inputRef}
                placeholder="Ask anything..."
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value)
                  // Auto-resize textarea
                  e.target.style.height = "auto"
                  e.target.style.height = Math.min(120, e.target.scrollHeight) + "px"
                }}
                className="min-h-[20px] max-h-[120px] bg-transparent border-none text-white placeholder:text-gray-400 resize-none focus-visible:ring-0"
                rows={1}
              />

              <div className="flex items-center justify-between mt-2">
                <Select value={selectedOption} onValueChange={setSelectedOption}>
                  <SelectTrigger className="w-32 h-8 bg-[#171717] border-none text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#171717] border-[#444]">
                    <SelectItem value="text" className="text-white">
                      Text
                    </SelectItem>
                    <SelectItem value="image" className="text-white">
                      Generate Image
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="h-8 w-8 p-0 bg-[#171717] hover:bg-[#333333] text-white"
                >
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
