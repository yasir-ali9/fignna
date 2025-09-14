/**
 * V1 Sandbox Files Write API Route
 * Writes files directly to the active sandbox for immediate preview updates
 */

import { NextRequest, NextResponse } from "next/server";
import { Sandbox } from "@e2b/code-interpreter";

// Global sandbox state
declare global {
  var activeSandbox: Sandbox | null;
}

interface WriteFilesRequest {
  files: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    console.log("[V1 Sandbox Write API] Writing files to sandbox...");

    // Parse request body
    const body: WriteFilesRequest = await request.json();
    const { files } = body;

    if (!files || typeof files !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Files object is required",
          version: "v1",
        },
        { status: 400 }
      );
    }

    // Check if there's an active sandbox
    if (!global.activeSandbox) {
      console.log("[V1 Sandbox Write API] No active sandbox found");
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

    const filePaths = Object.keys(files);
    console.log(
      `[V1 Sandbox Write API] Writing ${filePaths.length} files:`,
      filePaths
    );

    // Write each file to sandbox
    const results = {
      filesWritten: [] as string[],
      errors: [] as string[],
    };

    for (const [filePath, content] of Object.entries(files)) {
      try {
        // Normalize the file path for sandbox
        let normalizedPath = filePath;
        if (normalizedPath.startsWith("/")) {
          normalizedPath = normalizedPath.substring(1);
        }

        // Ensure path is relative to app directory
        if (
          !normalizedPath.startsWith("src/") &&
          !normalizedPath.startsWith("public/") &&
          normalizedPath !== "index.html" &&
          !normalizedPath.includes("config")
        ) {
          // Only add src/ prefix for component files
          if (
            normalizedPath.endsWith(".jsx") ||
            normalizedPath.endsWith(".tsx") ||
            normalizedPath.endsWith(".js") ||
            normalizedPath.endsWith(".ts")
          ) {
            normalizedPath = "src/" + normalizedPath;
          }
        }

        const fullPath = `/home/user/app/${normalizedPath}`;

        // Escape content for Python string
        const escapedContent = content
          .replace(/\\/g, "\\\\")
          .replace(/"""/g, '\\"\\"\\"')
          .replace(/\$/g, "\\$");

        // Write file using Python
        await global.activeSandbox.runCode(`
import os
import sys

# Ensure directory exists
file_path = "${fullPath}"
directory = os.path.dirname(file_path)
if directory:
    os.makedirs(directory, exist_ok=True)

# Write file content
try:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write("""${escapedContent}""")
    print(f"✅ Successfully wrote: {file_path}")
except Exception as e:
    print(f"❌ Failed to write {file_path}: {str(e)}")
    sys.exit(1)
        `);

        results.filesWritten.push(normalizedPath);
        console.log(`[V1 Sandbox Write API] ✅ Wrote: ${normalizedPath}`);
      } catch (error) {
        const errorMsg = `Failed to write ${filePath}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        results.errors.push(errorMsg);
        console.error(`[V1 Sandbox Write API] ❌ ${errorMsg}`);
      }
    }

    // Update global file cache if it exists
    if (global.sandboxState?.fileCache) {
      for (const [filePath, content] of Object.entries(files)) {
        let normalizedPath = filePath;
        if (normalizedPath.startsWith("/")) {
          normalizedPath = normalizedPath.substring(1);
        }
        if (
          !normalizedPath.startsWith("src/") &&
          !normalizedPath.startsWith("public/") &&
          normalizedPath !== "index.html" &&
          !normalizedPath.includes("config")
        ) {
          if (
            normalizedPath.endsWith(".jsx") ||
            normalizedPath.endsWith(".tsx") ||
            normalizedPath.endsWith(".js") ||
            normalizedPath.endsWith(".ts")
          ) {
            normalizedPath = "src/" + normalizedPath;
          }
        }

        global.sandboxState.fileCache.files[normalizedPath] = {
          content,
          lastModified: Date.now(),
        };
      }
      global.sandboxState.fileCache.lastSync = Date.now();
    }

    const success = results.errors.length === 0;
    const message = success
      ? `Successfully wrote ${results.filesWritten.length} files to sandbox`
      : `Wrote ${results.filesWritten.length} files with ${results.errors.length} errors`;

    return NextResponse.json({
      success,
      data: {
        filesWritten: results.filesWritten,
        filesCount: results.filesWritten.length,
        errors: results.errors,
      },
      message,
      version: "v1",
    });
  } catch (error) {
    console.error("[V1 Sandbox Write API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to write files to sandbox",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}
