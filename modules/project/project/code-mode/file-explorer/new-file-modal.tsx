"use client";

import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
// Removed tRPC import - now using fetch for API calls
import { XMarkIcon } from "@heroicons/react/24/outline";

interface NewFileModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  initialPath?: string;
}

/**
 * NewFileModal - Modal for creating new files
 * Integrates with database and opens file in editor
 */
export const NewFileModal = observer(
  ({ projectId, isOpen, onClose, initialPath = "" }: NewFileModalProps) => {
    const engine = useEditorEngine();
    const [filePath, setFilePath] = useState(initialPath);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State for tracking file creation
    const [isCreatingFile, setIsCreatingFile] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!filePath.trim()) {
        setError("File path is required");
        return;
      }

      // Validate file path
      if (filePath.includes("..") || filePath.startsWith("/")) {
        setError("Invalid file path");
        return;
      }

      setIsCreating(true);
      setError(null);

      try {
        setIsCreatingFile(true);

        // PROPER FLOW: Create file in sandbox first, then database
        const newContent = getDefaultContent(filePath);

        // Step 1: Create file in sandbox for immediate preview
        try {
          const sandboxResponse = await fetch("/api/v1/sandbox/files/write", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              files: {
                [filePath.trim()]: newContent,
              },
            }),
          });

          if (!sandboxResponse.ok) {
            console.warn(
              "Failed to create file in sandbox, continuing with database save..."
            );
          } else {
            console.log("✅ File created in sandbox for immediate preview");
          }
        } catch (sandboxError) {
          console.warn(
            "Sandbox file creation failed, continuing with database save:",
            sandboxError
          );
        }

        // Step 2: Save to database with PATCH endpoint for persistence
        const response = await fetch(
          `/api/v1/projects/${engine.projects.currentProject?.id}/files/update`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              files: {
                [filePath.trim()]: newContent,
              },
              metadata: {
                source: "editor",
                updatedBy: "user",
              },
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create file");
        }

        const result = await response.json();
        console.log("✅ File created successfully:", result);

        // Open the new file in editor
        engine.files.openFile(filePath.trim(), newContent);

        // Close modal
        onClose();
        setFilePath("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create file");
      } finally {
        setIsCreating(false);
        setIsCreatingFile(false);
      }
    };

    const getDefaultContent = (path: string): string => {
      const ext = path.split(".").pop()?.toLowerCase();

      switch (ext) {
        case "tsx":
          return `export default function Component() {
  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
}`;
        case "ts":
          return `// TypeScript file
export {};`;
        case "jsx":
          return `export default function Component() {
  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
}`;
        case "js":
          return `// JavaScript file
`;
        case "css":
          return `/* CSS file */
`;
        case "html":
          return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    
</body>
</html>`;
        case "json":
          return `{
  
}`;
        case "md":
          return `# ${path.split("/").pop()?.replace(".md", "") || "Document"}

`;
        default:
          return "";
      }
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-bk-40 border border-bd-50 rounded-lg shadow-xl w-full max-w-md mx-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-bd-50">
            <h2 className="text-lg font-semibold text-fg-30">
              Create New File
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-bk-50 rounded"
              disabled={isCreating}
            >
              <XMarkIcon className="w-5 h-5 text-fg-60" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-fg-40 mb-2">
                File Path
              </label>
              <input
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="e.g., components/Button.tsx"
                className="w-full px-3 py-2 bg-bk-50 border border-bd-50 rounded text-fg-30 placeholder-fg-60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isCreating}
                autoFocus
              />
              <div className="mt-1 text-xs text-fg-60">
                Enter the file path relative to project root
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-fg-60 hover:text-fg-30 transition-colors"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isCreating || !filePath.trim()}
              >
                {isCreating ? "Creating..." : "Create File"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
);
