import React, { useState } from 'react';
import './Ollama.css';

function Ollama() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [model, setModel] = useState('xIn');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [streamingResponse, setStreamingResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversation, setConversation] = useState([]);

  // Available models - update this list based on your Ollama models
  const availableModels = [
    'xIn',
    'xIn-v2',
  ];

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleModelChange = (e) => {
    setModel(e.target.value);
  };

  const addMessageToConversation = (role, content) => {
    const newMessage = { role, content };
    setConversation(prev => [...prev, newMessage]);
    return newMessage;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResponse('');

    // Add user message to conversation
    const userMessage = addMessageToConversation('user', prompt);
    
    try {
      const response = await fetch('https://api.cosinv.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [...conversation, userMessage],
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setResponse(data.message.content);
      
      // Add assistant response to conversation
      addMessageToConversation('assistant', data.message.content);
      
      // Clear the input field
      setPrompt('');
    } catch (error) {
      setError(`Error: ${error.message}. Make sure Ollama is running on 51.21.245.211:11434`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStreamingSubmit = async (e) => {
    e.preventDefault();
    setIsStreaming(true);
    setStreamingResponse('');
    setError('');

    // Add user message to conversation
    const userMessage = addMessageToConversation('user', prompt);
    let fullResponse = '';

    try {
      const response = await fetch('https://api.cosinv.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [...conversation, userMessage],
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          try {
            const parsedLine = JSON.parse(line);
            if (parsedLine.message?.content) {
              fullResponse += parsedLine.message.content;
              setStreamingResponse(fullResponse);
            }
          } catch (e) {
            console.error('Error parsing JSON:', e);
          }
        }
      }
      
      // Add assistant response to conversation
      addMessageToConversation('assistant', fullResponse);
      
      // Clear the input field
      setPrompt('');
    } catch (error) {
      setError(`Error: ${error.message}. Make sure Ollama is running on 51.21.245.211:11434`);
    } finally {
      setIsStreaming(false);
    }
  };

  const clearConversation = () => {
    setConversation([]);
    setResponse('');
    setStreamingResponse('');
    setError('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Ollama AI Chat</h1>
      </header>
      <main>
        <div className="model-selector">
          <label htmlFor="model-select">Select Model:</label>
          <select
            id="model-select"
            value={model}
            onChange={handleModelChange}
          >
            {availableModels.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button 
            type="button" 
            onClick={clearConversation} 
            className="clear-button"
          >
            Clear Conversation
          </button>
        </div>

        {conversation.length > 0 && (
          <div className="conversation-container">
            <h3>Conversation History:</h3>
            {conversation.map((message, index) => (
              <div 
                key={index} 
                className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
              >
                <div className="message-role">{message.role === 'user' ? 'You:' : 'Assistant:'}</div>
                <div className="message-content">
                  {message.content.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="prompt-form">
          <textarea
            value={prompt}
            onChange={handlePromptChange}
            placeholder="Enter your message here..."
            rows={4}
            className="prompt-input"
          />
          <div className="button-group">
            <button type="submit" disabled={isLoading || !prompt}>
              {isLoading ? 'Generating...' : 'Send Message'}
            </button>
            <button 
              type="button" 
              onClick={handleStreamingSubmit} 
              disabled={isStreaming || !prompt}
            >
              {isStreaming ? 'Streaming...' : 'Stream Response'}
            </button>
          </div>
        </form>

        {error && <div className="error-message">{error}</div>}

        {isStreaming && streamingResponse && (
          <div className="response-container streaming">
            <h3>Live Response:</h3>
            <div className="response-content">
              {streamingResponse.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Ollama;