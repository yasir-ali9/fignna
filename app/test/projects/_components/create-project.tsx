"use client";

import { useState } from "react";

interface CreateProjectProps {
  onMessage: (text: string, type: "success" | "error" | "info") => void;
  onProjectCreated: (project: any) => void;
}

export function CreateProject({
  onMessage,
  onProjectCreated,
}: CreateProjectProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreateProject = async () => {
    if (!name.trim()) {
      onMessage("❌ Project name is required", "error");
      return;
    }

    setLoading(true);
    onMessage("Creating new project...", "info");

    try {
      const requestBody = {
        name: name.trim(),
        description: description.trim() || undefined,
      };

      onMessage(`📤 Request: ${JSON.stringify(requestBody, null, 2)}`, "info");

      const response = await fetch("/api/v1/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onMessage(
          `✅ Successfully created project: ${data.data.project.name}`,
          "success"
        );
        onMessage(`📊 Response: ${JSON.stringify(data, null, 2)}`, "info");
        onProjectCreated(data.data.project);

        // Reset form
        setName("");
        setDescription("");
      } else {
        onMessage(
          `❌ Failed to create project: ${data.error || "Unknown error"}`,
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCreateProject();
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Form Fields */}
      <div className="space-y-3">
        <h4 className="text-fg-50 text-[11px] font-medium">Project Details</h4>

        <div>
          <label className="block text-fg-60 text-[9px] font-medium mb-1">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="My Awesome Project"
            className="w-full px-2 py-1 text-[10px] bg-bk-50 border border-bd-50 rounded text-fg-50 placeholder-fg-60 focus:outline-none focus:border-blue-400"
            maxLength={100}
          />
          <div className="text-fg-60 text-[8px] mt-1">
            {name.length}/100 characters
          </div>
        </div>

        <div>
          <label className="block text-fg-60 text-[9px] font-medium mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional project description..."
            className="w-full px-2 py-1 text-[10px] bg-bk-50 border border-bd-50 rounded text-fg-50 placeholder-fg-60 focus:outline-none focus:border-blue-400 resize-none"
            rows={3}
            maxLength={500}
          />
          <div className="text-fg-60 text-[8px] mt-1">
            {description.length}/500 characters
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleCreateProject}
        disabled={loading || !name.trim()}
        className="w-full px-3 py-2 text-[11px] font-medium bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Creating..." : "Create Project"}
      </button>

      {/* Quick Actions */}
      <div className="space-y-2">
        <h4 className="text-fg-60 text-[9px] font-medium">Quick Fill</h4>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setName("Test Project " + Date.now());
              setDescription(
                "A test project created from the API testing suite"
              );
            }}
            className="px-2 py-1 text-[9px] bg-bk-50 text-fg-60 rounded hover:bg-bk-30 hover:text-fg-50 transition-colors"
          >
            Sample Data
          </button>
          <button
            onClick={() => {
              setName("");
              setDescription("");
            }}
            className="px-2 py-1 text-[9px] bg-bk-50 text-fg-60 rounded hover:bg-bk-30 hover:text-fg-50 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="text-fg-60 text-[9px] leading-relaxed">
        <p>• Project name is required (1-100 characters)</p>
        <p>• Description is optional (max 500 characters)</p>
        <p>• Projects are initialized with empty files</p>
        <p>• Press Enter to create project</p>
      </div>
    </div>
  );
}
