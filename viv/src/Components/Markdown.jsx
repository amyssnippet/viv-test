import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // Supports tables, strikethrough, etc.
import remarkBreaks from "remark-breaks"; // Ensures line breaks work as expected
import rehypeHighlight from "rehype-highlight"; // Adds syntax highlighting
import "highlight.js/styles/github.css"; // Optional: Change theme for code highlighting

const CustomMarkdown = ({ text }) => {
  return (
    <ReactMarkdown
      children={text}
      remarkPlugins={[remarkGfm, remarkBreaks]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        a: ({ node, ...props }) => (
          <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline" />
        ),
        code: ({ node, inline, className, children, ...props }) => {
          return inline ? (
            <code className="bg-gray-200 p-1 rounded">{children}</code>
          ) : (
            <pre className="p-2 bg-gray-900 text-black rounded">
              <code {...props} className={className}>
                {children}
              </code>
            </pre>
          );
        },
        ul: ({ node, ...props }) => <ul className="list-disc pl-5" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal pl-5" {...props} />,
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-gray-500 pl-4 italic text-gray-600" {...props} />
        ),
      }}
    />
  );
};

export default CustomMarkdown;
