// AppleCallback.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AppleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("authToken", token);
      navigate("/"); // or wherever
    } else {
      console.error("No token found");
      navigate("/auth");
    }
  }, []);

  return <div>Signing you in with Apple...</div>;
}
