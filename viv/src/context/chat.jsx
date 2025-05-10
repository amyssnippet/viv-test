"use client"

import { createContext, useContext, useState, useRef } from "react"

// Create the context
const ChatContext = createContext(null)

// Custom hook to use the chat context
export const useChatContext = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider")
  }
  return context
}

export const ChatProvider = ({ children }) => {
  // Shared state for streaming
  const [activeStreamingChatId, setActiveStreamingChatId] = useState(null)
  const [streamingChat, setStreamingChat] = useState(false)
  const [partialResponse, setPartialResponse] = useState("")
  const streamControllerRef = useRef(null)

  // Store messages for all chats
  const [allChatMessages, setAllChatMessages] = useState({})

  // Function to update messages for a specific chat
  const updateChatMessages = (chatId, messages) => {
    setAllChatMessages((prev) => ({
      ...prev,
      [chatId]: messages,
    }))
  }

  // Function to get messages for a specific chat
  const getChatMessages = (chatId) => {
    return allChatMessages[chatId] || []
  }

  // Function to start streaming for a chat
  const startStreaming = (chatId, controller) => {
    setActiveStreamingChatId(chatId)
    setStreamingChat(true)
    streamControllerRef.current = controller
    setPartialResponse("") // Reset partial response when starting new stream

    // Make sure we have an entry for this chat
    setAllChatMessages((prev) => {
      if (!prev[chatId]) {
        return {
          ...prev,
          [chatId]: [],
        }
      }
      return prev
    })
  }

  // Function to stop streaming
  const stopStreaming = () => {
    if (streamControllerRef.current && streamingChat) {
      streamControllerRef.current.abort()
      setStreamingChat(false)
      setActiveStreamingChatId(null)
      streamControllerRef.current = null
    }
  }

  // Function to update partial response
  const updatePartialResponse = (text) => {
    setPartialResponse(text)

    // Update the message in the active chat
    if (activeStreamingChatId) {
      setAllChatMessages((prev) => {
        const chatMessages = [...(prev[activeStreamingChatId] || [])]
        const lastMessageIndex = chatMessages.length - 1

        // Check if the last message is from the assistant
        if (lastMessageIndex >= 0 && chatMessages[lastMessageIndex].sender === "assistant") {
          // Update existing message
          chatMessages[lastMessageIndex] = {
            ...chatMessages[lastMessageIndex],
            text: text,
            timestamp: new Date(),
          }
        } else {
          // Add new assistant message
          chatMessages.push({
            sender: "assistant",
            text: text,
            timestamp: new Date(),
          })
        }

        return {
          ...prev,
          [activeStreamingChatId]: chatMessages,
        }
      })
    }
  }

  // Check if a specific chat is currently streaming
  const isStreamingChat = (chatId) => {
    return streamingChat && activeStreamingChatId === chatId
  }

  // Debug function to log state
  const debugState = () => {
    console.log("Active streaming chat:", activeStreamingChatId)
    console.log("All chat messages:", allChatMessages)
    console.log("Streaming chat status:", streamingChat)
    console.log("Partial response:", partialResponse)
  }

  return (
    <ChatContext.Provider
      value={{
        streamingChat,
        partialResponse,
        activeStreamingChatId,
        startStreaming,
        stopStreaming,
        updatePartialResponse,
        isStreamingChat,
        updateChatMessages,
        getChatMessages,
        allChatMessages,
        debugState, // Add this
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}
