/**
 * V1 Project Save API Route
 * Fetches files from active sandbox and saves them to project database
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

    console.log(
      `[V1 Project Save API] Saving files from sandbox to project ${id}...`
    );

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Project Save API] No session found");
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
        "[V1 Project Save API] Invalid project ID:",
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

    // Check if there's an active sandbox
    if (!global.activeSandbox) {
      console.log("[V1 Project Save API] No active sandbox found");
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

    // Get all files from sandbox
    console.log("[V1 Project Save API] Fetching files from sandbox...");
    const result = await global.activeSandbox.runCode(`
import os
import json

def get_project_files(directory='/home/user/app'):
    files_content = {}
    
    # Skip these directories and files
    skip_dirs = {'node_modules', '.git', 'dist', 'build', '.vite', '.next'}
    skip_files = {'.DS_Store', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'}
    
    for root, dirs, files in os.walk(directory):
        # Filter out directories we want to skip
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        
        for file in files:
            if file in skip_files:
                continue
                
            file_path = os.path.join(root, file)
            relative_path = os.path.relpath(file_path, directory)
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    files_content[relative_path] = content
            except Exception as e:
                # Skip binary files or files that can't be read
                print(f'Skipping {relative_path}: {str(e)}')
                continue
    
    return files_content

# Get all project files
files = get_project_files()
print(json.dumps(files))
    `);

    const output = result.logs?.stdout?.join("") || "";
    if (!output) {
      throw new Error("No output from sandbox file scan");
    }

    let sandboxFiles;
    try {
      sandboxFiles = JSON.parse(output);
    } catch (parseError) {
      console.error(
        "[V1 Project Save API] Failed to parse sandbox files:",
        parseError
      );
      throw new Error("Failed to parse sandbox files");
    }

    console.log(
      `[V1 Project Save API] Found ${
        Object.keys(sandboxFiles).length
      } files in sandbox`
    );

    // Save files to project database
    const updatedProject = await projectQueries.updateFiles(
      id,
      session.user.id,
      sandboxFiles
    );

    console.log(
      `[V1 Project Save API] Saved ${
        Object.keys(sandboxFiles).length
      } files to project ${id}`
    );

    return NextResponse.json({
      success: true,
      data: {
        projectId: updatedProject.id,
        filesCount: Object.keys(sandboxFiles).length,
        version: updatedProject.version,
        lastSavedAt: updatedProject.lastSavedAt,
      },
      message: "Files saved from sandbox to project successfully",
      version: "v1",
    });
  } catch (error) {
    console.error(
      `[V1 Project Save API] Error saving files from sandbox for project ${id}:`,
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to save files from sandbox",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}
