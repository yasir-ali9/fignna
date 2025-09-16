"use client";

import React, {
  memo,
  useMemo,
  useState,
  createContext,
  useContext,
} from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { useTheme } from "@/lib/providers/theme-provider";

// Context for managing renderer size
const RendererSizeContext = createContext<"small" | "default">("default");

// Copy button component
const CopyButton = memo(({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 text-fg-60 hover:text-fg-50 cursor-pointer transition-colors"
      title="Copy code"
    >
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
        </svg>
      )}
    </button>
  );
});

CopyButton.displayName = "CopyButton";

// Simple syntax highlighter using CSS classes
const CodeBlock = memo(({ children, className, ...props }: any) => {
  const size = useContext(RendererSizeContext);
  const { theme } = useTheme();
  const match = /language-(\w+)/.exec(className || "");
  const codeString = String(children).replace(/\n$/, "");

  if (match) {
    const language = match[1];

    // Detect if this might be a streaming/partial code block
    // This is a heuristic - if the code doesn't end with proper syntax, it might be streaming
    const isLikelyStreaming =
      codeString.length > 0 &&
      (codeString.endsWith("...") ||
        codeString.match(/[{[(]$/) || // ends with opening bracket
        codeString.match(/[,;]$/) || // ends with comma or semicolon
        codeString.split("\n").pop()?.trim().length === 0); // last line is empty/incomplete

    return (
      <div className="my-3 rounded-lg overflow-hidden bg-bk-60">
        {/* Code header */}
        <div className="flex justify-between items-center px-3 py-1.5 bg-bk-40">
          <div></div>
          <CopyButton text={codeString} />
        </div>

        {/* Code content with syntax highlighting */}
        <SyntaxHighlighter
          language={language}
          style={theme === "dark" ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            padding: "12px",
            fontSize: size === "small" ? "10px" : "11px",
            lineHeight: "1.4",
            background: "rgb(var(--bk-60))",
            borderRadius: "0",
            textShadow: "none",
          }}
          codeTagProps={{
            style: {
              fontFamily: "var(--font-mono), monospace",
              textShadow: "none",
            },
          }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  }

  // Inline code
  return (
    <code
      className="px-1.5 py-0.5 bg-bk-40 text-fg-50 rounded font-mono border border-bd-50"
      style={{ fontSize: size === "small" ? "10px" : "11px" }}
      {...props}
    >
      {children}
    </code>
  );
});

CodeBlock.displayName = "CodeBlock";

// Image component with loading and error states
const ImageRenderer = memo(({ src, alt, ...props }: any) => {
  const [imageState, setImageState] = useState<"loading" | "loaded" | "error">(
    "loading"
  );
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  const handleImageLoad = () => {
    setImageState("loaded");
  };

  const handleImageError = () => {
    if (retryCount < maxRetries) {
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        setImageState("loading");
      }, 1000);
    } else {
      setImageState("error");
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setImageState("loading");
  };

  if (imageState === "error") {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-bk-40 rounded-lg border border-bd-50 my-3">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-fg-60 mb-2"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
        <p className="text-fg-60 mb-2" style={{ fontSize: "11px" }}>
          Failed to load image
        </p>
        <button
          onClick={handleRetry}
          className="px-2 py-1 bg-bk-50 hover:bg-bk-30 rounded text-fg-50 cursor-pointer transition-colors"
          style={{ fontSize: "10px" }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="my-3">
      {imageState === "loading" && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-fg-50"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${imageState === "loaded" ? "block" : "hidden"
          } max-w-full rounded-lg border border-bd-50`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        {...props}
      />
    </div>
  );
});

ImageRenderer.displayName = "ImageRenderer";

// Custom markdown components
const markdownComponents = {
  // Code blocks and inline code
  code: CodeBlock,
  pre: ({ children }: any) => {
    // ReactMarkdown wraps code blocks in pre > code, so we just pass through to let code component handle it
    return <>{children}</>;
  },

  // Images
  img: ImageRenderer,

  // Headings with proper sizing
  h1: ({ children, ...props }: any) => (
    <h1
      className="font-semibold text-fg-70 mt-4 mb-2 first:mt-0"
      style={{ fontSize: "12px" }}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2
      className="font-semibold text-fg-70 mt-3 mb-2 first:mt-0"
      style={{ fontSize: "12px" }}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3
      className="font-medium text-fg-60 mt-3 mb-1 first:mt-0"
      style={{ fontSize: "11px" }}
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: any) => (
    <h4
      className="font-medium text-fg-60 mt-2 mb-1 first:mt-0"
      style={{ fontSize: "11px" }}
      {...props}
    >
      {children}
    </h4>
  ),
  h5: ({ children, ...props }: any) => (
    <h5
      className="font-medium text-fg-60 mt-2 mb-1 first:mt-0"
      style={{ fontSize: "11px" }}
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ children, ...props }: any) => (
    <h6
      className="font-medium text-fg-60 mt-2 mb-1 first:mt-0"
      style={{ fontSize: "11px" }}
      {...props}
    >
      {children}
    </h6>
  ),

  // Paragraphs
  p: ({ children, ...props }: any) => (
    <p
      className="text-fg-50 mb-2 leading-relaxed"
      style={{ fontSize: "11px" }}
      {...props}
    >
      {children}
    </p>
  ),

  // Lists
  ul: ({ children, ...props }: any) => (
    <ul
      className="text-fg-50 mb-2 ml-4 space-y-1"
      style={{ fontSize: "11px" }}
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol
      className="text-fg-50 mb-2 ml-4 space-y-1"
      style={{ fontSize: "11px" }}
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="text-fg-50" style={{ fontSize: "11px" }} {...props}>
      {children}
    </li>
  ),

  // Links
  a: ({ children, href, ...props }: any) => (
    <a
      href={href}
      className="text-ac-01 hover:underline cursor-pointer"
      style={{ fontSize: "11px" }}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),

  // Blockquotes
  blockquote: ({ children, ...props }: any) => (
    <blockquote
      className="border-l-2 border-bd-50 pl-3 my-2 text-fg-60 italic"
      style={{ fontSize: "11px" }}
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Tables
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full border border-bd-50 rounded-lg" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead className="bg-bk-40" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
  tr: ({ children, ...props }: any) => (
    <tr className="border-b border-bd-50" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: any) => (
    <th
      className="px-3 py-2 text-left font-medium text-fg-60 border-r border-bd-50 last:border-r-0"
      style={{ fontSize: "11px" }}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td
      className="px-3 py-2 text-fg-50 border-r border-bd-50 last:border-r-0"
      style={{ fontSize: "11px" }}
      {...props}
    >
      {children}
    </td>
  ),

  // Horizontal rule
  hr: ({ ...props }: any) => <hr className="border-bd-50 my-4" {...props} />,

  // Strong and emphasis
  strong: ({ children, ...props }: any) => (
    <strong className="font-semibold text-fg-70" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: any) => (
    <em className="italic text-fg-60" {...props}>
      {children}
    </em>
  ),
};

// Parse content to handle custom file tags and markdown with streaming support
function parseContentIntoBlocks(content: string): Array<{
  type: "file" | "markdown";
  content: string;
  filePath?: string;
  isPartial?: boolean;
}> {
  if (!content) return [];

  const blocks: Array<{
    type: "file" | "markdown";
    content: string;
    filePath?: string;
    isPartial?: boolean;
  }> = [];

  // First, try to match complete <file path="...">content</file> tags
  const completeFileTagRegex = /<file\s+path="([^"]+)">([^]*?)<\/file>/g;

  // Also match partial/incomplete file tags for streaming
  const partialFileTagRegex = /<file\s+path="([^"]+)">([^]*?)$/;

  let lastIndex = 0;
  let match;
  let hasFileTags = false;

  // Process complete file tags first
  while ((match = completeFileTagRegex.exec(content)) !== null) {
    hasFileTags = true;

    // Add any markdown content before this file tag
    if (match.index > lastIndex) {
      const markdownContent = content.slice(lastIndex, match.index).trim();
      if (markdownContent) {
        blocks.push({ type: "markdown", content: markdownContent });
      }
    }

    // Add the complete file content
    blocks.push({
      type: "file",
      content: match[2],
      filePath: match[1],
      isPartial: false,
    });

    lastIndex = match.index + match[0].length;
  }

  // Check for partial file tag at the end (streaming case)
  const remainingContent = content.slice(lastIndex);
  const partialMatch = partialFileTagRegex.exec(remainingContent);

  if (partialMatch) {
    hasFileTags = true;

    // Add any markdown content before the partial file tag
    if (partialMatch.index > 0) {
      const markdownContent = remainingContent
        .slice(0, partialMatch.index)
        .trim();
      if (markdownContent) {
        blocks.push({ type: "markdown", content: markdownContent });
      }
    }

    // Add the partial file content (streaming)
    blocks.push({
      type: "file",
      content: partialMatch[2],
      filePath: partialMatch[1],
      isPartial: true,
    });
  } else if (lastIndex < content.length) {
    // Add any remaining markdown content
    const remainingMarkdown = content.slice(lastIndex).trim();
    if (remainingMarkdown) {
      blocks.push({ type: "markdown", content: remainingMarkdown });
    }
  }

  // If no file tags found, treat entire content as markdown
  if (!hasFileTags) {
    blocks.push({ type: "markdown", content: content });
  }

  return blocks;
}

// Individual markdown block renderer
const MarkdownBlock = memo(({ content }: { content: string }) => {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
});

MarkdownBlock.displayName = "MarkdownBlock";

// File block renderer for <file path="...">content</file> format
const FileBlock = memo(
  ({
    content,
    filePath,
    isPartial = false,
  }: {
    content: string;
    filePath: string;
    isPartial?: boolean;
  }) => {
    const { theme } = useTheme();

    // Detect language from file extension
    const getLanguageFromPath = (path: string): string => {
      const ext = path.split(".").pop()?.toLowerCase();
      switch (ext) {
        case "js":
        case "jsx":
          return "javascript";
        case "ts":
        case "tsx":
          return "typescript";
        case "css":
          return "css";
        case "html":
          return "html";
        case "json":
          return "json";
        case "md":
          return "markdown";
        case "py":
          return "python";
        default:
          return "text";
      }
    };

    const language = getLanguageFromPath(filePath);

    // Clean up the content - remove markdown code block markers if present
    let cleanContent = content.trim();

    // Remove opening markdown code block (```jsx, ```javascript, etc.)
    cleanContent = cleanContent.replace(/^```\w*\n?/, "");

    // Remove closing markdown code block
    cleanContent = cleanContent.replace(/\n?```$/, "");

    // Final trim
    const codeString = cleanContent.trim();

    return (
      <div className="my-4 rounded-lg overflow-hidden bg-bk-60">
        {/* File header */}
        <div className="flex justify-between items-center px-3 py-1.5 bg-bk-40">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-fg-60" style={{ fontSize: "10px" }}>
              {filePath}
            </span>
            {isPartial && (
              <div className="flex items-center space-x-1">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-fg-60 text-xs">Streaming...</span>
              </div>
            )}
          </div>
          <CopyButton text={codeString} />
        </div>

        {/* File content with syntax highlighting */}
        <SyntaxHighlighter
          language={language}
          style={theme === "dark" ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            padding: "12px",
            fontSize: "11px",
            lineHeight: "1.4",
            background: "rgb(var(--bk-60))",
            borderRadius: "0",
            textShadow: "none",
          }}
          codeTagProps={{
            style: {
              fontFamily: "var(--font-mono), monospace",
              textShadow: "none",
            },
          }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  }
);

FileBlock.displayName = "FileBlock";

// Main message renderer component
export const MessageRenderer = memo(
  ({
    content,
    id,
    size = "default",
  }: {
    content: string;
    id?: string;
    size?: "small" | "default";
  }) => {
    const blocks = useMemo(() => parseContentIntoBlocks(content), [content]);

    return (
      <RendererSizeContext.Provider value={size}>
        <div className="w-full">
          {blocks.map((block, index) =>
            block.type === "file" ? (
              <FileBlock
                key={`${id || "msg"}-file-${index}`}
                content={block.content}
                filePath={block.filePath!}
                isPartial={block.isPartial}
              />
            ) : (
              <MarkdownBlock
                key={`${id || "msg"}-markdown-${index}`}
                content={block.content}
              />
            )
          )}
        </div>
      </RendererSizeContext.Provider>
    );
  }
);

MessageRenderer.displayName = "MessageRenderer";

// Export individual components for flexibility
export { CodeBlock, ImageRenderer, CopyButton, FileBlock };
