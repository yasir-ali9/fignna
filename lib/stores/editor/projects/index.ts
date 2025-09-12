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
      const updateData: UpdateProjectRequest = {
        files: this.engine.files.getAllFiles(),
        dependencies: this.engine.files.getDependencies(),
      };

      // Include sandbox info if available
      if (this.engine.sandbox.currentSandboxId) {
        updateData.sandboxId = this.engine.sandbox.currentSandboxId;
      }
      if (this.engine.sandbox.previewUrl) {
        updateData.previewUrl = this.engine.sandbox.previewUrl;
      }

      const updatedProject = await this.updateProject(
        this.currentProject.id,
        updateData
      );
      this.currentProject = updatedProject;

      // Update project in list
      const index = this.projects.findIndex((p) => p.id === updatedProject.id);
      if (index !== -1) {
        this.projects[index] = updatedProject;
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
