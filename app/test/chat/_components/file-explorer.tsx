"use client";

import { useState, useEffect } from "react";

interface FileInfo {
  content: string;
  type:
    | "component"
    | "page"
    | "style"
    | "config"
    | "utility"
    | "layout"
    | "hook"
    | "context";
  exports?: string[];
  imports?: any[];
  lastModified: number;
  componentInfo?: {
    name: string;
    props?: string[];
    hooks?: string[];
    hasState: boolean;
    childComponents?: string[];
  };
  path: string;
  relativePath: string;
}

interface FileManifest {
  files: Record<string, FileInfo>;
  routes: any[];
  componentTree: Record<string, any>;
  entryPoint: string;
  styleFiles: string[];
  timestamp: number;
}

interface SandboxData {
  sandboxId: string;
  url: string;
  status: string;
}

interface FileExplorerProps {
  sandboxData: SandboxData | null;
  onFileSelect?: (file: FileInfo) => void;
}

export function FileExplorer({ sandboxData, onFileSelect }: FileExplorerProps) {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [manifest, setManifest] = useState<FileManifest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["src", "src/components"])
  );

  const fetchFiles = async () => {
    if (!sandboxData) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/sandbox/files/manifest");
      const data = await response.json();

      if (data.success) {
        setFiles(data.files);
        setManifest(data.manifest);
      } else {
        setError(data.error || "Failed to fetch files");
      }
    } catch (err) {
      setError(`Error fetching files: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sandboxData) {
      fetchFiles();
    }
  }, [sandboxData]);

  const getFileIcon = (path: string, type?: string) => {
    const ext = path.split(".").pop()?.toLowerCase();

    if (type === "component") return "⚛️";
    if (type === "page") return "📄";
    if (type === "style") return "🎨";
    if (type === "config") return "⚙️";
    if (type === "hook") return "🪝";
    if (type === "context") return "🔄";

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

  const buildFileTree = () => {
    const tree: Record<string, any> = {};

    Object.keys(files).forEach((filePath) => {
      const parts = filePath.split("/");
      let current = tree;

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // This is a file
          current[part] = {
            type: "file",
            path: filePath,
            fileInfo: manifest?.files[`/home/user/app/${filePath}`],
          };
        } else {
          // This is a folder
          if (!current[part]) {
            current[part] = { type: "folder", children: {} };
          }
          current = current[part].children;
        }
      });
    });

    return tree;
  };

  const renderTreeNode = (
    name: string,
    node: any,
    depth: number = 0,
    parentPath: string = ""
  ) => {
    const currentPath = parentPath ? `${parentPath}/${name}` : name;

    if (node.type === "file") {
      const fileInfo = node.fileInfo;
      const isSelected = selectedFile === node.path;

      return (
        <button
          key={node.path}
          onClick={() => {
            setSelectedFile(node.path);
            if (onFileSelect && fileInfo) {
              onFileSelect(fileInfo);
            }
          }}
          className={`w-full text-left p-2 hover:bg-bk-50 transition-colors ${
            isSelected ? "bg-blue-500/10 border-l-2 border-l-blue-400" : ""
          }`}
          style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px]">
              {getFileIcon(node.path, fileInfo?.type)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-fg-50 text-[10px] font-medium truncate">
                {name}
              </div>
              {fileInfo?.componentInfo && (
                <div className="text-fg-60 text-[8px] truncate">
                  {fileInfo.componentInfo.name}
                </div>
              )}
            </div>
          </div>
        </button>
      );
    } else {
      // This is a folder
      const isExpanded = expandedFolders.has(currentPath);

      return (
        <div key={currentPath}>
          <button
            onClick={() => {
              const newExpanded = new Set(expandedFolders);
              if (isExpanded) {
                newExpanded.delete(currentPath);
              } else {
                newExpanded.add(currentPath);
              }
              setExpandedFolders(newExpanded);
            }}
            className="w-full text-left p-2 hover:bg-bk-50 transition-colors"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px]">{isExpanded ? "📂" : "📁"}</span>
              <span className="text-fg-50 text-[10px] font-medium">{name}</span>
            </div>
          </button>

          {isExpanded && (
            <div>
              {Object.entries(node.children).map(([childName, childNode]) =>
                renderTreeNode(childName, childNode, depth + 1, currentPath)
              )}
            </div>
          )}
        </div>
      );
    }
  };

  if (!sandboxData) {
    return (
      <div className="h-full bg-bk-40 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-bk-50 rounded-lg flex items-center justify-center mb-3">
            <span className="text-fg-60 text-xl">📁</span>
          </div>
          <p className="text-fg-60 text-[10px]">No sandbox</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full bg-bk-40 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
            <div
              className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          <p className="text-fg-60 text-[10px]">Loading files...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-bk-40 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-3">
            <span className="text-red-400 text-xl">⚠️</span>
          </div>
          <p className="text-fg-60 text-[10px] mb-2">Error loading files</p>
          <button
            onClick={fetchFiles}
            className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-[9px] hover:bg-blue-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const fileTree = buildFileTree();

  return (
    <div className="h-full bg-bk-40 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-bd-50 flex items-center justify-between">
        <div>
          <h4 className="text-fg-50 text-[11px] font-medium">Project Files</h4>
          <p className="text-fg-60 text-[9px] mt-1">
            {Object.keys(files).length} files
          </p>
        </div>
        <button
          onClick={fetchFiles}
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

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(fileTree).map(([name, node]) =>
          renderTreeNode(name, node)
        )}
      </div>

      {/* Footer */}
      {manifest && (
        <div className="border-t border-bd-50 p-2">
          <div className="text-[8px] text-fg-60">
            <div>Entry: {manifest.entryPoint.split("/").pop()}</div>
            <div>Components: {Object.keys(manifest.componentTree).length}</div>
          </div>
        </div>
      )}
    </div>
  );
}
