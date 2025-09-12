"use client";

import { useState } from "react";

interface DeleteProjectProps {
  onMessage: (text: string, type: "success" | "error" | "info") => void;
  selectedProjectId: string;
  onProjectIdChange: (id: string) => void;
}

export function DeleteProject({
  onMessage,
  selectedProjectId,
  onProjectIdChange,
}: DeleteProjectProps) {
  const [projectId, setProjectId] = useState(selectedProjectId);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!projectId.trim()) {
      onMessage("Please enter a project ID", "error");
      return;
    }

    setIsLoading(true);
    onMessage(`Deleting project ${projectId}...`, "info");

    try {
      const response = await fetch(`/api/v1/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onMessage(
          `✅ Project deleted successfully: ${data.data.project.name} (${data.data.project.id})`,
          "success"
        );
        onMessage(`Response: ${JSON.stringify(data, null, 2)}`, "info");

        // Clear the project ID if it was the deleted one
        if (projectId === selectedProjectId) {
          onProjectIdChange("");
        }
        setProjectId("");
      } else {
        onMessage(
          `❌ Delete failed: ${data.error || "Unknown error"}`,
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
          placeholder="Enter project ID to delete"
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

      <div className="pt-2 border-t border-bd-50">
        <button
          onClick={handleDelete}
          disabled={isLoading || !projectId.trim()}
          className="w-full px-4 py-2 bg-red-500 text-white text-[11px] font-medium rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Deleting..." : "Delete Project"}
        </button>
      </div>

      <div className="text-[9px] text-fg-60 bg-bk-30 p-2 rounded">
        <strong>⚠️ Warning:</strong> This will perform a soft delete on the
        project. The project will be marked as inactive but data will be
        preserved.
      </div>
    </div>
  );
}
