/**
 * V1 Project Sync API Route
 * Synchronizes project files from database to E2B sandbox for live preview
 */

import { NextRequest, NextResponse } from "next/server";
import { Sandbox } from "@e2b/code-interpreter";
import { auth } from "@/lib/auth";
import { projectQueries, projectIdParamSchema } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Store active sandbox globally
declare global {
  var activeSandbox: Sandbox | null;
  var sandboxData: Record<string, unknown> | null;
  var existingFiles: Set<string>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  let sandbox: Sandbox | null = null;
  let id: string | undefined;

  try {
    // Debug params
    console.log("[V1 Project Sync API] Raw params:", params);
    console.log("[V1 Project Sync API] Params type:", typeof params);
    console.log("[V1 Project Sync API] Is Promise:", params instanceof Promise);

    // Handle both sync and async params
    const resolvedParams = params instanceof Promise ? await params : params;
    console.log("[V1 Project Sync API] Resolved params:", resolvedParams);
    console.log(
      "[V1 Project Sync API] Resolved params keys:",
      Object.keys(resolvedParams || {})
    );

    id = resolvedParams?.id;
    console.log(`[V1 Project Sync API] Extracted ID: ${id}`);

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Project Sync API] No session found");
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
        "[V1 Project Sync API] Invalid project ID:",
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

    // Get project files from database
    console.log(
      `[V1 Project Sync API] Fetching project files from database for project ${id} and user ${session.user.id}...`
    );

    let projectFiles;
    try {
      projectFiles = await projectQueries.getFiles(id, session.user.id);
      console.log(
        `[V1 Project Sync API] Project files retrieved:`,
        projectFiles
      );
    } catch (error) {
      console.error(
        `[V1 Project Sync API] Error fetching project files:`,
        error
      );
      return NextResponse.json(
        {
          success: false,
          error: "Failed to sync project to sandbox",
          details: error instanceof Error ? error.message : "Unknown error",
          version: "v1",
        },
        { status: 404 }
      );
    }

    if (!projectFiles.files || Object.keys(projectFiles.files).length === 0) {
      console.log(
        `[V1 Project Sync API] No files found in project ${id}. Cannot sync empty project.`
      );

      return NextResponse.json(
        {
          success: false,
          error: "Cannot sync empty project",
          details:
            "Project has no files to sync. Use the chat to generate code first.",
          version: "v1",
        },
        { status: 400 }
      );
    }

    console.log(
      `[V1 Project Sync API] Found ${
        Object.keys(projectFiles.files).length
      } files to sync`
    );

    // Log the files being synced for debugging
    console.log(
      "[V1 Project Sync API] Files to sync:",
      Object.keys(projectFiles.files)
    );

    // Kill existing sandbox if any
    if (global.activeSandbox) {
      console.log("[V1 Project Sync API] Killing existing sandbox...");
      try {
        await global.activeSandbox.kill();
      } catch {
        console.error("[V1 Project Sync API] Failed to close existing sandbox");
      }
      global.activeSandbox = null;
    }

    // Clear existing files tracking
    if (global.existingFiles) {
      global.existingFiles.clear();
    } else {
      global.existingFiles = new Set<string>();
    }

    // Create base E2B sandbox with 30 minute timeout
    console.log(
      "[V1 Project Sync API] Creating base E2B sandbox with 30 minute timeout..."
    );
    sandbox = await Sandbox.create({
      apiKey: process.env.E2B_API_KEY,
      timeoutMs: 30 * 60 * 1000, // 30 minutes
    });

    const sandboxId =
      (sandbox as Sandbox & { sandboxId: string }).sandboxId ||
      Date.now().toString();
    const host = (
      sandbox as Sandbox & { getHost: (port: number) => string }
    ).getHost(5173); // Vite default port

    console.log(`[V1 Project Sync API] Sandbox created: ${sandboxId}`);
    console.log(`[V1 Project Sync API] Sandbox host: ${host}`);

    // Create Python script to write all project files
    console.log("[V1 Project Sync API] Writing project files to sandbox...");

    // Escape file contents for Python string literals
    const escapeForPython = (content: string): string => {
      return content
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
    };

    // Generate Python script to create all files
    let fileCreationScript = `
import os
import json

print('Syncing project files to sandbox...')

# Create base directory structure
os.makedirs('/home/user/app', exist_ok=True)

`;

    // Add each file from the project
    for (const [filePath, content] of Object.entries(projectFiles.files)) {
      const escapedContent = escapeForPython(content);
      const fullPath = `/home/user/app/${filePath}`;

      // Create directory if needed
      const dirPath = fullPath.substring(0, fullPath.lastIndexOf("/"));
      fileCreationScript += `
# Create directory for ${filePath}
os.makedirs('${dirPath}', exist_ok=True)

# Write ${filePath}
with open('${fullPath}', 'w', encoding='utf-8') as f:
    f.write("${escapedContent}")
print('✓ ${filePath}')

`;
    }

    fileCreationScript += `
print(f'✓ Successfully wrote {len(os.listdir('/home/user/app'))} files to sandbox')
`;

    // Execute the file creation script
    await sandbox.runCode(fileCreationScript);

    // Ensure Vite config has correct E2B settings (only if needed)
    console.log(
      "[V1 Project Sync API] Checking Vite config for E2B compatibility..."
    );
    await sandbox.runCode(`
import os
import re

vite_config_path = '/home/user/app/vite.config.js'
needs_update = False

# Check if vite.config.js exists and has E2B allowedHosts
if os.path.exists(vite_config_path):
    with open(vite_config_path, 'r') as f:
        existing_config = f.read()
    
    # Check if it already has E2B allowedHosts
    if '.e2b.app' not in existing_config or 'allowedHosts' not in existing_config:
        print('⚠ Vite config exists but missing E2B allowedHosts, updating...')
        needs_update = True
    else:
        print('✓ Vite config already has E2B compatibility')
else:
    print('⚠ No vite.config.js found, creating E2B-compatible config...')
    needs_update = True

# Only update if needed
if needs_update:
    vite_config_content = """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// E2B-compatible Vite configuration
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: false,
    allowedHosts: ['.e2b.app', '.e2b.dev', 'localhost', '127.0.0.1']
  }
})"""

    with open(vite_config_path, 'w') as f:
        f.write(vite_config_content)
    print('✓ Updated vite.config.js with E2B compatibility')
    
    # Kill existing processes and clear cache only if we updated config
    import subprocess
    subprocess.run(['pkill', '-f', 'vite'], capture_output=True)
    
    # Clear Vite cache
    import shutil
    vite_cache_dirs = ['/home/user/app/node_modules/.vite', '/home/user/app/.vite']
    for cache_dir in vite_cache_dirs:
        if os.path.exists(cache_dir):
            shutil.rmtree(cache_dir)
            print(f'✓ Cleared Vite cache: {cache_dir}')
    
    print('✓ Killed existing Vite processes and cleared cache')
`);

    // Install dependencies if package.json exists
    if (projectFiles.files["package.json"]) {
      console.log("[V1 Project Sync API] Installing dependencies...");
      await sandbox.runCode(`
import subprocess
import sys
import os

print('Installing npm packages...')
os.chdir('/home/user/app')

result = subprocess.run(
    ['npm', 'install'],
    cwd='/home/user/app',
    capture_output=True,
    text=True
)

if result.returncode == 0:
    print('✓ Dependencies installed successfully')
else:
    print(f'⚠ Warning: npm install had issues: {result.stderr}')
    # Continue anyway as it might still work
`);
    }

    // Start dev server
    console.log("[V1 Project Sync API] Starting dev server...");
    await sandbox.runCode(`
import subprocess
import os
import time

os.chdir('/home/user/app')

# Kill any existing dev processes
subprocess.run(['pkill', '-f', 'vite'], capture_output=True)
subprocess.run(['pkill', '-f', 'next'], capture_output=True)
time.sleep(1)

# Detect project type and start appropriate dev server
package_json_path = '/home/user/app/package.json'
if os.path.exists(package_json_path):
    with open(package_json_path, 'r') as f:
        import json
        package_data = json.load(f)
        
    # Check if it's a Next.js project
    deps = package_data.get('dependencies', {})
    dev_deps = package_data.get('devDependencies', {})
    
    if 'next' in deps or 'next' in dev_deps:
        print('Detected Next.js project, starting Next.js dev server...')
        dev_command = ['npm', 'run', 'dev']
    elif 'vite' in deps or 'vite' in dev_deps:
        print('Detected Vite project, starting Vite dev server...')
        dev_command = ['npm', 'run', 'dev']
    else:
        print('Using default Vite dev server...')
        dev_command = ['npx', 'vite', '--host']
else:
    print('No package.json found, using default Vite dev server...')
    dev_command = ['npx', 'vite', '--host']

# Start dev server
env = os.environ.copy()
env['FORCE_COLOR'] = '0'

process = subprocess.Popen(
    dev_command,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    env=env
)

print(f'✓ Dev server started with PID: {process.pid}')
print('Waiting for server to be ready...')

# Log the command that was used to start the server
print(f'📋 Dev server command: {" ".join(dev_command)}')

# Verify Vite config is being used
if 'vite' in " ".join(dev_command):
    print('📋 Using Vite with E2B-compatible allowedHosts configuration')
`);

    // Wait for dev server to be ready
    await new Promise((resolve) => setTimeout(resolve, 8000));

    // Store sandbox globally
    global.activeSandbox = sandbox;
    global.sandboxData = {
      sandboxId,
      url: `https://${host}`,
      projectId: id,
    };

    // Update project with sandbox info
    const previewUrl = `https://${host}`;
    await projectQueries.update(id, session.user.id, {
      sandboxId,
      previewUrl,
    });

    console.log(
      `[V1 Project Sync API] Project synced successfully. Preview URL: ${previewUrl}`
    );

    return NextResponse.json({
      success: true,
      data: {
        projectId: id,
        sandboxId,
        previewUrl,
        filesCount: Object.keys(projectFiles.files).length,
        version: projectFiles.version,
      },
      message: "Project synchronized to sandbox successfully",
      version: "v1",
    });
  } catch (error) {
    console.error(`[V1 Project Sync API] Error syncing project ${id}:`, error);

    // Clean up on error
    if (sandbox) {
      try {
        await sandbox.kill();
      } catch (e) {
        console.error("Failed to close sandbox on error:", e);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync project to sandbox",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  let id: string | undefined;

  try {
    // Handle both sync and async params
    const resolvedParams = params instanceof Promise ? await params : params;
    id = resolvedParams?.id;

    console.log(
      `[V1 Project Sync API] Getting sync status for project ${id}...`
    );

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
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

    // Get project info
    const project = await projectQueries.getById(id, session.user.id);

    // Check if there's an active sandbox for this project
    const hasActiveSandbox =
      global.activeSandbox &&
      global.sandboxData &&
      global.sandboxData.projectId === id;

    return NextResponse.json({
      success: true,
      data: {
        projectId: id,
        sandboxId: project.sandboxId,
        previewUrl: project.previewUrl,
        isActive: hasActiveSandbox,
        lastSyncedAt: project.updatedAt,
        filesCount: Object.keys(project.files).length,
      },
      message: "Sync status retrieved successfully",
      version: "v1",
    });
  } catch (error) {
    console.error(
      `[V1 Project Sync API] Error getting sync status for project ${id}:`,
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get sync status",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}
