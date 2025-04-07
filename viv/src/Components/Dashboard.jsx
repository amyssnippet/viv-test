import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  AlignVerticalJustifyCenter,
  Coins,
  LayoutDashboard,
  User2,
  Lock,
  Server,
} from "lucide-react";
import { RingLoader, ScaleLoader, BounceLoader } from "react-spinners";
import "../App.css";
import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("Monthly");
  const [currentSection, setCurrentSection] = useState("Dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const userToken = Cookies.get("authToken");
  const isUserLoggedIn = !!userToken;

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
      <div className="card">
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
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={profileData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" value="********" disabled />
            </div>
          </div>
          <button className="btn btn-outline-primary" onClick={handleChangePassword}>
            <Lock size={16} className="me-1" /> Change Password
          </button>
        </div>
        <div className={`modal fade ${isChangePasswordPopupOpened ? "show d-block" : ""}`} tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Change Password</h5>
                <button type="button" className="btn-close" onClick={() => setIsChangePasswordPopupOpened(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-control" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" className="form-control" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
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
          `http://51.21.245.211/api/v1/create-endpoint/${userData.userId}`,
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
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow animate__fadeInUp">
              <Card.Header className="bg-gradient-primary text-white">
                <h3 className="mb-0 text-center">Create New API Endpoint</h3>
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
                  <Form.Group className="mb-3 animate__fadeIn" style={{ animationDelay: "0.1s" }}>
                    <Form.Label className="fw-bold">Endpoint Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      placeholder="My Cool API Endpoint"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="shadow-sm"
                    />
                    <Form.Text className="text-muted">
                      Choose a descriptive name for your API endpoint
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-4 animate__fadeIn" style={{ animationDelay: "0.2s" }}>
                    <Form.Label className="fw-bold">Initial Token Balance</Form.Label>
                    <Form.Control
                      type="number"
                      name="tokens"
                      placeholder="1000"
                      value={formData.tokens}
                      onChange={handleChange}
                      min="100"
                      className="shadow-sm"
                    />
                    <Form.Text className="text-muted">
                      Set the initial number of tokens for this endpoint (default: 1000)
                    </Form.Text>
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 btn-lg shadow animate__pulse"
                    disabled={loading}
                    style={{ animation: loading ? "none" : "pulse 2s infinite" }}
                  >
                    {loading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Creating...
                      </>
                    ) : (
                      "Create API Endpoint"
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>

            {newEndpoint && (
              <Card className="shadow mt-4 animate__zoomIn">
                <Card.Header className="bg-gradient-success text-white">
                  <h4 className="mb-0 text-center">Endpoint Created Successfully</h4>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <strong>Endpoint Name:</strong> <span className="text-primary">{newEndpoint.toolName}</span>
                  </div>
                  <div className="mb-3">
                    <strong>Endpoint ID:</strong>
                    <code className="ms-2 p-2 bg-light border rounded">{newEndpoint.endpoint}</code>
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

  return (
    <div className="d-flex flex-column flex-md-row min-vh-100">
      {/* Sidebar */}
      <div className="bg-light border-end sidebar p-3 d-none d-md-block" style={{ width: "250px" }}>
        <h1 className="h4 fw-bold text-dark mb-4">VIV AI</h1>
        <ul className="nav flex-column">
          <li className="nav-item mb-2">
            <a href="#" className={`nav-link d-flex align-items-center text-dark ${currentSection === "Dashboard" ? "active" : ""}`} onClick={() => handleSectionChange("Dashboard")}>
              <span className="me-2"><LayoutDashboard /></span> Dashboard
            </a>
          </li>
          <li className="nav-item mb-2">
            <a href="#" className={`nav-link d-flex align-items-center text-dark ${currentSection === "Profile" ? "active" : ""}`} onClick={() => handleSectionChange("Profile")}>
              <span className="me-2"><User2 /></span> Profile
            </a>
          </li>
          <li className="nav-item mb-2">
            <a href="#" className={`nav-link d-flex align-items-center text-dark ${currentSection === "Endpoints" ? "active" : ""}`} onClick={() => handleSectionChange("Endpoints")}>
              <span className="me-2"><Server /></span> Endpoints
            </a>
          </li>
          <li className="nav-item mb-2">
            <a href="#" className="nav-link d-flex align-items-center text-dark">
              <span className="me-2"><Coins /></span> Transactions
            </a>
          </li>
          <li className="nav-item mb-2">
            <a href="#" className="nav-link d-flex align-items-center text-dark">
              <span className="me-2"><AlignVerticalJustifyCenter /></span> Analytics
            </a>
          </li>
        </ul>
      </div>

      {/* Mobile Sidebar Toggle */}
      <div className="d-md-none p-3 bg-light border-bottom">
        <button className="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#sidebarMenu" aria-expanded="false" aria-controls="sidebarMenu">
          ☰ Menu
        </button>
        <div className="collapse mt-3" id="sidebarMenu">
          <ul className="nav flex-column">
            <li className="nav-item mb-2">
              <a href="#" className={`nav-link d-flex align-items-center ${currentSection === "Dashboard" ? "active" : ""}`} onClick={() => handleSectionChange("Dashboard")}>
                <span className="me-2"><LayoutDashboard /></span> Dashboard
              </a>
            </li>
            <li className="nav-item mb-2">
              <a href="#" className={`nav-link d-flex align-items-center ${currentSection === "Profile" ? "active" : ""}`} onClick={() => handleSectionChange("Profile")}>
                <span className="me-2"><User2 /></span> Profile
              </a>
            </li>
            <li className="nav-item mb-2">
              <a href="#" className={`nav-link d-flex align-items-center ${currentSection === "Endpoints" ? "active" : ""}`} onClick={() => handleSectionChange("Endpoints")}>
                <span className="me-2"><Server /></span> Endpoints
              </a>
            </li>
            <li className="nav-item mb-2">
              <a href="#" className="nav-link d-flex align-items-center">
                <span className="me-2"><Coins /></span> Transactions
              </a>
            </li>
            <li className="nav-item mb-2">
              <a href="#" className="nav-link d-flex align-items-center">
                <span className="me-2"><AlignVerticalJustifyCenter /></span> Analytics
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-3 p-md-5">
        {currentSection === "Dashboard" && (
          <>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
              <input type="text" className="form-control mb-3 mb-md-0" placeholder="Search..." style={{ maxWidth: "100%" }} />
            </div>
            <div className="btn-group mb-4" role="group">
              {["Daily", "Weekly", "Monthly"].map((tab) => (
                <button key={tab} onClick={() => handleTabChange(tab)} className={`btn ${activeTab === tab ? "btn-primary" : "btn-outline-primary"}`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="row row-cols-1 row-cols-md-4 g-4 mb-4">
              <div className="col">
                <div className="card h-100">
                  <div className="card-body">
                    <h6 className="card-subtitle mb-2 text-muted">TOKENS</h6>
                    <h5 className="card-title">24</h5>
                    <p className="card-text text-success">+12% from yesterday</p>
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="card h-100">
                  <div className="card-body">
                    <h6 className="card-subtitle mb-2 text-muted">TOTAL USERS</h6>
                    <h5 className="card-title">1,284</h5>
                    <p className="card-text text-danger">-2.5% from last week</p>
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="card h-100">
                  <div className="card-body">
                    <h6 className="card-subtitle mb-2 text-muted">TRANSACTIONS TODAY</h6>
                    <h5 className="card-title">R 12,543</h5>
                    <p className="card-text text-success">+18% from yesterday</p>
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="card h-100">
                  <div className="card-body">
                    <h6 className="card-subtitle mb-2 text-muted">NON-USERS</h6>
                    <h5 className="card-title">342</h5>
                    <p className="card-text text-danger">-4% from yesterday</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="row g-4">
              <div className="col-12 col-md-8">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">TOKEN TRANSACTION OVERVIEW</h5>
                    <div className="position-relative" style={{ height: "250px" }}>
                      <div className="d-flex align-items-end h-100">
                        {currentData.map((value, index) => (
                          <div key={index} className="flex-fill mx-1">
                            <div className="bg-dark" style={{ height: `${(value / Math.max(...currentData)) * 100}%` }}></div>
                          </div>
                        ))}
                      </div>
                      <div className="position-absolute top-0 start-0 h-100 d-flex flex-column justify-content-between text-muted p-2">
                        {yLabels.map((label, index) => (
                          <span key={index}>{label}</span>
                        ))}
                      </div>
                    </div>
                    <div className="d-flex justify-content-between text-muted mt-2 overflow-auto">
                      {currentLabels.map((label, index) => (
                        <span key={index} style={{ minWidth: "40px", textAlign: "center" }}>{label}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">RECENT LOGINS</h5>
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <span className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: "30px", height: "30px" }}>T</span>
                          <div>
                            <p className="mb-0 fw-bold">Thabo Mbeki</p>
                            <small className="text-muted">2023-11-14</small>
                          </div>
                        </div>
                        <span className="text-success">+R 2500.00</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <span className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: "30px", height: "30px" }}>N</span>
                          <div>
                            <p className="mb-0 fw-bold">Nthabiseng Mbatha</p>
                            <small className="text-muted">2023-11-13</small>
                          </div>
                        </div>
                        <span className="text-danger">-R 1000.00</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <span className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: "30px", height: "30px" }}>S</span>
                          <div>
                            <p className="mb-0 fw-bold">Siya Kolisi</p>
                            <small className="text-muted">2023-11-10</small>
                          </div>
                        </div>
                        <span className="text-success">+R 500.00</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <span className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: "30px", height: "30px" }}>T</span>
                          <div>
                            <p className="mb-0 fw-bold">Trevor Noah</p>
                            <small className="text-muted">2023-11-11</small>
                          </div>
                        </div>
                        <span className="text-danger">-R 750.00</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <span className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: "30px", height: "30px" }}>P</span>
                          <div>
                            <p className="mb-0 fw-bold">Patrice Motsepe</p>
                            <small className="text-muted">2023-11-10</small>
                          </div>
                        </div>
                        <span className="text-success">+R 2500.00</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
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
      </div>
    </div>
  );
};

export default Dashboard;