import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  AlignVerticalJustifyCenter,
  Coins,
  LayoutDashboard,
  User2,
  Lock,
  Server,
  MessageCircle,
  BookOpen
} from "lucide-react";
import { RingLoader, ScaleLoader, BounceLoader } from "react-spinners";
import "../App.css";
import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("Monthly");
  const [currentSection, setCurrentSection] = useState("Dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const userToken = Cookies.get("authToken");
  const isUserLoggedIn = !!userToken;
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [tools, setTools] = useState([]);

  useEffect(() => {
    if (isUserLoggedIn) {
      try {
        const decodedToken = jwtDecode(userToken);
        setUserData(decodedToken);
      } catch (error) {
        console.error("Error decoding token:", error);
        setUserData(null);
      }
    }
  }, [isUserLoggedIn, userToken]);

  useEffect(() => {
    fetchDeveloper();
  },[])

  const fetchDeveloper = async () => {
    try {
      const response = await axios.post("http://localhost:4000/api/v1/fetch/developerToken", { userId: userData.userId });
      // console.log(response.data.developerTools )
      setTools(response.data.developerTools)
    } catch (error) {
      console.log(error)
    }
  }
  // Sample data for histogram
  const data = {
    Daily: [
      500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1800, 2000,
      2200, 2400, 2600, 2800, 3000, 3200, 3400, 3600, 3800, 4000, 4200, 4400,
      4600, 4800, 5000, 5200, 5400, 5600,
    ],
    Weekly: [
      3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500,
    ],
    Monthly: [
      4500, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000,
      18000,
    ],
  };

  const labels = {
    Daily: Array.from({ length: 31 }, (_, i) => (i + 1).toString()),
    Weekly: Array.from({ length: 12 }, (_, i) => `Week ${i + 1}`),
    Monthly: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ],
  };

  const getYLabels = (values) => {
    const maxValue = Math.max(...values);
    const step = maxValue / 4;
    return [
      `R${Math.round(maxValue)}`,
      `R${Math.round(maxValue * 0.75)}`,
      `R${Math.round(maxValue * 0.5)}`,
      `R${Math.round(maxValue * 0.25)}`,
      "R0",
    ];
  };

  const users = [
    { id: 1, name: "Thabo Mbeki", email: "thabo@example.com", role: "Admin", status: "Active" },
    { id: 2, name: "Nthabiseng Mbatha", email: "nthabiseng@example.com", role: "User", status: "Inactive" },
    { id: 3, name: "Siya Kolisi", email: "siya@example.com", role: "User", status: "Active" },
    { id: 4, name: "Trevor Noah", email: "trevor@example.com", role: "Moderator", status: "Active" },
    { id: 5, name: "Patrice Motsepe", email: "patrice@example.com", role: "User", status: "Inactive" },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (tab) => setActiveTab(tab);
  const handleSectionChange = (section) => setCurrentSection(section);

  const currentData = data[activeTab];
  const currentLabels = labels[activeTab];
  const yLabels = getYLabels(currentData);

  // UserProfile Component
  const UserProfile = () => {
    const [profileData, setProfileData] = useState({
      name: userData?.fullName || "",
      email: userData?.email || "",
      password: "",
    });
    const [isProfileLoading, setIsProfileLoading] = useState(true);
    const [isChangePasswordPopupOpened, setIsChangePasswordPopupOpened] = useState(false);
    const [isDataChanged, setIsDataChanged] = useState(false);
    const [savedProfileData, setSavedProfileData] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");

    useEffect(() => {
      const loadUserData = async () => {
        setIsProfileLoading(true);
        const token = Cookies.get("authToken");
        if (!token) {
          console.error("No auth token found");
          setIsProfileLoading(false);
          return;
        }
        try {
          const response = await axios.get("http://localhost:4000/api/v1/user", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const userData = response.data.user;
          setProfileData({
            name: userData.fullName || "",
            email: userData.email || "",
            password: "",
          });
          setSavedProfileData({
            name: userData.fullName || "",
            email: userData.email || "",
            password: "",
          });
          setIsProfileLoading(false);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setIsProfileLoading(false);
        }
      };
      loadUserData();
    }, []);

    const handleInputChange = (field, value) => {
      setProfileData({ ...profileData, [field]: value });
      setIsDataChanged(true);
    };

    const handleChangePassword = () => setIsChangePasswordPopupOpened(true);

    const handlePasswordSave = () => {
      if (newPassword !== confirmPassword) {
        alert("New password and confirm password do not match");
        return;
      }
      if (newPassword) {
        handleSave(true);
        setIsChangePasswordPopupOpened(false);
      }
    };

    const handleSave = async (isPasswordChange = false) => {
      try {
        const response = await axios.put(
          "http://localhost:4000/api/v1/updateUser",
          {
            userId: userData.userId,
            name: profileData.name,
            email: profileData.email,
            password: isPasswordChange ? newPassword : profileData.password,
          }
        );
        alert(isPasswordChange ? "Password updated successfully" : "Profile data saved");
        if (!isPasswordChange) {
          setIsDataChanged(false);
          setSavedProfileData({ ...profileData });
        } else {
          setNewPassword("");
          setConfirmPassword("");
          setCurrentPassword("");
        }
      } catch (error) {
        console.error("Error saving profile data:", error.response?.data || error);
        alert(error.response?.data?.error || "Failed to save profile data");
      }
    };

    const handleCancel = () => {
      setProfileData(savedProfileData);
      setIsDataChanged(false);
    };

    if (isProfileLoading) {
      return (
        <div className="preloader">
          <ScaleLoader color="#007bff" size={200} />
        </div>
      );
    }

    return (
      <div className="card" style={{ background: '#161617', color: 'white' }}>
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">User Profile</h5>
          <div>
            <button className="btn btn-outline-secondary me-2" disabled={!isDataChanged} onClick={handleCancel}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={!isDataChanged} onClick={() => handleSave(false)}>
              Save
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-6 mb-3">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                value={profileData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                style={{ background: '#161617', color: 'white', border: '1px solid #222222' }}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={profileData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                style={{ background: '#161617', color: 'white', border: '1px solid #222222' }}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" value="********" disabled style={{ background: '#161617', color: 'white', border: '1px solid #222222' }} />
            </div>
          </div>
          <button className="btn btn-outline-primary" onClick={handleChangePassword}>
            <Lock size={16} className="me-1" /> Change Password
          </button>
        </div>
        <div className={`modal fade ${isChangePasswordPopupOpened ? "show d-block" : ""}`} tabIndex="-1" style={{ background: '#161617' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ background: '#222222' }}>
              <div className="modal-header">
                <h5 className="modal-title">Change Password</h5>
                <button type="button" className="btn-close" onClick={() => setIsChangePasswordPopupOpened(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-control" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ background: '#161617' }} />
                </div>
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ background: '#161617' }} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" className="form-control" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ background: '#161617' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsChangePasswordPopupOpened(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handlePasswordSave}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // EndpointCreationUI Component
  const EndpointCreationUI = () => {
    const [formData, setFormData] = useState({
      name: '',
      tokens: 5000,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [newEndpoint, setNewEndpoint] = useState(null);

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData({
        ...formData,
        [name]: name === 'tokens' ? parseInt(value, 10) : value,
      });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await axios.post(
          `http://localhost:4000/api/v1/create-endpoint/${userData.userId}`,
          formData
        );

        if (response.data.success) {
          setSuccess('Endpoint created successfully!');
          setNewEndpoint(response.data);
          setFormData({ name: '', tokens: 1000 });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred while creating the endpoint');
      } finally {
        setLoading(false);
      }
    };

    return (
      <Container className="py-5">
        <Row className="justify-content-center" style={{ width: '100%' }}>
          <Col md={8}>
            <Card className="shadow animate__fadeInUp" style={{ background: '#161617', color: 'white', padding: '2%' }}>
              <Card.Header className="bg-gradient-primary text-white">
                <h3 className="mb-0 text-center">Create API Endpoint</h3>
              </Card.Header>
              <Card.Body>
                {error && (
                  <Alert variant="danger" className="animate__shakeX">
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert variant="success" className="animate__bounceIn">
                    {success}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Form.Group className="mb-3 animate__fadeIn" style={{ animationDelay: "0.1s" }}>
                      <Form.Label className="fw-bold">Endpoint Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        placeholder="My Cool API Endpoint"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="shadow-sm api-input"
                        style={{ background: '#161617', color: 'white' }}
                      />
                    </Form.Group>

                    <Form.Group className="mb-4 animate__fadeIn" style={{ animationDelay: "0.2s" }}>
                      <Form.Label className="fw-bold">Initial Token Balance</Form.Label>
                      <Form.Control
                        type="number"
                        name="tokens"
                        placeholder="5000"
                        value={formData.tokens}
                        onChange={handleChange}
                        min="100"
                        disabled
                        className="shadow-sm api-input"
                        style={{ background: '#161617', color: 'white' }}
                      />
                    </Form.Group>
                  </div>

                  <div>
                    <Button
                      type="submit"
                      className="btn-lg shadow animate__pulse"
                      disabled={loading}
                      style={{ animation: loading ? "none" : "pulse 2s infinite", width: '30%', padding: '5px 10px', background: '#313031', border: 'none' }}
                    >
                      {loading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-2" />
                          Creating...
                        </>
                      ) : (
                        "Create API"
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            {newEndpoint && (
              <Card className="shadow mt-4 animate__zoomIn" style={{ background: '#161617' }}>
                <Card.Header className="bg-gradient-success text-white">
                  <h4 className="mb-0 text-center">Endpoint Created Successfully</h4>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <strong>Endpoint Name:</strong> <span className="text-primary" style={{ color: 'white' }}>{newEndpoint.toolName}</span>
                  </div>
                  <div className="mb-3">
                    <strong>Endpoint ID:</strong>
                    <code className="ms-2 p-2 border rounded" style={{ background: '#313031', color: 'white' }}>{newEndpoint.endpoint}</code>
                  </div>
                  <div className="mb-3">
                    <strong>Token Balance:</strong> <span className="text-success">{newEndpoint.tokens}</span>
                  </div>
                  <Alert variant="warning" className="animate__fadeIn">
                    <i className="bi bi-shield-lock me-2"></i>
                    Save this endpoint ID securely! You'll need it for API authentication.
                  </Alert>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    );
  };

  if (isLoading) {
    return (
      <div className="preloader">
        <RingLoader color="#007bff" size={100} />
      </div>
    );
  }

  const NPMDocs = () => {
    return (
      <div className="text-light">
        <h2>📦 VIV AI SDK – Installation (NPM)</h2>
        <pre className="bg-dark p-3 rounded">
          {`
  npm install viv-ai
  # or
  yarn add viv-ai
  `}
        </pre>
        <h4>🧠 Usage</h4>
        <pre className="bg-dark p-3 rounded">
          {`
  import VivAI from 'viv-ai';
  
  const ai = new VivAI({
    apiKey: 'your-api-key',
  });
  
  ai.generateText("Explain Quantum Physics in simple terms").then((response) => {
    console.log(response);
  });
  `}
        </pre>
        <h4>🔐 Authentication</h4>
        <pre className="bg-dark p-3 rounded">
          {`
  const ai = new VivAI({
    apiKey: process.env.VIV_API_KEY,
  });
  `}
        </pre>
      </div>
    );
  };

  const JSTSDocs = () => {
    return (
      <div className="text-light">
        <h2>🔤 VIV AI SDK – JavaScript / TypeScript Guide</h2>

        <h4>💻 Browser Script (CDN)</h4>
        <pre className="bg-dark p-3 rounded">
          {`
  <script src="https://cdn.yoursite.com/viv-ai.min.js"></script>
  <script>
    const ai = new VivAI({ apiKey: 'your-api-key' });
    ai.generateText("Tell me a joke").then(console.log);
  </script>
  `}
        </pre>

        <h4>🟦 TypeScript Example</h4>
        <pre className="bg-dark p-3 rounded">
          {`
  import VivAI from 'viv-ai';
  
  const ai = new VivAI({
    apiKey: 'your-api-key',
  });
  
  async function runAI() {
    const result: string = await ai.generateText("What is VIV AI?");
    console.log(result);
  }
  `}
        </pre>
      </div>
    );
  };

  return (
    <div className="d-flex flex-column flex-md-row min-vh-100">
      {/* Sidebar */}

      {/* Mobile */}
      <div
        className={`mobile-sidebar-overlay ${isSidebarOpen ? 'open' : ''} d-md-none`}
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
            padding: '20px'
          }}
        >
          <h1 className="h4 fw-bold text-light mb-4">VIV AI</h1>
          <ul className="nav flex-column">
            <li className="nav-item mb-2">
              <Link className="nav-link d-flex align-items-center text-light" to="/chat">
                <span className="me-2"><MessageCircle /></span>Chats</Link>
            </li>
            <li className="nav-item mb-2">
              <a href="#" className={`nav-link d-flex align-items-center text-light ${currentSection === "Dashboard" ? "active" : ""}`} onClick={() => handleSectionChange("Dashboard")}>
                <span className="me-2"><LayoutDashboard /></span> Dashboard
              </a>
            </li>
            <li className="nav-item mb-2">
              <a href="#" className={`nav-link d-flex align-items-center text-light ${currentSection === "Profile" ? "active" : ""}`} onClick={() => handleSectionChange("Profile")}>
                <span className="me-2"><User2 /></span> Profile
              </a>
            </li>
            <li className="nav-item mb-2">
              <a href="#" className={`nav-link d-flex align-items-center text-light ${currentSection === "Endpoints" ? "active" : ""}`} onClick={() => handleSectionChange("Endpoints")}>
                <span className="me-2"><Server /></span> Endpoints
              </a>
            </li>
            <li className="nav-item mb-2">
              <a href="#" className="nav-link d-flex align-items-center text-light">
                <span className="me-2"><Coins /></span> Subscriptions
              </a>
            </li>

            {/* Docs with submenu */}
            <li className="nav-item mb-2">
              <a
                className="nav-link d-flex align-items-center text-light"
                data-bs-toggle="collapse"
                href="#docsSubmenu"
                role="button"
                aria-expanded="false"
                aria-controls="docsSubmenu"
              >
                <span className="me-2"><BookOpen /></span> Docs
              </a>
              <div className="collapse ps-4" id="docsSubmenu">
                <a
                  href="#"
                  className={`nav-link text-light ${currentSection === "NPM" ? "active" : ""}`}
                  onClick={() => handleSectionChange("NPM")}
                >
                  NPM
                </a>
                <a
                  href="#"
                  className={`nav-link text-light ${currentSection === "JSTS" ? "active" : ""}`}
                  onClick={() => handleSectionChange("JSTS")}
                >
                  JS/TS
                </a>
              </div>
            </li>
          </ul>
          {/* Your original sidebar content here (like what you sent above) */}
        </div>
      </div>

      {/* Desktop */}
      <div
        className="col-3 sidebar d-none d-md-block"
        style={{ backgroundColor: "#171717", color: 'white', height: "100vh", padding: '20px' }}
      > <h1 className="h4 fw-bold text-light mb-4">VIV AI</h1>
        <ul className="nav flex-column">
          <li className="nav-item mb-2">
            <Link className="nav-link d-flex align-items-center text-light" to="/chat">
              <span className="me-2"><MessageCircle /></span>Chats</Link>
          </li>
          <li className="nav-item mb-2">
            <a href="#" className={`nav-link d-flex align-items-center text-light ${currentSection === "Dashboard" ? "active" : ""}`} onClick={() => handleSectionChange("Dashboard")}>
              <span className="me-2"><LayoutDashboard /></span> Dashboard
            </a>
          </li>
          <li className="nav-item mb-2">
            <a href="#" className={`nav-link d-flex align-items-center text-light ${currentSection === "Profile" ? "active" : ""}`} onClick={() => handleSectionChange("Profile")}>
              <span className="me-2"><User2 /></span> Profile
            </a>
          </li>
          <li className="nav-item mb-2">
            <a href="#" className={`nav-link d-flex align-items-center text-light ${currentSection === "Endpoints" ? "active" : ""}`} onClick={() => handleSectionChange("Endpoints")}>
              <span className="me-2"><Server /></span> Endpoints
            </a>
          </li>
          <li className="nav-item mb-2">
            <a href="#" className="nav-link d-flex align-items-center text-light">
              <span className="me-2"><Coins /></span> Subscriptions
            </a>
          </li>

          {/* Docs with submenu */}
          <li className="nav-item mb-2">
            <a
              className="nav-link d-flex align-items-center text-light"
              data-bs-toggle="collapse"
              href="#docsSubmenu"
              role="button"
              aria-expanded="false"
              aria-controls="docsSubmenu"
            >
              <span className="me-2"><BookOpen /></span> Docs
            </a>
            <div className="collapse ps-4" id="docsSubmenu">
              <a
                href="#"
                className={`nav-link text-light ${currentSection === "NPM" ? "active" : ""}`}
                onClick={() => handleSectionChange("NPM")}
              >
                NPM
              </a>
              <a
                href="#"
                className={`nav-link text-light ${currentSection === "JSTS" ? "active" : ""}`}
                onClick={() => handleSectionChange("JSTS")}
              >
                JS/TS
              </a>
            </div>
          </li>
        </ul>

      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-3 p-md-5" style={{
        height: '100vh',
        overflowY: 'auto',
        paddingRight: '1rem',
        background: '#232223'
      }}>
        <button className="btn text-white d-md-none mb-4" onClick={() => setSidebarOpen(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" className="bi bi-list" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M2.5 12.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm0-4a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm0-4a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11z" />
          </svg>
        </button>
        {currentSection === "Dashboard" && (
          <>
            {/* <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
              <input type="text" className="form-control mb-3 mb-md-0" placeholder="Search..." style={{ maxWidth: "100%", background: '#161617', color: 'white', border: 'none' }} />
            </div> */}
            {/* <div className="row row-cols-1 row-cols-md-4 g-4 mb-4">
              <div className="col">
                <div className="card h-100" style={{ background: '#161617', color: 'white' }}>
                  <div className="card-body">
                    <h6 className="card-subtitle mb-2">TOKENS</h6>
                    <h5 className="card-title">24</h5>
                    <p className="card-text text-success">+12% from yesterday</p>
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="card h-100" style={{ background: '#161617', color: 'white' }}>
                  <div className="card-body">
                    <h6 className="card-subtitle mb-2 text-muted">TOTAL USERS</h6>
                    <h5 className="card-title">1,284</h5>
                    <p className="card-text text-danger">-2.5% from last week</p>
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="card h-100" style={{ background: '#161617', color: 'white' }}>
                  <div className="card-body">
                    <h6 className="card-subtitle mb-2 text-muted">TRANSACTIONS TODAY</h6>
                    <h5 className="card-title">R 12,543</h5>
                    <p className="card-text text-success">+18% from yesterday</p>
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="card h-100" style={{ background: '#161617', color: 'white' }}>
                  <div className="card-body">
                    <h6 className="card-subtitle mb-2 text-muted">NON-USERS</h6>
                    <h5 className="card-title">342</h5>
                    <p className="card-text text-danger">-4% from yesterday</p>
                  </div>
                </div>
              </div>
            </div> */}
            <h2 className="text-white"> Tokens </h2>
            <div className="row g-4 text-white">
              {tools.length === 0 ? (
                <p>No tools found.</p>
              ) : (
                <table className=" mt-3">
                  <thead className="">
                    <tr style={{ background: '#161617', color:'white' }}>
                      <th style={{ padding:'20px' }}>Name</th>
                      <th>Endpoint</th>
                      <th>Token</th>
                      <th>Tokens Balance</th>
                      <th>Created At</th>
                      <th>Last Used</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tools.map((tool, index) => (
                      <tr key={index} style={{
                        backgroundColor: index % 2 === 0 ? '#232223' : '#313031',
                        color: 'white',
                      }}>
                        <td style={{ padding:'5px' }}>{tool.name}</td>
                        <td>{tool.endpoint}</td>
                        <td>{tool.token || "—"}</td>
                        <td>{tool.tokens}</td>
                        <td>{new Date(tool.createdAt).toLocaleString()}</td>
                        <td>{tool.lastUsedAt ? new Date(tool.lastUsedAt).toLocaleString() : "Never"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              )}
            </div>
          </>
        )}
        {currentSection === "Users" && (
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-4">Users</h5>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th scope="col">ID</th>
                      <th scope="col">Name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Role</th>
                      <th scope="col">Status</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>
                          <span className={`badge ${user.status === "Active" ? "bg-success" : "bg-danger"}`}>
                            {user.status}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-2">Edit</button>
                          <button className="btn btn-sm btn-outline-danger">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {currentSection === "Profile" && <UserProfile />}
        {currentSection === "Endpoints" && <EndpointCreationUI />}
        {currentSection === "NPM" && <NPMDocs />}
        {currentSection === "JSTS" && <JSTSDocs />}
      </div>
    </div>
  );
};

export default Dashboard;