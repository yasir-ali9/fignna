import { makeAutoObservable } from "mobx";
import type { EditorEngine } from "./index";

// Sandbox status types
export type SandboxStatus =
  | "creating"
  | "running"
  | "stopped"
  | "error"
  | "unknown";

// Sandbox interface for V1 API integration
export interface Sandbox {
  id: string;
  name: string;
  status: SandboxStatus;
  url?: string;
  host?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SandboxManager - Manages E2B sandbox lifecycle via V1 API
 * Integrates with project persistence system
 */
export class SandboxManager {
  currentSandbox: Sandbox | null = null;
  isCreating: boolean = false;
  isSyncing: boolean = false;
  isRestarting: boolean = false;
  error: string | null = null;

  // Reference to editor engine for project integration
  private engine: EditorEngine | null = null;

  constructor(engine?: EditorEngine) {
    this.engine = engine || null;
    makeAutoObservable(this);
  }

  /**
   * Set the editor engine reference
   */
  setEngine(engine: EditorEngine) {
    this.engine = engine;
  }

  /**
   * Create a new E2B sandbox using V1 API
   */
  async createSandbox(): Promise<void> {
    if (this.isCreating) return;

    this.isCreating = true;
    this.error = null;

    try {
      console.log("Creating E2B sandbox via V1 API...");

      // Get current project ID to save sandbox info to database
      const projectId = this.engine?.projects.currentProject?.id;

      const response = await fetch("/api/v1/sandbox/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: projectId, // Pass project ID so API can save sandbox_info to DB
        }),
      });

      const result = await response.json();
      console.log("Sandbox API response:", result);

      if (!result.success) {
        throw new Error(result.error || "Failed to create sandbox");
      }

      // Validate required fields
      if (!result.sandboxId || !result.url) {
        console.error("Invalid sandbox response:", result);
        throw new Error(
          "Invalid response from sandbox API - missing sandboxId or url"
        );
      }

      // Create sandbox object from V1 API response
      // Note: API returns sandboxId and url directly, not nested under sandbox object
      this.currentSandbox = {
        id: result.sandboxId,
        name: "E2B Sandbox",
        status: "running",
        url: result.url,
        host: result.url ? new URL(result.url).host : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log("Sandbox created successfully:", this.currentSandbox);

      // Verify the sandbox is accessible before resolving
      try {
        console.log("Verifying sandbox accessibility...");
        const verifyResponse = await fetch(result.url, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        if (verifyResponse.ok) {
          console.log("Sandbox verification successful - sandbox is accessible");
        } else {
          console.warn("Sandbox verification failed but continuing - sandbox may not be fully ready yet");
        }
      } catch (verifyError) {
        console.warn("Sandbox verification failed but continuing:", verifyError);
        // Don't fail the entire creation process if verification fails
      }
    } catch (error) {
      this.error =
        error instanceof Error ? error.message : "Failed to create sandbox";
      console.error("Sandbox creation failed:", error);
    } finally {
      this.isCreating = false;
    }
  }

