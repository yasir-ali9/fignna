"use client";

import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { AppMode } from "@/lib/stores/editor/state";
import {
  ContextMenu,
  useContextMenu,
} from "@/components/menu/context-menu";

export const SandboxDropdown = observer(function SandboxDropdown() {
  const engine = useEditorEngine();
  const { sandbox } = engine;
  const [isCreating, setIsCreating] = useState(false);
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();

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
      await sandbox.createSandbox();
    } catch (error) {
      console.error("Failed to create sandbox:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDestroySandbox = async () => {
    try {
      await sandbox.destroyCurrentSandbox();
    } catch (error) {
      console.error("Failed to destroy sandbox:", error);
    }
  };

  const handleDebugSandbox = async () => {
    if (!sandbox.currentSandbox) return;

    // Switch to code mode for debugging
    engine.state.setAppMode(AppMode.CODE);
    console.log("Switched to code mode for debugging");
  };

  const handleRestartSandbox = async () => {
    try {
      await sandbox.restartViteServer();
    } catch (error) {
      console.error("Restart failed:", error);
      alert("Failed to restart Vite server. Check console for details.");
    }
  };

  // Function to refresh sandbox using fetch
  const handleRefreshSandbox = async () => {
    setIsCreating(true);
    try {
      // TODO: Get current project ID from URL or context
      const projectId = "current-project";

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
  };

  const handlePreviewOpen = () => {
    if (sandbox.currentSandbox?.url) {
      window.open(sandbox.currentSandbox.url, "_blank", "noopener noreferrer");
    }
  };

  // Handle sandbox button click to show context menu
  const handleSandboxClick = (event: React.MouseEvent) => {
    event.preventDefault();
    showContextMenu(event);
  };

  // Generate context menu items based on sandbox state
  const getContextMenuItems = () => {
    const items = [];

    if (sandbox.currentSandbox) {
      // Preview Link
      if (sandbox.currentSandbox.url) {
        items.push({
          label: "Open Preview",
          icon: (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2C4.7 2 2 4.7 2 8s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" />
              <circle cx="8" cy="8" r="2" />
            </svg>
          ),
          onClick: handlePreviewOpen,
        });
      }

      // Debug (Switch to Code Mode)
      items.push({
        label: "Debug Mode",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1L4 5h2v6h4V5h2L8 1zM2 13h12v2H2v-2z" />
          </svg>
        ),
        onClick: handleDebugSandbox,
      });

      // Restart Vite Server
      items.push({
        label: sandbox.isRestarting ? "Restarting..." : "Restart Vite",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 3V1L5 4l3 3V5c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4H2c0 3.3 2.7 6 6 6s6-2.7 6-6-2.7-6-6-6z" />
          </svg>
        ),
        onClick: handleRestartSandbox,
        disabled: sandbox.isRestarting,
      });

      // Save from Sandbox to Project
      items.push({
        label: engine.projects.isSaving ? "Saving..." : "Save to Project",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 12l-4-4h3V2h2v6h3l-4 4zM2 14h12v2H2v-2z" />
          </svg>
        ),
        onClick: async () => {
          try {
            await engine.projects.saveFromSandbox();
          } catch (error) {
            console.error("Manual save failed:", error);
          }
        },
        disabled: engine.projects.isSaving || !engine.projects.currentProject,
      });

      // Sync Project to Sandbox
      items.push({
        label: engine.projects.isSyncing ? "Syncing..." : "Sync Project",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1v6l3-3M8 1L5 4l3-3zM8 15V9l-3 3M8 15l3-3-3 3z" />
          </svg>
        ),
        onClick: async () => {
          try {
            await engine.projects.syncToSandbox();
          } catch (error) {
            console.error("Manual sync failed:", error);
          }
        },
        disabled: engine.projects.isSyncing,
      });

      // Refresh Sandbox
      items.push({
        label: isCreating ? "Refreshing..." : "Refresh Sandbox",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1.5A6.5 6.5 0 1 0 14.5 8h-1A5.5 5.5 0 1 1 8 2.5z" />
            <path d="M11 4.5L8.5 2L11 2L11 4.5z" />
          </svg>
        ),
        onClick: handleRefreshSandbox,
        disabled: isCreating,
      });

      // Destroy
      items.push({
        label: "Destroy",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6 2h4v1H6V2zm7 2H3v1h1v8c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V5h1V4zm-2 9H5V5h6v8z" />
          </svg>
        ),
        onClick: handleDestroySandbox,
      });
    } else {
      // Create Sandbox
      items.push({
        label: isCreating || sandbox.isCreating ? "Creating..." : "Create VM",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2v6m0 0v6m0-6h6m-6 0H2" />
          </svg>
        ),
        onClick: handleCreateNextjsSandbox,
        disabled: isCreating || sandbox.isCreating,
      });
    }

    return items;
  };

  return (
    <>
      {/* Sandbox Button with Icon and Status Dot */}
      <button
        onClick={handleSandboxClick}
        className="flex items-center gap-1 px-2 py-1.5 hover:bg-bk-40 rounded-lg transition-colors group cursor-pointer"
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
        <div className="w-3 h-3 text-fg-60 group-hover:text-fg-50 transition-transform duration-200">
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

      {/* Context Menu */}
      <ContextMenu
        items={getContextMenuItems()}
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={hideContextMenu}
      />
    </>
  );
});
