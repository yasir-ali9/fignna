/**
 * V1 Project Download API Route
 * Creates a ZIP file of the project and returns it for download
 */

import { NextRequest, NextResponse } from "next/server";
import { Sandbox } from "@e2b/code-interpreter";
import { auth } from "@/lib/auth";
import { projectQueries, projectIdParamSchema } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Global sandbox state
declare global {
  var activeSandbox: Sandbox | null;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  let id: string | undefined;

  try {
    // Handle both sync and async params
    const resolvedParams = params instanceof Promise ? await params : params;
    id = resolvedParams?.id;

    console.log(`[V1 Project Download API] Creating ZIP for project ${id}...`);

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Project Download API] No session found");
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          version: "v1",
        },
        { status: 401 }
      );
    }

    // Validate project ID parameter
    const paramResult = projectIdParamSchema.safeParse({ id });
    if (!paramResult.success) {
      console.log(
        "[V1 Project Download API] Invalid project ID:",
        paramResult.error
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid project ID",
          details: paramResult.error.issues,
          version: "v1",
        },
        { status: 400 }
      );
    }

    // Get project details for filename
    const project = await projectQueries.getById(id, session.user.id);
    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
          version: "v1",
        },
        { status: 404 }
      );
    }

    // Check if there's an active sandbox
    if (!global.activeSandbox) {
      console.log(
        "[V1 Project Download API] No active sandbox, creating from database files..."
      );

      // If no sandbox, create ZIP from database files
      const projectFiles = await projectQueries.getFiles(id, session.user.id);

      // Create a simple ZIP structure from database files
      // For now, we'll return the files as JSON (could be enhanced to actual ZIP)
      const filesJson = JSON.stringify(projectFiles.files, null, 2);
      const base64Content = Buffer.from(filesJson).toString("base64");
      const dataUrl = `data:application/json;base64,${base64Content}`;

      return NextResponse.json({
        success: true,
        dataUrl,
        fileName: `${project.name.replace(/[^a-zA-Z0-9]/g, "-")}-files.json`,
        message:
          "Project files exported as JSON (no active sandbox for ZIP creation)",
        version: "v1",
      });
    }

    // Create ZIP file in sandbox
    console.log("[V1 Project Download API] Creating ZIP from sandbox...");

    // Create zip file excluding common build/cache directories
    const zipResult = await global.activeSandbox.runCode(`
import subprocess
import os

# Change to project directory
os.chdir('/home/user/app')

# Create zip file excluding unnecessary directories
result = subprocess.run([
    'zip', '-r', '/tmp/project.zip', '.',
    '-x', 'node_modules/*', '.git/*', '.next/*', 'dist/*', 
    'build/*', '*.log', '.vite/*', 'coverage/*'
], capture_output=True, text=True)

print(f"Zip creation exit code: {result.returncode}")
if result.stdout:
    print(f"Stdout: {result.stdout}")
if result.stderr:
    print(f"Stderr: {result.stderr}")

# Check if zip was created successfully
if result.returncode == 0:
    # Get file size
    size_result = subprocess.run(['ls', '-la', '/tmp/project.zip'], 
                                capture_output=True, text=True)
    print(f"Zip file info: {size_result.stdout}")
    print("ZIP_CREATION_SUCCESS")
else:
    print("ZIP_CREATION_FAILED")
    `);

    const output = zipResult.logs?.stdout?.join("") || "";

    if (!output.includes("ZIP_CREATION_SUCCESS")) {
      throw new Error("Failed to create ZIP file in sandbox");
    }

    // Read the zip file and convert to base64
    const readResult = await global.activeSandbox.runCode(`
import base64
import os

try:
    with open('/tmp/project.zip', 'rb') as f:
        zip_content = f.read()
    
    # Convert to base64
    base64_content = base64.b64encode(zip_content).decode('utf-8')
    print(f"BASE64_CONTENT_START")
    print(base64_content)
    print(f"BASE64_CONTENT_END")
    
    # Get file size
    file_size = os.path.getsize('/tmp/project.zip')
    print(f"File size: {file_size} bytes")
    
except Exception as e:
    print(f"Error reading zip file: {e}")
    `);

    const readOutput = readResult.logs?.stdout?.join("") || "";

    // Extract base64 content between markers
    const startMarker = "BASE64_CONTENT_START";
    const endMarker = "BASE64_CONTENT_END";
    const startIndex = readOutput.indexOf(startMarker);
    const endIndex = readOutput.indexOf(endMarker);

    if (startIndex === -1 || endIndex === -1) {
      throw new Error("Failed to read ZIP file content");
    }

    const base64Content = readOutput
      .substring(startIndex + startMarker.length, endIndex)
      .trim();

    if (!base64Content) {
      throw new Error("Empty ZIP file content");
    }

    // Create data URL for download
    const dataUrl = `data:application/zip;base64,${base64Content}`;

    // Generate filename from project name
    const sanitizedName = project.name.replace(/[^a-zA-Z0-9]/g, "-");
    const fileName = `${sanitizedName}-project.zip`;

    console.log(
      `[V1 Project Download API] ZIP created successfully for project ${id}`
    );

    return NextResponse.json({
      success: true,
      dataUrl,
      fileName,
      message: "Project ZIP created successfully",
      version: "v1",
    });
  } catch (error) {
    console.error(
      `[V1 Project Download API] Error creating ZIP for project ${id}:`,
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create project ZIP",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}
