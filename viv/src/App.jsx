import React from 'react';
import Auth from './Components/Auth';
import Bot from './Components/Bot';
import Plan from './Components/Plan';
import HomePage from './Components/HomePage'; 
import Ollama from './Components/Ollama';
import ImageGenerator from './Components/Image';
import LandingPage from './Components/LandingPage';
import Cookies from "js-cookie";
import ProtectedRoutes from "./ProtectedRoutes";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";


const App = () => {
  const jwtUserToken = Cookies.get("authToken");
  const isUserLoggedIn = jwtUserToken ? true : false;
  return (
    <Router>
      <Routes>
        <Route path="/" exact element={<HomePage />} />
        <Route path="/auth" exact element={<Auth />} />
        <Route path="/ollama" exact element={<Ollama />} />
        <Route path="/image" exact element={<ImageGenerator />} />
        <Route path="/chat" exact element={<Bot />} />
        <Route path="/plan" exact element={<Plan />} />
      </Routes>
    </Router>
  )
}

export default App