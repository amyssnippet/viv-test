import React, { useState } from "react";
import styled, { createGlobalStyle, ThemeProvider } from "styled-components";
import axios from "axios";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: Arial, sans-serif;
  }

  body {
    background-color: ${(props) => props.theme.bodyBg};
    color: ${(props) => props.theme.textColor};
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }
`;

const lightTheme = {
  bodyBg: "#f0f0f0",
  containerBg: "#ffffff",
  textColor: "#333333",
  headingColor: "#000000",
  inputBg: "#ffffff",
  inputBorder: "#dddddd",
  inputFocusBorder: "#000000",
  buttonBg: "#000000",
  buttonColor: "#ffffff",
  buttonHoverBg: "#333333",
  linkColor: "#000000",
  shadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
};

const darkTheme = {
  bodyBg: "#222222",
  containerBg: "#333333",
  textColor: "#ffffff",
  headingColor: "#ffffff",
  inputBg: "#444444",
  inputBorder: "#555555",
  inputFocusBorder: "#ffffff",
  buttonBg: "#ffffff",
  buttonColor: "#000000",
  buttonHoverBg: "#dddddd",
  linkColor: "#ffffff",
  shadow: "0 5px 15px rgba(0, 0, 0, 0.3)",
};

const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  padding: 20px;
  display: flex;
  justify-content: center;
`;

const AuthContainer = styled.div`
  background-color: ${(props) => props.theme.containerBg};
  border-radius: 8px;
  box-shadow: ${(props) => props.theme.shadow};
  width: 100%;
  max-width: 700px; /* Increased from 500px to 700px */
  padding: 30px;
  transition: all 0.3s ease;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 20px;
  color: ${(props) => props.theme.headingColor};
  font-size: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: ${(props) => props.theme.textColor};
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 4px;
  font-size: 16px;
  background-color: ${(props) => props.theme.inputBg};
  color: ${(props) => props.theme.textColor};
  transition: border 0.3s ease;

  &:focus {
    border-color: ${(props) => props.theme.inputFocusBorder};
    outline: none;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background-color: ${(props) => props.theme.buttonBg};
  color: ${(props) => props.theme.buttonColor};
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${(props) => props.theme.buttonHoverBg};
  }
`;

const ToggleFormText = styled.div`
  text-align: center;
  margin-top: 20px;
`;

const Link = styled.a`
  color: ${(props) => props.theme.linkColor};
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const ThemeToggle = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  cursor: pointer;
  background: ${(props) => props.theme.buttonBg};
  color: ${(props) => props.theme.buttonColor};
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  font-size: 14px;
`;

function App() {
  const navigate = useNavigate();
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  const toggleForm = () => {
    setIsLoginForm(!isLoginForm);
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm({
      ...loginForm,
      [name]: value,
    });
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm({
      ...registerForm,
      [name]: value,
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://51.21.245.211:4000/api/v1/login",
        loginForm
      );
      toast.success("Login successfull");
      Cookies.set("authToken", res.data.token, { expires: 7 });
      navigate("/chat");
      window.location.href = "/chat";
      console.log(res);
    } catch (e) {
      console.log(e);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://51.21.245.211:4000/api/v1/signup",
        registerForm
      );
      toast.success("Registration successfully");
      console.log(res);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <ThemeProvider theme={isDarkTheme ? darkTheme : lightTheme}>
      <GlobalStyle />
      <ThemeToggle onClick={toggleTheme}>
        {isDarkTheme ? "Light Theme" : "Dark Theme"}
      </ThemeToggle>

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
                  <Button type="submit">Login</Button>
                </form>
                <ToggleFormText>
                  <p>
                    Don't have an account?{" "}
                    <Link onClick={toggleForm}>Register</Link>
                  </p>
                </ToggleFormText>
              </div>
              <>
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    console.log(credentialResponse);
                  }}
                  onError={() => {
                    console.log("Login Failed");
                  }}
                />
              </>
            </>
          ) : (
            <>
              <Title>Register</Title>
              <form onSubmit={handleRegisterSubmit}>
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
                  <Label htmlFor="register-confirm-password">
                    Confirm Password
                  </Label>
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
                <Button type="submit">Register</Button>
              </form>
              <ToggleFormText>
                <p>
                  Already have an account?{" "}
                  <Link onClick={toggleForm}>Login</Link>
                </p>
              </ToggleFormText>
            </>
          )}
        </AuthContainer>
      </Container>
    </ThemeProvider>
  );
}

export default App;
