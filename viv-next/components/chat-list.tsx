"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Cookies from "js-cookie"
import toast from "react-hot-toast"
import { jwtDecode } from "jwt-decode"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus,
  MessageSquare,
  Settings,
  LogOut,
  Edit,
  MoreVertical,
  X,
  ExternalLink,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const BACKENDURL = "https://cp.cosinv.com/api/v1"

interface Message {
  sender: "user" | "assistant"
  text: string
  timestamp: Date
  isImage?: boolean
  imageUrl?: string
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

export default function ChatList() {
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
  const [imageLoader, setImageLoader] = useState(false)
  const [feedback, setFeedback] = useState<Record<number, "like" | "dislike">>({})
  const [user, setUser] = useState<User | null>(null)
  const [chatlist, setChatlist] = useState<Chat[]>([])
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
      router.push("/auth")
    }
  }, [userToken, router])

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

  const handleChatDelete = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (confirm("Are you sure you want to delete this chat?")) {
      try {
        await axios.post(`${BACKENDURL}/chat/delete`, {
          userId: userData.userId,
          chatId,
        })
        fetchChats()
        toast.success("Chat deleted successfully!")
      } catch (error) {
        console.error("Error deleting chat:", error)
        setError(`Failed to delete chat: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }
  }

  const editChat = async (chatId: string, e: React.MouseEvent) => {
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
    } catch (error) {
      console.error(error)
      toast.error("Error updating chat title.")
    }
  }

  return (
    <div className="flex h-screen bg-[#222222]">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-96 bg-[#171717] border-r border-[#333] flex-col">
        {/* Sidebar Header */}
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

        {/* New Chat Button */}
        <div className="p-4">
          <Button onClick={handleNewChat} className="w-full bg-[#222222] hover:bg-[#333333] text-white border-none">
            <Plus size={16} className="mr-2" />
            New Chat
          </Button>
        </div>

        {/* Chat List */}
        <div className="px-4 py-2">
          <div className="text-gray-400 text-sm font-medium mb-2">Your Chats</div>
        </div>

        <ScrollArea className="flex-1 px-4">
          {loadingChats ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          ) : chatlist.length === 0 ? (
            <div className="text-center p-4 text-gray-400">No chats yet. Create a new chat to get started.</div>
          ) : (
            <div className="space-y-2">
              {chatlist.map((chat) => (
                <Link key={chat.id} href={`/chat/${chat.id}`}>
                  <div className="group flex items-center justify-between p-3 rounded-lg bg-[#212020] hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                    <span className="text-white truncate flex-1">
                      {chat.title || `Chat from ${new Date(chat.createdAt).toLocaleDateString()}`}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 text-white hover:bg-[#333]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#222] border-[#444]">
                        <DropdownMenuItem onClick={(e) => editChat(chat.id, e)} className="text-white hover:bg-[#333]">
                          <Edit size={14} className="mr-2" />
                          Edit Chat
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleChatDelete(chat.id, e)}
                          className="text-red-400 hover:bg-[#333]"
                        >
                          <X size={14} className="mr-2" />
                          Delete Chat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                  <DropdownMenuItem asChild className="text-white hover:bg-[#333]">
                    <a href="https://cosinv.com/help-faq" target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={16} className="mr-2" />
                      Help & FAQ
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-white hover:bg-[#333]">
                    <a href="https://cosinv.com/release-notes" target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={16} className="mr-2" />
                      Release notes
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-white hover:bg-[#333]">
                    <a href="https://cosinv.com/terms" target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={16} className="mr-2" />
                      Terms & policies
                    </a>
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
          <SheetHeader className="p-4 border-b border-[#333]">
            <SheetTitle className="text-white text-left">Chat History</SheetTitle>
          </SheetHeader>
          {/* Mobile sidebar content would go here - similar to desktop but adapted */}
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Chat Placeholder */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <MessageSquare size={48} className="text-gray-400 mx-auto mb-4" />
            <h2 className="text-white text-xl font-semibold mb-2">Hello {user?.name || userData?.name || "there"}!</h2>
            <p className="text-gray-400 mb-6">Select a chat or start a new conversation to begin chatting.</p>
            <Button onClick={handleNewChat} className="bg-[#313031] hover:bg-[#444] text-white">
              <Plus size={18} className="mr-2" />
              New Chat
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
