"use client";

import { useState } from "react";

interface ListProjectsProps {
  onMessage: (text: string, type: "success" | "error" | "info") => void;
  onProjectSelect: (projectId: string) => void;
}

export function ListProjects({
  onMessage,
  onProjectSelect,
}: ListProjectsProps) {
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState("10");
  const [offset, setOffset] = useState("0");
  const [projects, setProjects] = useState<any[]>([]);

  const handleListProjects = async () => {
    setLoading(true);
    onMessage("Fetching projects list...", "info");

    try {
      const params = new URLSearchParams({
        limit,
        offset,
      });

      const response = await fetch(`/api/v1/projects?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProjects(data.data.projects);
        onMessage(
          `✅ Successfully fetched ${data.data.projects.length} projects`,
          "success"
        );
        onMessage(`📊 Response: ${JSON.stringify(data, null, 2)}`, "info");
      } else {
        onMessage(
          `❌ Failed to fetch projects: ${data.error || "Unknown error"}`,
          "error"
        );
        if (data.details) {
          onMessage(
            `🔍 Details: ${JSON.stringify(data.details, null, 2)}`,
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
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Parameters */}
      <div className="space-y-3">
        <h4 className="text-fg-50 text-[11px] font-medium">Parameters</h4>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-fg-60 text-[9px] font-medium mb-1">
              Limit
            </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full px-2 py-1 text-[10px] bg-bk-50 border border-bd-50 rounded text-fg-50 focus:outline-none focus:border-blue-400"
              min="1"
              max="100"
            />
          </div>

          <div>
            <label className="block text-fg-60 text-[9px] font-medium mb-1">
              Offset
            </label>
            <input
              type="number"
              value={offset}
              onChange={(e) => setOffset(e.target.value)}
              className="w-full px-2 py-1 text-[10px] bg-bk-50 border border-bd-50 rounded text-fg-50 focus:outline-none focus:border-blue-400"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleListProjects}
        disabled={loading}
        className="w-full px-3 py-2 text-[11px] font-medium bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Fetching..." : "List Projects"}
      </button>

      {/* Projects List */}
      {projects.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-fg-50 text-[11px] font-medium">
            Projects ({projects.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-bk-50 border border-bd-50 rounded p-2 hover:bg-bk-40 transition-colors cursor-pointer"
                onClick={() => onProjectSelect(project.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-fg-50 text-[10px] font-medium">
                    {project.name}
                  </span>
                  <span className="text-fg-60 text-[8px] font-mono">
                    {project.id.slice(0, 8)}...
                  </span>
                </div>
                {project.description && (
                  <div className="text-fg-60 text-[9px] mb-1">
                    {project.description}
                  </div>
                )}
                <div className="flex items-center justify-between text-[8px] text-fg-60">
                  <span>
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  <span>
                    Updated: {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="text-fg-60 text-[9px] leading-relaxed">
        <p>• Click on a project to select it for other operations</p>
        <p>• Use limit and offset for pagination</p>
        <p>• This endpoint returns metadata only (no file content)</p>
      </div>
    </div>
  );
}