  /**
   * Destroy the current sandbox using V1 API
   */
  async destroyCurrentSandbox(): Promise<void> {
    if (!this.currentSandbox) return;

    try {
      console.log("Destroying sandbox:", this.currentSandbox.id);

      const response = await fetch("/api/v1/sandbox/kill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to destroy sandbox");
      }

      this.currentSandbox = null;
      this.error = null;
      console.log("Sandbox destroyed successfully");
    } catch (error) {
      this.error =
        error instanceof Error ? error.message : "Failed to destroy sandbox";
      console.error("Sandbox destruction failed:", error);
    }
  }

  /**
   * Update sandbox status (called by sync manager)
   */
  updateSandboxStatus(status: SandboxStatus): void {
    if (this.currentSandbox) {
      this.currentSandbox.status = status;
      this.currentSandbox.updatedAt = new Date();
    }
  }

  /**
   * Update preview URL (called when workspace is ready)
   */
  updatePreviewUrl(url: string): void {
    if (this.currentSandbox) {
      this.currentSandbox.url = url;
      this.currentSandbox.updatedAt = new Date();
    } else {
      // Create a minimal sandbox object if none exists
      this.currentSandbox = {
        id: "unknown",
        name: "Current Project",
        status: "running",
        url: url,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  /**
   * Update sandbox ID (called when we have sandbox information)
   */
  updateSandboxId(id: string): void {
    if (this.currentSandbox) {
      this.currentSandbox.id = id;
      this.currentSandbox.updatedAt = new Date();
    } else {
      // Create a minimal sandbox object if none exists
      this.currentSandbox = {
        id: id,
        name: "Current Project",
        status: "running",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  /**
   * Update both sandbox ID and preview URL (convenience method)
   */
  updateSandboxInfo(id: string, previewUrl: string): void {
    this.updateSandboxId(id);
    this.updatePreviewUrl(previewUrl);
  }

  /**
   * Clear sandbox state
   */
  clearSandbox(): void {
    this.currentSandbox = null;
    this.error = null;
  }

  /**
   * Get current sandbox ID
   */
  get currentSandboxId(): string | null {
    return this.currentSandbox?.id || null;
  }

  /**
   * Restart Vite server in current sandbox
   */
  async restartViteServer(): Promise<void> {
    if (!this.currentSandbox || this.isRestarting) return;

    this.isRestarting = true;
    this.error = null;

    try {
      console.log("Restarting Vite server...");

      const response = await fetch("/api/v1/sandbox/restart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to restart Vite server");
      }

      console.log("✅ Vite server restarted successfully");
      this.isRestarting = false;
    } catch (error) {
      this.error =
        error instanceof Error
          ? error.message
          : "Failed to restart Vite server";
      this.isRestarting = false;
      throw error;
    }
  }

  /**
   * Clear any errors
   */
  clearError(): void {
    this.error = null;
  }

  /**
   * Check if sandbox is ready for operations
   */
  get isReady(): boolean {
    return this.currentSandbox?.status === "running";
  }

  /**
   * Get sandbox preview URL
   */
  get previewUrl(): string | null {
    return this.currentSandbox?.url || null;
  }

  // ======================
  // PROJECT INTEGRATION METHODS
  // ======================

  /**
   * Sync current project to sandbox using V1 API
   */
  async syncProjectToSandbox(): Promise<void> {
    if (!this.engine?.projects.currentProject || this.isSyncing) return;

    this.isSyncing = true;
    this.error = null;

    try {
      // Use the projects manager to sync
      await this.engine.projects.syncToSandbox();

      console.log("Project synced to sandbox successfully");
    } catch (error) {
      this.error =
        error instanceof Error
          ? error.message
          : "Failed to sync project to sandbox";
      console.error("Project sync failed:", error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Create sandbox from project files using V1 API
   */
  async createSandboxFromProject(): Promise<void> {
    if (!this.engine?.projects.currentProject || this.isCreating) return;

    this.isCreating = true;
    this.error = null;

    try {
      // Use the projects manager to sync (which creates sandbox if needed)
      await this.engine.projects.syncToSandbox();

      console.log("Sandbox created from project successfully");
    } catch (error) {
      this.error =
        error instanceof Error
          ? error.message
          : "Failed to create sandbox from project";
      console.error("Sandbox creation from project failed:", error);
    } finally {
      this.isCreating = false;
    }
  }

  /**
   * Restore project when sandbox expires
   */
  async restoreProjectSandbox(): Promise<void> {
    if (!this.engine?.projects.currentProject) return;

    try {
      console.log("Restoring project sandbox...");

      // Create new sandbox and sync project
      await this.createSandboxFromProject();

      // Update project with new sandbox info
      if (this.currentSandbox) {
        await this.engine.projects.saveProject();
      }

      console.log("Project sandbox restored successfully");
    } catch (error) {
      this.error =
        error instanceof Error
          ? error.message
          : "Failed to restore project sandbox";
      console.error("Project sandbox restoration failed:", error);
    }
  }





  /**
   * Cleanup resources when manager is disposed
   */
  dispose(): void {
    // Clean up any active subscriptions, timers, etc.
    this.currentSandbox = null;
    this.isCreating = false;
    this.isSyncing = false;
    this.error = null;
    console.log("SandboxManager disposed");
  }
}
