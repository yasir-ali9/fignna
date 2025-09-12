/**
 * V1 Sandbox Kill API Route
 * Destroys E2B sandbox following e2b pattern
 */

import { NextResponse } from "next/server";

declare global {
  var activeSandbox: any;
  var sandboxData: any;
  var existingFiles: Set<string>;
}

export async function POST() {
  try {
    console.log("[V1 Sandbox Kill API] Destroying active sandbox...");

    // Check if there's an active sandbox
    if (!global.activeSandbox) {
      return NextResponse.json(
        {
          success: false,
          error: "No active sandbox to destroy",
          version: "v1",
        },
        { status: 404 }
      );
    }

    const sandboxId = global.sandboxData?.id || "unknown";

    try {
      // Close the active sandbox
      await global.activeSandbox.close();
      console.log(
        "[V1 Sandbox Kill API] Sandbox closed successfully:",
        sandboxId
      );
    } catch (closeError) {
      console.error("[V1 Sandbox Kill API] Error closing sandbox:", closeError);
      // Continue with cleanup even if close fails
    }

    // Clear global state
    global.activeSandbox = null;
    global.sandboxData = null;

    // Clear existing files tracking
    if (global.existingFiles) {
      global.existingFiles.clear();
    }

    console.log(
      "[V1 Sandbox Kill API] Sandbox destroyed and state cleared:",
      sandboxId
    );

    return NextResponse.json({
      success: true,
      message: "Sandbox destroyed successfully",
      sandboxId,
      version: "v1",
    });
  } catch (error) {
    console.error("[V1 Sandbox Kill API] Failed to destroy sandbox:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to destroy sandbox",
        details: (error as Error).message,
        version: "v1",
      },
      { status: 500 }
    );
  }
}
