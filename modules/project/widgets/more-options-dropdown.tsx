"use client";

import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import {
  ContextMenu,
  useContextMenu,
} from "@/components/common/menu/context-menu";

export const MoreOptionsDropdown = observer(function MoreOptionsDropdown() {
  const engine = useEditorEngine();
  const [isDownloading, setIsDownloading] = useState(false);
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();

  // Handle download project
  const handleDownloadProject = async () => {
    if (!engine.projects.currentProject || isDownloading) return;

    setIsDownloading(true);
    try {
      console.log("🔽 Downloading project...");

      const response = await fetch(
        `/api/v1/projects/${engine.projects.currentProject.id}/download`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download project");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Download failed");
      }

      // Create download link and trigger download
      const link = document.createElement("a");
      link.href = result.dataUrl;
      link.download = result.fileName || "project-download.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("✅ Project downloaded successfully:", result.fileName);
    } catch (error) {
      console.error("❌ Download failed:", error);
      alert(
        `Download failed: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle history (placeholder for now)
  const handleViewHistory = () => {
    console.log("📜 View History clicked (not implemented yet)");
    // TODO: Implement history functionality
  };

  // Handle more options button click to show context menu
  const handleMoreOptionsClick = (event: React.MouseEvent) => {
    event.preventDefault();
    showContextMenu(event);
  };

  // Generate context menu items
  const getContextMenuItems = () => {
    const items = [];

    // Download Project
    items.push({
      label: isDownloading ? "Downloading..." : "Download",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 12l-4-4h3V2h2v6h3l-4 4zM2 14h12v2H2v-2z" />
        </svg>
      ),
      onClick: handleDownloadProject,
      disabled: isDownloading || !engine.projects.currentProject,
    });

    // History (placeholder)
    items.push({
      label: "History",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1.5A6.5 6.5 0 1 0 14.5 8h-1A5.5 5.5 0 1 1 8 2.5z" />
          <path d="M11 4.5L8.5 2L11 2L11 4.5z" />
        </svg>
      ),
      onClick: handleViewHistory,
      disabled: false,
    });

    return items;
  };

  return (
    <>
      {/* More Options Button */}
      <button
        onClick={handleMoreOptionsClick}
        className="flex items-center gap-2 px-2 py-1.5 hover:bg-bk-40 rounded-lg transition-colors group cursor-pointer"
      >
        {/* More Options Icon */}
        <div className="w-4 h-4 text-fg-50 group-hover:text-fg-30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 32 32"
            fill="currentColor"
          >
            <path d="M2 8a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3zm3-1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1zm10-1a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2zm0 13a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2zm-1-8a1 1 0 0 1 1-1h9a1 1 0 1 1 0 2h-9a1 1 0 0 1-1-1m1 12a1 1 0 1 0 0 2h9a1 1 0 1 0 0-2zM5 18a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3h3a3 3 0 0 0 3-3v-3a3 3 0 0 0-3-3zm-1 3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
          </svg>
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
