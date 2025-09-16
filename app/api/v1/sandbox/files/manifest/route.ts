/**
 * V1 Files Manifest API Route
 * Fetches and analyzes all files in the sandbox with component tree analysis
 */

import { NextResponse } from "next/server";
import {
  parseJavaScriptFile,
  buildComponentTree,
} from "@/lib/utils/file-parser";
import { FileManifest, FileInfo, RouteInfo } from "@/lib/types/file-manifest";
import type { SandboxState } from "@/lib/types/sandbox";

import type { Sandbox } from "@e2b/code-interpreter";

// Global state declarations
declare global {
  var activeSandbox: Sandbox | null;
  var sandboxState: SandboxState | null;
}

export async function GET() {
  try {
    if (!global.activeSandbox) {
      return NextResponse.json(
        {
          success: false,
          error: "No active sandbox",
          version: "v1",
        },
        { status: 404 }
      );
    }

    console.log(
      "[V1 Files Manifest API] Fetching and analyzing file structure..."
    );

    // Get all React/JS/CSS files from sandbox
    const result = await global.activeSandbox.runCode(`
import os
import json

def get_files_content(directory='/home/user/app', extensions=['.jsx', '.js', '.tsx', '.ts', '.css', '.json', '.html']):
    files_content = {}
    
    for root, dirs, files in os.walk(directory):
        # Skip node_modules and other unwanted directories
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist', 'build', '.vite']]
        
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, '/home/user/app')
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # Only include files under 50KB to avoid huge responses
                        if len(content) < 50000:
                            files_content[relative_path] = content
                        else:
                            # For large files, just include metadata
                            files_content[relative_path] = f"[Large file: {len(content)} characters - content truncated]"
                except Exception as e:
                    files_content[relative_path] = f"[Error reading file: {str(e)}]"
    
    return files_content

# Get the files
files = get_files_content()

# Also get the directory structure
structure = []
for root, dirs, files_list in os.walk('/home/user/app'):
    # Skip unwanted directories
    dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist', 'build', '.vite']]
    
    level = root.replace('/home/user/app', '').count(os.sep)
    indent = '  ' * level
    folder_name = os.path.basename(root) or 'app'
    structure.append(f"{indent}{folder_name}/")
    
    sub_indent = '  ' * (level + 1)
    for file in sorted(files_list):
        if not any(skip in root for skip in ['node_modules', '.git', 'dist', 'build', '.vite']):
            structure.append(f"{sub_indent}{file}")

result = {
    'files': files,
    'structure': '\\n'.join(structure[:100])  # Limit structure to 100 lines
}

print(json.dumps(result))
    `);

    const output = result.logs?.stdout?.join("") || "";
    if (!output) {
      throw new Error("No output from sandbox file scan");
    }

    const parsedResult = JSON.parse(output);

    // Build enhanced file manifest
    const fileManifest: FileManifest = {
      files: {},
      routes: [],
      componentTree: {},
      entryPoint: "",
      styleFiles: [],
      timestamp: Date.now(),
    };

    // Process each file
    for (const [relativePath, content] of Object.entries(parsedResult.files)) {
      const fullPath = `/home/user/app/${relativePath}`;

      // Skip error/truncated files for analysis
      if (typeof content === "string" && content.startsWith("[")) {
        continue;
      }

      // Clean content by removing markdown code block markers
      let cleanedContent = content as string;
      if (typeof cleanedContent === "string") {
        // Remove markdown code block markers (```jsx, ```js, ```css, etc.)
        cleanedContent = cleanedContent
          .replace(/^```\w*\n?/, "") // Remove opening markers
          .replace(/\n?```$/, "") // Remove closing markers
          .trim();
      }

      // Create base file info
      const fileInfo: FileInfo = {
        content: cleanedContent,
        type: "utility",
        path: fullPath,
        relativePath,
        lastModified: Date.now(),
      };

      // Parse JavaScript/JSX files
      if (relativePath.match(/\.(jsx?|tsx?)$/)) {
        const parseResult = parseJavaScriptFile(content as string, fullPath);
        Object.assign(fileInfo, parseResult);

        // Identify entry point
        if (
          relativePath === "src/main.jsx" ||
          relativePath === "src/index.jsx" ||
          relativePath === "src/main.tsx"
        ) {
          fileManifest.entryPoint = fullPath;
        }

        // Identify App.jsx
        if (
          relativePath === "src/App.jsx" ||
          relativePath === "App.jsx" ||
          relativePath === "src/App.tsx"
        ) {
          fileManifest.entryPoint = fileManifest.entryPoint || fullPath;
        }
      }

      // Track style files
      if (relativePath.endsWith(".css")) {
        fileManifest.styleFiles.push(fullPath);
        fileInfo.type = "style";
      }

      fileManifest.files[fullPath] = fileInfo;
    }

    // Build component tree
    fileManifest.componentTree = buildComponentTree(fileManifest.files);

    // Extract routes (simplified - looks for Route components or page pattern)
    fileManifest.routes = extractRoutes(fileManifest.files);

    // Update global file cache with manifest
    if (!global.sandboxState) {
      global.sandboxState = {
        fileCache: null,
        sandbox: global.activeSandbox,
        sandboxData: null,
      };
    }

    if (!global.sandboxState.fileCache) {
      global.sandboxState.fileCache = {
        files: {},
        lastSync: Date.now(),
        sandboxId:
          (global.activeSandbox as Sandbox & { sandboxId: string })
            ?.sandboxId || "unknown",
      };
    }

    // Update file cache
    for (const [relativePath, content] of Object.entries(parsedResult.files)) {
      if (typeof content === "string" && !content.startsWith("[")) {
        // Clean content by removing markdown code block markers
        let cleanedContent = content as string;
        cleanedContent = cleanedContent
          .replace(/^```\w*\n?/, "") // Remove opening markers
          .replace(/\n?```$/, "") // Remove closing markers
          .trim();

        global.sandboxState.fileCache.files[relativePath] = {
          content: cleanedContent,
          lastModified: Date.now(),
        };
      }
    }

    global.sandboxState.fileCache.manifest = fileManifest;
    global.sandboxState.fileCache.lastSync = Date.now();

    console.log(
      `[V1 Files Manifest API] Processed ${
        Object.keys(parsedResult.files).length
      } files`
    );

    // Clean all files in the response
    const cleanedFiles: Record<string, string> = {};
    for (const [relativePath, content] of Object.entries(parsedResult.files)) {
      if (typeof content === "string") {
        let cleanedContent = content;
        if (!content.startsWith("[")) {
          // Clean content by removing markdown code block markers
          cleanedContent = content
            .replace(/^```\w*\n?/, "") // Remove opening markers
            .replace(/\n?```$/, "") // Remove closing markers
            .trim();
        }
        cleanedFiles[relativePath] = cleanedContent;
      }
    }

    return NextResponse.json({
      success: true,
      files: cleanedFiles,
      structure: parsedResult.structure,
      fileCount: Object.keys(cleanedFiles).length,
      manifest: fileManifest,
      version: "v1",
    });
  } catch (error) {
    console.error("[V1 Files Manifest API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        version: "v1",
      },
      { status: 500 }
    );
  }
}

function extractRoutes(files: Record<string, FileInfo>): RouteInfo[] {
  const routes: RouteInfo[] = [];

  // Look for React Router usage
  for (const [path, fileInfo] of Object.entries(files)) {
    if (
      fileInfo.content.includes("<Route") ||
      fileInfo.content.includes("createBrowserRouter")
    ) {
      // Extract route definitions (simplified)
      const routeMatches = fileInfo.content.matchAll(
        /path=["']([^"']+)["'].*(?:element|component)={([^}]+)}/g
      );

      for (const match of routeMatches) {
        const [, routePath] = match;
        routes.push({
          path: routePath,
          component: path,
        });
      }
    }

    // Check for Next.js style pages
    if (
      fileInfo.relativePath.startsWith("pages/") ||
      fileInfo.relativePath.startsWith("src/pages/")
    ) {
      const routePath =
        "/" +
        fileInfo.relativePath
          .replace(/^(src\/)?pages\//, "")
          .replace(/\.(jsx?|tsx?)$/, "")
          .replace(/index$/, "");

      routes.push({
        path: routePath,
        component: path,
      });
    }
  }

  return routes;
}
