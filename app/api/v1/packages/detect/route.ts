/**
 * V1 Package Detection and Installation API Route
 *
 * Automatically detects missing packages from import statements in generated code files
 * and installs them. This route is used by the chat-based code generation flow to
 * ensure all required dependencies are installed after code generation.
 *
 * Usage:
 * - Chat flow: Code Apply API calls this route with generated files
 * - Direct API calls: POST /api/v1/packages/detect with { files: { "path": "content" } }
 * - Streaming: POST /api/v1/packages/detect with { files: {...}, streaming: true }
 *
 * Features:
 * - Smart import detection from JS/TS/JSX/TSX files
 * - Scoped package handling (@org/package)
 * - Built-in module filtering (react, next, node modules)
 * - Existing package detection via package.json
 * - Automatic dev server restart via /api/v1/sandbox/restart
 * - Non-blocking installation (continues even if fails)
 * - Streaming progress updates for chat UI
 */

import { NextRequest, NextResponse } from "next/server";
import { Sandbox } from "@e2b/code-interpreter";

declare global {
  var activeSandbox: Sandbox | null;
}

export async function POST(request: NextRequest) {
  try {
    const { files, streaming = false } = await request.json();

    if (!files || typeof files !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Files object is required",
        },
        { status: 400 }
      );
    }

    if (!global.activeSandbox) {
      return NextResponse.json(
        {
          success: false,
          error: "No active sandbox",
        },
        { status: 404 }
      );
    }

    // If streaming is requested, set up streaming response
    if (streaming) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const sendProgress = async (data: Record<string, unknown>) => {
            const message = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(message));
          };

          try {
            await processPackageDetection(files, request, sendProgress);
            controller.close();
          } catch (error) {
            await sendProgress({
              type: "error",
              error: (error as Error).message,
            });
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming response (existing behavior)
    return await processPackageDetectionSync(files, request);
  } catch (error) {
    console.error("[detect-and-install-packages] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// Streaming version with progress updates
async function processPackageDetection(
  files: Record<string, string>,
  request: NextRequest,
  sendProgress: (data: Record<string, unknown>) => Promise<void>
) {
  await sendProgress({
    type: "package-progress",
    stage: "detecting",
    message: "Scanning generated code for import statements...",
  });

  console.log(
    "[detect-and-install-packages] Processing files:",
    Object.keys(files)
  );

  // Extract all import statements from the files
  const imports = new Set<string>();
  const importRegex =
    /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s*,?\s*)*(?:from\s+)?['"]([^'"]+)['"]/g;
  const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;

  for (const [filePath, content] of Object.entries(files)) {
    if (typeof content !== "string") continue;

    // Skip non-JS/JSX/TS/TSX files
    if (!filePath.match(/\.(jsx?|tsx?)$/)) continue;

    // Find ES6 imports
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.add(match[1]);
    }

    // Find CommonJS requires
    while ((match = requireRegex.exec(content)) !== null) {
      imports.add(match[1]);
    }
  }

  console.log(
    "[detect-and-install-packages] Found imports:",
    Array.from(imports)
  );

  // Log specific heroicons imports
  const heroiconImports = Array.from(imports).filter((imp) =>
    imp.includes("heroicons")
  );
  if (heroiconImports.length > 0) {
    console.log(
      "[detect-and-install-packages] Heroicon imports:",
      heroiconImports
    );
  }

  // Filter out relative imports and built-in modules
  const packages = Array.from(imports).filter((imp) => {
    // Skip relative imports
    if (imp.startsWith(".") || imp.startsWith("/")) return false;

    // Skip built-in Node modules and React core
    const builtins = [
      "fs",
      "path",
      "http",
      "https",
      "crypto",
      "stream",
      "util",
      "os",
      "url",
      "querystring",
      "child_process",
      "react",
      "react-dom",
      "next",
    ];
    if (builtins.includes(imp)) return false;

    return true;
  });

  // Extract just the package names (without subpaths)
  const packageNames = packages.map((pkg) => {
    if (pkg.startsWith("@")) {
      // Scoped package: @scope/package or @scope/package/subpath
      const parts = pkg.split("/");
      return parts.slice(0, 2).join("/");
    } else {
      // Regular package: package or package/subpath
      return pkg.split("/")[0];
    }
  });

  // Remove duplicates
  const uniquePackages = [...new Set(packageNames)];

  console.log(
    "[detect-and-install-packages] Packages to install:",
    uniquePackages
  );

  if (uniquePackages.length === 0) {
    await sendProgress({
      type: "package-complete",
      stage: "complete",
      message: "No new packages to install",
      packagesInstalled: [],
    });
    return;
  }

  // Check which packages are already installed
  const installed: string[] = [];
  const missing: string[] = [];

  try {
    // Read package.json to check existing dependencies
    const packageJsonResult = await global.activeSandbox!.runCode(`
import json

try:
    with open('/home/user/app/package.json', 'r') as f:
        package_data = json.load(f)
    
    dependencies = package_data.get('dependencies', {})
    dev_dependencies = package_data.get('devDependencies', {})
    all_deps = {**dependencies, **dev_dependencies}
    
    print("PACKAGE_JSON_START")
    print(json.dumps(all_deps))
    print("PACKAGE_JSON_END")
except Exception as e:
    print(f"Error reading package.json: {e}")
    print("PACKAGE_JSON_START")
    print("{}")
    print("PACKAGE_JSON_END")
      `);

    const packageOutput = packageJsonResult.logs?.stdout?.join("") || "";
    const startMarker = "PACKAGE_JSON_START";
    const endMarker = "PACKAGE_JSON_END";
    const startIndex = packageOutput.indexOf(startMarker);
    const endIndex = packageOutput.indexOf(endMarker);

    let allDeps: Record<string, string> = {};
    if (startIndex !== -1 && endIndex !== -1) {
      const depsJson = packageOutput
        .substring(startIndex + startMarker.length, endIndex)
        .trim();
      try {
        allDeps = JSON.parse(depsJson) as Record<string, string>;
      } catch (parseError) {
        console.warn(
          "[detect-and-install-packages] Failed to parse package.json:",
          parseError
        );
      }
    }

    // Check each package
    for (const packageName of uniquePackages) {
      const pkgName = packageName.startsWith("@")
        ? packageName
        : packageName.split("@")[0];

      if (allDeps[pkgName]) {
        installed.push(packageName);
      } else {
        missing.push(packageName);
      }
    }
  } catch (error) {
    console.error(
      "[detect-and-install-packages] Error checking packages:",
      error
    );
    // If we can't check, assume all packages are missing
    missing.push(...uniquePackages);
  }

  console.log("[detect-and-install-packages] Package status:", {
    installed,
    missing,
  });

  if (missing.length === 0) {
    await sendProgress({
      type: "package-complete",
      stage: "complete",
      message: "All packages already installed",
      packagesInstalled: [],
      packagesAlreadyInstalled: installed,
    });
    return;
  }

  // Install missing packages
  console.log("[detect-and-install-packages] Installing packages:", missing);

  await sendProgress({
    type: "package-progress",
    stage: "installing",
    message: `Installing ${missing.length} packages...`,
    packages: missing,
  });

  // Sanitize package names to prevent command injection
  const sanitizedPackages = missing.map((pkg) => {
    const sanitized = pkg.replace(/[^a-zA-Z0-9@\-_./ ]/g, "");
    if (sanitized !== pkg) {
      throw new Error(`Invalid package name: ${pkg}`);
    }
    return sanitized;
  });

  const installResult = await global.activeSandbox!.runCode(`
import subprocess
import os

# Change to project directory
os.chdir('/home/user/app')

# Run package installation with legacy peer deps
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
  const stderr = installResult.logs?.stderr?.join("") || "";

  console.log("[detect-and-install-packages] Install output:", output);
  if (stderr) {
    console.log("[detect-and-install-packages] Install stderr:", stderr);
  }

  // Verify installation success
  const finalInstalled: string[] = [];
  const failed: string[] = [];

  if (output.includes("✓ Dependencies installed successfully")) {
    finalInstalled.push(...missing);
    console.log(`✓ Successfully installed: ${missing.join(", ")}`);
  } else {
    failed.push(...missing);
    console.error(`✗ Failed to install: ${missing.join(", ")}`);
  }

  // Auto-save updated package.json to database and restart server
  if (finalInstalled.length > 0) {
    await sendProgress({
      type: "package-progress",
      stage: "restarting",
      message: "Saving files and restarting development server...",
    });

    console.log(
      "[detect-and-install-packages] Packages were installed, syncing files and restarting..."
    );

    try {
      const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
      const host = request.headers.get("host") || "localhost:3000";

      // Extract project ID from request headers or URL
      const referer = request.headers.get("referer") || "";
      const projectIdMatch = referer.match(/\/projects\/([a-f0-9-]{36})/);
      const projectId = projectIdMatch ? projectIdMatch[1] : null;

      if (projectId) {
        console.log(
          "[detect-and-install-packages] Auto-saving files to database..."
        );

        const saveResponse = await fetch(
          `${protocol}://${host}/api/v1/projects/${projectId}/save`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (saveResponse.ok) {
          console.log(
            "[detect-and-install-packages] ✓ Files saved to database successfully"
          );
        } else {
          console.warn(
            "[detect-and-install-packages] ⚠ File save failed, but continuing..."
          );
        }
      } else {
        console.warn(
          "[detect-and-install-packages] ⚠ Could not determine project ID for auto-save"
        );
      }

      // Then restart the dev server
      const restartResponse = await fetch(
        `${protocol}://${host}/api/v1/sandbox/restart`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (restartResponse.ok) {
        console.log(
          "[detect-and-install-packages] ✓ Vite server restarted successfully"
        );
      } else {
        console.warn(
          "[detect-and-install-packages] ⚠ Restart API call failed, but continuing..."
        );
      }
    } catch (error) {
      console.warn(
        "[detect-and-install-packages] ⚠ Failed to sync files or restart:",
        error
      );
      // Don't fail the entire operation for sync/restart issues
    }
  }

  await sendProgress({
    type: "package-complete",
    stage: "complete",
    message: `Installed ${finalInstalled.length} packages`,
    packagesInstalled: finalInstalled,
    packagesFailed: failed,
    packagesAlreadyInstalled: installed,
  });
}

