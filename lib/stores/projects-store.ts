import { makeAutoObservable } from "mobx";

interface Project {
  id: string;
  name: string;
  description?: string;
  files?: Record<string, string>;
  sandboxId?: string;
  previewUrl?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// MobX store for projects management
export class ProjectsStore {
  projects: Project[] = [];
  loading = false;
  error: string | null = null;
  selectedProject: Project | null = null;
  isRenaming = false;
  newProjectName = "";

  constructor() {
    makeAutoObservable(this);
  }

  // Fetch projects from API
  async fetchProjects() {
    try {
      this.setLoading(true);
      this.setError(null);

      const response = await fetch("/api/v1/projects?limit=50", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "same-origin",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.setProjects(data.data.projects);
      } else {
        this.setError(data.error || "Failed to fetch projects");
      }
    } catch (err) {
      this.setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      this.setLoading(false);
    }
  }

  // Rename project with optimistic updates
  async renameProject(projectId: string, newName: string) {
    if (!newName.trim()) return;

    const originalProject = this.projects.find((p) => p.id === projectId);
    if (!originalProject) return;

    // Optimistic update
    this.updateProjectName(projectId, newName.trim());

    try {
      const response = await fetch(`/api/v1/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "same-origin",
        body: JSON.stringify({ name: newName.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Revert on failure
        this.updateProjectName(projectId, originalProject.name);
        throw new Error(data.error || "Failed to rename project");
      }

      this.setIsRenaming(false);
      this.setSelectedProject(null);
      this.setNewProjectName("");
    } catch (error) {
      // Revert optimistic update
      this.updateProjectName(projectId, originalProject.name);
      console.error("Error renaming project:", error);
      this.setError(error instanceof Error ? error.message : "Rename failed");
    }
  }

  // Actions
  setProjects(projects: Project[]) {
    this.projects = projects;
  }

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  setError(error: string | null) {
    this.error = error;
  }

  setSelectedProject(project: Project | null) {
    this.selectedProject = project;
  }

  setIsRenaming(isRenaming: boolean) {
    this.isRenaming = isRenaming;
  }

  setNewProjectName(name: string) {
    this.newProjectName = name;
  }

  updateProjectName(projectId: string, name: string) {
    const project = this.projects.find((p) => p.id === projectId);
    if (project) {
      project.name = name;
    }
  }

  startRename(project: Project) {
    this.setSelectedProject(project);
    this.setNewProjectName(project.name);
    this.setIsRenaming(true);
  }

  cancelRename() {
    this.setIsRenaming(false);
    this.setSelectedProject(null);
    this.setNewProjectName("");
  }
}

// Singleton instance
export const projectsStore = new ProjectsStore();
