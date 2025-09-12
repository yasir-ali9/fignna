"use client";

import { useState } from "react";

interface GetProjectProps {
  onMessage: (text: string, type: "success" | "error" | "info") => void;
  selectedProjectId: string;
  onProjectIdChange: (projectId: string) => void;
}

export function GetProject({
  onMessage,
  selectedProjectId,
  onProjectIdChange,
}: GetProjectProps) {
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState(selectedProjectId);
  const [project, setProject] = useState<any>(null);

  const handleGetProject = async () => {
    const idToUse = projectId || selectedProjectId;

    if (!idToUse.trim()) {
      onMessage("❌ Project ID is required", "error");
      return;
    }

    setLoading(true);
    onMessage(`Fetching project ${idToUse}...`, "info");

    try {
      const response = await fetch(`/api/v1/projects/${idToUse}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProject(data.data.project);
        onMessage(
          `✅ Successfully fetched project: ${data.data.project.name}`,
          "success"
        );
        onMessage(`📊 Response: ${JSON.stringify(data, null, 2)}`, "info");
        onProjectIdChange(data.data.project.id);
      } else {
        onMessage(
          `❌ Failed to fetch project: ${data.error || "Unknown error"}`,
          "error"
        );
        if (data.details) {
          onMessage(
            `🔍 Details: ${JSON.stringify(data.details, null, 2)}`,
            "error"
          );
        }
        setProject(null);
      }
    } catch (error) {
      onMessage(
        `❌ Network error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleGetProject();
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Project ID Input */}
      <div className="space-y-3">
        <h4 className="text-fg-50 text-[11px] font-medium">Project ID</h4>

        <div>
          <label className="block text-fg-60 text-[9px] font-medium mb-1">
            Project ID *
          </label>
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter project ID or select from list"
            className="w-full px-2 py-1 text-[10px] bg-bk-50 border border-bd-50 rounded text-fg-50 placeholder-fg-60 focus:outline-none focus:border-blue-400 font-mono"
          />
        </div>

        {selectedProjectId && selectedProjectId !== projectId && (
          <button
            onClick={() => setProjectId(selectedProjectId)}
            className="px-2 py-1 text-[9px] bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
          >
            Use Selected: {selectedProjectId.slice(0, 8)}...
          </button>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={handleGetProject}
        disabled={loading || !(projectId || selectedProjectId).trim()}
        className="w-full px-3 py-2 text-[11px] font-medium bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Fetching..." : "Get Project"}
      </button>

      {/* Project Details */}
      {project && (
        <div className="space-y-3">
          <h4 className="text-fg-50 text-[11px] font-medium">
            Project Details
          </h4>

          <div className="bg-bk-50 border border-bd-50 rounded p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-[9px]">
              <div>
                <span className="text-fg-60">Name:</span>
                <div className="text-fg-50 font-medium">{project.name}</div>
              </div>
              <div>
                <span className="text-fg-60">ID:</span>
                <div className="text-fg-50 font-mono text-[8px]">
                  {project.id}
                </div>
              </div>
            </div>

            {project.description && (
              <div className="text-[9px]">
                <span className="text-fg-60">Description:</span>
                <div className="text-fg-50">{project.description}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[8px] text-fg-60">
              <div>
                <span>Created:</span>
                <div>{new Date(project.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <span>Updated:</span>
                <div>{new Date(project.updatedAt).toLocaleString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[8px] text-fg-60">
              <div>
                <span>Version:</span>
                <div>{project.version || "N/A"}</div>
              </div>
              <div>
                <span>Files:</span>
                <div>{Object.keys(project.files || {}).length} files</div>
              </div>
            </div>

            {project.sandboxId && (
              <div className="text-[8px] text-fg-60">
                <span>Sandbox ID:</span>
                <div className="font-mono">{project.sandboxId}</div>
              </div>
            )}

            {project.previewUrl && (
              <div className="text-[8px] text-fg-60">
                <span>Preview URL:</span>
                <div>
                  <a
                    href={project.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {project.previewUrl}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="text-fg-60 text-[9px] leading-relaxed">
        <p>• Enter a project ID or use one selected from the list</p>
        <p>• This endpoint returns complete project data including files</p>
        <p>• Press Enter to fetch project</p>
      </div>
    </div>
  );
}
