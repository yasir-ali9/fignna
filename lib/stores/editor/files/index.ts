import { makeAutoObservable, runInAction } from "mobx";
import type { EditorEngine } from "../index";
import type { FileInfo } from "@/lib/types/file-manifest";

// File tree node for the file explorer
export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
  isExpanded?: boolean;
}

// Active file tab
export interface FileTab {
  id: string;
  path: string;
  name: string;
  content: string;
  isDirty: boolean; // Has unsaved changes
  isActive: boolean;
}

/**
 * FilesManager - Manages file operations and state for the code editor
 * Integrates with database via tRPC and handles file tree, tabs, and content
 */
export class FilesManager {
  // Maximum number of open tabs allowed
  private static readonly MAX_TABS = 5;

  // Reference to the editor engine for project persistence
  private engine: EditorEngine | null = null;

  // File tree for explorer
  fileTree: FileNode[] = [];

  // Open file tabs
  openTabs: FileTab[] = [];

  // Currently active file
  activeFileId: string | null = null;

  // Currently selected folder (for VS Code-like behavior)
  selectedFolderPath: string | null = null;

  // Inline creation state (VS Code-like behavior)
  creatingItem: {
    type: "file" | "folder";
    parentPath: string | null; // null for root level
    tempId: string;
  } | null = null;

  // Editor settings
  isTextWrapEnabled: boolean = false;

  // Loading states
  isLoadingFiles: boolean = false;
  isLoadingFile: boolean = false;

  // Error states
  error: string | null = null;

  // Current project ID
  projectId: string | null = null;

  constructor(engine?: EditorEngine) {
    this.engine = engine || null;
    makeAutoObservable(this);
  }

  /**
   * Set the editor engine reference for persistence
   */
  setEngine(engine: EditorEngine) {
    this.engine = engine;
  }

  /**
   * Initialize files manager with project ID
   */
  initialize(projectId: string) {
    this.projectId = projectId;
    this.clearState();
  }

  /**
   * Clear all state
   */
  clearState() {
    this.fileTree = [];
    this.openTabs = [];
    this.activeFileId = null;
    this.selectedFolderPath = null;
    this.creatingItem = null;
    this.error = null;
  }

