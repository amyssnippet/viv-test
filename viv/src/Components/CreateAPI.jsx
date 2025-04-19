import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import Cookies from "js-cookie"
import { jwtDecode } from "jwt-decode"

const EndpointCreationUI = () => {
  const [formData, setFormData] = useState({
    name: '',
    tokens: 5000,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newEndpoint, setNewEndpoint] = useState(null);
  const [userData, setUserData] = useState(null);
  const userToken = Cookies.get("authToken");
  const isUserLoggedIn = !!userToken;

  useEffect(() => {
      if (isUserLoggedIn) {
        try {
          const decodedToken = jwtDecode(userToken)
          setUserData(decodedToken)
          // console.log("User data:", decodedToken)
        } catch (error) {
          console.error("Error decoding token:", error)
          setUserData(null)
        }
      }
    }, [isUserLoggedIn, userToken])

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
      const response = await axios.post(`https://cp.cosinv.com:4000/api/v1/create-endpoint/${userData.userId}`, formData);
      
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
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h3 className="mb-0">Create New API Endpoint</h3>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Endpoint Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    placeholder="My Cool API Endpoint"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  <Form.Text className="text-muted">
                    Choose a descriptive name for your API endpoint
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Initial Token Balance</Form.Label>
                  <Form.Control
                    type="number"
                    name="tokens"
                    placeholder="1000"
                    value={formData.tokens}
                    onChange={handleChange}
                    min="100"
                  />
                  <Form.Text className="text-muted">
                    Set the initial number of tokens for this endpoint (default: 1000)
                  </Form.Text>
                </Form.Group>

                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Creating...
                    </>
                  ) : "Create API Endpoint"}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {newEndpoint && (
            <Card className="shadow mt-4">
              <Card.Header className="bg-success text-white">
                <h4 className="mb-0">Endpoint Created Successfully</h4>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <strong>Endpoint Name:</strong> {newEndpoint.toolName}
                </div>
                <div className="mb-3">
                  <strong>Endpoint ID:</strong> 
                  <code className="ms-2 p-1 bg-light">{newEndpoint.endpoint}</code>
                </div>
                <div className="mb-3">
                  <strong>Token Balance:</strong> {newEndpoint.tokens}
                </div>
                <Alert variant="warning">
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

export default EndpointCreationUI;