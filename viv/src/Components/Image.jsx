import { useState } from "react";
import "./img.css";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateImage = async () => {
    setLoading(true);
    setImage(null);
    try {
      const response = await fetch("http://ec2-13-60-38-53.eu-north-1.compute.amazonaws.com:7000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) throw new Error("Failed to generate image");
      console.log(response);
      const blob = await response.blob();
      setImage(URL.createObjectURL(blob));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>AI Image Generator</h1>
      <input 
        value={prompt} 
        onChange={(e) => setPrompt(e.target.value)} 
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
