import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy } from "lucide-react"; // Copy icon

const CustomMarkdown = ({ text }) => {
  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      alert("Copied to clipboard!"); // Replace with a better UI notification if needed
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code: ({ inline, children }) => {
          if (inline) {
            // 🌟 Inline Code Styling (Single-line)
            return (
              <code className="bg-gray-300 text-black px-1 py-0.5 rounded font-mono text-sm">
                {children}
              </code>
            );
          }

          // 📝 Multi-line Code Block Styling
          return (
            <div className="relative group">
              {/* Copy Button (Appears on Hover) */}
              <button
                onClick={() => copyToClipboard(children)}
                className="absolute top-2 right-2 bg-gray-700 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition"
              >
                <Copy size={14} className="inline-block mr-1" />
                Copy
              </button>

              {/* Code Block */}
              <pre className="bg-black text-white p-4 rounded-lg overflow-x-auto text-sm font-mono">
                <code>{children}</code>
              </pre>
            </div>
          );
        },
      }}
    >
      {text}
    </ReactMarkdown>
  );
};

export default CustomMarkdown;
