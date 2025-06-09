// AppleCallback.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AppleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("auth_token", token);
      navigate("/dashboard"); // or wherever
    } else {
      console.error("No token found");
      navigate("/login");
    }
  }, []);

  return <div>Signing you in with Apple...</div>;
}
