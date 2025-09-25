// Service for E2B sandbox operations and status management

import { Sandbox } from "@e2b/code-interpreter";
import type { SandboxInfo } from "@/lib/db/schema";

// E2B sandbox info response interface
export interface E2BSandboxInfo {
  sandboxId: string;
  templateId: string;
  name: string;
  metadata: Record<string, any>;
  startedAt: string; // ISO timestamp
  endAt: string; // ISO timestamp
}

export class SandboxService {
  // Get sandbox information from E2B
  static async getSandboxInfo(sandbox: Sandbox): Promise<E2BSandboxInfo> {
    try {
      const info = await sandbox.getInfo();
      console.log("[SandboxService] Retrieved sandbox info from E2B:", info);

      // Ensure the returned info matches our interface
      // Convert Date objects to ISO strings if needed
      return {
        sandboxId: info.sandboxId,
        templateId: info.templateId || "",
        name: info.name || "sandbox",
        metadata: info.metadata || {},
        startedAt:
          info.startedAt instanceof Date
            ? info.startedAt.toISOString()
            : info.startedAt,
        endAt:
          info.endAt instanceof Date ? info.endAt.toISOString() : info.endAt,
      };
    } catch (error) {
      console.error(
        "[SandboxService] Failed to get sandbox info from E2B:",
        error
      );
      throw new Error(
        `E2B getInfo failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Convert E2B sandbox info to our SandboxInfo format
  static convertE2BInfoToSandboxInfo(
    e2bInfo: E2BSandboxInfo,
    previewUrl: string
  ): SandboxInfo {
    return {
      sandbox_id: e2bInfo.sandboxId,
      preview_url: previewUrl,
      start_time: e2bInfo.startedAt,
      end_time: e2bInfo.endAt,
    };
  }

  // Check if sandbox is expired based on end time
  static isSandboxExpired(sandboxInfo: SandboxInfo): boolean {
    const currentTime = new Date();
    const endTime = new Date(sandboxInfo.end_time);
    return endTime <= currentTime;
  }

  // Calculate remaining time in minutes
  static getRemainingTimeMinutes(sandboxInfo: SandboxInfo): number {
    const currentTime = new Date();
    const endTime = new Date(sandboxInfo.end_time);
    const remainingTimeMs = endTime.getTime() - currentTime.getTime();
    return Math.max(0, Math.floor(remainingTimeMs / 60000));
  }

  // Extend sandbox timeout (useful for keeping active sandboxes alive)
  static async extendSandboxTimeout(
    sandbox: Sandbox,
    timeoutMs: number = 30 * 60 * 1000 // Default 30 minutes
  ): Promise<void> {
    try {
      await sandbox.setTimeout(timeoutMs);
      console.log(
        `[SandboxService] Extended sandbox timeout to ${timeoutMs}ms`
      );
    } catch (error) {
      console.error(
        "[SandboxService] Failed to extend sandbox timeout:",
        error
      );
      throw new Error(
        `Failed to extend sandbox timeout: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Verify if a sandbox is healthy and accessible
  static async verifySandboxHealth(sandbox: Sandbox): Promise<boolean> {
    try {
      // Try to get sandbox info - if this succeeds, sandbox is healthy
      await sandbox.getInfo();
      return true;
    } catch (error) {
      console.warn("[SandboxService] Sandbox health check failed:", error);
      return false;
    }
  }

  // Create sandbox info for a new sandbox
  static createSandboxInfo(
    sandboxId: string,
    previewUrl: string,
    timeoutMs: number = 30 * 60 * 1000 // Default 30 minutes
  ): SandboxInfo {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + timeoutMs);

    return {
      sandbox_id: sandboxId,
      preview_url: previewUrl,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    };
  }

  // Handle E2B API errors with appropriate error messages
  static handleE2BError(error: any): string {
    if (error?.code === "SANDBOX_NOT_FOUND") {
      return "Sandbox not found in E2B";
    } else if (error?.code === "RATE_LIMITED") {
      return "E2B API rate limit exceeded";
    } else if (error?.code === "TIMEOUT") {
      return "E2B API request timeout";
    } else if (error?.message?.includes("network")) {
      return "Network error connecting to E2B";
    } else {
      return `E2B API error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
    }
  }
}
