"use client"

import { ThreeDots } from "react-loader-spinner"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "bootstrap/dist/css/bootstrap.min.css"
import {
  LayoutDashboard,
  MessageCircle,
  RefreshCw,
  Plus,
  Shield,
  Clock,
  Database,
  Play,
  Code,
  Copy,
  CheckCircle,
} from "lucide-react"
import { ScaleLoader } from "react-spinners"
import "../App.css"
import axios from "axios"
import Cookies from "js-cookie"
import { jwtDecode } from "jwt-decode"
import { Link } from "react-router-dom"
import { Card, Form, Button, Alert, Spinner, Badge } from "react-bootstrap"
import useDeleteTool from "../hooks/useDeleteTool"
import { Trash2Icon, LucideLayoutDashboard, Settings, ExternalLink, LogOut } from "lucide-react"
import BACKENDURL from "./urls"
import ProfileModal from "./profile-modal"
import toast from "react-hot-toast"

const Dashboard = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("Monthly")
  const [currentSection, setCurrentSection] = useState("Dashboard")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [userData, setUserData] = useState(null)
  const userToken = Cookies.get("authToken")
  const isUserLoggedIn = !!userToken
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [tools, setTools] = useState([])
  const [count, setCount] = useState("")
  const [showEndpointModal, setShowEndpointModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [newEndpoint, setNewEndpoint] = useState(null)
  const userId = userData?.userId
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [user, setUser] = useState(null)

  const handleLogOut = () => {
    Cookies.remove("authToken")
    navigate("/auth")
    toast.success("Logged out successfully")
  }

  const handleOpenProfileModal = () => {
    setIsProfileModalOpen(true)
  }

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false)
  }

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser)
    // Update userData as well
    if (userData) {
      setUserData({
        ...userData,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        profilePic: updatedUser.profile,
      })
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(userData?.userId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const displayId = userData?.userId ? `${userData.userId}` : "Loading..."

  const {
    deleteTool,
    loading: deleteLoading,
    error: deleteError,
  } = useDeleteTool(userId, (deletedEndpoint) => {
    setTools((prev) => prev.filter((tool) => tool.endpoint !== deletedEndpoint))
  })

  const handleDelete = (endpoint) => {
    if (confirm("Are you sure you want to delete this tool?")) {
      deleteTool(endpoint)
    }
  }

  useEffect(() => {
    if (isUserLoggedIn) {
      try {
        const decodedToken = jwtDecode(userToken)
        console.log(decodedToken)
        setUserData(decodedToken)
      } catch (error) {
        console.error("Error decoding token:", error)
        setUserData(null)
      }
    }
  }, [isUserLoggedIn, userToken])

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

  const fetchDeveloper = async () => {
    try {
      setIsRefreshing(true)
      const response = await axios.post(`${BACKENDURL}/fetch/developerToken`, { userId: userData.userId })
      setTools(response.data.developerTools)
      setLastUpdated(new Date())
    } catch (error) {
      return
    } finally {
      setIsRefreshing(false)
    }
  }

  const fetchUserCount = async () => {
    try {
      const res = await axios.post(`${BACKENDURL}/count`, { userId: userData.userId })
      setCount(res.data.count)
    } catch (error) {
      return
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Only run this effect when Dashboard section is active
    if (currentSection === "Dashboard" && userData?.userId) {
      // Set up interval for real-time updates
      const intervalId = setInterval(() => {
        fetchDeveloper()
        fetchUserCount()
      }, 100000)

      // Initial fetch
      fetchDeveloper()
      fetchUserCount()
      fetchUser()

      // Clean up interval on component unmount or when section changes
      return () => clearInterval(intervalId)
    }
  }, [currentSection, userData])

  const handleSectionChange = (section) => setCurrentSection(section)

  const handleManualRefresh = () => {
    if (currentSection === "Dashboard" && userData?.userId) {
      fetchDeveloper()
      fetchUserCount()
    }
  }

  const Playground = () => {
    const [formData, setFormData] = useState({
      userId: userData?.userId,
      prompt: "What are your capabilities",
      model: "Numax",
      instructions: "You are a smart AI",
      stream: false,
      endpoint: "",
    })

    const [response, setResponse] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [copied, setCopied] = useState(false)

    const handleChange = (e) => {
      const { name, value } = e.target
      const newValue = name === "stream" ? e.target.checked : value

      setFormData({
        ...formData,
        [name]: newValue,
      })
    }

    const handleSubmit = async (e) => {
      e.preventDefault()
      setLoading(true)
      setError(null)
      setResponse(null)

      try {
        if (!formData.endpoint) {
          throw new Error("Endpoint ID is required")
        }

        const payload = {
          userId: formData.userId,
          prompt: formData.prompt,
          model: formData.model,
          instructions: formData.instructions,
          stream: formData.stream,
        }

        const response = await axios.post(`${BACKENDURL}/completionsforPG/${formData.endpoint}`, payload)

        setResponse(response.data)
      } catch (err) {
        setError(err.response?.data?.message || err.message || "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    const copyToClipboard = () => {
      if (response) {
        navigator.clipboard.writeText(JSON.stringify(response, null, 2))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }

    return (
      <div className="container-fluid p-0">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="text-white mb-1">API Playground</h2>
            <p className="text-white-50 mb-0">Test your API endpoints with different parameters</p>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-md-6">
            <Card className="shadow-sm h-100" style={{ background: "#1E1E1F", borderRadius: "12px", border: "none" }}>
              <Card.Header className="py-3" style={{ background: "#252526", borderBottom: "1px solid #333" }}>
                <h5 className="mb-0 text-white d-flex align-items-center">
                  <Code className="me-2" size={18} />
                  Request Parameters
                </h5>
              </Card.Header>
              <Card.Body>
                {error && (
                  <Alert variant="danger" className="animate__animated animate__shakeX mb-4">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium text-white">Endpoint ID</Form.Label>
                    <Form.Control
                      type="text"
                      name="endpoint"
                      placeholder="Enter your endpoint ID"
                      value={formData.endpoint}
                      onChange={handleChange}
                      required
                      style={{
                        background: "#2A2A2B",
                        border: "1px solid #444",
                        borderRadius: "6px",
                        padding: "10px 12px",
                        color: "white",
                      }}
                    />
                    <Form.Text style={{ color: "#f2f2f2" }}>The endpoint ID from your dashboard</Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium text-white">User ID</Form.Label>
                    <Form.Control
                      type="text"
                      name="userId"
                      value={formData.userId}
                      onChange={handleChange}
                      required
                      style={{
                        background: "#2A2A2B",
                        color: "white",
                        border: "1px solid #444",
                        borderRadius: "6px",
                        padding: "10px 12px",
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium text-white">Prompt</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="prompt"
                      value={formData.prompt}
                      onChange={handleChange}
                      required
                      style={{
                        background: "#2A2A2B",
                        color: "white",
                        border: "1px solid #444",
                        borderRadius: "6px",
                        padding: "10px 12px",
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium text-white">Model</Form.Label>
                    <Form.Control
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      required
                      style={{
                        background: "#2A2A2B",
                        color: "white",
                        border: "1px solid #444",
                        borderRadius: "6px",
                        padding: "10px 12px",
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium text-white">Instructions</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="instructions"
                      value={formData.instructions}
                      onChange={handleChange}
                      style={{
                        background: "#2A2A2B",
                        color: "white",
                        border: "1px solid #444",
                        borderRadius: "6px",
                        padding: "10px 12px",
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Check
                      type="switch"
                      id="stream-switch"
                      label="Stream Response"
                      name="stream"
                      checked={formData.stream}
                      onChange={handleChange}
                      className="text-white"
                    />
                    <Form.Text style={{ color: "#f2f2f2" }}>Enable streaming for real-time responses</Form.Text>
                  </Form.Group>
                  <div className="d-flex justify-content-center">
                    <Button
                      type="submit"
                      className="w-50 d-flex align-items-center justify-content-center btn btn-secondary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Play size={16} className="me-2" />
                          Run Completion
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </div>

          <div className="col-md-6">
            <Card className="shadow-sm h-100" style={{ background: "#1E1E1F", borderRadius: "12px", border: "none" }}>
              <Card.Header
                className="py-3 d-flex justify-content-between align-items-center"
                style={{ background: "#252526", borderBottom: "1px solid #333" }}
              >
                <h5 className="mb-0 text-white">Response</h5>
                {response && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={copyToClipboard}
                    style={{ borderRadius: "6px" }}
                  >
                    {copied ? (
                      <>
                        <CheckCircle size={14} className="me-1" />
                      </>
                    ) : (
                      <>
                        <Copy size={14} className="me-1" />
                      </>
                    )}
                  </Button>
                )}
              </Card.Header>
              <Card.Body
                style={{
                  background: "#1E1E1F",
                  maxHeight: "600px",
                  overflowY: "auto",
                }}
              >
                {loading ? (
                  <div className="d-flex justify-content-center align-items-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <span className="ms-3 text-white">Fetching response...</span>
                  </div>
                ) : response ? (
                  <pre
                    style={{
                      background: "#252526",
                      color: "#e6e6e6",
                      padding: "1rem",
                      borderRadius: "6px",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      maxHeight: "100%",
                      overflowY: "auto",
                    }}
                  >
                    {JSON.stringify(response, null, 2)}
                  </pre>
                ) : (
                  <div className="text-center py-5 text-white-50 d-flex flex-column align-items-center">
                    <Code size={48} className="mb-3" />
                    <p>Response will appear here after you run a completion</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const EndpointCreationUI = ({ onClose }) => {
    const [formData, setFormData] = useState({
      name: "",
      tokens: 5000,
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleChange = (e) => {
      const { name, value } = e.target
      setFormData({
        ...formData,
        [name]: name === "tokens" ? Number.parseInt(value, 10) : value,
      })
    }

    const handleSubmit = async (e) => {
      e.preventDefault()
      setLoading(true)
      setError(null)

      try {
        const response = await axios.post(`${BACKENDURL}/create-endpoint/${userData.userId}`, formData)

        if (response.data.success) {
          setNewEndpoint(response.data)
          fetchDeveloper() // Refresh tools list
          setShowEndpointModal(false) // Close creation modal
          setShowSuccessModal(true) // Open success modal
          setFormData({ name: "", tokens: 5000 }) // Reset form
        }
      } catch (err) {
        setError(err.response?.data?.message || "An error occurred while creating the endpoint")
      } finally {
        setLoading(false)
      }
    }

    return (
      <>
        <div className="modal-body">
          {error && (
            <Alert variant="danger" className="animate__animated animate__shakeX">
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3 animate__animated animate__fadeIn" style={{ animationDelay: "0.1s" }}>
              <Form.Label className="fw-bold text-white">Endpoint Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                placeholder="My Cool API Endpoint"
                value={formData.name}
                onChange={handleChange}
                required
                className="shadow-sm api-input"
                style={{
                  background: "#2A2A2B",
                  color: "white",
                  border: "1px solid #444",
                  borderRadius: "6px",
                  padding: "10px 12px",
                }}
              />
            </Form.Group>

            <div className="modal-footer">
              <Button type="button" className="btn btn-danger" onClick={onClose} style={{ borderRadius: "6px" }}>
                Close
              </Button>
              <Button type="submit" className="btn btn-secondary" disabled={loading}>
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
    )
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#232223",
        }}
      >
        <div className="text-center">
          <ScaleLoader color="#0070f3" height={50} width={5} radius={2} margin={2} />
          <p className="mt-3 text-white-50">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="d-flex flex-column flex-md-row min-vh-100">
      {/* Mobile Sidebar */}
      <div
        className={`mobile-sidebar-overlay ${isSidebarOpen ? "open" : ""} d-md-none`}
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
            padding: "20px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h1 className="h4 fw-bold text-light mb-4">VIV AI</h1>
          <ul className="nav flex-column" style={{ flex: 1 }}>
            <li className="nav-item mb-2">
              <Link className="nav-link d-flex align-items-center text-light" to="/">
                <span className="me-2">
                  <MessageCircle />
                </span>
                Chats
              </Link>
            </li>
            <li className="nav-item mb-2">
              <a
                href="#"
                className={`nav-link d-flex align-items-center text-light ${currentSection === "Dashboard" ? "active" : ""}`}
                onClick={() => handleSectionChange("Dashboard")}
              >
                <span className="me-2">
                  <LayoutDashboard />
                </span>{" "}
                Dashboard
              </a>
            </li>
            <li className="nav-item mb-2">
              <a
                href="#"
                className={`nav-link d-flex align-items-center text-light ${currentSection === "Playground" ? "active" : ""}`}
                onClick={() => handleSectionChange("Playground")}
              >
                <span className="me-2">
                  <Code />
                </span>{" "}
                Playground
              </a>
            </li>
          </ul>

          {/* Mobile Sidebar Footer */}
          <div className="sidebar-footer mobile">
            <div className="sidebar-footer-content">
              <div className="d-flex">
                <div className="dropdown">
                  {!user?.profile ? (
                    <ThreeDots
                      height="35"
                      width="35"
                      radius="9"
                      color="#ffffff"
                      ariaLabel="three-dots-loading"
                      wrapperStyle={{}}
                      visible={true}
                    />
                  ) : (
                    <img
                      src={user?.profile || "/placeholder.svg"}
                      referrerPolicy="no-referrer"
                      alt="Profile"
                      className="dropdown-toggle"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #444",
                        cursor: "pointer",
                      }}
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = "/default-avatar.png"
                      }}
                    />
                  )}
                  <ul
                    className="dropdown-menu dropdown-menu-end p-2"
                    style={{
                      backgroundColor: "#2E2F2E",
                      border: "1px solid #444",
                      minWidth: "250px",
                      fontSize: "14px",
                    }}
                  >
                    <li className="text-white px-3 py-2" style={{ fontWeight: "bold" }}>
                      {user?.email}
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <button
                        className="dropdown-item text-white d-flex align-items-center"
                        style={{ backgroundColor: "transparent" }}
                        onClick={handleOpenProfileModal}
                        data-profile-toggle
                      >
                        <Settings className="me-2" size={16} /> Settings
                      </button>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <a
                        href="https://cosinv.com/help-faq"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dropdown-item text-white d-flex align-items-center"
                        style={{ backgroundColor: "transparent" }}
                      >
                        <ExternalLink className="me-2" size={16} /> Help & FAQ
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://cosinv.com/release-notes"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dropdown-item text-white d-flex align-items-center"
                        style={{ backgroundColor: "transparent" }}
                      >
                        <ExternalLink className="me-2" size={16} /> Release notes
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://cosinv.com/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dropdown-item text-white d-flex align-items-center"
                        style={{ backgroundColor: "transparent" }}
                      >
                        <ExternalLink className="me-2" size={16} /> Terms & policies
                      </a>
                    </li>

                    <li>
                      <hr className="dropdown-divider" />
                    </li>

                    <li>
                      <button
                        onClick={handleLogOut}
                        className="dropdown-item text-white d-flex align-items-center"
                        style={{ backgroundColor: "transparent" }}
                      >
                        <LogOut className="me-2" size={16} /> Log out
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div
        className="col-3 sidebar d-none d-md-block"
        style={{
          backgroundColor: "#171717",
          color: "white",
          height: "100vh",
          padding: "20px",
          boxShadow: "2px 0 10px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h1 className="h4 fw-bold text-light mb-4">VIV AI</h1>
        <ul className="nav flex-column" style={{ flex: 1 }}>
          <li className="nav-item mb-3">
            <Link
              className="nav-link d-flex align-items-center text-light rounded py-2 px-3 transition-all"
              to="/"
              style={{
                transition: "all 0.2s ease",
                hover: { backgroundColor: "rgba(255,255,255,0.1)" },
              }}
            >
              <span className="me-2">
                <MessageCircle />
              </span>
              Chats
            </Link>
          </li>
          <li className="nav-item mb-3">
            <a
              href="#"
              className={`nav-link d-flex align-items-center rounded py-2 px-3 ${
                currentSection === "Dashboard" ? "text-white bg-secondary" : "text-light hover-bg-light-10"
              }`}
              onClick={() => handleSectionChange("Dashboard")}
              style={{ transition: "all 0.2s ease" }}
            >
              <span className="me-2">
                <LayoutDashboard />
              </span>{" "}
              Dashboard
            </a>
          </li>
          <li className="nav-item mb-3">
            <a
              href="#"
              className={`nav-link d-flex align-items-center rounded py-2 px-3 ${
                currentSection === "Playground" ? "text-white bg-secondary" : "text-light hover-bg-light-10"
              }`}
              onClick={() => handleSectionChange("Playground")}
              style={{ transition: "all 0.2s ease" }}
            >
              <span className="me-2">
                <Code />
              </span>{" "}
              Playground
            </a>
          </li>
        </ul>

        {/* Desktop Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-content">
            <div className="d-flex">
              <div className="dropdown">
                {!user?.profile ? (
                  <ThreeDots
                    height="35"
                    width="35"
                    radius="9"
                    color="#ffffff"
                    ariaLabel="three-dots-loading"
                    wrapperStyle={{}}
                    visible={true}
                  />
                ) : (
                  <img
                    src={user?.profile || "/placeholder.svg"}
                    referrerPolicy="no-referrer"
                    alt="Profile"
                    className="dropdown-toggle"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #444",
                      cursor: "pointer",
                    }}
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "/default-avatar.png"
                    }}
                  />
                )}
                <ul
                  className="dropdown-menu dropdown-menu-end p-2"
                  style={{
                    backgroundColor: "#2E2F2E",
                    border: "1px solid #444",
                    minWidth: "250px",
                    fontSize: "14px",
                  }}
                >
                  <li className="text-white px-3 py-2" style={{ fontWeight: "bold" }}>
                    {user?.email}
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>

                  <li>
                    <button
                      className="dropdown-item text-white d-flex align-items-center"
                      style={{ backgroundColor: "transparent" }}
                      onClick={handleOpenProfileModal}
                      data-profile-toggle
                    >
                      <Settings className="me-2" size={16} /> Settings
                    </button>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <a
                      href="https://cosinv.com/help-faq"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dropdown-item text-white d-flex align-items-center"
                      style={{ backgroundColor: "transparent" }}
                    >
                      <ExternalLink className="me-2" size={16} /> Help & FAQ
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://cosinv.com/release-notes"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dropdown-item text-white d-flex align-items-center"
                      style={{ backgroundColor: "transparent" }}
                    >
                      <ExternalLink className="me-2" size={16} /> Release notes
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://cosinv.com/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dropdown-item text-white d-flex align-items-center"
                      style={{ backgroundColor: "transparent" }}
                    >
                      <ExternalLink className="me-2" size={16} /> Terms & policies
                    </a>
                  </li>

                  <li>
                    <hr className="dropdown-divider" />
                  </li>

                  <li>
                    <button
                      onClick={handleLogOut}
                      className="dropdown-item text-white d-flex align-items-center"
                      style={{ backgroundColor: "transparent" }}
                    >
                      <LogOut className="me-2" size={16} /> Log out
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Settings Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfileModal}
        userData={userData}
        user={user}
        onUserUpdate={handleUserUpdate}
      />

      {/* Main Content */}
      <div
        className="flex-grow-1 p-3 p-md-5"
        style={{
          height: "100vh",
          overflowY: "auto",
          paddingRight: "1rem",
          background: "#232223",
        }}
      >
        <button
          className="btn text-white d-md-none mb-4"
          onClick={() => setSidebarOpen(true)}
          style={{ background: "#1E1E1F", borderRadius: "8px" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="white"
            className="bi bi-list"
            viewBox="0 0 16 16"
          >
            <path
              fillRule="evenodd"
              d="M2.5 12.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm0-4a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm0-4a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11z"
            />
          </svg>
        </button>

        {currentSection === "Dashboard" && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="text-white mb-1">Developer Dashboard</h2>
                <p className="text-white-50 mb-0">Manage your API endpoints and monitor usage</p>
              </div>
              <div className="d-flex gap-2">
                <Button
                  className="d-flex align-items-center"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  style={{
                    background: "#2A2A2B",
                    borderColor: "#444",
                    borderRadius: "6px",
                  }}
                >
                  <RefreshCw size={16} className={`me-2 ${isRefreshing ? "spin" : ""}`} />
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
                <Button
                  className="d-flex align-items-center btn btn-secondary"
                  onClick={() => setShowEndpointModal(true)}
                >
                  <Plus size={16} className="me-2" />
                  Create Endpoint
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div
                  className="card h-100 shadow-sm"
                  style={{ background: "#1E1E1F", borderRadius: "12px", border: "none" }}
                >
                  <div className="card-body d-flex align-items-center">
                    <div className="rounded-circle p-3 me-3" style={{ background: "rgba(0, 0, 0, 0.31)" }}>
                      <Database size={24} color="#fff" />
                    </div>
                    <div>
                      <h6 className="text-white-50 mb-1">Total Endpoints</h6>
                      <h3 className="text-white mb-0">{tools.length}</h3>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div
                  className="card h-100 shadow-sm"
                  style={{ background: "#1E1E1F", borderRadius: "12px", border: "none" }}
                >
                  <div className="card-body d-flex align-items-center">
                    <div className="rounded-circle p-3 me-3" style={{ background: "rgba(0, 0, 0, 0.31)" }}>
                      <Clock size={24} color="#fff" />
                    </div>
                    <div>
                      <h6 className="text-white-50 mb-1">Last Updated</h6>
                      <h3 className="text-white mb-0">
                        {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "Never"}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div
                  className="card h-100 shadow-sm"
                  style={{
                    background: "#1E1E1F",
                    borderRadius: "12px",
                    border: "none",
                  }}
                >
                  <div className="card-body d-flex align-items-center">
                    <div className="rounded-circle p-3 me-3" style={{ background: "rgba(0, 0, 0, 0.31)" }}>
                      <Shield size={24} color="#fff" />
                    </div>
                    <div className="d-flex flex-column">
                      <h6 className="text-white-50 mb-1">Your User ID</h6>
                      <div className="d-flex align-items-center">
                        <h5 className="text-white mb-0 me-2">{displayId}</h5>
                        <button onClick={handleCopy} className="btn btn-sm btn-outline-light" title="Copy User ID">
                          <Copy size={16} />
                        </button>
                        {copied && <small className="text-success ms-2">Copied!</small>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="card shadow-sm mb-4"
              style={{ background: "#1E1E1F", borderRadius: "12px", border: "none" }}
            >
              <div className="card-header py-3" style={{ background: "#252526", borderBottom: "1px solid #333" }}>
                <h5 className="mb-0 text-white">API Endpoints</h5>
              </div>
              <div className="card-body p-0">
                {tools.length === 0 ? (
                  <div className="text-center py-5 d-flex flex-column align-items-center justify-content-center">
                    <Database size={48} className="mb-3" />
                    <p className="text-white">No endpoints found. Create your first endpoint to get started.</p>
                    <Button
                      className=""
                      onClick={() => setShowEndpointModal(true)}
                      style={{
                        background: "#6c757d",
                        borderColor: "#6c757d",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px", // adds some space between icon and text
                      }}
                    >
                      <Plus size={16} />
                      Create Endpoint
                    </Button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-dark table-hover mb-0">
                      <thead style={{ background: "#252526" }}>
                        <tr>
                          <th className="py-3 px-4 border-0">Name</th>
                          <th className="py-3 px-4 border-0">Endpoint</th>
                          <th className="py-3 px-4 border-0">Token</th>
                          <th className="py-3 px-4 border-0">Tokens Balance</th>
                          <th className="py-3 px-4 border-0">Created At</th>
                          <th className="py-3 px-4 border-0">Last Used</th>
                          <th className="py-3 px-4 border-0 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tools.map((tool, index) => (
                          <tr key={index} style={{ background: index % 2 === 0 ? "#1E1E1F" : "#252526" }}>
                            <td className="py-3 px-4">
                              <div className="fw-medium">{tool.name}</div>
                            </td>
                            <td className="py-3 px-4">
                              <code className="bg-dark text-white px-2 py-1 rounded">{tool.endpoint}</code>
                            </td>
                            <td className="py-3 px-4">{tool.token || "—"}</td>
                            <td className="py-3 px-4">
                              <Badge bg={tool.tokens > 1000 ? "success" : "warning"} pill>
                                {tool.tokens}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="d-flex align-items-center">
                                <Clock size={14} className="me-2 text-muted" />
                                {new Date(tool.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {tool.lastUsedAt ? new Date(tool.lastUsedAt).toLocaleString() : "Never"}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(tool.endpoint)}
                                disabled={deleteLoading}
                                style={{ borderRadius: "6px" }}
                              >
                                <Trash2Icon size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        {currentSection === "Playground" && <Playground />}

        {/* Endpoint Creation Modal */}
        <div
          className={`modal fade ${showEndpointModal ? "show" : ""}`}
          id="endpointModal"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="endpointModalTitle"
          aria-hidden={!showEndpointModal}
          style={{ display: showEndpointModal ? "block" : "none" }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content" style={{ background: "#1E1E1F", borderRadius: "12px" }}>
              <div className="modal-header" style={{ borderBottom: "1px solid #333" }}>
                <h5
                  className="modal-title text-white"
                  id="endpointModalTitle"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <Plus size={16} className="me-2" />
                  Create API Endpoint
                </h5>

                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowEndpointModal(false)}
                  aria-label="Close"
                ></button>
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
          style={{ display: showSuccessModal ? "block" : "none" }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content" style={{ background: "#1E1E1F", borderRadius: "12px" }}>
              <div className="modal-header" style={{ borderBottom: "1px solid #333" }}>
                <h5 className="modal-title text-white" id="successModalTitle">
                  Endpoint Creation Success
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowSuccessModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                {newEndpoint && (
                  <Card
                    className="shadow-sm animate__animated animate__zoomIn"
                    style={{ background: "#252526", border: "none", borderRadius: "8px" }}
                  >
                    <Card.Body>
                      <div className="mb-3">
                        <strong className="text-white">Endpoint Name:</strong>{" "}
                        <span className="text-white">{newEndpoint.toolName}</span>
                      </div>
                      <div className="mb-3">
                        <strong className="text-white">Endpoint ID:</strong>
                        <code
                          className="ms-2 p-2 border rounded d-block mt-2"
                          style={{ background: "#1E1E1F", color: "white", borderColor: "#444" }}
                        >
                          {newEndpoint.endpoint}
                        </code>
                      </div>
                      <div className="mb-3">
                        <strong className="text-white">Token Balance:</strong>{" "}
                        <span className="text-success">{newEndpoint.tokens}</span>
                      </div>
                      <Alert
                        variant="success"
                        className="animate__animated animate__fadeIn mb-0 d-flex align-items-center"
                      >
                        <Shield size={16} className="me-2" />
                        Save this endpoint ID securely! You'll need it for API authentication.
                      </Alert>
                    </Card.Body>
                  </Card>
                )}
              </div>
              <div className="modal-footer" style={{ borderTop: "1px solid #333" }}>
                <Button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowSuccessModal(false)}
                  style={{
                    borderRadius: "6px",
                    background: "#0070f3",
                    borderColor: "#0070f3",
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
        {showSuccessModal && <div className="modal-backdrop fade show"></div>}
      </div>

      <style jsx>{`
        .sidebar-footer {
          padding: 1rem;
          margin-top: 130%;
          border-top: 1px solid #333;
          flex-shrink: 0;
        }

        .sidebar-footer.mobile {
          position: sticky;
          bottom: 0;
          background-color: #171717;
        }

        .sidebar-footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .mobile-sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1040;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }

        .mobile-sidebar-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default Dashboard
