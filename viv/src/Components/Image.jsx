import { useState, useRef, useEffect } from "react";
import "./img.css";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();

    const handleGlobalKeyDown = (e) => {
      // Focus on the input if typing starts and the field isn't already focused
      if (
        !inputRef.current.contains(document.activeElement) && // Input isn't focused
        e.key.length === 1 // Only trigger on character keys, not control keys like Shift/Enter
      ) {
        inputRef.current.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  const generateImage = async () => {
    if (!prompt.trim()) return; // Prevent empty prompts
    setLoading(true);
    setImage(null);
    try {
      const response = await fetch("http://ec2-16-171-254-203.eu-north-1.compute.amazonaws.com:7000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) throw new Error("Failed to generate image");
      const blob = await response.blob();
      setImage(URL.createObjectURL(blob));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      generateImage();
    }
  };

  return (
    <div className="container">
      <h1>AI Image Generator</h1>
      <input
        ref={inputRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}  // Trigger on Enter key
        placeholder="Enter a prompt..."
        className="input"
      />
      <button onClick={generateImage} disabled={loading} className="button">
        {loading ? "Generating..." : "Generate Image"}
      </button>
      {image && (
        <div className="image-container">
          <img src={image} alt="Generated AI" className="image" />
        </div>
      )}
    </div>
  );
}
