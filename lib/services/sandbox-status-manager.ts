// Service for managing periodic sandbox status checks and automatic sync triggering

export interface SandboxStatusInfo {
  sandbox_id: string;
  preview_url: string;
  start_time: string;
  end_time: string;
  remaining_time_minutes: number;
}

export interface StatusCheckResult {
  success: boolean;
  status: "running" | "expired" | "not_found";
  sandbox_info?: SandboxStatusInfo;
  action_required: "none" | "sync_needed";
  message: string;
}

export class SandboxStatusManager {
  private statusInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60000; // 1 minute (60 sec)
  private projectId: string | null = null;
  private isActive = false;
  private onStatusUpdate?: (status: StatusCheckResult) => void;
  private onSyncRequired?: () => Promise<void>;
  private consecutiveErrors = 0;
  private lastSuccessfulCheck: Date | null = null;
  private operationInProgress = false;
  
  // Request deduplication properties
  private pendingRequest: Promise<StatusCheckResult> | null = null;
  private lastRequestTime: number = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // Minimum 1 second between requests

  constructor(
    onStatusUpdate?: (status: StatusCheckResult) => void,
    onSyncRequired?: () => Promise<void>
  ) {
    this.onStatusUpdate = onStatusUpdate;
    this.onSyncRequired = onSyncRequired;
  }

  // Start periodic status checking for a project
  async startStatusChecking(projectId: string): Promise<void> {
    console.log(
      `[SandboxStatusManager] Starting status checks for project ${projectId}`
    );

    this.projectId = projectId;
    this.isActive = true;

    // Initial status check
    await this.checkAndUpdateStatus();

    // Start periodic checks
    this.statusInterval = setInterval(async () => {
      if (this.isActive && this.projectId) {
        const status = await this.checkAndUpdateStatus();

        // If sandbox expired, stop checking and trigger sync if handler provided
        if (status.status === "expired" && this.onSyncRequired) {
          console.log(
            `[SandboxStatusManager] Sandbox expired, triggering sync for project ${this.projectId}`
          );
          this.stopStatusChecking();

          try {
            await this.onSyncRequired();
            // Restart status checking after sync
            await this.startStatusChecking(this.projectId);
          } catch (error) {
            console.error(`[SandboxStatusManager] Auto-sync failed:`, error);
          }
        }
      }
    }, this.CHECK_INTERVAL);

    console.log(
      `[SandboxStatusManager] Status checking started with ${this.CHECK_INTERVAL}ms interval`
    );
  }

  // Stop periodic status checking
  stopStatusChecking(): void {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = null;
    }

    this.isActive = false;
    console.log(
      `[SandboxStatusManager] Status checking stopped for project ${this.projectId}`
    );
  }

  // Perform a single status check and update UI with request deduplication
  private async checkAndUpdateStatus(): Promise<StatusCheckResult> {
    if (!this.projectId) {
      throw new Error("No project ID set for status checking");
    }

    // Check if there's already a pending request
    if (this.pendingRequest) {
      console.log(`[SandboxStatusManager] Request already in progress, returning existing promise`);
      return this.pendingRequest;
    }

    // Check if we're making requests too frequently
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      console.log(`[SandboxStatusManager] Rate limiting: ${timeSinceLastRequest}ms since last request (min: ${this.MIN_REQUEST_INTERVAL}ms)`);
      // Return the last successful result if available, or create a throttled response
      if (this.lastSuccessfulCheck) {
        return {
          success: true,
          status: "running", // Assume running if we had a recent successful check
          action_required: "none",
          message: "Rate limited - using cached result",
        };
      }
    }

    // Create and store the pending request
    this.pendingRequest = this.performStatusCheck();
    this.lastRequestTime = now;

    try {
      const result = await this.pendingRequest;
      return result;
    } finally {
      // Clear the pending request when done
      this.pendingRequest = null;
    }
  }

  // Actual status check implementation (separated for deduplication)
  private async performStatusCheck(): Promise<StatusCheckResult> {
    try {
      console.log(`[SandboxStatusManager] Performing status check for project ${this.projectId}`);
      
      const response = await fetch(
        `/api/v1/projects/${this.projectId}/sandbox/status`
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Status check failed");
      }

      const statusResult: StatusCheckResult = {
        success: true,
        status: result.status,
        sandbox_info: result.sandbox_info,
        action_required: result.action_required,
        message: result.message,
      };

      // Reset error counters on successful check
      this.consecutiveErrors = 0;
      this.lastSuccessfulCheck = new Date();

      // Notify UI of status update
      if (this.onStatusUpdate) {
        this.onStatusUpdate(statusResult);
      }

      console.log(`[SandboxStatusManager] Status check result:`, {
        status: statusResult.status,
        remaining_time: statusResult.sandbox_info?.remaining_time_minutes,
        action_required: statusResult.action_required,
      });

      return statusResult;
    } catch (error) {
      console.error(`[SandboxStatusManager] Status check failed:`, error);

      this.consecutiveErrors++;

      const errorResult: StatusCheckResult = {
        success: false,
        status: "not_found",
        action_required: "sync_needed",
        message: `Status check failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };

      // Notify UI of error
      if (this.onStatusUpdate) {
        this.onStatusUpdate(errorResult);
      }

      // If too many consecutive errors, consider backing off
      if (this.consecutiveErrors >= 5) {
        console.warn(
          `[SandboxStatusManager] Too many consecutive errors (${this.consecutiveErrors}). Consider stopping status checks.`
        );
      }

      return errorResult;
    }
  }

  // Get error recovery status
  getErrorStatus(): {
    consecutiveErrors: number;
    lastSuccessfulCheck: Date | null;
    isHealthy: boolean;
  } {
    return {
      consecutiveErrors: this.consecutiveErrors,
      lastSuccessfulCheck: this.lastSuccessfulCheck,
      isHealthy: this.consecutiveErrors < 3,
    };
  }

  // Manual status check (for user-triggered checks)
  async checkStatus(): Promise<StatusCheckResult> {
    if (!this.projectId) {
      return {
        success: false,
        status: "not_found",
        action_required: "sync_needed",
        message: "No project ID set for status checking",
      };
    }
    return this.checkAndUpdateStatus();
  }

  // Check if status manager is currently active
  get isRunning(): boolean {
    return this.isActive && this.statusInterval !== null;
  }

  // Get current project ID
  get currentProjectId(): string | null {
    return this.projectId;
  }

  // Update callbacks
  setStatusUpdateCallback(callback: (status: StatusCheckResult) => void): void {
    this.onStatusUpdate = callback;
  }

  setSyncRequiredCallback(callback: () => Promise<void>): void {
    this.onSyncRequired = callback;
  }

  // Set operation in progress state
  setOperationInProgress(inProgress: boolean): void {
    this.operationInProgress = inProgress;
  }

  // Get operation in progress state
  get isOperationInProgress(): boolean {
    return this.operationInProgress;
  }

  // Cleanup method
  dispose(): void {
    this.stopStatusChecking();
    this.projectId = null;
    this.onStatusUpdate = undefined;
    this.onSyncRequired = undefined;
    
    // Clean up request deduplication state
    this.pendingRequest = null;
    this.lastRequestTime = 0;
  }
}
