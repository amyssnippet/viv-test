import { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  AlignVerticalJustifyCenter,
  Coins,
  LayoutDashboard,
  User2,
  Lock,
  Server,
  MessageCircle,
  BookOpen,
  LockIcon
} from "lucide-react";
import { RingLoader, ScaleLoader, BounceLoader } from "react-spinners";
import "../App.css";
import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import useDeleteTool from "../hooks/useDeleteTool";
import { Trash2Icon } from "lucide-react";
import BACKENDURL from "./urls";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("Monthly");
  const [currentSection, setCurrentSection] = useState("Dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const userToken = Cookies.get("authToken");
  const isUserLoggedIn = !!userToken;
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [tools, setTools] = useState([]);
  const [count, setCount] = useState("");
  const [showEndpointModal, setShowEndpointModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState(null);
  const userId = userData?.userId;


  const { deleteTool, loading, error } = useDeleteTool(userId, (deletedEndpoint) => {
    setTools(prev => prev.filter(tool => tool.endpoint !== deletedEndpoint));
  });

  const handleDelete = (endpoint) => {
    if (confirm('Are you sure you want to delete this tool?')) {
      deleteTool(endpoint);
    }
  };

  useEffect(() => {
    if (isUserLoggedIn) {
      try {
        const decodedToken = jwtDecode(userToken);
        setUserData(decodedToken);
        console.log("User data:", decodedToken);
      } catch (error) {
        console.error("Error decoding token:", error);
        setUserData(null);
      }
    }
  }, [isUserLoggedIn, userToken]);

  useEffect(() => {
    if (userData?.userId) {
      fetchDeveloper();
      fetchUserCount();
    }
  }, [userData]);

  const fetchDeveloper = async () => {
    try {
      const response = await axios.post(`${BACKENDURL}/fetch/developerToken`, { userId: userData.userId });
      setTools(response.data.developerTools);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (userData?.userId) {
      fetchDeveloper();
    }
  }, [tools]);

  const fetchUserCount = async () => {
    try {
      const res = await axios.post(`${BACKENDURL}/count`, { userId: userData.userId });
      setCount(res.data.count);
    } catch (error) {
      console.error("Error fetching count:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSectionChange = (section) => setCurrentSection(section);

  const UserProfile = () => {
    const [profileData, setProfileData] = useState({
      name: userData?.fullName || "",
      email: userData?.email || "",
      password: "",
      profilePic: ""
    });

    useEffect(() => {
      if (userData) {
        const initialData = {
          name: userData.fullName || "",
          email: userData.email || "",
          password: "",
          profilePic: userData.profilePic || ""
        };
        setProfileData(initialData);
        setSavedProfileData(initialData);
        setImagePreview(userData.profilePic || null);
      }
    }, [userData]);
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [isChangePasswordPopupOpened, setIsChangePasswordPopupOpened] = useState(false);
    const [isDataChanged, setIsDataChanged] = useState(false);
    const [savedProfileData, setSavedProfileData] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [alertInfo, setAlertInfo] = useState({ show: false, message: "", variant: "" });
    const fileInputRef = useRef(null);

    const handleInputChange = (field, value) => {
      setProfileData({ ...profileData, [field]: value });
      setIsDataChanged(true);
    };

    const handleChangePassword = () => setIsChangePasswordPopupOpened(true);

    const handlePasswordSave = () => {
      if (newPassword !== confirmPassword) {
        setAlertInfo({
          show: true,
          message: "New password and confirm password do not match",
          variant: "danger"
        });
        return;
      }
      if (newPassword) {
        handleSave(true);
        setIsChangePasswordPopupOpened(false);
      }
    };

    const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setUploadingImage(true);

      if (file.size > 5 * 1024 * 1024) {
        setAlertInfo({
          show: true,
          message: "Image size should not exceed 5MB",
          variant: "danger"
        });
        setUploadingImage(false);
        return;
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setAlertInfo({
          show: true,
          message: "Only JPG, PNG, GIF, and WEBP formats are supported",
          variant: "danger"
        });
        setUploadingImage(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result;
        setImagePreview(base64String);
        handleInputChange("profilePic", base64String);
        setUploadingImage(false);
        setIsDataChanged(true);
      };
      reader.onerror = () => {
        setAlertInfo({
          show: true,
          message: "Error reading file",
          variant: "danger"
        });
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    };

    const handleSave = async (isPasswordChange = false) => {
      try {
        const saveData = {
          userId: userData.userId,
          name: profileData.name,
          email: profileData.email
        };

        if (isPasswordChange) {
          saveData.password = newPassword;
        } else if (profileData.profilePic !== savedProfileData.profilePic) {
          saveData.profilePic = profileData.profilePic;
        }

        const response = await axios.post(
          `${BACKENDURL}/updateUser`,
          saveData, { userId: userData.userId }
        );
        setAlertInfo({
          show: true,
          message: isPasswordChange ? "Password updated successfully" : "Profile data saved successfully",
          variant: "success"
        });

        setTimeout(() => {
          setAlertInfo({ show: false, message: "", variant: "" });
        }, 3000);

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
        setAlertInfo({
          show: true,
          message: error.response?.data?.error || "Failed to save profile data",
          variant: "danger"
        });
      }
    };

    const handleCancel = () => {
      setProfileData(savedProfileData);
      setImagePreview(savedProfileData.profilePic || null);
      setIsDataChanged(false);
    };

    const triggerFileInput = () => {
      fileInputRef.current.click();
    };

    const removeProfilePicture = () => {
      setImagePreview(null);
      handleInputChange("profilePic", "");
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
          {alertInfo.show && (
            <Alert variant={alertInfo.variant} onClose={() => setAlertInfo({ ...alertInfo, show: false })} dismissible>
              {alertInfo.message}
            </Alert>
          )}

          <div className="row">
            <div className="col-md-4 mb-4 d-flex flex-column align-items-center">
              <div
                className="profile-pic-container mb-3 position-relative"
                style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: '#222',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  border: '3px solid #333'
                }}
              >
                {uploadingImage ? (
                  <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-75">
                    <BounceLoader color="#007bff" size={60} />
                  </div>
                ) : (
                  imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <User2 size={80} color="#666" />
                  )
                )}
              </div>

              <div className="d-flex gap-2 mb-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="d-none"
                  accept="image/png, image/jpeg, image/gif, image/webp"
                />
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={triggerFileInput}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? 'Uploading...' : 'Change Photo'}
                </button>

                {imagePreview && (
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={removeProfilePicture}
                    disabled={uploadingImage}
                  >
                    Remove
                  </button>
                )}
              </div>
              <small className="text-white text-center">
                Recommended: Square JPG, PNG, GIF or WEBP<br />Max size: 5MB
              </small>
            </div>

            <div className="col-md-8">
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
                  <input
                    type="password"
                    className="form-control"
                    value="********"
                    disabled
                    style={{ background: '#161617', color: 'white', border: '1px solid #222222' }}
                  />
                </div>
              </div>
              <Button className="bg-[#222222] text-black" onClick={handleChangePassword}>
                Change Password
              </Button>
            </div>
          </div>
        </div>

        <div className={`modal fade ${isChangePasswordPopupOpened ? "show d-block" : ""}`} tabIndex="-1" role="dialog" aria-labelledby="changePasswordModal" style={{ display: isChangePasswordPopupOpened ? 'block' : 'none', background: isChangePasswordPopupOpened ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ background: '#222222' }}>
              <div className="modal-header">
                <h5 className="modal-title" id="changePasswordModal">Change Password</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsChangePasswordPopupOpened(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    style={{ background: '#161617', color: 'white' }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ background: '#161617', color: 'white' }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ background: '#161617', color: 'white' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsChangePasswordPopupOpened(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handlePasswordSave}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EndpointCreationUI = ({ onClose }) => {
    const [formData, setFormData] = useState({
      name: '',
      tokens: 5000,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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

      try {
        const response = await axios.post(
          `${BACKENDURL}/create-endpoint/${userData.userId}`,
          formData
        );

        if (response.data.success) {
          setNewEndpoint(response.data);
          fetchDeveloper(); // Refresh tools list
          setShowEndpointModal(false); // Close creation modal
          setShowSuccessModal(true); // Open success modal
          setFormData({ name: '', tokens: 5000 }); // Reset form
        }
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred while creating the endpoint');
      } finally {
        setLoading(false);
      }
    };

    return (
      <>
        <div className="modal-body">
          {error && (
            <Alert variant="danger" className="animate__shakeX">
              {error}
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
                className="shadow-sm api-input"
                style={{ background: '#161617', color: 'white' }}
              />
            </Form.Group>

            <div className="modal-footer">
              <Button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Close
              </Button>
              <Button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
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
        </div>
      </>
    );
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="loader">
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column flex-md-row min-vh-100">
      {/* Mobile Sidebar */}
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
              <Link className="nav-link d-flex align-items-center text-light" to="/">
                <span className="me-2"><MessageCircle /></span>Chats
              </Link>
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
          </ul>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div
        className="col-3 sidebar d-none d-md-block"
        style={{ backgroundColor: "#171717", color: 'white', height: "100vh", padding: '20px' }}
      >
        <h1 className="h4 fw-bold text-light mb-4">VIV AI</h1>
        <ul className="nav flex-column">
          <li className="nav-item mb-2">
            <Link className="nav-link d-flex align-items-center text-light" to="/chat">
              <span className="me-2"><MessageCircle /></span>Chats
            </Link>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="card h-100" style={{ background: '#161617', color: 'white' }}>
                </div>
              </div>
              <Button
                className="bg-black"
                style={{ border: 'none' }}
                onClick={() => setShowEndpointModal(true)}
              >
                Create
              </Button>
            </div>

            <h2 className="text-white mt-4">Tokens</h2>
            <div className="row g-4 text-white">
              {tools.length === 0 ? (
                <p>No tools found.</p>
              ) : (
                <div className="overflow-x-auto w-full mt-3">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-[#161617] text-white">
                        <th className="p-3 text-left">Name</th>
                        <th className="p-3 text-left">Endpoint</th>
                        <th className="p-3 text-left">Token</th>
                        <th className="p-3 text-left">Tokens Balance</th>
                        <th className="p-3 text-left">Created At</th>
                        <th className="p-3 text-left">Last Used</th>
                        <th className="p-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tools.map((tool, index) => (
                        <tr
                          key={index}
                          className={`text-white ${index % 2 === 0 ? 'bg-[#232223]' : 'bg-[#313031]'}`}
                        >
                          <td className="p-3">{tool.name}</td>
                          <td className="p-3">{tool.endpoint}</td>
                          <td className="p-3">{tool.token || '—'}</td>
                          <td className="p-3">{tool.tokens}</td>
                          <td className="p-3">{new Date(tool.createdAt).toLocaleString()}</td>
                          <td className="p-3">
                            {tool.lastUsedAt ? new Date(tool.lastUsedAt).toLocaleString() : 'Never'}
                          </td>
                          <td className="p-3">
                            <button
                              className="btn btn-danger btn-sm d-flex align-items-center justify-content-center"
                              onClick={() => handleDelete(tool.endpoint)}
                            >
                              <Trash2Icon />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
        {currentSection === "Profile" && <UserProfile />}

        {/* Endpoint Creation Modal */}
        <div
          className={`modal fade ${showEndpointModal ? "show" : ""}`}
          id="endpointModal"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="endpointModalTitle"
          aria-hidden={!showEndpointModal}
          style={{ display: showEndpointModal ? 'block' : 'none' }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content" style={{ background: '#222222', color: 'white' }}>
              <div className="modal-header">
                <h5 className="modal-title" id="endpointModalTitle">Create API Endpoint</h5>
                {/* <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowEndpointModal(false)}
                  aria-label="Close"
                ></button> */}
              </div>
              <EndpointCreationUI onClose={() => setShowEndpointModal(false)} />
            </div>
          </div>
        </div>
        {showEndpointModal && <div className="modal-backdrop fade show"></div>}

        {/* Success Modal */}
        <div
          className={`modal fade ${showSuccessModal ? "show" : ""}`}
          id="successModal"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="successModalTitle"
          aria-hidden={!showSuccessModal}
          style={{ display: showSuccessModal ? 'block' : 'none' }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content" style={{ background: '#222222', color: 'white' }}>
              <div className="modal-header">
                <h5 className="modal-title" id="successModalTitle">Endpoint Creation Success</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowSuccessModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                {newEndpoint && (
                  <Card className="shadow mt-4 animate__zoomIn" style={{ background: '#161617' }}>
                    {/* <Card.Header className="bg-gradient-success text-white">
                      <h4 className="mb-0 text-start">Endpoint Created Successfully</h4>
                    </Card.Header> */}
                    <Card.Body>
                      <div className="mb-3">
                        <strong className="text-white">Endpoint Name:</strong> <span className="text-white" style={{ color: 'white' }}>{newEndpoint.toolName}</span>
                      </div>
                      <div className="mb-3">
                        <strong className="text-white">Endpoint ID:</strong>
                        <code className="ms-2 p-2 border rounded" style={{ background: '#313031', color: 'white' }}>{newEndpoint.endpoint}</code>
                      </div>
                      <div className="mb-3">
                        <strong className="text-white ">Token Balance:</strong> <span class="text-success">{newEndpoint.tokens}</span>
                      </div>
                      <Alert variant=" alert alert-success text-success" className="animate__fadeIn">
                        <i className="bi bi-shield-lock "></i>
                        Save this endpoint ID securely! You'll need it for API authentication.
                      </Alert>
                    </Card.Body>
                  </Card>
                )}
              </div>
              <div className="modal-footer">
                <Button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSuccessModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
        {showSuccessModal && <div className="modal-backdrop fade show"></div>}
      </div>
    </div>
  );
};

export default Dashboard;