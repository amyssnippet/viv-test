import React, { useState } from 'react';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import axios from 'axios';
import toast from 'react-hot-toast';
import Cookies from "js-cookie";
import { useNavigate } from 'react-router-dom';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: Arial, sans-serif;
  }

  body {
    background-color: ${props => props.theme.bodyBg};
    color: ${props => props.theme.textColor};
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }
`;

const darkTheme = {
  bodyBg: '#222222',
  containerBg: '#333333',
  textColor: '#ffffff',
  headingColor: '#ffffff',
  inputBg: '#444444',
  inputBorder: '#555555',
  inputFocusBorder: '#ffffff',
  buttonBg: '#ffffff',
  buttonColor: '#000000',
  buttonHoverBg: '#dddddd',
  linkColor: '#ffffff',
  shadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
};

const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  padding: 20px;
  display: flex;
  justify-content: center;
`;

const AuthContainer = styled.div`
  background-color: ${props => props.theme.containerBg};
  border-radius: 8px;
  box-shadow: ${props => props.theme.shadow};
  width: 100%;
  max-width: 700px; /* Increased from 500px to 700px */
  padding: 30px;
  transition: all 0.3s ease;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 20px;
  color: ${props => props.theme.headingColor};
  font-size: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: ${props => props.theme.textColor};
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid ${props => props.theme.inputBorder};
  border-radius: 4px;
  font-size: 16px;
  background-color: ${props => props.theme.inputBg};
  color: ${props => props.theme.textColor};
  transition: border 0.3s ease;

  &:focus {
    border-color: ${props => props.theme.inputFocusBorder};
    outline: none;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background-color: ${props => props.theme.buttonBg};
  color: ${props => props.theme.buttonColor};
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${props => props.theme.buttonHoverBg};
  }
`;

const ToggleFormText = styled.div`
  text-align: center;
  margin-top: 20px;
`;

const Link = styled.a`
  color: ${props => props.theme.linkColor};
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

function App() {
  const navigate = useNavigate();
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [loginLoader, setLoginLoader] = useState(false)
  const [signupLoader, setSignupLoader] = useState(false)

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    profile: '' // base64 string
  });

  const handleProfileChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setRegisterForm(prevState => ({
        ...prevState,
        profile: reader.result
      }));
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const toggleForm = () => {
    setIsLoginForm(!isLoginForm);
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm({
      ...loginForm,
      [name]: value
    });
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm({
      ...registerForm,
      [name]: value
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoader(true)
    try {
      const res = await axios.post('http://localhost:4000/api/v1/login', loginForm);
      Cookies.set("authToken", res.data.token, { expires: 7 });
      toast.success("Login sucessfull");
      window.location.href = "/chat";
      console.log(res);
    } catch (e) {
      const msg = e.response?.data?.message || "Something went wrong";
      toast.error(msg);
    } finally {
      setLoginLoader(false)
    }
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return regex.test(password);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setSignupLoader(true)

    if (!validatePassword(registerForm.password)) {
      toast.error("Password must be at least 8 characters, include uppercase, lowercase, number, and special character.");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      const res = await axios.post('http://localhost:4000/api/v1/signup', registerForm);
      toast.success("Registration successfully");
      console.log(res);
    } catch (e) {
      const msg = e.response?.data?.message || "Something went wrong";
      toast.error(msg);
    } finally {
      setSignupLoader(false)
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <GlobalStyle />

      <Container>
        <AuthContainer>
          {isLoginForm ? (
            <>
              <Title>Login</Title>
              <div>
                <form onSubmit={handleLoginSubmit}>
                  <FormGroup>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      type="email"
                      id="login-email"
                      name="email"
                      placeholder="Enter your email"
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      type="password"
                      id="login-password"
                      name="password"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      required
                    />
                  </FormGroup>
                  <Button type="submit">
                    {
                      loginLoader ?
                        <div className="d-flex justify-content-center align-items-center">
                          <div className="spinner-border text-dark" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                        :
                        <>Login</>
                    }
                  </Button>
                </form>
                <ToggleFormText>
                  <p>Don't have an account? <Link onClick={toggleForm}>Register</Link></p>
                </ToggleFormText>
              </div>
              <>
              </>
            </>
          ) : (
            <>
              <Title>Register</Title>
              <form onSubmit={handleRegisterSubmit}>
                <FormGroup>
                  <Label htmlFor="register-profile">Profile Image</Label>
                  <Input
                    type="file"
                    id="register-profile"
                    name="profile"
                    accept="image/*"
                    onChange={handleProfileChange}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input
                    type="text"
                    id="register-name"
                    name="name"
                    placeholder="Enter your full name"
                    value={registerForm.name}
                    onChange={handleRegisterChange}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    type="email"
                    id="register-email"
                    name="email"
                    placeholder="Enter your email"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    type="password"
                    id="register-password"
                    name="password"
                    placeholder="Create a password"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="register-confirm-password">Confirm Password</Label>
                  <Input
                    type="password"
                    id="register-confirm-password"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterChange}
                    required
                  />
                </FormGroup>
                <Button type="submit"> {
                  signupLoader ?
                    <div className="d-flex justify-content-center align-items-center">
                      <div className="spinner-border text-dark" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                    :
                    <>Register</>
                }</Button>
              </form>
              <ToggleFormText>
                <p>Already have an account? <Link onClick={toggleForm}>Login</Link></p>
              </ToggleFormText>
            </>
          )}
        </AuthContainer>

      </Container>

    </ThemeProvider>
  );
}

export default App;