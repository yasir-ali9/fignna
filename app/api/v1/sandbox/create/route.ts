/**
 * V1 Sandbox Creation API Route
 * Creates new E2B sandbox for Vite React projects
 */

import { NextResponse } from "next/server";
import { Sandbox } from "@e2b/code-interpreter";

// Store active sandbox globally
declare global {
  var activeSandbox: Sandbox | null;
  var sandboxData: Record<string, unknown> | null;
  var existingFiles: Set<string>;
}

export async function POST() {
  let sandbox: Sandbox | null = null;

  try {
    console.log("[V1 Sandbox API] Creating Vite React sandbox...");

    // Kill existing sandbox if any
    if (global.activeSandbox) {
      console.log("[V1 Sandbox API] Killing existing sandbox...");
      try {
        await global.activeSandbox.kill();
      } catch (e) {
        console.error("[V1 Sandbox API] Failed to close existing sandbox:", e);
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
      "[V1 Sandbox API] Creating base E2B sandbox with 30 minute timeout..."
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

    console.log(`[V1 Sandbox API] Sandbox created: ${sandboxId}`);
    console.log(`[V1 Sandbox API] Sandbox host: ${host}`);

    // Set up Vite React app using Python script
    console.log("[V1 Sandbox API] Setting up Vite React app...");

    // Write all files in a single Python script to avoid multiple executions
    const setupScript = `
import os
import json

print('Setting up React app with Vite and Tailwind...')

# Create directory structure
os.makedirs('/home/user/app/src', exist_ok=True)

# Package.json with Vite and React
package_json = {
    "name": "sandbox-app",
    "version": "1.0.0",
    "type": "module",
    "scripts": {
        "dev": "vite --host",
        "build": "vite build",
        "preview": "vite preview"
    },
    "dependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0"
    },
    "devDependencies": {
        "@vitejs/plugin-react": "^4.0.0",
        "vite": "^4.3.9",
        "tailwindcss": "^3.3.0",
        "postcss": "^8.4.31",
        "autoprefixer": "^10.4.16"
    }
}

with open('/home/user/app/package.json', 'w') as f:
    json.dump(package_json, f, indent=2)
print('✓ package.json')

# Vite config for E2B compatibility
vite_config = """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// E2B-compatible Vite configuration
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: false,
    allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1']
  }
})"""

with open('/home/user/app/vite.config.js', 'w') as f:
    f.write(vite_config)
print('✓ vite.config.js')

# Tailwind config
tailwind_config = """/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}"""

with open('/home/user/app/tailwind.config.js', 'w') as f:
    f.write(tailwind_config)
print('✓ tailwind.config.js')

# PostCSS config
postcss_config = """export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}"""

with open('/home/user/app/postcss.config.js', 'w') as f:
    f.write(postcss_config)
print('✓ postcss.config.js')

# Index.html
index_html = """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sandbox App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>"""

with open('/home/user/app/index.html', 'w') as f:
    f.write(index_html)
print('✓ index.html')

# Main.jsx
main_jsx = """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)"""

with open('/home/user/app/src/main.jsx', 'w') as f:
    f.write(main_jsx)
print('✓ src/main.jsx')

# App.jsx with Tailwind styling
app_jsx = """function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4 text-blue-400">
          Sandbox Ready
        </h1>
        <p className="text-lg text-gray-400">
          Start building your React app with Vite and Tailwind CSS!
        </p>
      </div>
    </div>
  )
}

export default App"""

with open('/home/user/app/src/App.jsx', 'w') as f:
    f.write(app_jsx)
print('✓ src/App.jsx')

# Index.css with Tailwind directives
index_css = """@tailwind base;
@tailwind components;
@tailwind utilities;

/* Force Tailwind to load */
@layer base {
  :root {
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-text-size-adjust: 100%;
  }
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background-color: rgb(17 24 39);
}"""

with open('/home/user/app/src/index.css', 'w') as f:
    f.write(index_css)
print('✓ src/index.css')

print('\\nAll files created successfully!')
`;

    // Execute the setup script
    await sandbox.runCode(setupScript);

    // Install dependencies
    console.log("[V1 Sandbox API] Installing dependencies...");
    await sandbox.runCode(`
import subprocess
import sys

print('Installing npm packages...')
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

    // Start Vite dev server
    console.log("[V1 Sandbox API] Starting Vite dev server...");
    await sandbox.runCode(`
import subprocess
import os
import time

os.chdir('/home/user/app')

# Kill any existing Vite processes
subprocess.run(['pkill', '-f', 'vite'], capture_output=True)
time.sleep(1)

# Start Vite dev server
env = os.environ.copy()
env['FORCE_COLOR'] = '0'

process = subprocess.Popen(
    ['npm', 'run', 'dev'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    env=env
)

print(f'✓ Vite dev server started with PID: {process.pid}')
print('Waiting for server to be ready...')
    `);

    // Wait for Vite to be fully ready
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Vite is faster than Next.js

    // Force Tailwind CSS to rebuild by touching the CSS file
    await sandbox.runCode(`
import os
import time

# Touch the CSS file to trigger rebuild
css_file = '/home/user/app/src/index.css'
if os.path.exists(css_file):
    os.utime(css_file, None)
    print('✓ Triggered CSS rebuild')
    
# Also ensure PostCSS processes it
time.sleep(2)
print('✓ Tailwind CSS should be loaded')
    `);

    // Store sandbox globally
    global.activeSandbox = sandbox;
    global.sandboxData = {
      sandboxId,
      url: `https://${host}`,
    };

    // Set extended timeout on the sandbox instance if method available
    if (typeof sandbox.setTimeout === "function") {
      sandbox.setTimeout(30 * 60 * 1000);
      console.log("[V1 Sandbox API] Set sandbox timeout to 30 minutes");
    }

    console.log(
      "[V1 Sandbox API] Vite React sandbox ready at:",
      `https://${host}`
    );

    return NextResponse.json({
      success: true,
      sandboxId,
      url: `https://${host}`,
      message: "Vite React sandbox created and initialized successfully",
      version: "v1",
    });
  } catch (error) {
    console.error("[V1 Sandbox API] Error:", error);

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
        error: "Failed to create Vite React sandbox",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}
