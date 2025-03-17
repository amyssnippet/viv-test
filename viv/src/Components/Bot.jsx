import React, { useState, useRef, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import CustomMarkdown from './Markdown';

const OLLAMA_API_URL = 'https://api.cosinv.com/api/chat'; // Default Ollama API endpoint
const DEFAULT_MODEL = 'xIn-v2'; // Default model to use

// Memory management settings
const MAX_HISTORY_LENGTH = 20; // Maximum number of messages to keep in context
const MEMORY_PRUNING_THRESHOLD = 15; // Number of messages before pruning older ones


const ClaudeChatUI = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [error, setError] = useState(null);
  const [responseMode, setResponseMode] = useState('Balanced');
  const [activeChat, setActiveChat] = useState([]);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle mode change
  // const handleModeChange = (mode) => {
  //   setResponseMode(mode);
  // };

  // Prepare messages for Ollama API format
  const prepareMessagesForOllama = (messageHistory) => {
    return messageHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
  };

  // Memory management function
  const manageMemory = (currentMessages) => {
    // If we have more messages than our pruning threshold, summarize older messages
    if (currentMessages.length > MEMORY_PRUNING_THRESHOLD) {
      // Keep the most recent messages up to MAX_HISTORY_LENGTH
      return currentMessages.slice(-MAX_HISTORY_LENGTH);
    }
    return currentMessages;
  };

  // Handle sending message
  // const handleSendMessage = async (e) => {
  //   e.preventDefault();

  //   if (!inputMessage.trim()) return;

  //   // Add user message to chat
  //   const userMessage = { sender: 'user', text: inputMessage, timestamp: new Date() };
  //   const updatedMessages = [...messages, userMessage];
  //   setMessages(updatedMessages);
  //   setInputMessage('');
  //   setIsLoading(true);
  //   setError(null);

  //   try {
  //     // Prepare messages for Ollama
  //     const memoryManagedMessages = manageMemory(updatedMessages);
  //     const ollamaMessages = prepareMessagesForOllama(memoryManagedMessages);

  //     // Add system message for response mode
  //     let systemMessage = "";
  //     if (responseMode === 'Precise') {
  //       systemMessage = "Provide deterministic and focused responses, best for factual or technical questions.";
  //     } else if (responseMode === 'Creative') {
  //       systemMessage = "Provide varied and creative responses, best for brainstorming and exploration.";
  //     } else {
  //       systemMessage = "Provide a balanced mix of precise and creative responses.";
  //     }

  //     // Add system message if needed
  //     const requestMessages = [
  //       { role: 'system', content: systemMessage },
  //       ...ollamaMessages
  //     ];

  //     // Make API request to Ollama
  //     const response = await axios.post(OLLAMA_API_URL, {
  //       model,
  //       messages: requestMessages,
  //       stream: true
  //     });

  //     console.log(response);
  //     // Add AI response to chat
  //     const aiMessage = {
  //       sender: 'assistant',
  //       text: response.data.message.content,
  //       timestamp: new Date()
  //     };

  //     setMessages([...memoryManagedMessages, aiMessage]);
  //   } catch (err) {
  //     console.error('Error calling Ollama API:', err);
  //     setError('Failed to get response from Ollama. Please check if the service is running.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;

    const userMessage = { sender: "user", text: inputMessage, timestamp: new Date() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:4000/api/v1/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemma3:12b", // You can make this dynamic
          messages: updatedMessages.map(msg => ({ role: msg.sender, content: msg.text })),
        }),
      });

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
    } catch (err) {
      console.error("Error calling backend:", err);
      setError("Failed to get response from server.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // Cmd+Enter or Ctrl+Enter to send message
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSendMessage(e);
    }
  };

  const chatList = [
    { id: 1, name: 'New Chat', active: true },
    { id: 2, name: 'example', active: false },
    { id: 3, name: 'hasAccessToAdminBindle...', active: false },
    { id: 4, name: 'give me sable prod end po...', active: false },
    { id: 5, name: 'Possible null pointer der...', active: false },
    { id: 6, name: 'New Chat', active: false },
    { id: 7, name: '...', active: false },
    { id: 8, name: 'fun checkPermissionsF...', active: false },
  ];

  const olderChatList = [
    { id: 9, name: '1. moving update and get ...', active: false },
    { id: 10, name: '//ccs service bindle ...', active: false },
    { id: 11, name: 'ArrayList own...', active: false },
  ];

  const handleChatClick = (chatName) => {
    setActiveChat(chatName);
  };

  const handleModeChange = (mode) => {
    setResponseMode(mode);
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };

  // const handleSendMessage = () => {
  //   // Logic to send message
  //   console.log('Sending message:', inputMessage);
  //   setInputMessage('');
  // };

  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-3 sidebar" style={{ backgroundColor: 'white', borderRight: '1px solid #dee2e6', height: '100vh' }}>
          <div className="p-3 d-flex border-bottom">
            <div className="bg-dark p-2 rounded me-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" className="bi bi-chat-square-text" viewBox="0 0 16 16">
                <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2.5a2 2 0 0 0-1.6.8L8 14.333 6.1 11.8a2 2 0 0 0-1.6-.8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2.5a1 1 0 0 1 .8.4l1.9 2.533a1 1 0 0 0 1.6 0l1.9-2.533a1 1 0 0 1 .8-.4H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                <path d="M3 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 6a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 6zm0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
              </svg>
            </div>
            <div>
              <div className="fw-bold">Chat Threads</div>
              <div className="text-muted small">13 conversations</div>
            </div>
          </div>

          <div className="sidebar-section-header" style={{ padding: '10px 15px', color: '#6c757d', fontSize: '14px', fontWeight: 600 }}>Last 7 Days</div>

          {chatList.map((chat) => (
            <div
              key={chat.id}
              className={`chat-list-item ${activeChat === chat.name ? 'active' : ''}`}
              style={{
                cursor: 'pointer',
                padding: '10px 15px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: activeChat === chat.name ? '#f1f1f1' : 'transparent'
              }}
              onClick={() => handleChatClick(chat.name)}
            >
              <span className="text-truncate">{chat.name}</span>
              <button className="btn btn-sm text-muted p-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-three-dots-vertical" viewBox="0 0 16 16">
                  <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                </svg>
              </button>
            </div>
          ))}

          <div className="sidebar-section-header" style={{ padding: '10px 15px', color: '#6c757d', fontSize: '14px', fontWeight: 600 }}>Last 30 Days</div>

          {olderChatList.map((chat) => (
            <div
              key={chat.id}
              className={`chat-list-item ${activeChat === chat.name ? 'active' : ''}`}
              style={{
                cursor: 'pointer',
                padding: '10px 15px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: activeChat === chat.name ? '#f1f1f1' : 'transparent'
              }}
              onClick={() => handleChatClick(chat.name)}
            >
              <span className="text-truncate">{chat.name}</span>
              <button className="btn btn-sm text-muted p-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-three-dots-vertical" viewBox="0 0 16 16">
                  <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                </svg>
              </button>
            </div>
          ))}

          <div className="sidebar-footer mt-auto" style={{ borderTop: '1px solid #dee2e6', padding: '15px', display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-light border w-100 d-flex align-items-center justify-content-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus me-2" viewBox="0 0 16 16">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
              </svg>
              New Chat
            </button>
          </div>

          <div className="d-flex justify-content-between p-3 border-top">
            <button className="btn btn-sm text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-house" viewBox="0 0 16 16">
                <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5ZM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5 5 5Z" />
              </svg>
            </button>
            <button className="btn btn-sm text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-brightness-high" viewBox="0 0 16 16">
                <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z" />
              </svg>
            </button>
            <button className="btn btn-sm text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-gear" viewBox="0 0 16 16">
                <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
                <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Chat Content */}
        <div className="col-9" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          {/* Header */}
          <div className="chat-header d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid #dee2e6', padding: '15px', backgroundColor: 'white' }}>
            <div className="d-flex align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-file-earmark me-2" viewBox="0 0 16 16">
                <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
              </svg>
              <h1 className="h5 mb-0 fw-bold">{activeChat}</h1>
            </div>

            <div className="dropdown">
              <button className="btn btn-light border d-flex align-items-center" type="button" id="modeDropdown">
                <span className="me-2">Main</span>
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {/* <div className="chat-content" style={{ flex: 1, overflowY: 'auto', backgroundColor: 'white', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2 className="mb-3 fw-bold">Hi there!</h2>
            <p className="text-center text-muted mb-2">Start a conversation by typing a message below.</p>
            <p className="text-center text-muted mb-2">
              Press <span style={{ backgroundColor: '#f1f1f1', padding: '2px 5px', borderRadius: '3px', fontSize: '12px' }}>⌘+Enter</span> or <span style={{ backgroundColor: '#f1f1f1', padding: '2px 5px', borderRadius: '3px', fontSize: '12px' }}>Ctrl+Enter</span> to send your message.
            </p>
            <p className="text-center text-muted mb-2">
              You can also attach files to enhance your discussion. Press <span style={{ backgroundColor: '#f1f1f1', padding: '2px 5px', borderRadius: '3px', fontSize: '12px' }}>⌘/</span> or <span style={{ backgroundColor: '#f1f1f1', padding: '2px 5px', borderRadius: '3px', fontSize: '12px' }}>Ctrl+/</span> to view all shortcuts.
            </p>
            <div className="response-mode mt-5" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <p className="text-center text-muted mb-3">Choose how you want the AI to respond</p>
              <div className="btn-group w-100" role="group">
                <button 
                  type="button" 
                  className={`btn ${responseMode === 'Precise' ? 'btn-dark' : 'btn-outline-secondary'}`}
                  onClick={() => handleModeChange('Precise')}
                >
                  Precise
                </button>
                <button 
                  type="button" 
                  className={`btn ${responseMode === 'Balanced' ? 'btn-dark' : 'btn-outline-secondary'}`}
                  onClick={() => handleModeChange('Balanced')}
                >
                  Balanced
                </button>
                <button 
                  type="button" 
                  className={`btn ${responseMode === 'Creative' ? 'btn-dark' : 'btn-outline-secondary'}`}
                  onClick={() => handleModeChange('Creative')}
                >
                  Creative
                </button>
              </div>
              <p style={{ color: '#6c757d', textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
                {responseMode === 'Precise' && 'More deterministic and focused responses, best for factual or technical questions'}
                {responseMode === 'Balanced' && 'A balanced mix of precise and creative responses'}
                {responseMode === 'Creative' && 'More varied and creative responses, best for brainstorming and exploration'}
              </p>
            </div>
          </div> */}

          <div className="container mt-5">
            <div className="card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h3>VIV Chat</h3>
                  <div className="form-group mb-0">
                    <select
                      className="form-control"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                    >
                      <option value="llama2">Llama 2</option>
                      <option value="mistral">xIn-v2</option>
                      <option value="gemma3:12b">Gemma 3</option>
                      <option value="xIn">xIn</option>
                      {/* Add more models as needed */}
                    </select>
                  </div>
                </div>
              </div>

              <div
                className="card-body chat-content"
                ref={chatContainerRef}
                style={{ height: '400px', overflowY: 'auto' }}
              >
                {messages.length === 0 ? (
                  <div className="text-center text-muted">
                    <h4>Start a conversation</h4>
                    <p>Type a message below to begin chatting with Ollama.</p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`message ${msg.sender === 'user' ? 'user-message' : 'ai-message'}`}
                      style={{
                        textAlign: msg.sender === 'user' ? 'right' : 'left',
                        marginBottom: '15px',
                      }}
                    >
                      <div
                        style={{
                          display: 'inline-block',
                          padding: '10px 15px',
                          borderRadius: '15px',
                          maxWidth: '70%',
                          backgroundColor: msg.sender === 'user' ? '#007bff' : '#f1f1f1',
                          color: msg.sender === 'user' ? 'white' : 'black',
                        }}
                      >
                        <CustomMarkdown text={String(msg.text || "").trim()} />


                      </div>
                      <div className="timestamp text-muted small">
                        {msg.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}

                {/* {isLoading && (
                  <div className="text-center mt-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )} */}

                {error && (
                  <div className="alert alert-danger mt-3" role="alert">
                    {error}
                  </div>
                )}
              </div>

              <div className="card-footer">
                <form onSubmit={handleSendMessage}>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Type your message..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                    />
                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={isLoading}
                    >
                      Send
                    </button>
                  </div>
                </form>

                <div className="response-mode mt-3">
                  <p className="text-muted mb-2 small">Response Mode:</p>
                  <div className="btn-group" role="group" style={{ width: '100%' }}>
                    <button
                      type="button"
                      className={`btn ${responseMode === 'Precise' ? 'btn-dark' : 'btn-outline-secondary'} btn-sm`}
                      onClick={() => handleModeChange('Precise')}
                    >
                      Precise
                    </button>
                    <button
                      type="button"
                      className={`btn ${responseMode === 'Balanced' ? 'btn-dark' : 'btn-outline-secondary'} btn-sm`}
                      onClick={() => handleModeChange('Balanced')}
                    >
                      Balanced
                    </button>
                    <button
                      type="button"
                      className={`btn ${responseMode === 'Creative' ? 'btn-dark' : 'btn-outline-secondary'} btn-sm`}
                      onClick={() => handleModeChange('Creative')}
                    >
                      Creative
                    </button>
                  </div>
                  <p className="text-muted mt-2 small">
                    {responseMode === 'Precise' && 'More deterministic and focused responses'}
                    {responseMode === 'Balanced' && 'A balanced mix of precise and creative responses'}
                    {responseMode === 'Creative' && 'More varied and creative responses'}
                  </p>
                </div>

                <div className="text-muted text-center mt-2 small">
                  <p>
                    Press <span className="badge bg-light text-dark">⌘+Enter</span> or <span className="badge bg-light text-dark">Ctrl+Enter</span> to send
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          {/* <div className="input-area" style={{ borderTop: '1px solid #dee2e6', padding: '15px', backgroundColor: 'white' }}>
            <div className="d-flex align-items-center">
              <button className="btn btn-light text-muted me-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-paperclip" viewBox="0 0 16 16">
                  <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z" />
                </svg>
              </button>

              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                />
                <button className="btn btn-dark" type="button" onClick={handleSendMessage}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-send" viewBox="0 0 16 16">
                    <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z" />
                  </svg>
                </button>
              </div>

              <button className="btn btn-light text-muted ms-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-arrows-fullscreen" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707zm4.344 0a.5.5 0 0 1 .707 0l4.096 4.096V11.5a.5.5 0 1 1 1 0v3.975a.5.5 0 0 1-.5.5H11.5a.5.5 0 0 1 0-1h2.768l-4.096-4.096a.5.5 0 0 1 0-.707zm0-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707zm-4.344 0a.5.5 0 0 1-.707 0L1.025 1.732V4.5a.5.5 0 0 1-1 0V.525a.5.5 0 0 1 .5-.5H4.5a.5.5 0 0 1 0 1H1.732l4.096 4.096a.5.5 0 0 1 0 .707z" />
                </svg>
              </button>
            </div>

            <div className="model-selector mt-2 text-end" style={{ color: '#6c757d', fontSize: '14px' }}>
              <small>xIn · Default</small>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ClaudeChatUI;