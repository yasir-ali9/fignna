"use client";

import { useState } from "react";

interface UpdateProjectProps {
  onMessage: (text: string, type: "success" | "error" | "info") => void;
  selectedProjectId: string;
  onProjectIdChange: (projectId: string) => void;
}

export function UpdateProject({
  onMessage,
  selectedProjectId,
  onProjectIdChange,
}: UpdateProjectProps) {
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState(selectedProjectId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sandboxId, setSandboxId] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const handleUpdateProject = async () => {
    const idToUse = projectId || selectedProjectId;

    if (!idToUse.trim()) {
      onMessage("❌ Project ID is required", "error");
      return;
    }

    // Build update object with only non-empty fields
    const updateData: any = {};
    if (name.trim()) updateData.name = name.trim();
    if (description.trim()) updateData.description = description.trim();
    if (sandboxId.trim()) updateData.sandboxId = sandboxId.trim();
    if (previewUrl.trim()) updateData.previewUrl = previewUrl.trim();

    if (Object.keys(updateData).length === 0) {
      onMessage("❌ At least one field must be provided for update", "error");
      return;
    }

    setLoading(true);
    onMessage(`Updating project ${idToUse}...`, "info");

    try {
      onMessage(`📤 Request: ${JSON.stringify(updateData, null, 2)}`, "info");

      const response = await fetch(`/api/v1/projects/${idToUse}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onMessage(
          `✅ Successfully updated project: ${data.data.project.name}`,
          "success"
        );
        onMessage(`📊 Response: ${JSON.stringify(data, null, 2)}`, "info");
        onProjectIdChange(data.data.project.id);

        // Clear form
        setName("");
        setDescription("");
        setSandboxId("");
        setPreviewUrl("");
      } else {
        onMessage(
          `❌ Failed to update project: ${data.error || "Unknown error"}`,
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
      {/* Project ID Input */}
      <div className="space-y-3">
        <h4 className="text-fg-50 text-[11px] font-medium">Project ID</h4>

        <div>
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="Enter project ID"
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

      {/* Update Fields */}
      <div className="space-y-3">
        <h4 className="text-fg-50 text-[11px] font-medium">Update Fields</h4>
        <p className="text-fg-60 text-[9px]">
          Only fill fields you want to update
        </p>

        <div>
          <label className="block text-fg-60 text-[9px] font-medium mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New project name"
            className="w-full px-2 py-1 text-[10px] bg-bk-50 border border-bd-50 rounded text-fg-50 placeholder-fg-60 focus:outline-none focus:border-blue-400"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-fg-60 text-[9px] font-medium mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="New project description"
            className="w-full px-2 py-1 text-[10px] bg-bk-50 border border-bd-50 rounded text-fg-50 placeholder-fg-60 focus:outline-none focus:border-blue-400 resize-none"
            rows={2}
            maxLength={500}
          />
        </div>

        <div>
          <label className="block text-fg-60 text-[9px] font-medium mb-1">
            Sandbox ID
          </label>
          <input
            type="text"
            value={sandboxId}
            onChange={(e) => setSandboxId(e.target.value)}
            placeholder="Sandbox ID"
            className="w-full px-2 py-1 text-[10px] bg-bk-50 border border-bd-50 rounded text-fg-50 placeholder-fg-60 focus:outline-none focus:border-blue-400 font-mono"
          />
        </div>

        <div>
          <label className="block text-fg-60 text-[9px] font-medium mb-1">
            Preview URL
          </label>
          <input
            type="url"
            value={previewUrl}
            onChange={(e) => setPreviewUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-2 py-1 text-[10px] bg-bk-50 border border-bd-50 rounded text-fg-50 placeholder-fg-60 focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleUpdateProject}
        disabled={loading || !(projectId || selectedProjectId).trim()}
        className="w-full px-3 py-2 text-[11px] font-medium bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Updating..." : "Update Project"}
      </button>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setName("");
            setDescription("");
            setSandboxId("");
            setPreviewUrl("");
          }}
          className="px-2 py-1 text-[9px] bg-bk-50 text-fg-60 rounded hover:bg-bk-30 hover:text-fg-50 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Info */}
      <div className="text-fg-60 text-[9px] leading-relaxed">
        <p>• Only non-empty fields will be updated</p>
        <p>• Partial updates are supported</p>
        <p>• Preview URL must be a valid URL if provided</p>
      </div>
    </div>
  );
}