// Non-streaming version (existing behavior)
async function processPackageDetectionSync(
  files: Record<string, string>,
  request: NextRequest
) {
  console.log(
    "[detect-and-install-packages] Processing files:",
    Object.keys(files)
  );

  // Extract all import statements from the files
  const imports = new Set<string>();
  const importRegex =
    /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s*,?\s*)*(?:from\s+)?['"]([^'"]+)['"]/g;
  const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;

  for (const [filePath, content] of Object.entries(files)) {
    if (typeof content !== "string") continue;

    // Skip non-JS/JSX/TS/TSX files
    if (!filePath.match(/\.(jsx?|tsx?)$/)) continue;

    // Find ES6 imports
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.add(match[1]);
    }

    // Find CommonJS requires
    while ((match = requireRegex.exec(content)) !== null) {
      imports.add(match[1]);
    }
  }

  console.log(
    "[detect-and-install-packages] Found imports:",
    Array.from(imports)
  );

  // Filter out relative imports and built-in modules
  const packages = Array.from(imports).filter((imp) => {
    // Skip relative imports
    if (imp.startsWith(".") || imp.startsWith("/")) return false;

    // Skip built-in Node modules and React core
    const builtins = [
      "fs",
      "path",
      "http",
      "https",
      "crypto",
      "stream",
      "util",
      "os",
      "url",
      "querystring",
      "child_process",
      "react",
      "react-dom",
      "next",
    ];
    if (builtins.includes(imp)) return false;

    return true;
  });

  // Extract just the package names (without subpaths)
  const packageNames = packages.map((pkg) => {
    if (pkg.startsWith("@")) {
      // Scoped package: @scope/package or @scope/package/subpath
      const parts = pkg.split("/");
      return parts.slice(0, 2).join("/");
    } else {
      // Regular package: package or package/subpath
      return pkg.split("/")[0];
    }
  });

  // Remove duplicates
  const uniquePackages = [...new Set(packageNames)];

  console.log(
    "[detect-and-install-packages] Packages to install:",
    uniquePackages
  );

  if (uniquePackages.length === 0) {
    return NextResponse.json({
      success: true,
      packagesInstalled: [],
      message: "No new packages to install",
    });
  }

  // Check which packages are already installed
  const installed: string[] = [];
  const missing: string[] = [];

  try {
    // Read package.json to check existing dependencies
    const packageJsonResult = await global.activeSandbox!.runCode(`
import json

try:
    with open('/home/user/app/package.json', 'r') as f:
        package_data = json.load(f)
    
    dependencies = package_data.get('dependencies', {})
    dev_dependencies = package_data.get('devDependencies', {})
    all_deps = {**dependencies, **dev_dependencies}
    
    print("PACKAGE_JSON_START")
    print(json.dumps(all_deps))
    print("PACKAGE_JSON_END")
except Exception as e:
    print(f"Error reading package.json: {e}")
    print("PACKAGE_JSON_START")
    print("{}")
    print("PACKAGE_JSON_END")
      `);

    const packageOutput = packageJsonResult.logs?.stdout?.join("") || "";
    const startMarker = "PACKAGE_JSON_START";
    const endMarker = "PACKAGE_JSON_END";
    const startIndex = packageOutput.indexOf(startMarker);
    const endIndex = packageOutput.indexOf(endMarker);

    let allDeps: Record<string, string> = {};
    if (startIndex !== -1 && endIndex !== -1) {
      const depsJson = packageOutput
        .substring(startIndex + startMarker.length, endIndex)
        .trim();
      try {
        allDeps = JSON.parse(depsJson) as Record<string, string>;
      } catch (parseError) {
        console.warn(
          "[detect-and-install-packages] Failed to parse package.json:",
          parseError
        );
      }
    }

    // Check each package
    for (const packageName of uniquePackages) {
      const pkgName = packageName.startsWith("@")
        ? packageName
        : packageName.split("@")[0];

      if (allDeps[pkgName]) {
        installed.push(packageName);
      } else {
        missing.push(packageName);
      }
    }
  } catch (error) {
    console.error(
      "[detect-and-install-packages] Error checking packages:",
      error
    );
    // If we can't check, assume all packages are missing
    missing.push(...uniquePackages);
  }

  console.log("[detect-and-install-packages] Package status:", {
    installed,
    missing,
  });

  if (missing.length === 0) {
    return NextResponse.json({
      success: true,
      packagesInstalled: [],
      packagesAlreadyInstalled: installed,
      message: "All packages already installed",
    });
  }

  // Install missing packages
  console.log("[detect-and-install-packages] Installing packages:", missing);

  // Sanitize package names to prevent command injection
  const sanitizedPackages = missing.map((pkg) => {
    const sanitized = pkg.replace(/[^a-zA-Z0-9@\-_./ ]/g, "");
    if (sanitized !== pkg) {
      throw new Error(`Invalid package name: ${pkg}`);
    }
    return sanitized;
  });

  const installResult = await global.activeSandbox!.runCode(`
import subprocess
import os

# Change to project directory
os.chdir('/home/user/app')

# Run package installation with legacy peer deps
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
  const stderr = installResult.logs?.stderr?.join("") || "";

  console.log("[detect-and-install-packages] Install output:", output);
  if (stderr) {
    console.log("[detect-and-install-packages] Install stderr:", stderr);
  }

  // Verify installation success
  const finalInstalled: string[] = [];
  const failed: string[] = [];

  if (output.includes("✓ Dependencies installed successfully")) {
    finalInstalled.push(...missing);
    console.log(`✓ Successfully installed: ${missing.join(", ")}`);
  } else {
    failed.push(...missing);
    console.error(`✗ Failed to install: ${missing.join(", ")}`);
  }

  // Auto-save updated package.json to database and restart server
  if (finalInstalled.length > 0) {
    console.log(
      "[detect-and-install-packages] Packages were installed, syncing files and restarting..."
    );

    try {
      const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
      const host = request.headers.get("host") || "localhost:3000";

      // Extract project ID from request headers or URL
      const referer = request.headers.get("referer") || "";
      const projectIdMatch = referer.match(/\/projects\/([a-f0-9-]{36})/);
      const projectId = projectIdMatch ? projectIdMatch[1] : null;

      if (projectId) {
        console.log(
          "[detect-and-install-packages] Auto-saving files to database..."
        );

        const saveResponse = await fetch(
          `${protocol}://${host}/api/v1/projects/${projectId}/save`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (saveResponse.ok) {
          console.log(
            "[detect-and-install-packages] ✓ Files saved to database successfully"
          );
        } else {
          console.warn(
            "[detect-and-install-packages] ⚠ File save failed, but continuing..."
          );
        }
      } else {
        console.warn(
          "[detect-and-install-packages] ⚠ Could not determine project ID for auto-save"
        );
      }

      // Then restart the dev server
      const restartResponse = await fetch(
        `${protocol}://${host}/api/v1/sandbox/restart`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (restartResponse.ok) {
        console.log(
          "[detect-and-install-packages] ✓ Vite server restarted successfully"
        );
      } else {
        console.warn(
          "[detect-and-install-packages] ⚠ Restart API call failed, but continuing..."
        );
      }
    } catch (error) {
      console.warn(
        "[detect-and-install-packages] ⚠ Failed to sync files or restart:",
        error
      );
      // Don't fail the entire operation for sync/restart issues
    }
  }

  return NextResponse.json({
    success: true,
    packagesInstalled: finalInstalled,
    packagesFailed: failed,
    packagesAlreadyInstalled: installed,
    message: `Installed ${finalInstalled.length} packages`,
    logs: output,
  });
}
