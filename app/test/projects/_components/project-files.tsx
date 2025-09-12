"use client";

import { useState } from "react";

interface ProjectFilesProps {
  onMessage: (text: string, type: "success" | "error" | "info") => void;
  selectedProjectId: string;
  onProjectIdChange: (id: string) => void;
  mode: "get" | "update";
}

export function ProjectFiles({
  onMessage,
  selectedProjectId,
  onProjectIdChange,
  mode,
}: ProjectFilesProps) {
  const [projectId, setProjectId] = useState(selectedProjectId);
  const [isLoading, setIsLoading] = useState(false);
  const [filesJson, setFilesJson] = useState(`{
  "app/page.tsx": "export default function Home() {\\n  return <div>Hello World</div>;\\n}",
  "app/layout.tsx": "export default function RootLayout({ children }: { children: React.ReactNode }) {\\n  return <html><body>{children}</body></html>;\\n}",
  "package.json": "{\\"name\\": \\"my-project\\", \\"version\\": \\"1.0.0\\"}"
}`);

  const handleGetFiles = async () => {
    if (!projectId.trim()) {
      onMessage("Please enter a project ID", "error");
      return;
    }

    setIsLoading(true);
    onMessage(`Fetching files for project ${projectId}...`, "info");

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/files`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onMessage(
          `✅ Files retrieved successfully (${data.data.fileCount} files)`,
          "success"
        );
        onMessage(`Response: ${JSON.stringify(data, null, 2)}`, "info");

        // Update the files JSON with the retrieved data
        setFilesJson(JSON.stringify(data.data.files, null, 2));
      } else {
        onMessage(
          `❌ Get files failed: ${data.error || "Unknown error"}`,
          "error"
        );
        if (data.details) {
          onMessage(
            `Details: ${JSON.stringify(data.details, null, 2)}`,
            "error"
          );
        }
      }
    } catch (error) {
      onMessage(
        `❌ Network error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateFiles = async () => {
    if (!projectId.trim()) {
      onMessage("Please enter a project ID", "error");
      return;
    }

    let parsedFiles;
    try {
      parsedFiles = JSON.parse(filesJson);
    } catch (error) {
      onMessage("❌ Invalid JSON format in files", "error");
      return;
    }

    setIsLoading(true);
    onMessage(`Updating files for project ${projectId}...`, "info");

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/files`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: parsedFiles,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onMessage(
          `✅ Files updated successfully (${data.data.fileCount} files)`,
          "success"
        );
        onMessage(`Response: ${JSON.stringify(data, null, 2)}`, "info");
      } else {
        onMessage(
          `❌ Update files failed: ${data.error || "Unknown error"}`,
          "error"
        );
        if (data.details) {
          onMessage(
            `Details: ${JSON.stringify(data.details, null, 2)}`,
            "error"
          );
        }
      }
    } catch (error) {
      onMessage(
        `❌ Network error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <label className="block text-fg-50 text-[11px] font-medium">
          Project ID
        </label>
        <input
          type="text"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="Enter project ID"
          className="w-full px-3 py-2 bg-bk-50 border border-bd-50 rounded text-fg-50 text-[11px] placeholder-fg-60 focus:outline-none focus:border-blue-400"
        />
        <div className="flex gap-2">
          <button
            onClick={() => {
              setProjectId(selectedProjectId);
              onProjectIdChange(selectedProjectId);
            }}
            disabled={!selectedProjectId}
            className="px-2 py-1 text-[9px] bg-bk-30 text-fg-60 rounded hover:bg-bk-20 hover:text-fg-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Use Selected
          </button>
          <button
            onClick={() => setProjectId("")}
            className="px-2 py-1 text-[9px] bg-bk-30 text-fg-60 rounded hover:bg-bk-20 hover:text-fg-50 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {mode === "update" && (
        <div className="space-y-2">
          <label className="block text-fg-50 text-[11px] font-medium">
            Files (JSON)
          </label>
          <textarea
            value={filesJson}
            onChange={(e) => setFilesJson(e.target.value)}
            placeholder="Enter files as JSON object"
            rows={12}
            className="w-full px-3 py-2 bg-bk-50 border border-bd-50 rounded text-fg-50 text-[10px] font-mono placeholder-fg-60 focus:outline-none focus:border-blue-400 resize-none"
          />
          <div className="text-[9px] text-fg-60">
            Format: {"{"}"filename": "content", ...{"}"}
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-bd-50 space-y-2">
        {mode === "get" ? (
          <button
            onClick={handleGetFiles}
            disabled={isLoading || !projectId.trim()}
            className="w-full px-4 py-2 bg-green-500 text-white text-[11px] font-medium rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Getting Files..." : "Get Project Files"}
          </button>
        ) : (
          <button
            onClick={handleUpdateFiles}
            disabled={isLoading || !projectId.trim()}
            className="w-full px-4 py-2 bg-yellow-500 text-white text-[11px] font-medium rounded hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Updating Files..." : "Update Project Files"}
          </button>
        )}
      </div>

      <div className="text-[9px] text-fg-60 bg-bk-30 p-2 rounded">
        <strong>💡 Tip:</strong>{" "}
        {mode === "get"
          ? "This endpoint returns only the files data for efficient file operations."
          : "Use valid JSON format. Files will be stored as key-value pairs where key is the file path."}
      </div>
    </div>
  );
}
