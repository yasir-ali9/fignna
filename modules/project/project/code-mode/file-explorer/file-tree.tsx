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
import { FileIcon } from "../icons/file-icons";
import { InlineCreator } from "./inline-creator";

interface FileTreeProps {
  projectId: string;
  onTerminalToggle?: () => void;
  showTerminalButton?: boolean;
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

          // Create the file/folder using V1 Projects API
          if (result.type === "file") {
            // Get current project files
            const currentFiles = engine.files.getAllFiles();

            // Add the new file
            const updatedFiles = {
              ...currentFiles,
              [result.path]: "",
            };

            // Update via V1 API
            const response = await fetch(
              `/api/v1/projects/${engine.projects.currentProject?.id}/files`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  files: updatedFiles,
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
            const currentFiles = engine.files.getAllFiles();

            // Add the .gitkeep file for the folder
            const updatedFiles = {
              ...currentFiles,
              [`${result.path}/.gitkeep`]: "",
            };

            const response = await fetch(
              `/api/v1/projects/${engine.projects.currentProject?.id}/files`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  files: updatedFiles,
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

    if (isLoading || engine.files.isLoadingFiles) {
      return (
        <div className="p-4 text-center">
          <div className="text-[11px] text-fg-60">Loading files...</div>
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
      <div className="h-full overflow-y-auto">
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
            {showTerminalButton && onTerminalToggle && (
              <button
                className="p-1 rounded cursor-pointer transition-colors hover:text-fg-30"
                title="Toggle Terminal"
                onClick={onTerminalToggle}
              >
                <CommandLineIcon className="w-3.5 h-3.5 text-fg-60" />
              </button>
            )}
            <button
              className="p-1 rounded cursor-pointer transition-colors hover:text-fg-30"
              title="New File"
              onClick={handleCreateFile}
            >
              <FileIcon
                filename="new-file.txt"
                size={14}
                className="text-fg-60"
              />
            </button>
            <button
              className="p-1 rounded cursor-pointer transition-colors hover:text-fg-30"
              title="New Folder"
              onClick={handleCreateFolder}
            >
              <FileIcon
                filename="new-folder"
                isDirectory={true}
                size={14}
                className="text-fg-60"
              />
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
    );
  }
);
