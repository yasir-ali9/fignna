"use client";

import { useState } from "react";

interface ProjectSyncProps {
  onMessage: (text: string, type: "success" | "error" | "info") => void;
  selectedProjectId: string;
  onProjectIdChange: (id: string) => void;
}

export function ProjectSync({
  onMessage,
  selectedProjectId,
  onProjectIdChange,
}: ProjectSyncProps) {
  const [projectId, setProjectId] = useState(selectedProjectId);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);

  const handleSync = async () => {
    if (!projectId.trim()) {
      onMessage("Please enter a project ID", "error");
      return;
    }

    setIsLoading(true);
    onMessage(`Syncing project ${projectId} to sandbox...`, "info");

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onMessage(
          `✅ Project synced successfully! ${data.data.filesCount} files synced`,
          "success"
        );
        onMessage(`🚀 Preview URL: ${data.data.previewUrl}`, "success");
        onMessage(`Response: ${JSON.stringify(data, null, 2)}`, "info");
        setSyncStatus(data.data);
      } else {
        onMessage(`❌ Sync failed: ${data.error || "Unknown error"}`, "error");
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

  const handleGetStatus = async () => {
    if (!projectId.trim()) {
      onMessage("Please enter a project ID", "error");
      return;
    }

    setIsLoading(true);
    onMessage(`Getting sync status for project ${projectId}...`, "info");

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/sync`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onMessage(`✅ Sync status retrieved successfully`, "success");
        onMessage(`Response: ${JSON.stringify(data, null, 2)}`, "info");
        setSyncStatus(data.data);
      } else {
        onMessage(
          `❌ Failed to get sync status: ${data.error || "Unknown error"}`,
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
          placeholder="Enter project ID to sync"
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

      <div className="pt-2 border-t border-bd-50 space-y-2">
        <button
          onClick={handleSync}
          disabled={isLoading || !projectId.trim()}
          className="w-full px-4 py-2 bg-green-500 text-white text-[11px] font-medium rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Syncing..." : "🚀 Sync to Sandbox"}
        </button>

        <button
          onClick={handleGetStatus}
          disabled={isLoading || !projectId.trim()}
          className="w-full px-4 py-2 bg-blue-500 text-white text-[11px] font-medium rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Getting Status..." : "📊 Get Sync Status"}
        </button>
      </div>

      {syncStatus && (
        <div className="space-y-3">
          <h4 className="text-fg-50 text-[11px] font-medium border-b border-bd-50 pb-2">
            Current Sync Status
          </h4>

          <div className="grid grid-cols-1 gap-3">
            <div className="bg-bk-30 rounded p-3 border border-bd-50">
              <div className="text-fg-60 text-[9px] uppercase tracking-wide mb-1">
                Sandbox Status
              </div>
              <div
                className={`text-[12px] font-bold ${
                  syncStatus.isActive ? "text-green-400" : "text-yellow-400"
                }`}
              >
                {syncStatus.isActive ? "🟢 Active" : "🟡 Inactive"}
              </div>
            </div>

            {syncStatus.previewUrl && (
              <div className="bg-bk-30 rounded p-3 border border-bd-50">
                <div className="text-fg-60 text-[9px] uppercase tracking-wide mb-1">
                  Preview URL
                </div>
                <a
                  href={syncStatus.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 text-[10px] font-mono break-all hover:text-blue-300 underline"
                >
                  {syncStatus.previewUrl}
                </a>
              </div>
            )}

            <div className="bg-bk-30 rounded p-3 border border-bd-50">
              <div className="text-fg-60 text-[9px] uppercase tracking-wide mb-1">
                Files Count
              </div>
              <div className="text-fg-50 text-[14px] font-bold">
                {syncStatus.filesCount}
              </div>
            </div>

            {syncStatus.sandboxId && (
              <div className="bg-bk-30 rounded p-3 border border-bd-50">
                <div className="text-fg-60 text-[9px] uppercase tracking-wide mb-1">
                  Sandbox ID
                </div>
                <div className="text-fg-50 text-[10px] font-mono break-all">
                  {syncStatus.sandboxId}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-bd-50">
            <button
              onClick={() => setSyncStatus(null)}
              className="w-full px-3 py-1 text-[9px] bg-bk-50 text-fg-60 rounded hover:bg-bk-30 hover:text-fg-50 transition-colors"
            >
              Clear Status
            </button>
          </div>
        </div>
      )}

      <div className="text-[9px] text-fg-60 bg-bk-30 p-2 rounded">
        <strong>🔄 Sync Info:</strong> This endpoint extracts files from the
        database and creates a live E2B sandbox. The sync process includes file
        creation, dependency installation, and dev server startup.
        <br />
        <br />
        <strong>📊 Status Info:</strong> Check if a project has an active
        sandbox and get preview URL.
      </div>
    </div>
  );
}
