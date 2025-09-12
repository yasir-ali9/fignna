"use client";

import { useState, useEffect } from "react";

interface Version {
  id: string;
  projectId: string;
  version: number;
  message: string;
  changeType: "manual" | "auto" | "sync";
  createdAt: string;
}

interface VersionPanelProps {
  projectId: string | null;
  onMessage: (message: string, type: "success" | "error" | "info") => void;
}

export function VersionPanel({ projectId, onMessage }: VersionPanelProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<{
    from: string | null;
    to: string | null;
  }>({ from: null, to: null });
  const [comparison, setComparison] = useState<any>(null);
  const [showComparison, setShowComparison] = useState(false);

  // Fetch versions when projectId changes
  useEffect(() => {
    if (projectId) {
      fetchVersions();
    } else {
      setVersions([]);
    }
  }, [projectId]);

  const fetchVersions = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/versions`);
      const data = await response.json();

      if (data.success) {
        setVersions(data.data.versions);
        onMessage(`Loaded ${data.data.versions.length} versions`, "success");
      } else {
        onMessage(`Failed to load versions: ${data.error}`, "error");
      }
    } catch (error) {
      onMessage(`Error loading versions: ${error}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const createManualVersion = async () => {
    if (!projectId) return;

    const message = prompt("Enter version message:", "Manual snapshot");
    if (!message) return;

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: {}, // Would need to get current files
          message,
          changeType: "manual",
        }),
      });

      const data = await response.json();
      if (data.success) {
        onMessage(`Created version ${data.data.version.version}`, "success");
        fetchVersions(); // Refresh list
      } else {
        onMessage(`Failed to create version: ${data.error}`, "error");
      }
    } catch (error) {
      onMessage(`Error creating version: ${error}`, "error");
    }
  };

  const restoreVersion = async (versionId: string, versionNumber: number) => {
    if (!projectId) return;

    const confirmed = confirm(
      `Are you sure you want to restore to version ${versionNumber}? This will overwrite the current project state.`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/v1/projects/${projectId}/versions/${versionId}/restore`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();
      if (data.success) {
        onMessage(`Restored to version ${versionNumber}`, "success");
        fetchVersions(); // Refresh list
      } else {
        onMessage(`Failed to restore version: ${data.error}`, "error");
      }
    } catch (error) {
      onMessage(`Error restoring version: ${error}`, "error");
    }
  };

  const compareVersions = async () => {
    if (!projectId || !selectedVersions.from || !selectedVersions.to) return;

    try {
      const response = await fetch(
        `/api/v1/projects/${projectId}/versions/compare`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromVersionId: selectedVersions.from,
            toVersionId: selectedVersions.to,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setComparison(data.data);
        setShowComparison(true);
        onMessage("Version comparison completed", "success");
      } else {
        onMessage(`Failed to compare versions: ${data.error}`, "error");
      }
    } catch (error) {
      onMessage(`Error comparing versions: ${error}`, "error");
    }
  };

  const cleanupVersions = async () => {
    if (!projectId) return;

    const keepCount = prompt("How many recent versions to keep?", "10");
    if (!keepCount) return;

    try {
      const response = await fetch(
        `/api/v1/projects/${projectId}/versions/cleanup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keepCount: parseInt(keepCount) }),
        }
      );

      const data = await response.json();
      if (data.success) {
        onMessage(
          `Cleaned up ${data.data.deletedCount} old versions`,
          "success"
        );
        fetchVersions(); // Refresh list
      } else {
        onMessage(`Failed to cleanup versions: ${data.error}`, "error");
      }
    } catch (error) {
      onMessage(`Error cleaning up versions: ${error}`, "error");
    }
  };

  if (!projectId) {
    return (
      <div className="p-4 text-center text-fg-60 text-[12px]">
        Load a project to see version history
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-bd-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-fg-50 text-[12px] font-semibold">
            Version History
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={fetchVersions}
              disabled={loading}
              className="px-2 py-1 text-[9px] bg-bk-50 text-fg-60 rounded hover:bg-bk-30 hover:text-fg-50 transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
            <button
              onClick={createManualVersion}
              className="px-2 py-1 text-[9px] bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
            >
              + Version
            </button>
          </div>
        </div>

        {/* Comparison Controls */}
        {selectedVersions.from && selectedVersions.to && (
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={compareVersions}
              className="px-2 py-1 text-[9px] bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors"
            >
              Compare Selected
            </button>
            <button
              onClick={() => setSelectedVersions({ from: null, to: null })}
              className="px-2 py-1 text-[9px] bg-bk-50 text-fg-60 rounded hover:bg-bk-30 transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Cleanup Button */}
        <div className="flex justify-end">
          <button
            onClick={cleanupVersions}
            className="px-2 py-1 text-[9px] bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
          >
            Cleanup Old
          </button>
        </div>
      </div>

      {/* Version List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-fg-60 text-[11px]">
            Loading versions...
          </div>
        ) : versions.length === 0 ? (
          <div className="p-4 text-center text-fg-60 text-[11px]">
            No versions yet. Create your first version!
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  selectedVersions.from === version.id ||
                  selectedVersions.to === version.id
                    ? "bg-blue-500/10 border-blue-400/50"
                    : "bg-bk-40 border-bd-50 hover:bg-bk-30"
                }`}
                onClick={() => {
                  if (!selectedVersions.from) {
                    setSelectedVersions({
                      ...selectedVersions,
                      from: version.id,
                    });
                  } else if (
                    !selectedVersions.to &&
                    selectedVersions.from !== version.id
                  ) {
                    setSelectedVersions({
                      ...selectedVersions,
                      to: version.id,
                    });
                  } else {
                    setSelectedVersions({ from: version.id, to: null });
                  }
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-fg-50 text-[11px] font-medium">
                      v{version.version}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 text-[8px] rounded ${
                        version.changeType === "manual"
                          ? "bg-blue-500/20 text-blue-400"
                          : version.changeType === "auto"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-purple-500/20 text-purple-400"
                      }`}
                    >
                      {version.changeType}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      restoreVersion(version.id, version.version);
                    }}
                    className="px-2 py-1 text-[8px] bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors"
                  >
                    Restore
                  </button>
                </div>
                <div className="text-fg-60 text-[10px] mb-1">
                  {version.message}
                </div>
                <div className="text-fg-60 text-[9px]">
                  {new Date(version.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      {showComparison && comparison && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bk-40 border border-bd-50 rounded-lg w-[90%] max-w-4xl h-[80%] flex flex-col">
            <div className="p-4 border-b border-bd-50 flex items-center justify-between">
              <h3 className="text-fg-50 text-[14px] font-semibold">
                Version Comparison
              </h3>
              <button
                onClick={() => setShowComparison(false)}
                className="text-fg-60 hover:text-fg-50 text-[16px]"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-bk-50 p-3 rounded">
                  <h4 className="text-fg-50 text-[12px] font-medium mb-1">
                    From: v{comparison.fromVersion.version}
                  </h4>
                  <p className="text-fg-60 text-[10px]">
                    {comparison.fromVersion.message}
                  </p>
                  <p className="text-fg-60 text-[9px]">
                    {new Date(
                      comparison.fromVersion.createdAt
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="bg-bk-50 p-3 rounded">
                  <h4 className="text-fg-50 text-[12px] font-medium mb-1">
                    To: v{comparison.toVersion.version}
                  </h4>
                  <p className="text-fg-60 text-[10px]">
                    {comparison.toVersion.message}
                  </p>
                  <p className="text-fg-60 text-[9px]">
                    {new Date(comparison.toVersion.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-fg-50 text-[12px] font-medium mb-2">
                  Statistics
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-green-500/10 p-2 rounded text-center">
                    <div className="text-green-400 text-[14px] font-bold">
                      {comparison.statistics.added}
                    </div>
                    <div className="text-fg-60 text-[9px]">Added</div>
                  </div>
                  <div className="bg-yellow-500/10 p-2 rounded text-center">
                    <div className="text-yellow-400 text-[14px] font-bold">
                      {comparison.statistics.modified}
                    </div>
                    <div className="text-fg-60 text-[9px]">Modified</div>
                  </div>
                  <div className="bg-red-500/10 p-2 rounded text-center">
                    <div className="text-red-400 text-[14px] font-bold">
                      {comparison.statistics.removed}
                    </div>
                    <div className="text-fg-60 text-[9px]">Removed</div>
                  </div>
                  <div className="bg-bk-50 p-2 rounded text-center">
                    <div className="text-fg-50 text-[14px] font-bold">
                      {comparison.statistics.unchanged}
                    </div>
                    <div className="text-fg-60 text-[9px]">Unchanged</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-fg-50 text-[12px] font-medium mb-2">
                  File Changes
                </h4>
                <div className="space-y-1">
                  {comparison.changes.map((change: any, index: number) => (
                    <div
                      key={index}
                      className={`p-2 rounded text-[10px] ${
                        change.type === "added"
                          ? "bg-green-500/10 text-green-400"
                          : change.type === "removed"
                          ? "bg-red-500/10 text-red-400"
                          : change.type === "modified"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-bk-50 text-fg-60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono">{change.path}</span>
                        <span className="uppercase font-bold">
                          {change.type}
                        </span>
                      </div>
                      {change.fromSize !== undefined &&
                        change.toSize !== undefined && (
                          <div className="text-[9px] opacity-75">
                            {change.fromSize} → {change.toSize} chars
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
