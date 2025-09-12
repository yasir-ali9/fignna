/**
 * V1 Sandbox Restart API Route
 * Restarts the Vite dev server in the active sandbox
 */

import { NextResponse } from "next/server";
import { Sandbox } from "@e2b/code-interpreter";

// Global sandbox state
declare global {
  var activeSandbox: Sandbox | null;
  var lastViteRestartTime: number;
  var viteRestartInProgress: boolean;
}

const RESTART_COOLDOWN_MS = 5000; // 5 second cooldown between restarts

export async function POST() {
  try {
    console.log("[V1 Sandbox Restart API] Restarting Vite server...");

    // Check if there's an active sandbox
    if (!global.activeSandbox) {
      console.log("[V1 Sandbox Restart API] No active sandbox found");
      return NextResponse.json(
        {
          success: false,
          error: "No active sandbox",
          details: "Create or sync a sandbox first",
          version: "v1",
        },
        { status: 404 }
      );
    }

    // Check if restart is already in progress
    if (global.viteRestartInProgress) {
      console.log(
        "[V1 Sandbox Restart API] Vite restart already in progress, skipping..."
      );
      return NextResponse.json({
        success: true,
        message: "Vite restart already in progress",
        version: "v1",
      });
    }

    // Check cooldown
    const now = Date.now();
    if (
      global.lastViteRestartTime &&
      now - global.lastViteRestartTime < RESTART_COOLDOWN_MS
    ) {
      const remainingTime = Math.ceil(
        (RESTART_COOLDOWN_MS - (now - global.lastViteRestartTime)) / 1000
      );
      console.log(
        `[V1 Sandbox Restart API] Cooldown active, ${remainingTime}s remaining`
      );
      return NextResponse.json({
        success: true,
        message: `Vite was recently restarted, cooldown active (${remainingTime}s remaining)`,
        version: "v1",
      });
    }

    // Set the restart flag
    global.viteRestartInProgress = true;

    console.log("[V1 Sandbox Restart API] Restarting Vite dev server...");

    // Restart Vite server
    await global.activeSandbox.runCode(`
import subprocess
import os
import time

os.chdir('/home/user/app')

print('Restarting Vite dev server...')

# Kill existing Vite processes
try:
    result = subprocess.run(['pkill', '-f', 'vite'], capture_output=True, text=True)
    print('✓ Killed existing Vite processes')
    time.sleep(2)  # Wait for processes to terminate
except Exception as e:
    print(f'No existing Vite processes found: {e}')

# Clear Vite cache
import shutil
vite_cache_dirs = ['/home/user/app/node_modules/.vite', '/home/user/app/.vite']
for cache_dir in vite_cache_dirs:
    if os.path.exists(cache_dir):
        shutil.rmtree(cache_dir)
        print(f'✓ Cleared Vite cache: {cache_dir}')

# Start Vite dev server
env = os.environ.copy()
env['FORCE_COLOR'] = '0'

process = subprocess.Popen(
    ['npm', 'run', 'dev'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    env=env
)

print(f'✓ Vite dev server restarted with PID: {process.pid}')
print('Waiting for server to be ready...')
    `);

    // Wait for Vite to start up
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Update global state
    global.lastViteRestartTime = Date.now();
    global.viteRestartInProgress = false;

    console.log("[V1 Sandbox Restart API] Vite restarted successfully");

    return NextResponse.json({
      success: true,
      message: "Vite dev server restarted successfully",
      version: "v1",
    });
  } catch (error) {
    console.error("[V1 Sandbox Restart API] Error:", error);

    // Clear the restart flag on error
    global.viteRestartInProgress = false;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to restart Vite server",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}
