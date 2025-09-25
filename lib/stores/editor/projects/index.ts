import { makeAutoObservable } from "mobx";
import type { EditorEngine } from "../index";

// Sandbox information structure matching database schema
export interface SandboxInfo {
  sandbox_id: string;
  preview_url: string;
  start_time: string; // ISO 8601 timestamp
  end_time: string; // ISO 8601 timestamp
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
  files: Record<string, string>;
  dependencies: Record<string, string>;
  // New comprehensive sandbox info
  sandboxInfo?: SandboxInfo;
  // Legacy fields for backward compatibility during migration
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
  // Legacy fields for backward compatibility
  sandboxId?: string;
  previewUrl?: string;
  // New sandbox info field
  sandboxInfo?: SandboxInfo;
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

  async loadProject(projectId: string, options?: { skipAutoSync?: boolean }) {
    this.isLoading = true;
    this.error = null;

    try {
      const project = await this.fetchProject(projectId);
      this.currentProject = project;

      // Sync with existing managers
      this.engine.files.setFiles(project.files);

      // Update sandbox info if available (support both new and legacy formats)
      if (project.sandboxInfo) {
        this.engine.sandbox.updateSandboxInfo(
          project.sandboxInfo.sandbox_id,
          project.sandboxInfo.preview_url
        );
      } else if (project.sandboxId && project.previewUrl) {
        this.engine.sandbox.updateSandboxInfo(
          project.sandboxId,
          project.previewUrl
        );
      }

      this.isDirty = false;
      this.isLoading = false;

      // Conditionally sync project to sandbox based on options
      // skipAutoSync = true for NEW projects (they need fresh sandbox, not sync from DB)
      // skipAutoSync = false for EXISTING projects (they need to sync DB files to sandbox)
      if (!options?.skipAutoSync) {
        console.log(
          `[ProjectsManager] Auto-syncing existing project ${projectId} to sandbox...`
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
      } else {
        console.log(
          `[ProjectsManager] Skipping auto-sync for new project ${projectId} (will create fresh sandbox instead)`
        );
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

  // Sync project to sandbox with intelligent status checking
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

      // Update project with new sandbox_info structure
      if (result.data.sandbox_info) {
        this.currentProject.sandboxInfo = result.data.sandbox_info;
      }

      // Also update legacy fields for backward compatibility
      this.currentProject.sandboxId = result.data.sandboxId;
      this.currentProject.previewUrl = result.data.previewUrl;

      // Update sandbox manager with the correct info
      const sandboxId =
        result.data.sandbox_info?.sandbox_id || result.data.sandboxId;
      const previewUrl =
        result.data.sandbox_info?.preview_url || result.data.previewUrl;

      if (sandboxId && previewUrl) {
        this.engine.sandbox.updateSandboxInfo(sandboxId, previewUrl);
      }

      console.log(
        `[ProjectsManager] Sync completed with sandbox info:`,
        result.data.sandbox_info
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

  // Sandbox status checking methods
  async checkSandboxStatus(): Promise<{
    success: boolean;
    status: "running" | "expired" | "not_found";
    sandbox_info?: any;
    action_required: "none" | "sync_needed";
    message: string;
  } | null> {
    if (!this.currentProject) return null;

    try {
      const response = await fetch(
        `/api/v1/projects/${this.currentProject.id}/sandbox/status`
      );
      const result = await response.json();

      if (result.success && result.sandbox_info) {
        // Update current project with latest sandbox info
        this.currentProject.sandboxInfo = {
          sandbox_id: result.sandbox_info.sandbox_id,
          preview_url: result.sandbox_info.preview_url,
          start_time: result.sandbox_info.start_time,
          end_time: result.sandbox_info.end_time,
        };
      }

      return result;
    } catch (error) {
      console.error("[ProjectsManager] Status check failed:", error);
      return {
        success: false,
        status: "not_found",
        action_required: "sync_needed",
        message: `Status check failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  // Get sandbox remaining time in minutes
  getSandboxRemainingTime(): number {
    if (!this.currentProject?.sandboxInfo) return 0;

    const currentTime = new Date();
    const endTime = new Date(this.currentProject.sandboxInfo.end_time);
    const remainingTimeMs = endTime.getTime() - currentTime.getTime();
    return Math.max(0, Math.floor(remainingTimeMs / 60000));
  }

  // Check if sandbox is expired
  isSandboxExpired(): boolean {
    if (!this.currentProject?.sandboxInfo) return true;

    const currentTime = new Date();
    const endTime = new Date(this.currentProject.sandboxInfo.end_time);
    return endTime <= currentTime;
  }

  // Get current sandbox status for UI
  getSandboxStatusForUI(): {
    status: "running" | "expired" | "not_found";
    remainingMinutes: number;
    sandboxId?: string;
    previewUrl?: string;
  } {
    if (!this.currentProject?.sandboxInfo) {
      return {
        status: "not_found",
        remainingMinutes: 0,
      };
    }

    const remainingMinutes = this.getSandboxRemainingTime();
    const isExpired = this.isSandboxExpired();

    return {
      status: isExpired ? "expired" : "running",
      remainingMinutes,
      sandboxId: this.currentProject.sandboxInfo.sandbox_id,
      previewUrl: this.currentProject.sandboxInfo.preview_url,
    };
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
