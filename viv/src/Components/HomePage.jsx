import { useEffect, useRef } from "react";
import "./home.css"

function ChatInterface({ messages, inputValue, setInputValue, handleSubmit }) {
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="app-container">
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container">
          <a className="navbar-brand" href="#">
            <span className="brand-text">AI</span>
          </a>

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <a className="nav-link active" href="#">
                  GROK
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">
                  API
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">
                  COMPANY
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">
                  COLOSSUS
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">
                  CAREERS
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">
                  NEWS
                </a>
              </li>
            </ul>
            <div className="d-flex">
              <button className="btn btn-outline-light rounded-pill">TRY GROK</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">




              <div className="chat-interface">
                {messages.length === 0 ? (
                  <div className="empty-state">
                    <h1 className="grok-title">Grok</h1>
                    <form onSubmit={handleSubmit} className="mt-4">
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control search-input"
                          placeholder="Ask Grok anything..."
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                        />
                        <button className="btn search-btn" type="submit">
                          <i className="bi bi-arrow-right"></i>
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="chat-messages">
                    {messages.map((message, index) => (
                      <div key={index} className={`message ${message.role}`}>
                        <div className="message-content">
                          <strong>{message.role === "user" ? "You: " : "Grok: "}</strong>
                          {message.content}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />

                    <form onSubmit={handleSubmit} className="mt-4 sticky-bottom">
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control search-input"
                          placeholder="Ask Grok anything..."
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                        />
                        <button className="btn search-btn" type="submit">
                          <i className="bi bi-arrow-right"></i>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

              </div>


            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container text-center">
          <p className="announcement">
            We are thrilled to unveil Grok 3, our most advanced model yet,
            <br />
            blending superior reasoning with extensive pretraining knowledge.
          </p>
          <div className="footer-buttons">
            <button className="btn btn-dark rounded-pill me-3">BUILD WITH GROK</button>
            <button className="btn btn-outline-light rounded-pill">LEARN MORE</button>
          </div>
          <div className="scroll-indicator">
            <i className="bi bi-arrow-down"></i>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default ChatInterface