  /**
   * Sort file tree recursively: folders first, then files (both alphabetically)
   */
  private sortFileTree(nodes: FileNode[]) {
    nodes.sort((a, b) => {
      // Folders always come before files
      if (a.type === "folder" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "folder") return 1;

      // Both are same type, sort alphabetically (case-insensitive)
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

    // Recursively sort children
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        this.sortFileTree(node.children);
      }
    });
  }

  /**
   * Build hierarchical file tree from flat file list
   */
  private buildFileTree(files: FileInfo[]): FileNode[] {
    const tree: FileNode[] = [];
    const folderMap = new Map<string, FileNode>();

    // Sort files by path for consistent ordering
    const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

    for (const file of sortedFiles) {
      const pathParts = file.path.split("/");
      let currentPath = "";
      let currentLevel = tree;

      // Create folder structure
      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderName = pathParts[i];
        currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

        let folder = folderMap.get(currentPath);
        if (!folder) {
          folder = {
            name: folderName,
            path: currentPath,
            type: "folder",
            children: [],
            isExpanded: true, // Auto-expand folders initially
          };
          folderMap.set(currentPath, folder);
          currentLevel.push(folder);
        }

        currentLevel = folder.children!;
      }

      // Add file
      const fileName = pathParts[pathParts.length - 1];
      currentLevel.push({
        name: fileName,
        path: file.path,
        type: "file",
      });
    }

    // Sort each level: folders first, then files (both alphabetically)
    this.sortFileTree(tree);

    return tree;
  }

  /**
   * Open file in editor (create new tab or switch to existing)
   */
  openFile(filePath: string, content?: string) {
    // Check if file is already open
    const existingTab = this.openTabs.find((tab) => tab.path === filePath);
    if (existingTab) {
      this.setActiveFile(existingTab.id);
      return;
    }

    // Create new tab
    const fileName = filePath.split("/").pop() || filePath;
    const tabId = `tab-${Date.now()}-${Math.random()}`;

    const newTab: FileTab = {
      id: tabId,
      path: filePath,
      name: fileName,
      content: content || "",
      isDirty: false,
      isActive: true,
    };

    runInAction(() => {
      // Set all other tabs as inactive
      this.openTabs.forEach((tab) => (tab.isActive = false));

      // Check if we've reached the tab limit
      if (this.openTabs.length >= FilesManager.MAX_TABS) {
        // Find the oldest non-active tab to close
        const oldestTab = this.openTabs.find((tab) => !tab.isActive);
        if (oldestTab) {
          // Remove the oldest tab
          const tabIndex = this.openTabs.findIndex(
            (tab) => tab.id === oldestTab.id
          );
          this.openTabs.splice(tabIndex, 1);
          console.log(
            `🗂️ Tab limit reached (${FilesManager.MAX_TABS}), closed oldest tab: ${oldestTab.name}`
          );
        }
      }

      // Add new tab
      this.openTabs.push(newTab);
      this.activeFileId = tabId;

      // Clear folder selection when opening a file
      this.selectedFolderPath = null;
    });
  }

  /**
   * Close file tab
   */
  closeFile(tabId: string) {
    runInAction(() => {
      const tabIndex = this.openTabs.findIndex((tab) => tab.id === tabId);
      if (tabIndex === -1) return;

      const wasActive = this.openTabs[tabIndex].isActive;
      this.openTabs.splice(tabIndex, 1);

      // If closed tab was active, activate another tab
      if (wasActive && this.openTabs.length > 0) {
        const newActiveIndex = Math.min(tabIndex, this.openTabs.length - 1);
        this.setActiveFile(this.openTabs[newActiveIndex].id);
      } else if (this.openTabs.length === 0) {
        this.activeFileId = null;
      }
    });
  }

  /**
   * Set active file tab
   */
  setActiveFile(tabId: string) {
    runInAction(() => {
      this.openTabs.forEach((tab) => {
        tab.isActive = tab.id === tabId;
      });
      this.activeFileId = tabId;
      // Clear folder selection when a file is selected
      this.selectedFolderPath = null;
    });
  }

  /**
   * Set selected folder (VS Code-like behavior)
   */
  setSelectedFolder(folderPath: string | null) {
    runInAction(() => {
      this.selectedFolderPath = folderPath;
      // Clear active file when a folder is selected
      if (folderPath) {
        this.openTabs.forEach((tab) => (tab.isActive = false));
        this.activeFileId = null;
      }
    });
  }

  /**
   * Start inline creation of file or folder (VS Code-like behavior)
   */
  startInlineCreation(
    type: "file" | "folder",
    parentPath: string | null = null
  ) {
    runInAction(() => {
      this.creatingItem = {
        type,
        parentPath,
        tempId: `temp-${Date.now()}-${Math.random()}`,
      };
    });
  }

  /**
   * Cancel inline creation
   */
  cancelInlineCreation() {
    runInAction(() => {
      this.creatingItem = null;
    });
  }

  /**
   * Complete inline creation with the given name
   */
  completeInlineCreation(name: string) {
    if (!this.creatingItem || !name.trim()) {
      this.cancelInlineCreation();
      return null;
    }

    const fullPath = this.creatingItem.parentPath
      ? `${this.creatingItem.parentPath}/${name.trim()}`
      : name.trim();

    const result = {
      type: this.creatingItem.type,
      path: fullPath,
      name: name.trim(),
    };

    this.cancelInlineCreation();
    return result;
  }

  /**
   * Toggle text wrap in editor
   */
  toggleTextWrap() {
    runInAction(() => {
      this.isTextWrapEnabled = !this.isTextWrapEnabled;
      console.log("🔄 Text wrap toggled:", this.isTextWrapEnabled);
    });
  }

  /**
   * Update file content and mark as dirty
   */
  updateFileContent(tabId: string, content: string) {
    runInAction(() => {
      const tab = this.openTabs.find((t) => t.id === tabId);
      if (tab) {
        tab.content = content;
        tab.isDirty = true;

        // Trigger auto-save through projects manager
        this.markProjectDirty();
      }
    });
  }

  /**
   * Mark file as saved (clean)
   */
  markFileSaved(tabId: string) {
    runInAction(() => {
      const tab = this.openTabs.find((t) => t.id === tabId);
      if (tab) {
        tab.isDirty = false;
      }
    });
  }

  /**
   * Toggle folder expansion in file tree
   */
  toggleFolder(folderPath: string) {
    const toggleInTree = (nodes: FileNode[]): boolean => {
      for (const node of nodes) {
        if (node.path === folderPath && node.type === "folder") {
          node.isExpanded = !node.isExpanded;
          return true;
        }
        if (node.children && toggleInTree(node.children)) {
          return true;
        }
      }
      return false;
    };

    runInAction(() => {
      toggleInTree(this.fileTree);
    });
  }

  /**
   * Set loading state
   */
  setLoading(isLoading: boolean) {
    runInAction(() => {
      this.isLoadingFiles = isLoading;
    });
  }

  /**
   * Set error state
   */
  setError(error: string | null) {
    runInAction(() => {
      this.error = error;
    });
  }

  /**
   * Get currently active file tab
   */
  get activeFile(): FileTab | null {
    return this.openTabs.find((tab) => tab.isActive) || null;
  }

  /**
   * Get dirty (unsaved) files count
   */
  get dirtyFilesCount(): number {
    return this.openTabs.filter((tab) => tab.isDirty).length;
  }

  /**
   * Check if there are any unsaved changes
   */
  get hasUnsavedChanges(): boolean {
    return this.dirtyFilesCount > 0;
  }

  /**
   * Get file by path from tree
   */
  getFileByPath(path: string): FileNode | null {
    const findInTree = (nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
        if (node.path === path) {
          return node;
        }
        if (node.children) {
          const found = findInTree(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findInTree(this.fileTree);
  }

  // ===== PROJECT PERSISTENCE METHODS =====

  /**
   * Set files from project data (JSONB format)
   */
  setFiles(filesData: Record<string, string> | FileInfo[]) {
    runInAction(() => {
      if (Array.isArray(filesData)) {
        // Legacy format - convert to file tree
        const processedFiles = filesData.map((file) => ({
          ...file,
        }));
        this.fileTree = this.buildFileTree(processedFiles);
      } else {
        // New JSONB format - convert to file tree
        this.fileTree = this.buildFileTreeFromJSON(filesData);
      }

      this.isLoadingFiles = false;
      this.error = null;
    });
  }

  /**
   * Build file tree from JSONB files object
   */
  private buildFileTreeFromJSON(files: Record<string, string>): FileNode[] {
    const tree: FileNode[] = [];
    const folderMap = new Map<string, FileNode>();

    // Sort file paths for consistent ordering
    const sortedPaths = Object.keys(files).sort();

    for (const filePath of sortedPaths) {
      const pathParts = filePath.split("/");
      let currentPath = "";
      let currentLevel = tree;

      // Create folder structure
      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderName = pathParts[i];
        currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

        let folder = folderMap.get(currentPath);
        if (!folder) {
          folder = {
            name: folderName,
            path: currentPath,
            type: "folder",
            children: [],
            isExpanded: true,
          };
          folderMap.set(currentPath, folder);
          currentLevel.push(folder);
        }

        currentLevel = folder.children!;
      }

      // Add file
      const fileName = pathParts[pathParts.length - 1];
      currentLevel.push({
        name: fileName,
        path: filePath,
        type: "file",
      });
    }

    // Sort the tree
    this.sortFileTree(tree);
    return tree;
  }

  /**
   * Get all files as JSONB format for database storage
   * WARNING: This method includes empty files and should be used carefully
   */
  getAllFiles(): Record<string, string> {
    const files: Record<string, string> = {};

    // Get content from open tabs (most up-to-date)
    this.openTabs.forEach((tab) => {
      files[tab.path] = tab.content;
    });

    // Add files from tree that aren't open in tabs
    const addFilesFromTree = (nodes: FileNode[]) => {
      nodes.forEach((node) => {
        if (node.type === "file" && !files[node.path]) {
          // File not in tabs, use empty content or fetch from server
          files[node.path] = "";
        }
        if (node.children) {
          addFilesFromTree(node.children);
        }
      });
    };

    addFilesFromTree(this.fileTree);
    return files;
  }

  /**
   * Get only files that have been modified (changed files only)
   * This is safer for database updates as it won't overwrite unchanged files
   */
  getChangedFiles(): Record<string, string> {
    const changedFiles: Record<string, string> = {};

    // Only include files that are open in tabs (these are the ones being edited)
    this.openTabs.forEach((tab) => {
      if (tab.isDirty || tab.content.trim().length > 0) {
        changedFiles[tab.path] = tab.content;
      }
    });

    return changedFiles;
  }

  /**
   * Get dependencies from package.json if available
   */
  getDependencies(): Record<string, string> {
    const packageJsonTab = this.openTabs.find(
      (tab) => tab.path === "package.json"
    );
    if (packageJsonTab) {
      try {
        const packageJson = JSON.parse(packageJsonTab.content);
        return {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };
      } catch (error) {
        console.warn("Failed to parse package.json:", error);
      }
    }
    return {};
  }

  /**
   * Clear all files and reset state
   */
  clearFiles() {
    runInAction(() => {
      this.fileTree = [];
      this.openTabs = [];
      this.activeFileId = null;
      this.selectedFolderPath = null;
      this.creatingItem = null;
      this.error = null;
    });
  }

  /**
   * Mark project as dirty to trigger auto-save
   */
  private markProjectDirty() {
    if (this.engine?.projects) {
      this.engine.projects.markDirty();
    }
  }

  /**
   * Sync current files to database
   */
  async syncToDatabase() {
    if (this.engine?.projects) {
      await this.engine.projects.saveProject();
    }
  }

  /**
   * Create a new file and add to project
   */
  createFile(path: string, content: string = "") {
    runInAction(() => {
      // Add to file tree
      this.addFileToTree(path);

      // Open in editor
      this.openFile(path, content);

      // Mark project as dirty
      this.markProjectDirty();
    });
  }

  /**
   * Delete a file from project
   */
  deleteFile(path: string) {
    runInAction(() => {
      // Remove from file tree
      this.removeFileFromTree(path);

      // Close tab if open
      const tab = this.openTabs.find((t) => t.path === path);
      if (tab) {
        this.closeFile(tab.id);
      }

      // Mark project as dirty
      this.markProjectDirty();
    });
  }

  /**
   * Rename a file in project
   */
  renameFile(oldPath: string, newPath: string) {
    runInAction(() => {
      // Update file tree
      this.removeFileFromTree(oldPath);
      this.addFileToTree(newPath);

      // Update open tab if exists
      const tab = this.openTabs.find((t) => t.path === oldPath);
      if (tab) {
        tab.path = newPath;
        tab.name = newPath.split("/").pop() || newPath;
      }

      // Mark project as dirty
      this.markProjectDirty();
    });
  }

  /**
   * Add file to tree structure
   */
  private addFileToTree(filePath: string) {
    const pathParts = filePath.split("/");
    let currentLevel = this.fileTree;
    let currentPath = "";

    // Create folder structure
    for (let i = 0; i < pathParts.length - 1; i++) {
      const folderName = pathParts[i];
      currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

      let folder = currentLevel.find(
        (node) => node.type === "folder" && node.path === currentPath
      );

      if (!folder) {
        folder = {
          name: folderName,
          path: currentPath,
          type: "folder",
          children: [],
          isExpanded: true,
        };
        currentLevel.push(folder);
        this.sortFileTree(currentLevel);
      }

      currentLevel = folder.children!;
    }

    // Add file
    const fileName = pathParts[pathParts.length - 1];
    const existingFile = currentLevel.find(
      (node) => node.type === "file" && node.path === filePath
    );

    if (!existingFile) {
      currentLevel.push({
        name: fileName,
        path: filePath,
        type: "file",
      });
      this.sortFileTree(currentLevel);
    }
  }

  /**
   * Remove file from tree structure
   */
  private removeFileFromTree(filePath: string) {
    const removeFromLevel = (nodes: FileNode[]): boolean => {
      const index = nodes.findIndex((node) => node.path === filePath);
      if (index !== -1) {
        nodes.splice(index, 1);
        return true;
      }

      for (const node of nodes) {
        if (node.children && removeFromLevel(node.children)) {
          // Clean up empty folders
          if (node.children.length === 0) {
            const folderIndex = nodes.findIndex((n) => n === node);
            if (folderIndex !== -1) {
              nodes.splice(folderIndex, 1);
            }
          }
          return true;
        }
      }
      return false;
    };

    removeFromLevel(this.fileTree);
  }

  /**
   * Cleanup when manager is disposed
   */
  dispose() {
    this.clearState();
    this.projectId = null;
  }
}
