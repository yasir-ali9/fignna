"use client";

import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { FileNode } from "@/lib/stores/editor/files";

import {
  ChevronRightIcon,
  ChevronDownIcon,
  CommandLineIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Loader2 } from "lucide-react";
import { FileIcon } from "../icons/file-icons";
import { InlineCreator } from "./inline-creator";

interface FileTreeProps {
  projectId: string;
  onTerminalToggle?: () => void;
  showTerminalButton?: boolean;
  isTerminalActive?: boolean;
  onSplitViewToggle?: () => void;
  showSplitViewButton?: boolean;
  isSplitViewActive?: boolean;
}

/**
 * FileTree - Displays hierarchical file structure from database
 * Integrates with FilesManager for state management
 */

export const FileTree = observer(
  ({
    projectId,
    onTerminalToggle,
    showTerminalButton = false,
    isTerminalActive = false,
    onSplitViewToggle,
    showSplitViewButton = false,
    isSplitViewActive = false,
  }: FileTreeProps) => {
    const engine = useEditorEngine();

    // State for files and loading
    const [files, setFiles] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<Error | null>(null);
    const [isSyncing, setIsSyncing] = React.useState(false);
    const [isCreating, setIsCreating] = React.useState(false);

    // Fetch files from sandbox manifest (like test chat)
    const fetchFiles = React.useCallback(async () => {
      if (!engine.sandbox.currentSandboxId) {
        console.log("🌳 FileTree: No sandbox available");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/v1/sandbox/files/manifest");
        if (!response.ok) {
          throw new Error("Failed to fetch files from sandbox");
        }
        const data = await response.json();

        if (data.success && data.files) {
          // Convert files object to array format for compatibility
          const filesArray = Object.entries(data.files).map(
            ([path, content]) => ({
              path: path.replace("/home/user/app/", ""), // Remove sandbox prefix
              content: content as string,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          );

          setFiles(filesArray);
          console.log(
            "🌳 FileTree: Fetched files from sandbox:",
            filesArray.length
          );
        } else {
          throw new Error(data.error || "Invalid response from manifest API");
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        console.error("❌ FileTree: Error fetching files:", error);
      } finally {
        setIsLoading(false);
      }
    }, [engine.sandbox.currentSandboxId]);

    // Load files on mount and when sandbox changes
    React.useEffect(() => {
      if (engine.sandbox.currentSandboxId) {
        fetchFiles();
      }
    }, [fetchFiles, engine.sandbox.currentSandboxId]);

    // Listen for refresh events from code application (like test chat)
    React.useEffect(() => {
      const handleRefresh = () => {
        console.log("🔄 Received refresh event, fetching files...");
        fetchFiles();
      };

      window.addEventListener("refreshFiles", handleRefresh);
      return () => window.removeEventListener("refreshFiles", handleRefresh);
    }, [fetchFiles]);

    // Refetch files function for compatibility
    const refetchFiles = React.useCallback(() => {
      return fetchFiles();
    }, [fetchFiles]);

    // Process files when data changes
    React.useEffect(() => {
      if (files) {
        console.log("🌳 FileTree: Processing files:", files.length);
        engine.files.setFiles(files);
      }
    }, [files, engine.files]);

    // Handle errors
    React.useEffect(() => {
      if (error) {
        engine.files.setError(error.message);
      }
    }, [error, engine.files]);

    const handleFileClick = React.useCallback(
      (node: FileNode) => {
        console.log("🖱️ File clicked:", node.path, node.type);

        if (node.type === "folder") {
          // Set folder as selected (VS Code behavior)
          engine.files.setSelectedFolder(node.path);
          engine.files.toggleFolder(node.path);
          return;
        }

        // Check if file is already open
        const existingTab = engine.files.openTabs.find(
          (tab) => tab.path === node.path
        );
        if (existingTab) {
          console.log(
            "📂 File already open, switching to tab:",
            existingTab.id
          );
          engine.files.setActiveFile(existingTab.id);
          return;
        }

        // Get fresh file content from database when opening
        const fileData = files?.find((f) => f.path === node.path);
        if (fileData) {
          console.log(
            "📄 Opening file:",
            node.path,
            "Content length:",
            fileData.content.length
          );

          // Always refetch files to ensure we have the latest content
          refetchFiles().then(() => {
            console.log("🔄 Files refreshed after opening file");
          });

          engine.files.openFile(node.path, fileData.content);
        } else {
          console.error("File not found in loaded data:", node.path);
          engine.files.setError("File not found");
        }
      },
      [engine.files, files, refetchFiles]
    );

    // Handle inline creation completion
    const handleInlineCreationComplete = React.useCallback(
      async (name: string) => {
        const result = engine.files.completeInlineCreation(name);
        if (!result) return;

        try {
          setIsCreating(true);

          // PROPER FLOW: Create file in sandbox first, then database
          if (result.type === "file") {
            // Step 1: Create file in sandbox for immediate preview
            try {
              const sandboxResponse = await fetch(
                "/api/v1/sandbox/files/write",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    files: {
                      [result.path]: "",
                    },
                  }),
                }
              );

              if (!sandboxResponse.ok) {
                console.warn(
                  "Failed to create file in sandbox, continuing with database save..."
                );
              } else {
                console.log("✅ File created in sandbox for immediate preview");
              }
            } catch (sandboxError) {
              console.warn(
                "Sandbox file creation failed, continuing with database save:",
                sandboxError
              );
            }

            // Step 2: Save to database with PATCH endpoint for persistence
            const response = await fetch(
              `/api/v1/projects/${engine.projects.currentProject?.id}/files/update`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  files: {
                    [result.path]: "",
                  },
                  metadata: {
                    source: "editor",
                    updatedBy: "user",
                  },
                }),
              }
            );

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Failed to create file");
            }

            console.log("📄 Created file:", result.path);
          } else {
            // For folders, we create a placeholder .gitkeep file
            // Step 1: Create .gitkeep in sandbox for immediate preview
            try {
              const sandboxResponse = await fetch(
                "/api/v1/sandbox/files/write",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    files: {
                      [`${result.path}/.gitkeep`]: "",
                    },
                  }),
                }
              );

              if (!sandboxResponse.ok) {
                console.warn(
                  "Failed to create folder in sandbox, continuing with database save..."
                );
              } else {
                console.log(
                  "✅ Folder created in sandbox for immediate preview"
                );
              }
            } catch (sandboxError) {
              console.warn(
                "Sandbox folder creation failed, continuing with database save:",
                sandboxError
              );
            }

            // Step 2: Save to database with PATCH endpoint for persistence
            const response = await fetch(
              `/api/v1/projects/${engine.projects.currentProject?.id}/files/update`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  files: {
                    [`${result.path}/.gitkeep`]: "",
                  },
                  metadata: {
                    source: "editor",
                    updatedBy: "user",
                  },
                }),
              }
            );

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Failed to create folder");
            }

            console.log("📁 Created folder:", result.path);
          }

          // Refresh files to show the new item
          await refetchFiles();
        } catch (error) {
          console.error("❌ Failed to create item:", error);
          engine.files.setError(
            `Failed to create ${result.type}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        } finally {
          setIsCreating(false);
        }
      },
      [engine.files, projectId, refetchFiles]
    );

    // Handle inline creation cancellation
    const handleInlineCreationCancel = React.useCallback(() => {
      engine.files.cancelInlineCreation();
    }, [engine.files]);

    // Handle new file/folder creation
    const handleCreateFile = React.useCallback(() => {
      const parentPath = engine.files.selectedFolderPath;
      engine.files.startInlineCreation("file", parentPath);
    }, [engine.files]);

    const handleCreateFolder = React.useCallback(() => {
      const parentPath = engine.files.selectedFolderPath;
      engine.files.startInlineCreation("folder", parentPath);
    }, [engine.files]);

    // Define renderFileNode first (before it's used in renderTreeLevel)
    const renderFileNode = React.useCallback(
      (node: FileNode, level: number = 0) => {
        const isFolder = node.type === "folder";
        const isExpanded = node.isExpanded;
        const paddingLeft = level * 16 + 8;

        // Check if this file is currently active or folder is selected
        const isActiveFile =
          !isFolder && engine.files.activeFile?.path === node.path;
        const isSelectedFolder =
          isFolder && engine.files.selectedFolderPath === node.path;
        const isSelected = isActiveFile || isSelectedFolder;

        return (
          <div key={node.path}>
            {/* File/Folder Item */}
            <div
              className={`flex items-center gap-1 px-2 py-1 cursor-pointer select-none transition-colors ${
                isSelected
                  ? "bg-bk-40 hover:bg-bk-30" // Active file or selected folder: darker background
                  : "hover:bg-bk-40" // Non-selected: lighter hover background (bk-60 is lighter than bk-50)
              }`}
              style={{ paddingLeft }}
              onClick={() => handleFileClick(node)}
            >
              {/* Expand/Collapse Icon (or placeholder space for files) */}
              <div className="w-4 h-4 flex items-center justify-center">
                {isFolder ? (
                  isExpanded ? (
                    <ChevronDownIcon className="w-3 h-3 text-fg-60" />
                  ) : (
                    <ChevronRightIcon className="w-3 h-3 text-fg-60" />
                  )
                ) : (
                  // Empty space for files to maintain alignment
                  <div className="w-3 h-3" />
                )}
              </div>

              {/* File/Folder Icon */}
              <div className="w-4 h-4 flex items-center justify-center">
                <FileIcon
                  filename={node.name}
                  isDirectory={isFolder}
                  isOpen={isExpanded}
                  size={16}
                  className="flex-shrink-0"
                />
              </div>

              {/* File/Folder Name */}
              <span className="text-fg-30 truncate text-[11px]">
                {node.name}
              </span>
            </div>

            {/* Children (if folder is expanded) */}
            {isFolder && isExpanded && node.children && (
              <div>
                {(() => {
                  const folders = node.children.filter(
                    (child) => child.type === "folder"
                  );
                  const files = node.children.filter(
                    (child) => child.type === "file"
                  );
                  const isCreatingInThisFolder =
                    engine.files.creatingItem &&
                    engine.files.creatingItem.parentPath === node.path;

                  return (
                    <>
                      {/* 1. Render folders first */}
                      {folders.map((child) => renderFileNode(child, level + 1))}

                      {/* 2. If creating a folder, show inline creator after folders */}
                      {isCreatingInThisFolder &&
                        engine.files.creatingItem?.type === "folder" && (
                          <InlineCreator
                            key="folder-creator"
                            type="folder"
                            level={level + 1}
                            onComplete={handleInlineCreationComplete}
                            onCancel={handleInlineCreationCancel}
                          />
                        )}

                      {/* 3. If creating a file, show inline creator before files */}
                      {isCreatingInThisFolder &&
                        engine.files.creatingItem?.type === "file" && (
                          <InlineCreator
                            key="file-creator"
                            type="file"
                            level={level + 1}
                            onComplete={handleInlineCreationComplete}
                            onCancel={handleInlineCreationCancel}
                          />
                        )}

                      {/* 4. Render files last */}
                      {files.map((child) => renderFileNode(child, level + 1))}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        );
      },
      [
        handleFileClick,
        handleInlineCreationComplete,
        handleInlineCreationCancel,
      ]
    );

    // Render tree level with proper inline creator positioning (VS Code style)
    const renderTreeLevel = React.useCallback(
      (nodes: FileNode[], parentPath: string | null, level: number) => {
        // Separate folders and files
        const folders = nodes.filter((node) => node.type === "folder");
        const files = nodes.filter((node) => node.type === "file");

        const isCreatingInThisLevel =
          engine.files.creatingItem &&
          engine.files.creatingItem.parentPath === parentPath;

        return (
          <>
            {/* 1. Render all folders first */}
            {folders.map((folder) => renderFileNode(folder, level))}

            {/* 2. If creating a folder, show inline creator after folders */}
            {isCreatingInThisLevel &&
              engine.files.creatingItem?.type === "folder" && (
                <InlineCreator
                  key="folder-creator"
                  type="folder"
                  level={level}
                  onComplete={handleInlineCreationComplete}
                  onCancel={handleInlineCreationCancel}
                />
              )}

            {/* 3. If creating a file, show inline creator before files (after folders) */}
            {isCreatingInThisLevel &&
              engine.files.creatingItem?.type === "file" && (
                <InlineCreator
                  key="file-creator"
                  type="file"
                  level={level}
                  onComplete={handleInlineCreationComplete}
                  onCancel={handleInlineCreationCancel}
                />
              )}

            {/* 4. Render all files last */}
            {files.map((file) => renderFileNode(file, level))}
          </>
        );
      },
      [
        engine.files,
        handleInlineCreationComplete,
        handleInlineCreationCancel,
        renderFileNode,
      ]
    );

    // Helper function to render tree with proper inline creator positioning
    const renderTreeWithInlineCreator = React.useCallback(
      (nodes: FileNode[], parentPath: string | null, level: number) => {
        const folders = nodes.filter((node) => node.type === "folder");
        const files = nodes.filter((node) => node.type === "file");

        const isCreatingInThisLevel =
          engine.files.creatingItem &&
          engine.files.creatingItem.parentPath === parentPath;

        const elements: React.ReactNode[] = [];

        // 1. Render folders first
        folders.forEach((folder) => {
          elements.push(renderFileNode(folder, level));
        });

        // 2. If creating a folder, add inline creator after folders
        if (
          isCreatingInThisLevel &&
          engine.files.creatingItem?.type === "folder"
        ) {
          elements.push(
            <InlineCreator
              key="folder-creator"
              type="folder"
              level={level}
              onComplete={handleInlineCreationComplete}
              onCancel={handleInlineCreationCancel}
            />
          );
        }

        // 3. If creating a file, add inline creator before files (after folders)
        if (
          isCreatingInThisLevel &&
          engine.files.creatingItem?.type === "file"
        ) {
          elements.push(
            <InlineCreator
              key="file-creator"
              type="file"
              level={level}
              onComplete={handleInlineCreationComplete}
              onCancel={handleInlineCreationCancel}
            />
          );
        }

        // 4. Render files last
        files.forEach((file) => {
          elements.push(renderFileNode(file, level));
        });

        return elements;
      },
      [
        engine.files,
        handleInlineCreationComplete,
        handleInlineCreationCancel,
        renderFileNode,
      ]
    );

    if (
      isLoading ||
      engine.files.isLoadingFiles ||
      engine.projects.isSyncing ||
      engine.sandbox.isRestarting ||
      engine.sandbox.isCreating
    ) {
      return (
        <div className="p-4 text-center">
          <Loader2 className="animate-spin h-4 w-4 text-fg-50 mx-auto mb-2" />
          <div className="text-[11px] text-fg-60">
            {engine.sandbox.isRestarting
              ? "Restarting server..."
              : engine.projects.isSyncing
              ? "Syncing project..."
              : engine.sandbox.isCreating
              ? "Creating sandbox..."
              : "Loading files..."}
          </div>
        </div>
      );
    }

    if (error || engine.files.error) {
      return (
        <div className="p-4 text-center text-[11px]">
          <div className="text-[11px] text-red-400 max-w-[150px]">
            {error?.message || engine.files.error}
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col">
        {/* File Tree Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-medium text-fg-40 uppercase tracking-wide">
            Files
          </span>
          <div className="flex items-center gap-1">
            <button
              className={`p-1 rounded cursor-pointer transition-colors ${
                isSyncing ? "animate-spin" : ""
              } hover:text-fg-30`}
              title="Sync to Sandbox & Refresh Files"
              onClick={async () => {
                try {
                  setIsSyncing(true);

                  // First refresh the files from database
                  console.log("🔄 Refreshing files from database...");
                  await refetchFiles();

                  // Then sync project to sandbox using V1 API
                  if (engine.projects.currentProject) {
                    const response = await fetch(
                      `/api/v1/projects/${engine.projects.currentProject.id}/sync`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                      }
                    );

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(
                        errorData.error || "Failed to sync project to sandbox"
                      );
                    }

                    const result = await response.json();
                    console.log("🔄 Manual sync result:", result);
                  } else {
                    console.log("🔄 No current project to sync");
                  }
                } catch (error) {
                  console.error("❌ Manual sync failed:", error);
                  engine.files.setError(
                    `Sync failed: ${
                      error instanceof Error ? error.message : "Unknown error"
                    }`
                  );
                } finally {
                  setIsSyncing(false);
                }
              }}
              disabled={isSyncing}
            >
              <ArrowPathIcon className="w-3.5 h-3.5 text-fg-60" />
            </button>
            <button
              className="p-1 rounded cursor-pointer transition-colors hover:text-fg-30"
              title="New File"
              onClick={handleCreateFile}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 20 20"
                className="text-fg-60"
              >
                <path
                  fill="currentColor"
                  d="M6 2a2 2 0 0 0-2 2v5.207a5.5 5.5 0 0 1 1-.185V4a1 1 0 0 1 1-1h4v3.5A1.5 1.5 0 0 0 11.5 8H15v8a1 1 0 0 1-1 1h-3.6a5.5 5.5 0 0 1-.657 1H14a2 2 0 0 0 2-2V7.414a1.5 1.5 0 0 0-.44-1.06l-3.914-3.915A1.5 1.5 0 0 0 10.586 2zm8.793 5H11.5a.5.5 0 0 1-.5-.5V3.207zM10 14.5a4.5 4.5 0 1 1-9 0a4.5 4.5 0 0 1 9 0m-4-2a.5.5 0 0 0-1 0V14H3.5a.5.5 0 0 0 0 1H5v1.5a.5.5 0 0 0 1 0V15h1.5a.5.5 0 0 0 0-1H6z"
                />
              </svg>
            </button>
            <button
              className="p-1 rounded cursor-pointer transition-colors hover:text-fg-30"
              title="New Folder"
              onClick={handleCreateFolder}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 20 20"
                className="text-fg-60"
              >
                <path
                  fill="currentColor"
                  d="M4.5 3A2.5 2.5 0 0 0 2 5.5v9A2.5 2.5 0 0 0 4.5 17h5.1a5.5 5.5 0 0 1-.393-1H4.5A1.5 1.5 0 0 1 3 14.5V8h4.086a1.5 1.5 0 0 0 1.06-.44L9.707 6H15.5A1.5 1.5 0 0 1 17 7.5v2.1q.538.276 1 .657V7.5A2.5 2.5 0 0 0 15.5 5H9.707L8.22 3.513A1.75 1.75 0 0 0 6.982 3zM3 5.5A1.5 1.5 0 0 1 4.5 4h2.482a.75.75 0 0 1 .53.22l1.28 1.28L7.44 6.854A.5.5 0 0 1 7.086 7H3zm16 9a4.5 4.5 0 1 1-9 0a4.5 4.5 0 0 1 9 0m-4-2a.5.5 0 0 0-1 0V14h-1.5a.5.5 0 0 0 0 1H14v1.5a.5.5 0 0 0 1 0V15h1.5a.5.5 0 0 0 0-1H15z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* File Tree */}
        <div className="py-1">
          {engine.files.fileTree.length === 0 ? (
            <div className="p-4 text-center text-[11px] text-fg-60">
              No files found
            </div>
          ) : (
            <>
              {(() => {
                const folders = engine.files.fileTree.filter(
                  (node) => node.type === "folder"
                );
                const files = engine.files.fileTree.filter(
                  (node) => node.type === "file"
                );
                const isCreatingAtRoot =
                  engine.files.creatingItem &&
                  engine.files.creatingItem.parentPath === null;

                return (
                  <>
                    {/* 1. Render folders first */}
                    {folders.map((node) => renderFileNode(node, 0))}

                    {/* 2. If creating a folder at root, show inline creator after folders */}
                    {isCreatingAtRoot &&
                      engine.files.creatingItem?.type === "folder" && (
                        <InlineCreator
                          key="root-folder-creator"
                          type="folder"
                          level={0}
                          onComplete={handleInlineCreationComplete}
                          onCancel={handleInlineCreationCancel}
                        />
                      )}

                    {/* 3. If creating a file at root, show inline creator before files */}
                    {isCreatingAtRoot &&
                      engine.files.creatingItem?.type === "file" && (
                        <InlineCreator
                          key="root-file-creator"
                          type="file"
                          level={0}
                          onComplete={handleInlineCreationComplete}
                          onCancel={handleInlineCreationCancel}
                        />
                      )}

                    {/* 4. Render files last */}
                    {files.map((node) => renderFileNode(node, 0))}
                  </>
                );
              })()}
            </>
          )}
        </div>
        </div>

        {/* Bottom Controls */}
        {(showSplitViewButton || showTerminalButton) && (
          <div className="bg-bk-50 px-3 py-2">
            <div className="flex items-center justify-between">
              {/* Feedback text on the left */}
              <div className="text-[11px] text-fg-60 hover:text-fg-50 transition-colors cursor-pointer">
                Feedback
              </div>
              
              {/* Icons aligned to the right */}
              <div className="flex items-center gap-2">
                {/* Split View Button */}
                {showSplitViewButton && onSplitViewToggle && (
                  <button
                    className={`flex items-center justify-center p-1.5 transition-colors rounded-md cursor-pointer ${
                      isSplitViewActive
                        ? "bg-bk-30 text-fg-50"
                        : "text-fg-60 hover:text-fg-50 hover:bg-bk-40"
                    }`}
                    title="Toggle Split View"
                    onClick={onSplitViewToggle}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" className={isSplitViewActive ? "text-fg-50" : "text-fg-60"}>
                      <path fill="currentColor" d="M8.5 1.5a.5.5 0 0 0-1 0v13a.5.5 0 0 0 1 0zM1 5.5A2.5 2.5 0 0 1 3.5 3h3v1h-3A1.5 1.5 0 0 0 2 5.5v5A1.5 1.5 0 0 0 3.5 12h3v1h-3A2.5 2.5 0 0 1 1 10.5zM9.5 4V3h3A2.5 2.5 0 0 1 15 5.5v5a2.5 2.5 0 0 1-2.5 2.5h-3v-1h3a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 12.5 4z"/>
                    </svg>
                  </button>
                )}

                {/* Terminal Button */}
                {showTerminalButton && onTerminalToggle && (
                  <button
                    className={`flex items-center justify-center p-1.5 transition-colors rounded-md cursor-pointer ${
                      isTerminalActive
                        ? "bg-bk-30 text-fg-50"
                        : "text-fg-60 hover:text-fg-50 hover:bg-bk-40"
                    }`}
                    title="Toggle Terminal"
                    onClick={onTerminalToggle}
                  >
                    <CommandLineIcon className={`w-4 h-4 ${isTerminalActive ? "text-fg-50" : "text-fg-60"}`} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);
