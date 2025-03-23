import React from 'react';
import "./Landing.css"

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="container">
          <div className="navbar-content">
            <div className="navbar-logo">
              <svg className="logo-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>AI Chat</span>
            </div>
            <div className="navbar-links">
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="navbar-actions">
              <a href="/login" className="login-button">Log in</a>
              <a href="/signup" className="signup-button">Sign up</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>The Next Generation AI Chat Assistant</h1>
              <p>Intelligent conversations powered by state-of-the-art AI. Built for developers, creators, and teams.</p>
              <div className="hero-buttons">
                <a href="/signup" className="primary-button">
                  Get Started
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </a>
                <a href="/demo" className="secondary-button">View Demo</a>
              </div>
            </div>
            <div className="hero-image">
              <div className="app-preview">
                <div className="app-preview-header">
                  <div className="window-controls">
                    <div className="control red"></div>
                    <div className="control yellow"></div>
                    <div className="control green"></div>
                  </div>
                </div>
                <div className="app-preview-content">
                  <div className="preview-message assistant">
                    <div className="preview-avatar">AI</div>
                    <div className="preview-bubble">How can I help you today?</div>
                  </div>
                  <div className="preview-message user">
                    <div className="preview-bubble">Can you help me build a React component?</div>
                  </div>
                  <div className="preview-message assistant">
                    <div className="preview-avatar">AI</div>
                    <div className="preview-bubble">Of course! Let's create a React component. First, decide what functionality you need...</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2>Powerful Features</h2>
            <p>Everything you need to boost your productivity</p>
          </div>
          <div className="feature-grid">
            {[
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                ),
                title: "Lightning Fast",
                description: "Get responses in milliseconds with our optimized infrastructure."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                ),
                title: "Secure & Private",
                description: "Your conversations are encrypted and never shared with third parties."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                  </svg>
                ),
                title: "Developer Friendly",
                description: "Built for developers with code generation and explanation capabilities."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                ),
                title: "Context Aware",
                description: "Maintains conversation context for more natural and helpful interactions."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                ),
                title: "Multi-platform",
                description: "Available on web, desktop, and mobile devices for seamless experience."
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                  </svg>
                ),
                title: "Customizable",
                description: "Tailor the AI to your specific needs with custom knowledge and training."
              }
            ].map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing">
        <div className="container">
          <div className="section-header">
            <h2>Simple, Transparent Pricing</h2>
            <p>Choose the plan that works for you</p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Free</h3>
                <div className="pricing-price">
                  <span className="price">$0</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <div className="pricing-features">
                <ul>
                  <li>Up to 100 messages per day</li>
                  <li>Basic AI capabilities</li>
                  <li>Community support</li>
                  <li>Web access only</li>
                </ul>
              </div>
              <div className="pricing-action">
                <a href="/signup" className="pricing-button">Get Started</a>
              </div>
            </div>
            <div className="pricing-card popular">
              <div className="popular-tag">Most Popular</div>
              <div className="pricing-header">
                <h3>Pro</h3>
                <div className="pricing-price">
                  <span className="price">$19</span>
                  <span className="period">/month</span>
                </div>
              </div>
              <div className="pricing-features">
                <ul>
                  <li>Unlimited messages</li>
                  <li>Advanced AI capabilities</li>
                  <li>Priority support</li>
                  <li>Web, desktop & mobile access</li>
                  <li>API access</li>
                </ul>
              </div>
              <div className="pricing-action">
                <a href="/signup?plan=pro" className="pricing-button">Choose Pro</a>
              </div>
            </div>
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Enterprise</h3>
                <div className="pricing-price">
                  <span className="price">Custom</span>
                  <span className="period">pricing</span>
                </div>
              </div>
              <div className="pricing-features">
                <ul>
                  <li>Unlimited messages</li>
                  <li>Custom AI training</li>
                  <li>Dedicated support</li>
                  <li>SSO integration</li>
                  <li>Advanced analytics</li>
                  <li>SLA guarantees</li>
                </ul>
              </div>
              <div className="pricing-action">
                <a href="/contact" className="pricing-button">Contact Us</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq">
        <div className="container">
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about our AI Chat</p>
          </div>
          <div className="faq-grid">
            {[
              {
                question: "How does AI Chat work?",
                answer: "AI Chat uses advanced language models to understand and respond to your questions and requests. It learns from the conversation context to provide more relevant and helpful responses over time."
              },
              {
                question: "Is my data secure?",
                answer: "Yes. We take data privacy seriously. All conversations are encrypted end-to-end, and we never share your data with third parties. You can delete your conversation history at any time."
              },
              {
                question: "Can I use AI Chat for coding?",
                answer: "Absolutely! Our AI is trained extensively on code and can help with generating, explaining, and debugging code in dozens of programming languages."
              },
              {
                question: "Do you offer a free trial for Pro?",
                answer: "Yes, we offer a 7-day free trial for our Pro plan. No credit card required to start."
              },
              {
                question: "Can I integrate AI Chat with my own applications?",
                answer: "Yes, Pro and Enterprise plans include API access for integrating our AI capabilities into your own applications and workflows."
              },
              {
                question: "What kind of support do you offer?",
                answer: "Free users have access to our community forum. Pro users get priority email support with 24-hour response time. Enterprise customers receive dedicated support with a named account manager."
              }
            ].map((item, index) => (
              <div key={index} className="faq-item">
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to transform your productivity?</h2>
            <p>Start using AI Chat today and experience the future of AI assistance.</p>
            <a href="/signup" className="cta-button">Get Started for Free</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <svg className="logo-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>AI Chat</span>
            </div>
            <div className="footer-links">
              <div className="footer-section">
                <h4>Product</h4>
                <ul>
                  <li><a href="#features">Features</a></li>
                  <li><a href="#pricing">Pricing</a></li>
                  <li><a href="/api">API</a></li>
                  <li><a href="/integrations">Integrations</a></li>
                </ul>
              </div>
              <div className="footer-section">
                <h4>Company</h4>
                <ul>
                  <li><a href="/about">About Us</a></li>
                  <li><a href="/blog">Blog</a></li>
                  <li><a href="/careers">Careers</a></li>
                  <li><a href="/contact">Contact</a></li>
                </ul>
              </div>
              <div className="footer-section">
                <h4>Resources</h4>
                <ul>
                  <li><a href="/docs">Documentation</a></li>
                  <li><a href="/tutorials">Tutorials</a></li>
                  <li><a href="/community">Community</a></li>
                  <li><a href="/status">Status</a></li>
                </ul>
              </div>
              <div className="footer-section">
                <h4>Legal</h4>
                <ul>
                  <li><a href="/terms">Terms</a></li>
                  <li><a href="/privacy">Privacy</a></li>
                  <li><a href="/security">Security</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} AI Chat. All rights reserved.</p>
            <div className="social-links">
              <a href="https://twitter.com" aria-label="Twitter">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </a>
              <a href="https://github.com" aria-label="GitHub">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </a>
              <a href="https://linkedin.com" aria-label="LinkedIn">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;