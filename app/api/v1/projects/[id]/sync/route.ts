/**
 * V1 Project Sync API Route
 * Synchronizes project files from database to E2B sandbox for live preview
 */

import { NextRequest, NextResponse } from "next/server";
import { Sandbox } from "@e2b/code-interpreter";
import { auth } from "@/lib/auth";
import { projectQueries, versionQueries, projectIdParamSchema } from "@/lib/db";

interface RouteParams {
  params: { id: string };
}

// Store active sandbox globally
declare global {
  var activeSandbox: any;
  var sandboxData: any;
  var existingFiles: Set<string>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  let sandbox: any = null;

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

    const id = resolvedParams?.id;
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
        `[V1 Project Sync API] No files found in project ${id}, creating basic React app structure...`
      );

      // Create a basic React app structure for empty projects
      projectFiles.files = {
        "package.json": JSON.stringify(
          {
            name: "my-react-app",
            version: "0.1.0",
            private: true,
            dependencies: {
              react: "^18.2.0",
              "react-dom": "^18.2.0",
            },
            scripts: {
              start: "react-scripts start",
              build: "react-scripts build",
              dev: "vite",
              preview: "vite preview",
            },
            devDependencies: {
              vite: "^5.0.0",
              "@vitejs/plugin-react": "^4.0.0",
            },
            browserslist: {
              production: [">0.2%", "not dead", "not op_mini all"],
              development: [
                "last 1 chrome version",
                "last 1 firefox version",
                "last 1 safari version",
              ],
            },
          },
          null,
          2
        ),
        "vite.config.js": `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  }
})`,
        "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
        "src/main.jsx": `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
        "src/App.jsx": `import React from 'react'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Your React App</h1>
        <p>Start building something amazing!</p>
      </header>
    </div>
  )
}

export default App`,
        "src/App.css": `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
}`,
        "src/index.css": `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`,
      };

      console.log(
        `[V1 Project Sync API] Created basic React app with ${
          Object.keys(projectFiles.files).length
        } files`
      );

      // Create version snapshot for the scaffolded project
      try {
        await versionQueries.create({
          projectId: id,
          files: projectFiles.files,
          dependencies:
            JSON.parse(projectFiles.files["package.json"]).dependencies || {},
          message: "Initial React app scaffolding",
          // changeType: "sync",
        });
        console.log(
          `[V1 Project Sync API] Created scaffolding version for project ${id}`
        );
      } catch (versionError) {
        console.warn(
          `[V1 Project Sync API] Failed to create scaffolding version:`,
          versionError
        );
      }
    }

    console.log(
      `[V1 Project Sync API] Found ${
        Object.keys(projectFiles.files).length
      } files to sync`
    );

    // Kill existing sandbox if any 
    if (global.activeSandbox) {
      console.log("[V1 Project Sync API] Killing existing sandbox...");
      try {
        await global.activeSandbox.close();
      } catch (e) {
        console.error(
          "[V1 Project Sync API] Failed to close existing sandbox:",
          e
        );
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

    const sandboxId = (sandbox as any).sandboxId || Date.now().toString();
    const host = (sandbox as any).getHost(5173); // Vite default port

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
`);

    // Wait for dev server to be ready
    await new Promise((resolve) => setTimeout(resolve, 8000));

    // Store sandbox globally
    global.activeSandbox = sandbox;
    global.sandboxData = {
      sandboxId,
      url: `https://${host}`,
      projectId: params.id,
    };

    // Update project with sandbox info
    const previewUrl = `https://${host}`;
    await projectQueries.update(params.id, session.user.id, {
      sandboxId,
      previewUrl,
    });

    console.log(
      `[V1 Project Sync API] Project synced successfully. Preview URL: ${previewUrl}`
    );

    return NextResponse.json({
      success: true,
      data: {
        projectId: params.id,
        sandboxId,
        previewUrl,
        filesCount: Object.keys(projectFiles.files).length,
        version: projectFiles.version,
      },
      message: "Project synchronized to sandbox successfully",
      version: "v1",
    });
  } catch (error) {
    console.error(
      `[V1 Project Sync API] Error syncing project ${params.id}:`,
      error
    );

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
  try {
    console.log(
      `[V1 Project Sync API] Getting sync status for project ${params.id}...`
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
    const paramResult = projectIdParamSchema.safeParse({ id: params.id });
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
    const project = await projectQueries.getById(params.id, session.user.id);

    // Check if there's an active sandbox for this project
    const hasActiveSandbox =
      global.activeSandbox &&
      global.sandboxData &&
      global.sandboxData.projectId === params.id;

    return NextResponse.json({
      success: true,
      data: {
        projectId: params.id,
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
      `[V1 Project Sync API] Error getting sync status for project ${params.id}:`,
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
