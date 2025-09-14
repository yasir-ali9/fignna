import { makeAutoObservable } from "mobx";
import type { EditorEngine } from "../index";

export interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
  files: Record<string, string>;
  dependencies: Record<string, string>;
  sandboxId?: string;
  previewUrl?: string;
  version: number;
  lastSavedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  template?: "react" | "nextjs" | "vite";
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  files?: Record<string, string>;
  dependencies?: Record<string, string>;
  sandboxId?: string;
  previewUrl?: string;
}

export class ProjectsManager {
  private engine: EditorEngine;

  // Project list and current project
  projects: Project[] = [];
  currentProject: Project | null = null;

  // Loading states
  isLoading: boolean = false;
  isSaving: boolean = false;
  isCreating: boolean = false;
  isSyncing: boolean = false;
  error: string | null = null;

  // Auto-save settings
  autoSaveEnabled: boolean = true;
  autoSaveInterval: number = 2000; // 2 seconds
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private isDirty: boolean = false;

  constructor(engine: EditorEngine) {
    this.engine = engine;
    makeAutoObservable(this);
  }

  // Project loading and management
  async loadProjects() {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await fetch("/api/v1/projects");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load projects");
      }

      this.projects = result.data.projects;
      this.isLoading = false;
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Unknown error";
      this.isLoading = false;
    }
  }

  async loadProject(projectId: string) {
    this.isLoading = true;
    this.error = null;

    try {
      const project = await this.fetchProject(projectId);
      this.currentProject = project;

      // Sync with existing managers
      this.engine.files.setFiles(project.files);

      // Update sandbox info if available
      if (project.sandboxId && project.previewUrl) {
        this.engine.sandbox.updateSandboxInfo(
          project.sandboxId,
          project.previewUrl
        );
      }

      this.isDirty = false;
      this.isLoading = false;

      // Automatically sync project to sandbox for live preview
      // This ensures existing projects have a running sandbox
      console.log(
        `[ProjectsManager] Auto-syncing project ${projectId} to sandbox...`
      );
      try {
        await this.syncToSandbox();
        console.log(
          `[ProjectsManager] Project ${projectId} synced to sandbox successfully`
        );
      } catch (syncError) {
        // Don't fail the entire load if sync fails - user can manually sync later
        console.warn(
          `[ProjectsManager] Auto-sync failed for project ${projectId}:`,
          syncError
        );
        // Store sync error separately so UI can show it
        this.error = `Project loaded but sandbox sync failed: ${
          syncError instanceof Error ? syncError.message : "Unknown error"
        }`;
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Unknown error";
      this.isLoading = false;
    }
  }

  async createProject(data: CreateProjectRequest) {
    this.isCreating = true;
    this.error = null;

    try {
      const response = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create project");
      }

      const newProject = result.data.project;
      this.projects.unshift(newProject);

      // Automatically load the new project
      await this.loadProject(newProject.id);

      this.isCreating = false;
      return newProject;
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Unknown error";
      this.isCreating = false;
      throw error;
    }
  }

  // Save current project state to database
  async saveProject() {
    if (!this.currentProject || this.isSaving) return;

    this.isSaving = true;
    this.error = null;

    try {
      // Use changed files only to prevent overwriting unchanged files with empty content
      const changedFiles = this.engine.files.getChangedFiles();

      // SAFETY CHECK: Validate that we have actual file content before saving
      const hasValidFiles = Object.values(changedFiles).some(
        (content) => typeof content === "string" && content.trim().length > 0
      );

      if (!hasValidFiles && Object.keys(changedFiles).length > 0) {
        console.warn("⚠️ Preventing save of empty files to avoid data loss");
        this.isSaving = false;
        return;
      }

      // If no files have changed, don't save
      if (Object.keys(changedFiles).length === 0) {
        console.log("[ProjectsManager] No files have changed, skipping save");
        this.isSaving = false;
        return;
      }

      console.log(
        `[ProjectsManager] Saving ${
          Object.keys(changedFiles).length
        } changed files:`,
        Object.keys(changedFiles)
      );

      // PROPER FLOW: Update sandbox first, then database
      // Step 1: Update files in sandbox for immediate preview
      try {
        const sandboxResponse = await fetch("/api/v1/sandbox/files/write", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: changedFiles,
          }),
        });

        if (!sandboxResponse.ok) {
          console.warn(
            "Failed to update sandbox during auto-save, continuing with database save..."
          );
        } else {
          console.log("✅ Files updated in sandbox for immediate preview");
        }
      } catch (sandboxError) {
        console.warn(
          "Sandbox update failed during auto-save, continuing with database save:",
          sandboxError
        );
      }

      // Step 2: Save to database with PATCH endpoint for persistence
      const response = await fetch(
        `/api/v1/projects/${this.currentProject.id}/files/update`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: changedFiles,
            metadata: {
              source: "editor",
              updatedBy: "user",
            },
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update files");
      }

      // Update project metadata
      this.currentProject.version = result.data.version;
      this.currentProject.lastSavedAt = new Date(result.data.lastSavedAt);

      // Update project in list
      const index = this.projects.findIndex(
        (p) => p.id === this.currentProject!.id
      );
      if (index !== -1) {
        this.projects[index] = { ...this.currentProject };
      }

      this.isDirty = false;
      this.isSaving = false;
    } catch (error) {
      this.error =
        error instanceof Error ? error.message : "Failed to save project";
      this.isSaving = false;
    }
  }

  // Sync project to sandbox
  async syncToSandbox() {
    if (!this.currentProject || this.isSyncing) return;

    this.isSyncing = true;
    this.error = null;

    try {
      const response = await fetch(
        `/api/v1/projects/${this.currentProject.id}/sync`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to sync to sandbox");
      }

      // Update project with sandbox info
      this.currentProject.sandboxId = result.data.sandboxId;
      this.currentProject.previewUrl = result.data.previewUrl;

      // Update sandbox manager
      this.engine.sandbox.updateSandboxInfo(
        result.data.sandboxId,
        result.data.previewUrl
      );

      this.isSyncing = false;
    } catch (error) {
      this.error =
        error instanceof Error ? error.message : "Failed to sync to sandbox";
      this.isSyncing = false;
    }
  }

  // Save files from sandbox to project database
  async saveFromSandbox() {
    if (!this.currentProject || this.isSaving) return;

    this.isSaving = true;
    this.error = null;

    try {
      const response = await fetch(
        `/api/v1/projects/${this.currentProject.id}/save`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to save from sandbox");
      }

      // Update project version info
      this.currentProject.version = result.data.version;
      this.currentProject.lastSavedAt = new Date(result.data.lastSavedAt);

      // No need to reload project - we just saved files, project structure hasn't changed
      console.log(
        `Saved ${result.data.filesCount} files from sandbox to project`
      );
      this.isSaving = false;
    } catch (error) {
      this.error =
        error instanceof Error ? error.message : "Failed to save from sandbox";
      this.isSaving = false;
    }
  }

  // Auto-save functionality
  markDirty() {
    this.isDirty = true;

    if (this.autoSaveEnabled && this.currentProject) {
      this.scheduleAutoSave();
    }
  }

  private scheduleAutoSave() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    this.autoSaveTimer = setTimeout(() => {
      if (this.isDirty && this.currentProject) {
        this.saveProject();
      }
    }, this.autoSaveInterval);
  }

  // Project metadata updates
  async updateProjectMetadata(data: { name?: string; description?: string }) {
    if (!this.currentProject) return;

    try {
      const updatedProject = await this.updateProject(
        this.currentProject.id,
        data
      );
      this.currentProject = updatedProject;

      // Update in projects list
      const index = this.projects.findIndex((p) => p.id === updatedProject.id);
      if (index !== -1) {
        this.projects[index] = updatedProject;
      }
    } catch (error) {
      this.error =
        error instanceof Error ? error.message : "Failed to update project";
    }
  }

  // Delete project
  async deleteProject(projectId: string) {
    try {
      const response = await fetch(`/api/v1/projects/${projectId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to delete project");
      }

      // Remove from projects list
      this.projects = this.projects.filter((p) => p.id !== projectId);

      // Clear current project if it was deleted
      if (this.currentProject?.id === projectId) {
        this.currentProject = null;
        this.engine.files.clearFiles();
        this.engine.sandbox.clearSandbox();
      }
    } catch (error) {
      this.error =
        error instanceof Error ? error.message : "Failed to delete project";
      throw error;
    }
  }

  // Helper methods for API calls
  private async fetchProject(projectId: string): Promise<Project> {
    const response = await fetch(`/api/v1/projects/${projectId}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch project");
    }

    return result.data.project;
  }

  private async updateProject(
    projectId: string,
    data: UpdateProjectRequest
  ): Promise<Project> {
    const response = await fetch(`/api/v1/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to update project");
    }

    return result.data.project;
  }

  // Getters for computed values
  get hasUnsavedChanges() {
    return this.isDirty;
  }

  get canSave() {
    return this.currentProject && this.isDirty && !this.isSaving;
  }

  get canSync() {
    return this.currentProject && !this.isSyncing;
  }

  // Cleanup
  dispose() {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
}
