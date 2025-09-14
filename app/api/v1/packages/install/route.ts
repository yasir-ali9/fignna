/**
 * V1 Package Installation API Route
 *
 * Handles streaming package installation for terminal commands and direct API calls.
 * This route provides real-time progress updates via Server-Sent Events (SSE) and
 * integrates with the existing sandbox restart API for proper dev server management.
 *
 * Usage:
 * - Terminal commands: `npm install <package>` calls this route
 * - Direct API calls: POST /api/v1/packages/install with { packages: ["package-name"] }
 *
 * Features:
 * - Streaming progress updates with SSE
 * - Package deduplication and validation
 * - Existing package detection via package.json
 * - Automatic dev server restart via /api/v1/sandbox/restart
 * - Error handling and recovery
 */

import { NextRequest, NextResponse } from "next/server";
import { Sandbox } from "@e2b/code-interpreter";

declare global {
  var activeSandbox: Sandbox | null;
  var sandboxData: Record<string, unknown> | null;
}

export async function POST(request: NextRequest) {
  try {
    const { packages } = await request.json();

    if (!packages || !Array.isArray(packages) || packages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Packages array is required",
        },
        { status: 400 }
      );
    }

    // Validate and deduplicate package names
    const validPackages = [...new Set(packages)]
      .filter((pkg) => pkg && typeof pkg === "string" && pkg.trim() !== "")
      .map((pkg) => pkg.trim());

    if (validPackages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid package names provided",
        },
        { status: 400 }
      );
    }

    // Log if duplicates were found
    if (packages.length !== validPackages.length) {
      console.log(
        `[install-packages] Cleaned packages: removed ${
          packages.length - validPackages.length
        } invalid/duplicate entries`
      );
      console.log(`[install-packages] Original:`, packages);
      console.log(`[install-packages] Cleaned:`, validPackages);
    }

    // Check if there's an active sandbox
    if (!global.activeSandbox) {
      return NextResponse.json(
        {
          success: false,
          error: "No active sandbox available",
        },
        { status: 400 }
      );
    }

    console.log("[install-packages] Installing packages:", validPackages);

    // Create a response stream for real-time updates
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Function to send progress updates
    const sendProgress = async (data: any) => {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(message));
    };

    // Start installation in background
    (async () => {
      try {
        await sendProgress({
          type: "start",
          message: `Installing ${validPackages.length} package${
            validPackages.length > 1 ? "s" : ""
          }...`,
          packages: validPackages,
        });

        // Stop any existing development server first
        await sendProgress({
          type: "status",
          message: "Stopping development server...",
        });

        try {
          // Try to kill any running dev server processes
          await global.activeSandbox!.runCode(`
import subprocess
import os

# Kill any running Vite processes
try:
    result = subprocess.run(['pkill', '-f', 'vite'], capture_output=True, text=True)
    print(f"Killed Vite processes: {result.returncode}")
except Exception as e:
    print(f"No Vite processes to kill: {e}")
          `);
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait a bit
        } catch (killError) {
          // It's OK if no process is found
          console.debug(
            "[install-packages] No existing dev server found:",
            killError
          );
        }

        // Check which packages are already installed
        await sendProgress({
          type: "status",
          message: "Checking installed packages...",
        });

        let packagesToInstall = validPackages;

        try {
          // Read package.json to check existing dependencies
          const packageJsonResult = await global.activeSandbox!.runCode(`
import json

try:
    with open('/home/user/app/package.json', 'r') as f:
        content = f.read()
    print("PACKAGE_JSON_START")
    print(content)
    print("PACKAGE_JSON_END")
except Exception as e:
    print(f"Error reading package.json: {e}")
          `);

          const packageOutput = packageJsonResult.logs?.stdout?.join("") || "";
          const startMarker = "PACKAGE_JSON_START";
          const endMarker = "PACKAGE_JSON_END";
          const startIndex = packageOutput.indexOf(startMarker);
          const endIndex = packageOutput.indexOf(endMarker);

          if (startIndex !== -1 && endIndex !== -1) {
            const packageJsonContent = packageOutput
              .substring(startIndex + startMarker.length, endIndex)
              .trim();

            const packageJson = JSON.parse(packageJsonContent);

            const dependencies = packageJson.dependencies || {};
            const devDependencies = packageJson.devDependencies || {};
            const allDeps = { ...dependencies, ...devDependencies };

            const alreadyInstalled = [];
            const needInstall = [];

            for (const pkg of validPackages) {
              // Handle scoped packages
              const pkgName = pkg.startsWith("@") ? pkg : pkg.split("@")[0];

              if (allDeps[pkgName]) {
                alreadyInstalled.push(pkgName);
              } else {
                needInstall.push(pkg);
              }
            }

            packagesToInstall = needInstall;

            if (alreadyInstalled.length > 0) {
              await sendProgress({
                type: "info",
                message: `Already installed: ${alreadyInstalled.join(", ")}`,
              });
            }
          }
        } catch (error) {
          console.error(
            "[install-packages] Error checking existing packages:",
            error
          );
          // If we can't check, just try to install all packages
          packagesToInstall = validPackages;
        }

        if (packagesToInstall.length === 0) {
          await sendProgress({
            type: "success",
            message: "All packages are already installed",
            installedPackages: [],
            alreadyInstalled: validPackages,
          });

          // Use your existing restart API
          await sendProgress({
            type: "status",
            message: "Restarting development server...",
          });

          try {
            const restartResponse = await fetch("/api/v1/sandbox/restart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            });

            if (restartResponse.ok) {
              await sendProgress({
                type: "complete",
                message: "Dev server restarted!",
                installedPackages: [],
              });
            } else {
              await sendProgress({
                type: "warning",
                message: "Restart failed. Please restart manually.",
                installedPackages: [],
              });
            }
          } catch (error) {
            await sendProgress({
              type: "warning",
              message: "Restart failed. Please restart manually.",
              installedPackages: [],
            });
          }

          await writer.close();
          return;
        }

        // Install only packages that aren't already installed
        await sendProgress({
          type: "info",
          message: `Installing ${
            packagesToInstall.length
          } new package(s): ${packagesToInstall.join(", ")}`,
        });

        // Sanitize package names to prevent command injection
        const sanitizedPackages = packagesToInstall.map((pkg) => {
          // Allow only alphanumeric, hyphens, underscores, dots, slashes, and @ for scoped packages
          const sanitized = pkg.replace(/[^a-zA-Z0-9@\-_./ ]/g, "");
          if (sanitized !== pkg) {
            throw new Error(`Invalid package name: ${pkg}`);
          }
          return sanitized;
        });

        // Install packages using the same pattern as your existing routes
        const installResult = await global.activeSandbox!.runCode(`
import subprocess
import os

# Change to project directory
os.chdir('/home/user/app')

# Run package installation with legacy peer deps (like your existing routes)
result = subprocess.run([
    'npm', 'install', '--legacy-peer-deps',
    ${sanitizedPackages.map((pkg) => `'${pkg}'`).join(", ")}
], capture_output=True, text=True, cwd='/home/user/app')

print(f"Exit code: {result.returncode}")
print(f"Stdout: {result.stdout}")
if result.stderr:
    print(f"Stderr: {result.stderr}")

if result.returncode == 0:
    print("✓ Dependencies installed successfully")
else:
    print(f"⚠ Warning: npm install had issues: {result.stderr}")
        `);

        const output = installResult.logs?.stdout?.join("") || "";
        const hasError = installResult.logs?.stderr?.join("") || "";

        // Get install output - ensure stdout/stderr are strings
        const stdout = String(output || "");
        const stderr = String(hasError || "");

        if (stdout) {
          const lines = stdout.split("\n").filter((line) => line.trim());
          for (const line of lines) {
            if (line.includes("npm WARN")) {
              await sendProgress({ type: "warning", message: line });
            } else if (
              line.trim() &&
              !line.includes("Exit code") &&
              !line.includes("Stdout") &&
              !line.includes("Stderr")
            ) {
              await sendProgress({ type: "output", message: line });
            }
          }
        }

        if (stderr) {
          const errorLines = stderr.split("\n").filter((line) => line.trim());
          for (const line of errorLines) {
            if (line.includes("ERESOLVE")) {
              await sendProgress({
                type: "warning",
                message: `Dependency conflict resolved with --legacy-peer-deps: ${line}`,
              });
            } else if (line.trim()) {
              await sendProgress({ type: "error", message: line });
            }
          }
        }

        if (output.includes("✓ Dependencies installed successfully")) {
          await sendProgress({
            type: "success",
            message: `Successfully installed: ${packagesToInstall.join(", ")}`,
            installedPackages: packagesToInstall,
          });
        } else {
          await sendProgress({
            type: "error",
            message: "Package installation failed",
          });
        }

        // Use your existing restart API instead of manual restart
        await sendProgress({
          type: "status",
          message: "Restarting development server...",
        });

        try {
          // Call your existing restart API
          const restartResponse = await fetch("/api/v1/sandbox/restart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });

          if (restartResponse.ok) {
            await sendProgress({
              type: "complete",
              message:
                "Package installation complete and dev server restarted!",
              installedPackages: packagesToInstall,
            });
          } else {
            await sendProgress({
              type: "warning",
              message:
                "Packages installed but restart failed. Please restart manually.",
              installedPackages: packagesToInstall,
            });
          }
        } catch (error) {
          await sendProgress({
            type: "warning",
            message: `Packages installed but restart failed: ${
              (error as Error).message
            }`,
            installedPackages: packagesToInstall,
          });
        }
      } catch (error) {
        const errorMessage = (error as Error).message;
        if (errorMessage && errorMessage !== "undefined") {
          await sendProgress({
            type: "error",
            message: errorMessage,
          });
        }
      } finally {
        await writer.close();
      }
    })();

    // Return the stream
    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[install-packages] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
