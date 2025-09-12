/**
 * V1 Sandbox Status API Route
 */

import { NextResponse } from "next/server";
import type { Sandbox } from "@e2b/code-interpreter";

// Access global sandbox state
declare global {
  var activeSandbox: Sandbox | null;
  var sandboxData: Record<string, unknown> | null;
  var existingFiles: Set<string>;
}

export async function GET() {
  try {
    console.log("[V1 Sandbox Status API] Checking sandbox status...");

    // Check if there's an active sandbox
    const sandboxExists = !!global.activeSandbox;

    let sandboxHealthy = false;
    let sandboxInfo = null;

    if (sandboxExists && global.activeSandbox && global.sandboxData) {
      try {
        // Check if sandbox is healthy by verifying it exists and has data
        sandboxHealthy = true;
        const sandboxDataTyped = global.sandboxData as {
          id?: string;
          host?: string;
          url?: string;
          status?: string;
          createdAt?: string;
        };
        sandboxInfo = {
          id: sandboxDataTyped.id,
          host: sandboxDataTyped.host,
          url: sandboxDataTyped.url,
          status: sandboxDataTyped.status || "ready",
          createdAt: sandboxDataTyped.createdAt,
          filesTracked: global.existingFiles
            ? Array.from(global.existingFiles)
            : [],
          lastHealthCheck: new Date().toISOString(),
        };
        console.log(
          "[V1 Sandbox Status API] Sandbox is healthy:",
          sandboxInfo?.id
        );
      } catch (error) {
        console.error("[V1 Sandbox Status API] Health check failed:", error);
        sandboxHealthy = false;
      }
    }

    if (sandboxExists && sandboxHealthy) {
      return NextResponse.json({
        success: true,
        status: "active",
        sandbox: sandboxInfo,
        message: "Sandbox is active and healthy",
        version: "v1",
      });
    } else if (sandboxExists) {
      return NextResponse.json({
        success: true,
        status: "unhealthy",
        message: "Sandbox exists but is not responding",
        version: "v1",
      });
    } else {
      return NextResponse.json({
        success: true,
        status: "no_sandbox",
        message: "No active sandbox",
        version: "v1",
      });
    }
  } catch (error) {
    console.error("[V1 Sandbox Status API] Error checking status:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to check sandbox status",
        details: (error as Error).message,
        version: "v1",
      },
      { status: 500 }
    );
  }
}
