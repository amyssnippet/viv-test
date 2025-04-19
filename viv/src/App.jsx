import { useState } from "react"
import Auth from './Components/Auth';
import Bot from './Components/Bot';
import Plan from './Components/Plan';
import HomePage from './Components/HomePage';
import Ollama from './Components/Ollama';
import ImageGenerator from './Components/Image';
import Chatbot from './Components/Speech';
import Dashboard from "./Components/Dashboard"
import LandingPage from './Components/LandingPage';
import EndpointCreationUI from './Components/CreateAPI';
import Cookies from "js-cookie";
import ProtectedRoutes from "./ProtectedRoutes";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

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
        <Route path="/" exact element={<HomePage messages={messages}
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleSubmit={handleSubmit} />} />
        <Route path="/auth" exact element={<Auth />} />
        <Route path="/ollama" exact element={<Ollama />} />
        <Route path="/dashboard" exact element={<Dashboard />} />
        <Route path="/image" exact element={<ImageGenerator />} />
        {/* <Route path="/chat" exact element={<Bot />} /> */}
        <Route path="/plan" exact element={<Plan />} />
        <Route path="/speech" exact element={<Chatbot />} />
        <Route path="/cr-ep" exact element={<EndpointCreationUI />} />

     <Route path="/chat" exact element={<ProtectedRoutes Component={Bot} isUserLoggedIn={isUserLoggedIn} />} />
     </Routes>
    </Router>
  )
}

export default App