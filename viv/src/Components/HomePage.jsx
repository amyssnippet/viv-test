import React, { useState } from 'react';
import axios from 'axios';

const ChatbotLanding = () => {
  
  const [email, setEmail] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Thank you for subscribing with: ${email}`);
    setEmail('');
  };

  const handleCheckout = async (priceId) => {
    console.log(priceId);
    try {
      const response = await axios.post("http://localhost:4000/api/v1/create-checkout-session", {
        priceId,
      });
      window.location.href = response.data.url; // Redirect to Stripe
    } catch (error) {
      console.error("Error creating checkout session:", error);
    }
  };
  return (
    <div className="min-vh-100 d-flex flex-column bg-white">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom">
        <div className="container">
          <a className="navbar-brand fw-bold" href="#">ChatterBot</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a className="nav-link" href="#features">Features</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#demo">Demo</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#pricing">Pricing</a>
              </li>
              <li className="nav-item">
                <a className="btn btn-outline-dark ms-2" href="#signup">Sign Up</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="container py-5 mt-5">
        <div className="row align-items-center">
          <div className="col-lg-6">
            <h1 className="display-4 fw-bold mb-4">Intelligent Conversations Made Simple</h1>
            <p className="lead mb-4 text-secondary">Deploy our AI chatbot to provide 24/7 customer support, boost engagement, and drive conversions.</p>
            <div className="d-flex gap-3">
              <button className="btn btn-dark btn-lg px-4">Get Started</button>
              <button className="btn btn-outline-dark btn-lg px-4">Watch Demo</button>
            </div>
          </div>
          <div className="col-lg-6 d-flex justify-content-center mt-5 mt-lg-0">
            <div className="position-relative" style={{ width: '350px', height: '500px' }}>
              <div className="border border-dark rounded-3 p-3 bg-light position-absolute top-0 end-0" style={{ width: '300px' }}>
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-dark rounded-circle" style={{ width: '40px', height: '40px' }}></div>
                  <div className="ms-3">
                    <h6 className="mb-0">ChatterBot</h6>
                    <small className="text-success">Online</small>
                  </div>
                </div>
                <div className="mb-3" style={{ height: '300px', overflowY: 'auto' }}>
                  <div className="mb-2 text-end">
                    <span className="bg-dark text-white rounded-3 py-2 px-3 d-inline-block">How can I integrate this with my website?</span>
                  </div>
                  <div className="mb-2">
                    <span className="bg-light border rounded-3 py-2 px-3 d-inline-block">It's simple! Just copy our script tag into your HTML, or use our React component for seamless integration.</span>
                  </div>
                  <div className="mb-2 text-end">
                    <span className="bg-dark text-white rounded-3 py-2 px-3 d-inline-block">Do you support custom training?</span>
                  </div>
                  <div className="mb-2">
                    <span className="bg-light border rounded-3 py-2 px-3 d-inline-block">Yes! Our Pro plan includes custom training to match your brand voice and knowledge base.</span>
                  </div>
                </div>
                <div className="d-flex">
                  <input type="text" className="form-control me-2" placeholder="Type your message..." />
                  <button className="btn btn-dark px-3">Send</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-5 bg-light" id="features">
        <div className="container py-4">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Why Choose ChatterBot?</h2>
            <p className="text-secondary">Powerful features for modern businesses</p>
          </div>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="rounded-circle bg-dark d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-lightning text-white fs-4"></i>
                  </div>
                  <h5 className="card-title mb-3">Instant Responses</h5>
                  <p className="card-text text-secondary">Provide immediate answers to customer queries 24/7, reducing wait times and improving satisfaction.</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="rounded-circle bg-dark d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-person text-white fs-4"></i>
                  </div>
                  <h5 className="card-title mb-3">Personalization</h5>
                  <p className="card-text text-secondary">Tailored conversations based on user behavior and preferences for a custom experience.</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="rounded-circle bg-dark d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-graph-up text-white fs-4"></i>
                  </div>
                  <h5 className="card-title mb-3">Analytics Dashboard</h5>
                  <p className="card-text text-secondary">Gain valuable insights into customer interactions and identify trends to improve your service.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-5" id="demo">
        <div className="container py-4">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <h2 className="fw-bold mb-4">See ChatterBot in Action</h2>
              <p className="mb-4 text-secondary">Try out our demo to experience how ChatterBot can transform your customer interactions.</p>
              <ul className="list-unstyled">
                <li className="mb-3 d-flex align-items-center">
                  <div className="bg-dark rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '24px', height: '24px' }}>
                    <i className="bi bi-check text-white small"></i>
                  </div>
                  <span>Natural language processing for human-like conversations</span>
                </li>
                <li className="mb-3 d-flex align-items-center">
                  <div className="bg-dark rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '24px', height: '24px' }}>
                    <i className="bi bi-check text-white small"></i>
                  </div>
                  <span>Seamless handoff to human agents when needed</span>
                </li>
                <li className="d-flex align-items-center">
                  <div className="bg-dark rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '24px', height: '24px' }}>
                    <i className="bi bi-check text-white small"></i>
                  </div>
                  <span>Integration with your existing CRM and tools</span>
                </li>
              </ul>
              <button className="btn btn-dark mt-4">Start Free Trial</button>
            </div>
            <div className="col-lg-6">
              <img src="/api/placeholder/600/400" alt="ChatterBot Demo" className="img-fluid rounded shadow" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-5 bg-light" id="pricing">
      <div className="container py-4">
        <div className="text-center mb-5">
          <h2 className="fw-bold">Simple, Transparent Pricing</h2>
          <p className="text-secondary">Choose the plan that fits your business needs</p>
        </div>
        <div className="row g-4">
          {/* Starter Plan */}
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body p-4">
                <h5 className="fw-bold">Starter</h5>
                <h2 className="display-5 fw-bold my-3">$29<small className="fs-6 text-secondary">/mo</small></h2>
                <p className="text-secondary mb-4">Perfect for small businesses getting started with chat support.</p>
                <button className="btn btn-outline-dark w-100" onClick={() => handleCheckout("price_123")}>
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Professional Plan */}
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow border border-dark">
              <div className="card-body p-4">
                <h5 className="fw-bold">Professional</h5>
                <h2 className="display-5 fw-bold my-3">$79<small className="fs-6 text-secondary">/mo</small></h2>
                <p className="text-secondary mb-4">For growing teams that need more advanced features.</p>
                <button className="btn btn-dark w-100" onClick={() => handleCheckout("price_1R1poOSDMzhLVRDNO49VEWTu")}>
                {/* "id": "price_1R1poOSDMzhLVRDNO49VEWTu", */}
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body p-4">
                <h5 className="fw-bold">Enterprise</h5>
                <h2 className="display-5 fw-bold my-3">Custom</h2>
                <p className="text-secondary mb-4">For large organizations with custom requirements.</p>
                <button className="btn btn-outline-dark w-100" onClick={() => handleCheckout("price_789")}>
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* Newsletter Section */}
      <section className="py-5 bg-dark text-white" id="signup">
        <div className="container py-4">
          <div className="row justify-content-center">
            <div className="col-lg-6 text-center">
              <h2 className="fw-bold mb-4">Stay Updated</h2>
              <p className="mb-4">Subscribe to our newsletter for the latest features and updates</p>
              <form onSubmit={handleSubmit}>
                <div className="input-group mb-3">
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="Your email address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <button className="btn btn-light px-4" type="submit">Subscribe</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 bg-light">
        <div className="container">
          <div className="row">
            <div className="col-md-4 mb-4 mb-md-0">
              <h5 className="fw-bold mb-3">ChatterBot</h5>
              <p className="text-secondary small">The intelligent chatbot solution that helps businesses automate customer interactions and boost engagement.</p>
            </div>
            <div className="col-md-2 mb-4 mb-md-0">
              <h6 className="fw-bold mb-3">Product</h6>
              <ul className="list-unstyled">
                <li className="mb-2"><a href="#" className="text-decoration-none text-secondary">Features</a></li>
                <li className="mb-2"><a href="#" className="text-decoration-none text-secondary">Pricing</a></li>
                <li className="mb-2"><a href="#" className="text-decoration-none text-secondary">Demo</a></li>
                <li className="mb-2"><a href="#" className="text-decoration-none text-secondary">Integrations</a></li>
              </ul>
            </div>
            <div className="col-md-2 mb-4 mb-md-0">
              <h6 className="fw-bold mb-3">Company</h6>
              <ul className="list-unstyled">
                <li className="mb-2"><a href="#" className="text-decoration-none text-secondary">About</a></li>
                <li className="mb-2"><a href="#" className="text-decoration-none text-secondary">Blog</a></li>
                <li className="mb-2"><a href="#" className="text-decoration-none text-secondary">Careers</a></li>
                <li className="mb-2"><a href="#" className="text-decoration-none text-secondary">Contact</a></li>
              </ul>
            </div>
            <div className="col-md-2 mb-4 mb-md-0">
              <h6 className="fw-bold mb-3">Resources</h6>
              <ul className="list-unstyled">
                <li className="mb-2"><a href="#" className="text-decoration-none text-secondary">Documentation</a></li>
                <li className="mb-2"><a href="#" className="text-decoration-none text-secondary">Support</a></li>
                <li className="mb-2"><a href="#" className="text-decoration-none text-secondary">API</a></li>
                <li className="mb-2"><a href="#" className="text-decoration-none text-secondary">Community</a></li>
              </ul>
            </div>
            <div className="col-md-2">
              <h6 className="fw-bold mb-3">Legal</h6>
              <ul className="list-unstyled">
                <li className="mb-2"><a href="#" className="text-decoration-none text-secondary">Privacy</a></li>
                <li className="mb-2"><a href="#" className="text-decoration-none text-secondary">Terms</a></li>
                <li className="mb-2"><a href="#" className="text-decoration-none text-secondary">Security</a></li>
              </ul>
            </div>
          </div>
          <hr className="my-4" />
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start">
              <p className="small text-secondary mb-0">© 2025 ChatterBot. All rights reserved.</p>
            </div>
            <div className="col-md-6 text-center text-md-end">
              <div className="d-flex justify-content-center justify-content-md-end gap-3">
                <a href="#" className="text-secondary"><i className="bi bi-twitter"></i></a>
                <a href="#" className="text-secondary"><i className="bi bi-facebook"></i></a>
                <a href="#" className="text-secondary"><i className="bi bi-linkedin"></i></a>
                <a href="#" className="text-secondary"><i className="bi bi-instagram"></i></a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChatbotLanding;