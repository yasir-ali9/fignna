"use client";

import { useState, useEffect } from "react";

interface CodePanelProps {
  generatedCode: string;
  isGenerating: boolean;
  sandboxData: { sandboxId: string; url: string; status: string } | null;
}

export function CodePanel({
  generatedCode,
  isGenerating,
  sandboxData,
}: CodePanelProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [sandboxFiles, setSandboxFiles] = useState<Record<string, string>>({});
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [showGenerated, setShowGenerated] = useState(false);

  // Fetch actual sandbox files
  const fetchSandboxFiles = async () => {
    if (!sandboxData) return;

    setIsLoadingFiles(true);
    try {
      const response = await fetch("/api/v1/sandbox/files/manifest");
      const data = await response.json();

      if (data.success) {
        setSandboxFiles(data.files);
        // Auto-select first file if none selected
        if (!selectedFile && Object.keys(data.files).length > 0) {
          setSelectedFile(Object.keys(data.files)[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching sandbox files:", error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Fetch files when sandbox changes or when code is applied
  useEffect(() => {
    if (sandboxData) {
      fetchSandboxFiles();
    }
  }, [sandboxData]);

  // Auto-refresh files when new code is generated
  useEffect(() => {
    if (generatedCode && sandboxData) {
      // Delay to allow code application to complete
      const timer = setTimeout(() => {
        fetchSandboxFiles();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [generatedCode, sandboxData]);

  // Parse generated code to extract files (for comparison)
  const parseGeneratedFiles = (code: string) => {
    const files: Array<{ path: string; content: string }> = [];
    const fileRegex = /<file path="([^"]+)">([\s\S]*?)(?:<\/file>|$)/g;
    let match;

    while ((match = fileRegex.exec(code)) !== null) {
      let content = match[2].trim();

      // Remove markdown code block markers (```jsx, ```css, etc.)
      content = content.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");

      files.push({
        path: match[1],
        content: content.trim(),
      });
    }

    return files;
  };

  const generatedFiles = parseGeneratedFiles(generatedCode);

  // Use sandbox files if available and not showing generated, otherwise fall back to generated files
  const files =
    !showGenerated && Object.keys(sandboxFiles).length > 0
      ? Object.entries(sandboxFiles).map(([path, content]) => ({
          path,
          content,
        }))
      : generatedFiles;

  const currentFile = files.find((f) => f.path === selectedFile) || files[0];

  // Auto-select first file when files change
  if (files.length > 0 && !selectedFile) {
    setSelectedFile(files[0].path);
  }

  const getFileIcon = (path: string) => {
    const ext = path.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "jsx":
      case "tsx":
        return "⚛️";
      case "js":
      case "ts":
        return "📄";
      case "css":
        return "🎨";
      case "json":
        return "📋";
      case "html":
        return "🌐";
      default:
        return "📄";
    }
  };

  const getLanguage = (path: string) => {
    const ext = path.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "jsx":
      case "tsx":
        return "jsx";
      case "js":
      case "ts":
        return "javascript";
      case "css":
        return "css";
      case "json":
        return "json";
      case "html":
        return "html";
      default:
        return "text";
    }
  };

  if (isGenerating && !generatedCode) {
    return (
      <div className="h-full bg-bk-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          <p className="text-fg-60 text-[11px]">Generating code...</p>
        </div>
      </div>
    );
  }

  if (!sandboxData) {
    return (
      <div className="h-full bg-bk-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-bk-40 rounded-lg flex items-center justify-center mb-3">
            <span className="text-fg-60 text-xl">📁</span>
          </div>
          <p className="text-fg-60 text-[11px]">No sandbox</p>
          <p className="text-fg-70 text-[10px] mt-1">
            Create a sandbox to see files
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingFiles) {
    return (
      <div className="h-full bg-bk-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          <p className="text-fg-60 text-[11px]">Loading files...</p>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="h-full bg-bk-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-bk-40 rounded-lg flex items-center justify-center mb-3">
            <span className="text-fg-60 text-xl">📝</span>
          </div>
          <p className="text-fg-60 text-[11px]">No files found</p>
          <p className="text-fg-70 text-[10px] mt-1">
            Generate some code to see files here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-bk-50 flex">
      {/* File Explorer */}
      <div className="w-64 bg-bk-40 border-r border-bd-50 flex flex-col">
        <div className="p-3 border-b border-bd-50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-fg-50 text-[11px] font-medium">
              {showGenerated ? "Generated" : "Sandbox"} Files
            </h4>
            <button
              onClick={fetchSandboxFiles}
              className="p-1 text-fg-60 hover:text-fg-50 hover:bg-bk-50 rounded transition-colors"
              title="Refresh files"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-1 mb-2">
            <button
              onClick={() => setShowGenerated(false)}
              className={`px-2 py-1 text-[9px] rounded transition-colors ${
                !showGenerated
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-fg-60 hover:text-fg-50"
              }`}
            >
              Sandbox
            </button>
            <button
              onClick={() => setShowGenerated(true)}
              className={`px-2 py-1 text-[9px] rounded transition-colors ${
                showGenerated
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-fg-60 hover:text-fg-50"
              }`}
            >
              Generated
            </button>
          </div>

          <p className="text-fg-60 text-[9px]">{files.length} files</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {files.map((file) => (
            <button
              key={file.path}
              onClick={() => setSelectedFile(file.path)}
              className={`w-full text-left p-3 border-b border-bd-50 hover:bg-bk-50 transition-colors ${
                selectedFile === file.path
                  ? "bg-blue-500/10 border-l-2 border-l-blue-400"
                  : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[12px]">{getFileIcon(file.path)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-fg-50 text-[10px] font-medium truncate">
                    {file.path.split("/").pop()}
                  </div>
                  <div className="text-fg-60 text-[9px] truncate">
                    {file.path}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Code Viewer */}
      <div className="flex-1 flex flex-col">
        {currentFile && (
          <>
            {/* File Header */}
            <div className="bg-bk-40 border-b border-bd-50 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[12px]">
                  {getFileIcon(currentFile.path)}
                </span>
                <span className="text-fg-50 text-[11px] font-medium">
                  {currentFile.path}
                </span>
                {!showGenerated && (
                  <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[8px]">
                    LIVE
                  </span>
                )}
              </div>
              <div className="text-fg-60 text-[9px]">
                {currentFile.content.split("\n").length} lines
              </div>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto">
              <pre className="p-4 text-[10px] leading-relaxed text-fg-50 font-mono bg-bk-50 h-full overflow-auto">
                <code className={`language-${getLanguage(currentFile.path)}`}>
                  {currentFile.content}
                </code>
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
