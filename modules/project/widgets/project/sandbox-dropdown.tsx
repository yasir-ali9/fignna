"use client";

import { useState, useRef, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useEditorEngine } from "@/lib/stores/editor/hooks";

export const SandboxDropdown = observer(function SandboxDropdown() {
  const engine = useEditorEngine();
  const { sandbox } = engine;
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get status dot color based on sandbox status
  const getStatusDotColor = () => {
    if (!sandbox.currentSandbox) return "bg-fg-60"; // Gray for no sandbox

    switch (sandbox.currentSandbox.status) {
      case "creating":
        return "bg-yellow-500";
      case "running":
        return "bg-green-500";
      case "stopped":
        return "bg-red-500";
      case "error":
        return "bg-red-600";
      default:
        return "bg-fg-60";
    }
  };

  // Sandbox control handlers - now connected to MobX store
  const handleCreateNextjsSandbox = async () => {
    setIsCreating(true);
    try {
      await sandbox.createSandbox({
        framework: "nextjs",
        name: "My Next.js App",
      });
    } catch (error) {
      console.error("Failed to create sandbox:", error);
    } finally {
      setIsCreating(false);
    }
    setIsOpen(false);
  };

  const handleDestroySandbox = async () => {
    try {
      await sandbox.destroyCurrentSandbox();
    } catch (error) {
      console.error("Failed to destroy sandbox:", error);
    }
    setIsOpen(false);
  };

  const handleDebugSandbox = async () => {
    if (!sandbox.currentSandbox) return;

    console.log("Debug sandbox:", sandbox.currentSandbox);
    // TODO: Implement actual Daytona debug functionality
    alert("Debug info logged to console. Check browser dev tools.");
    setIsOpen(false);
  };

  const handleRestartSandbox = async () => {
    try {
      await sandbox.restartSandbox();
    } catch (error) {
      console.error("Restart failed:", error);
    }
    setIsOpen(false);
  };

  // Function to refresh sandbox using fetch
  const handleRefreshSandbox = async () => {
    setIsCreating(true);
    try {
      // Get current project ID from engine
      const projectId = engine.state.projectId;
      if (!projectId) {
        throw new Error("No project ID available");
      }

      // Check sandbox status using V1 API
      const response = await fetch("/api/v1/sandbox/status");

      if (!response.ok) {
        throw new Error("Failed to check sandbox status");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Sandbox not available");
      }

      // Update the sandbox state with new preview URL
      if (result.previewUrl) {
        sandbox.updatePreviewUrl(result.previewUrl);
      }
      if (result.sandboxId) {
        sandbox.updateSandboxId(result.sandboxId);
      }

      console.log("✅ Sandbox refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh sandbox:", error);
      alert("Failed to refresh sandbox. Check console for details.");
    } finally {
      setIsCreating(false);
    }
    setIsOpen(false);
  };

  const handlePreviewOpen = () => {
    if (sandbox.currentSandbox?.urls.preview) {
      window.open(
        sandbox.currentSandbox.urls.preview,
        "_blank",
        "noopener noreferrer"
      );
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Sandbox Button with Icon and Status Dot */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 hover:bg-bk-40 rounded-lg transition-colors group cursor-pointer"
      >
        {/* Sandbox Icon */}
        <div className="w-4 h-4 text-fg-50 group-hover:text-fg-30 relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M11.3 2.48a3.5 3.5 0 0 0-2.6 0L2.943 4.785A1.5 1.5 0 0 0 2 6.176v7.646a1.5 1.5 0 0 0 .943 1.393L8.7 17.518a3.5 3.5 0 0 0 2.6 0l5.757-2.303A1.5 1.5 0 0 0 18 13.822V6.176a1.5 1.5 0 0 0-.943-1.392zm-2.228.93a2.5 2.5 0 0 1 1.857 0l5.225 2.09l-2.279.91l-6.154-2.46zM6.375 4.487l6.154 2.461L10 7.961L3.846 5.499zm4.125 4.35l6.5-2.6v7.584a.5.5 0 0 1-.314.465l-5.757 2.303q-.21.083-.429.128zm-1 0v7.88a2.5 2.5 0 0 1-.428-.128l-5.758-2.303A.5.5 0 0 1 3 13.822V6.238z" />
          </svg>
          {/* Status Dot */}
          <div
            className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${getStatusDotColor()}`}
          ></div>
        </div>

        {/* Chevron Down */}
        <div
          className={`w-3 h-3 text-fg-60 group-hover:text-fg-50 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-bk-40 border border-bd-50 rounded-lg shadow-xl backdrop-blur-sm z-50 py-1">
          {/* Sandbox Status Section */}
          <div className="px-3 py-2 border-b border-bd-50">
            <div className="text-[11px] text-fg-60 mb-1">Sandbox Status</div>
            {sandbox.currentSandbox ? (
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${getStatusDotColor()}`}
                ></div>
                <span className="text-[11px] text-fg-50">
                  {sandbox.currentSandbox.status} |{" "}
                  {sandbox.currentSandbox.id.slice(0, 8)}...
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-fg-60 rounded-full"></div>
                <span className="text-[11px] text-fg-50">No sandbox</span>
              </div>
            )}
          </div>

          {/* Sandbox Controls */}
          <div className="py-1">
            {sandbox.currentSandbox ? (
              <>
                {/* Preview Link */}
                {sandbox.currentSandbox.urls?.preview && (
                  <button
                    onClick={handlePreviewOpen}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-fg-50 hover:text-fg-30 hover:bg-bk-30 transition-colors"
                  >
                    <div className="w-4 h-4">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <path d="M8 2C4.7 2 2 4.7 2 8s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" />
                        <circle cx="8" cy="8" r="2" />
                      </svg>
                    </div>
                    <span>Open Preview</span>
                  </button>
                )}

                {/* Debug */}
                <button
                  onClick={handleDebugSandbox}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-fg-50 hover:text-fg-30 hover:bg-bk-30 transition-colors"
                >
                  <div className="w-4 h-4">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M4.5 7.5L7 10l4.5-4.5" />
                    </svg>
                  </div>
                  <span>Debug</span>
                </button>

                {/* Restart */}
                <button
                  onClick={handleRestartSandbox}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-fg-50 hover:text-fg-30 hover:bg-bk-30 transition-colors"
                >
                  <div className="w-4 h-4">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M8 3V1L5 4l3 3V5c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4H2c0 3.3 2.7 6 6 6s6-2.7 6-6-2.7-6-6-6z" />
                    </svg>
                  </div>
                  <span>Restart</span>
                </button>

                {/* Refresh Sandbox */}
                <button
                  onClick={handleRefreshSandbox}
                  disabled={isCreating}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-fg-50 hover:text-fg-30 hover:bg-bk-30 disabled:text-fg-60 disabled:cursor-not-allowed transition-colors"
                >
                  <div className="w-4 h-4">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M8 1.5A6.5 6.5 0 1 0 14.5 8h-1A5.5 5.5 0 1 1 8 2.5z" />
                      <path d="M11 4.5L8.5 2L11 2L11 4.5z" />
                    </svg>
                  </div>
                  <span>
                    {isCreating ? "Refreshing..." : "Refresh Sandbox"}
                  </span>
                </button>

                {/* Destroy */}
                <button
                  onClick={handleDestroySandbox}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-fg-50 hover:text-fg-30 hover:bg-bk-30 transition-colors"
                >
                  <div className="w-4 h-4">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M6 2h4v1H6V2zm7 2H3v1h1v8c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V5h1V4zm-2 9H5V5h6v8z" />
                    </svg>
                  </div>
                  <span>Destroy</span>
                </button>
              </>
            ) : (
              /* Create Sandbox */
              <button
                onClick={handleCreateNextjsSandbox}
                disabled={isCreating || sandbox.isCreating}
                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-fg-50 hover:text-fg-30 hover:bg-bk-30 disabled:text-fg-60 disabled:cursor-not-allowed transition-colors"
              >
                <div className="w-4 h-4">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M8 2v6m0 0v6m0-6h6m-6 0H2" />
                  </svg>
                </div>
                <span>
                  {isCreating || sandbox.isCreating
                    ? "Creating..."
                    : "Create Next.js App"}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
