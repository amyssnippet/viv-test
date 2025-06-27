import { useState } from "react"
import Auth from './Components/Auth';
import Plan from './Components/Plan';
import HomePage from './Components/HomePage';
import Ollama from './Components/Ollama';
import ImageGenerator from './Components/Image';
import Chatbot from './Components/Speech';
import Dashboard from "./Components/Dashboard";
import EndpointCreationUI from './Components/CreateAPI';
import VerifyEmail from "./Components/Verify";
import Cookies from "js-cookie";
import ProtectedRoutes from "./ProtectedRoutes";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ChatList from "./Components/ChatList";
import ChatView from "./Components/ChatView";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GoogleAuth } from "./Components/Gauth";
import AppleCallback from "./Components/AppleCallback";

const App = () => {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    // Add user message
    const newMessages = [...messages, { role: "user", content: inputValue }]
    setMessages(newMessages)
    setInputValue("")

    // Simulate AI response (in a real app, you'd call your AI API here)
    setTimeout(() => {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: `This is a simulated response to: "${inputValue}"`,
        },
      ])
    }, 1000)
  }


  const jwtUserToken = Cookies.get("authToken");
  const isUserLoggedIn = jwtUserToken ? true : false;
  return (
    <Router>
      <Routes>
        <Route path="/auth" exact element={
          <GoogleOAuthProvider clientId="612742129961-98avllgdrs8l4i4duvt0e036loluk33c.apps.googleusercontent.com">
            <Auth />
          </GoogleOAuthProvider>
        } />
        <Route path="/ollama" exact element={<Ollama />} />
        <Route path="/dashboard" exact element={<Dashboard />} />
        <Route path="/image" exact element={<ImageGenerator />} />
        <Route path="/" exact element={<ChatList />} />
        <Route path="/chat/:chatId" exact element={<ChatView />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/plan" exact element={<Plan />} />
        <Route path="/speech" exact element={<Chatbot />} />
        <Route path="/cr-ep" exact element={<EndpointCreationUI />} />
        <Route path="/apple/callback" element={<AppleCallback />} />
      </Routes>
    </Router>
  )
}

export default App