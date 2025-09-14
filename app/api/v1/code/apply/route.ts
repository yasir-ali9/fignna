/**
 * V1 Chat Apply API Route
 * Parses AI-generated code and applies it to the sandbox with streaming progress
 */

import { NextRequest, NextResponse } from "next/server";
import { Sandbox } from "@e2b/code-interpreter";
import type { SandboxState } from "@/lib/types/sandbox";
import type { ConversationState } from "@/lib/types/conversation";

// Global state declarations
declare global {
  var conversationState: ConversationState | null;
  var activeSandbox: Sandbox | null;
  var existingFiles: Set<string>;
  var sandboxState: SandboxState | null;
  var sandboxData: Record<string, unknown> | null;
}

interface ParsedResponse {
  explanation: string;
  template: string;
  files: Array<{ path: string; content: string }>;
  packages: string[];
  commands: string[];
  structure: string | null;
}

// Function to extract packages from import statements
function extractPackagesFromCode(content: string): string[] {
  const packages: string[] = [];
  // Match ES6 imports
  const importRegex =
    /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;
  let importMatch;

  while ((importMatch = importRegex.exec(content)) !== null) {
    const importPath = importMatch[1];
    // Skip relative imports and built-in React
    if (
      !importPath.startsWith(".") &&
      !importPath.startsWith("/") &&
      importPath !== "react" &&
      importPath !== "react-dom" &&
      !importPath.startsWith("@/")
    ) {
      // Extract package name (handle scoped packages like @heroicons/react)
      const packageName = importPath.startsWith("@")
        ? importPath.split("/").slice(0, 2).join("/")
        : importPath.split("/")[0];

      if (!packages.includes(packageName)) {
        packages.push(packageName);

        // Log important packages for debugging
        if (
          packageName === "react-router-dom" ||
          packageName.includes("router") ||
          packageName.includes("icon")
        ) {
          console.log(
            `[V1 Chat Apply API] Detected package from imports: ${packageName}`
          );
        }
      }
    }
  }

  return packages;
}

function parseAIResponse(response: string): ParsedResponse {
  const sections = {
    files: [] as Array<{ path: string; content: string }>,
    commands: [] as string[],
    packages: [] as string[],
    structure: null as string | null,
    explanation: "",
    template: "",
  };

  // Parse file sections - handle duplicates and prefer complete versions
  const fileMap = new Map<string, { content: string; isComplete: boolean }>();

  // First pass: Find all file declarations
  const fileRegex = /<file path="([^"]+)">([\s\S]*?)(?:<\/file>|$)/g;
  let match;
  while ((match = fileRegex.exec(response)) !== null) {
    const filePath = match[1];
    const content = match[2].trim();
    const hasClosingTag = response
      .substring(match.index, match.index + match[0].length)
      .includes("</file>");

    // Check if this file already exists in our map
    const existing = fileMap.get(filePath);

    // Decide whether to keep this version
    let shouldReplace = false;
    if (!existing) {
      shouldReplace = true; // First occurrence
    } else if (!existing.isComplete && hasClosingTag) {
      shouldReplace = true; // Replace incomplete with complete
      console.log(
        `[V1 Chat Apply API] Replacing incomplete ${filePath} with complete version`
      );
    } else if (
      existing.isComplete &&
      hasClosingTag &&
      content.length > existing.content.length
    ) {
      shouldReplace = true; // Replace with longer complete version
      console.log(
        `[V1 Chat Apply API] Replacing ${filePath} with longer complete version`
      );
    } else if (
      !existing.isComplete &&
      !hasClosingTag &&
      content.length > existing.content.length
    ) {
      shouldReplace = true; // Both incomplete, keep longer one
    }

    if (shouldReplace) {
      // Additional validation: reject obviously broken content
      if (
        content.includes("...") &&
        !content.includes("...props") &&
        !content.includes("...rest")
      ) {
        console.warn(
          `[V1 Chat Apply API] Warning: ${filePath} contains ellipsis, may be truncated`
        );
        // Still use it if it's the only version we have
        if (!existing) {
          fileMap.set(filePath, { content, isComplete: hasClosingTag });
        }
      } else {
        fileMap.set(filePath, { content, isComplete: hasClosingTag });
      }
    }
  }

  // Convert map to array for sections.files
  for (const [path, { content, isComplete }] of fileMap.entries()) {
    if (!isComplete) {
      console.log(
        `[V1 Chat Apply API] Warning: File ${path} appears to be truncated (no closing tag)`
      );
    }

    sections.files.push({
      path,
      content,
    });

    // Extract packages from file content
    const filePackages = extractPackagesFromCode(content);
    for (const pkg of filePackages) {
      if (!sections.packages.includes(pkg)) {
        sections.packages.push(pkg);
        console.log(
          `[V1 Chat Apply API] 📦 Package detected from imports: ${pkg}`
        );
      }
    }
  }

  // Also parse markdown code blocks with file paths
  const markdownFileRegex = /```(?:file )?path="([^"]+)"\n([\s\S]*?)```/g;
  while ((match = markdownFileRegex.exec(response)) !== null) {
    const filePath = match[1];
    const content = match[2].trim();
    sections.files.push({
      path: filePath,
      content: content,
    });

    // Extract packages from file content
    const filePackages = extractPackagesFromCode(content);
    for (const pkg of filePackages) {
      if (!sections.packages.includes(pkg)) {
        sections.packages.push(pkg);
        console.log(
          `[V1 Chat Apply API] 📦 Package detected from imports: ${pkg}`
        );
      }
    }
  }

  // Parse commands
  const cmdRegex = /<command>(.*?)<\/command>/g;
  while ((match = cmdRegex.exec(response)) !== null) {
    sections.commands.push(match[1].trim());
  }

  // Parse packages - support both <package> and <packages> tags
  const pkgRegex = /<package>(.*?)<\/package>/g;
  while ((match = pkgRegex.exec(response)) !== null) {
    sections.packages.push(match[1].trim());
  }

  // Also parse <packages> tag with multiple packages
  const packagesRegex = /<packages>([\s\S]*?)<\/packages>/;
  const packagesMatch = response.match(packagesRegex);
  if (packagesMatch) {
    const packagesContent = packagesMatch[1].trim();
    // Split by newlines or commas
    const packagesList = packagesContent
      .split(/[\n,]+/)
      .map((pkg) => pkg.trim())
      .filter((pkg) => pkg.length > 0);
    sections.packages.push(...packagesList);
  }

  // Parse structure
  const structureMatch = /<structure>([\s\S]*?)<\/structure>/;
  const structResult = response.match(structureMatch);
  if (structResult) {
    sections.structure = structResult[1].trim();
  }

  // Parse explanation
  const explanationMatch = /<explanation>([\s\S]*?)<\/explanation>/;
  const explResult = response.match(explanationMatch);
  if (explResult) {
    sections.explanation = explResult[1].trim();
  }

  // Parse template
  const templateMatch = /<template>(.*?)<\/template>/;
  const templResult = response.match(templateMatch);
  if (templResult) {
    sections.template = templResult[1].trim();
  }

  return sections;
}

export async function POST(request: NextRequest) {
  try {
    const {
      response,
      isEdit = false,
      packages = [],
      sandboxId,
    } = await request.json();

    if (!response) {
      return NextResponse.json(
        {
          success: false,
          error: "response is required",
          version: "v1",
        },
        { status: 400 }
      );
    }

    // Debug log the response
    console.log("[V1 Chat Apply API] Received response to parse:");
    console.log("[V1 Chat Apply API] Response length:", response.length);
    console.log(
      "[V1 Chat Apply API] Response preview:",
      response.substring(0, 500)
    );
    console.log("[V1 Chat Apply API] isEdit:", isEdit);
    console.log("[V1 Chat Apply API] packages:", packages);

    // Parse the AI response
    const parsed = parseAIResponse(response);

    // Log what was parsed
    console.log("[V1 Chat Apply API] Parsed result:");
    console.log("[V1 Chat Apply API] Files found:", parsed.files.length);
    if (parsed.files.length > 0) {
      parsed.files.forEach((f) => {
        console.log(
          `[V1 Chat Apply API] - ${f.path} (${f.content.length} chars)`
        );
      });
    }
    console.log("[V1 Chat Apply API] Packages found:", parsed.packages);

    // Initialize existingFiles if not already
    if (!global.existingFiles) {
      global.existingFiles = new Set<string>();
    }

    // First, always check the global state for active sandbox
    let sandbox = global.activeSandbox;

    // If we don't have a sandbox in this instance but we have a sandboxId,
    // reconnect to the existing sandbox
    if (!sandbox && sandboxId) {
      console.log(
        `[V1 Chat Apply API] Sandbox ${sandboxId} not in this instance, attempting reconnect...`
      );

      try {
        // Reconnect to the existing sandbox using E2B's connect method
        sandbox = await Sandbox.connect(sandboxId, {
          apiKey: process.env.E2B_API_KEY,
        });
        console.log(
          `[V1 Chat Apply API] Successfully reconnected to sandbox ${sandboxId}`
        );

        // Store the reconnected sandbox globally for this instance
        global.activeSandbox = sandbox;

        // Update sandbox data if needed
        if (!global.sandboxData) {
          const host = (
            sandbox as Sandbox & { getHost: (port: number) => string }
          ).getHost(5173);
          global.sandboxData = {
            sandboxId,
            url: `https://${host}`,
          };
        }

        // Initialize existingFiles if not already
        if (!global.existingFiles) {
          global.existingFiles = new Set<string>();
        }
      } catch (reconnectError) {
        console.error(
          `[V1 Chat Apply API] Failed to reconnect to sandbox ${sandboxId}:`,
          reconnectError
        );

        // If reconnection fails, we'll still try to return a meaningful response
        return NextResponse.json({
          success: false,
          error: `Failed to reconnect to sandbox ${sandboxId}. The sandbox may have expired or been terminated.`,
          results: {
            filesCreated: [],
            packagesInstalled: [],
            commandsExecuted: [],
            errors: [
              `Sandbox reconnection failed: ${
                (reconnectError as Error).message
              }`,
            ],
          },
          explanation: parsed.explanation,
          structure: parsed.structure,
          parsedFiles: parsed.files,
          message: `Parsed ${parsed.files.length} files but couldn't apply them - sandbox reconnection failed.`,
          version: "v1",
        });
      }
    }

    // If no sandbox at all and no sandboxId provided, return an error
    if (!sandbox && !sandboxId) {
      console.log(
        "[V1 Chat Apply API] No sandbox available and no sandboxId provided"
      );
      return NextResponse.json({
        success: false,
        error: "No active sandbox found. Please create a sandbox first.",
        results: {
          filesCreated: [],
          packagesInstalled: [],
          commandsExecuted: [],
          errors: ["No sandbox available"],
        },
        explanation: parsed.explanation,
        structure: parsed.structure,
        parsedFiles: parsed.files,
        message: `Parsed ${parsed.files.length} files but no sandbox available to apply them.`,
        version: "v1",
      });
    }

    // Create a response stream for real-time updates
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Function to send progress updates
    const sendProgress = async (data: Record<string, unknown>) => {
      const message = `data: ${JSON.stringify({ ...data, version: "v1" })}\n\n`;
      await writer.write(encoder.encode(message));
    };

    // Start processing in background
    (async (sandboxInstance, req) => {
      const results = {
        filesCreated: [] as string[],
        filesUpdated: [] as string[],
        packagesInstalled: [] as string[],
        packagesAlreadyInstalled: [] as string[],
        packagesFailed: [] as string[],
        commandsExecuted: [] as string[],
        errors: [] as string[],
      };

      try {
        await sendProgress({
          type: "start",
          message: "Starting code application...",
          totalSteps: 3,
        });

        // Step 1: Install packages
        const packagesArray = Array.isArray(packages) ? packages : [];
        const parsedPackages = Array.isArray(parsed.packages)
          ? parsed.packages
          : [];

        // Combine and deduplicate packages
        const allPackages = [
          ...packagesArray.filter((pkg) => pkg && typeof pkg === "string"),
          ...parsedPackages,
        ];

        // Use Set to remove duplicates, then filter out pre-installed packages
        const uniquePackages = [...new Set(allPackages)]
          .filter((pkg) => pkg && typeof pkg === "string" && pkg.trim() !== "") // Remove empty strings
          .filter((pkg) => pkg !== "react" && pkg !== "react-dom"); // Filter pre-installed

        // Log if we found duplicates
        if (allPackages.length !== uniquePackages.length) {
          console.log(
            `[V1 Chat Apply API] Removed ${
              allPackages.length - uniquePackages.length
            } duplicate packages`
          );
          console.log(`[V1 Chat Apply API] Original packages:`, allPackages);
          console.log(
            `[V1 Chat Apply API] Deduplicated packages:`,
            uniquePackages
          );
        }

        if (uniquePackages.length > 0) {
          await sendProgress({
            type: "step",
            step: 1,
            message: `Installing ${uniquePackages.length} packages...`,
            packages: uniquePackages,
          });

          // Use detect-and-install-packages for chat flow
          try {
            // Construct the API URL properly for both dev and production
            const protocol =
              process.env.NODE_ENV === "production" ? "https" : "http";
            const host = req.headers.get("host") || "localhost:3000";
            const apiUrl = `${protocol}://${host}/api/v1/packages/detect`;

            // Prepare files for package detection (from parsed files)
            const filesForPackageDetection: Record<string, string> = {};
            for (const file of parsed.files) {
              filesForPackageDetection[file.path] = file.content;
            }

            const installResponse = await fetch(apiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                files: filesForPackageDetection,
                streaming: true,
              }),
            });

            if (installResponse.ok) {
              // Handle streaming response from detect API
              const reader = installResponse.body?.getReader();
              if (reader) {
                const decoder = new TextDecoder();
                let packageResult: Record<string, unknown> = {};

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  const chunk = decoder.decode(value);
                  const lines = chunk.split("\n");

                  for (const line of lines) {
                    if (line.startsWith("data: ")) {
                      try {
                        const data = JSON.parse(line.slice(6));

                        // Forward package progress to chat
                        if (data.type === "package-progress") {
                          await sendProgress({
                            type: "package-progress",
                            stage: data.stage,
                            message: data.message,
                            packages: data.packages,
                          });
                        } else if (data.type === "package-complete") {
                          packageResult = data;

                          if (
                            data.packagesInstalled &&
                            data.packagesInstalled.length > 0
                          ) {
                            results.packagesInstalled = data.packagesInstalled;
                            console.log(
                              `[V1 Chat Apply API] Installed packages: ${data.packagesInstalled.join(
                                ", "
                              )}`
                            );

                            await sendProgress({
                              type: "package-success",
                              message: `Installed ${
                                data.packagesInstalled.length
                              } packages: ${data.packagesInstalled.join(", ")}`,
                              packages: data.packagesInstalled,
                            });
                          }

                          if (
                            data.packagesAlreadyInstalled &&
                            data.packagesAlreadyInstalled.length > 0
                          ) {
                            results.packagesAlreadyInstalled =
                              data.packagesAlreadyInstalled;
                            console.log(
                              `[V1 Chat Apply API] Already installed: ${data.packagesAlreadyInstalled.join(
                                ", "
                              )}`
                            );
                          }

                          if (
                            data.packagesFailed &&
                            data.packagesFailed.length > 0
                          ) {
                            results.packagesFailed = data.packagesFailed;
                            console.error(
                              `[V1 Chat Apply API] Failed to install packages: ${data.packagesFailed.join(
                                ", "
                              )}`
                            );
                            results.errors.push(
                              `Failed to install packages: ${data.packagesFailed.join(
                                ", "
                              )}`
                            );

                            await sendProgress({
                              type: "warning",
                              message: `Failed to install some packages: ${data.packagesFailed.join(
                                ", "
                              )}`,
                            });
                          }
                        } else if (data.type === "error") {
                          console.error(
                            "[V1 Chat Apply API] Package installation error:",
                            data.error
                          );
                          await sendProgress({
                            type: "warning",
                            message: `Package installation failed: ${data.error}`,
                          });
                        }
                      } catch (parseError) {
                        console.warn(
                          "[V1 Chat Apply API] Failed to parse package progress:",
                          parseError
                        );
                      }
                    }
                  }
                }

                console.log(
                  "[V1 Chat Apply API] Package installation result:",
                  JSON.stringify(packageResult, null, 2)
                );
              } else {
                throw new Error("No response stream available");
              }
            } else {
              throw new Error(
                `Package detection API returned ${installResponse.status}`
              );
            }
          } catch (error) {
            console.error(
              "[V1 Chat Apply API] Error installing packages:",
              error
            );
            await sendProgress({
              type: "warning",
              message: `Package installation skipped (${
                (error as Error).message
              }). Continuing with file creation...`,
            });
            results.errors.push(
              `Package installation failed: ${(error as Error).message}`
            );
          }
        } else {
          await sendProgress({
            type: "step",
            step: 1,
            message: "No additional packages to install, skipping...",
          });
        }

        // Step 2: Create/update files
        const filesArray = Array.isArray(parsed.files) ? parsed.files : [];
        await sendProgress({
          type: "step",
          step: 2,
          message: `Creating ${filesArray.length} files...`,
        });

        // Filter out config files that shouldn't be created
        const configFiles = [
          "tailwind.config.js",
          "vite.config.js",
          "package.json",
          "package-lock.json",
          "tsconfig.json",
          "postcss.config.js",
        ];
        const filteredFiles = filesArray.filter((file) => {
          if (!file || typeof file !== "object") return false;
          const fileName = (file.path || "").split("/").pop() || "";
          return !configFiles.includes(fileName);
        });

        for (const [index, file] of filteredFiles.entries()) {
          try {
            // Send progress for each file
            await sendProgress({
              type: "file-progress",
              current: index + 1,
              total: filteredFiles.length,
              fileName: file.path,
              action: "creating",
            });

            // Normalize the file path
            let normalizedPath = file.path;
            if (normalizedPath.startsWith("/")) {
              normalizedPath = normalizedPath.substring(1);
            }
            if (
              !normalizedPath.startsWith("src/") &&
              !normalizedPath.startsWith("public/") &&
              normalizedPath !== "index.html" &&
              !configFiles.includes(normalizedPath.split("/").pop() || "")
            ) {
              normalizedPath = "src/" + normalizedPath;
            }

            const fullPath = `/home/user/app/${normalizedPath}`;
            const isUpdate = global.existingFiles.has(normalizedPath);

            // Clean file content: remove markdown code block markers and CSS imports
            let fileContent = file.content;

            // Remove markdown code block markers (```jsx, ```js, ```css, etc.)
            fileContent = fileContent
              .replace(/^```\w*\n?/, "") // Remove opening markers
              .replace(/\n?```$/, "") // Remove closing markers
              .trim();

            // Remove any CSS imports from JSX/JS files (we're using Tailwind)
            if (
              file.path.endsWith(".jsx") ||
              file.path.endsWith(".js") ||
              file.path.endsWith(".tsx") ||
              file.path.endsWith(".ts")
            ) {
              fileContent = fileContent.replace(
                /import\s+['"]\.\/[^'"]+\.css['"];?\s*\n?/g,
                ""
              );
            }

            // Write the file using Python (code-interpreter SDK)
            const escapedContent = fileContent
              .replace(/\\/g, "\\\\")
              .replace(/"""/g, '\\"\\"\\"')
              .replace(/\$/g, "\\$");

            await sandboxInstance?.runCode(`
import os
os.makedirs(os.path.dirname("${fullPath}"), exist_ok=True)
with open("${fullPath}", 'w') as f:
    f.write("""${escapedContent}""")
print(f"File written: ${fullPath}")
            `);

            // Update file cache
            if (global.sandboxState?.fileCache) {
              global.sandboxState.fileCache.files[normalizedPath] = {
                content: fileContent,
                lastModified: Date.now(),
              };
            }

            if (isUpdate) {
              if (results.filesUpdated)
                results.filesUpdated.push(normalizedPath);
            } else {
              if (results.filesCreated)
                results.filesCreated.push(normalizedPath);
              if (global.existingFiles)
                global.existingFiles.add(normalizedPath);
            }

            await sendProgress({
              type: "file-complete",
              fileName: normalizedPath,
              action: isUpdate ? "updated" : "created",
            });
          } catch (error) {
            if (results.errors) {
              results.errors.push(
                `Failed to create ${file.path}: ${(error as Error).message}`
              );
            }
            await sendProgress({
              type: "file-error",
              fileName: file.path,
              error: (error as Error).message,
            });
          }
        }

        // Step 3: Execute commands
        const commandsArray = Array.isArray(parsed.commands)
          ? parsed.commands
          : [];
        if (commandsArray.length > 0) {
          await sendProgress({
            type: "step",
            step: 3,
            message: `Executing ${commandsArray.length} commands...`,
          });

          for (const [index, cmd] of commandsArray.entries()) {
            try {
              await sendProgress({
                type: "command-progress",
                current: index + 1,
                total: parsed.commands.length,
                command: cmd,
                action: "executing",
              });

              // Use E2B runCode for command execution
              const result = await sandboxInstance?.runCode(`
import subprocess
import os

os.chdir('/home/user/app')
result = subprocess.run(${JSON.stringify(cmd.split(" "))}, 
                       capture_output=True, 
                       text=True, 
                       timeout=60)

print("STDOUT:")
print(result.stdout)
if result.stderr:
    print("\\nSTDERR:")
    print(result.stderr)
print(f"\\nReturn code: {result.returncode}")
              `);

              if (results.commandsExecuted) {
                results.commandsExecuted.push(cmd);
              }

              await sendProgress({
                type: "command-complete",
                command: cmd,
                output:
                  result?.logs?.stdout?.join("\n") ||
                  result?.logs?.stderr?.join("\n") ||
                  "",
                success: true,
              });
            } catch (error) {
              if (results.errors) {
                results.errors.push(
                  `Failed to execute ${cmd}: ${(error as Error).message}`
                );
              }
              await sendProgress({
                type: "command-error",
                command: cmd,
                error: (error as Error).message,
              });
            }
          }
        }

        // Auto-save files from sandbox to project database after 3 seconds
        setTimeout(async () => {
          try {
            await sendProgress({
              type: "status",
              message: "Auto-saving files to project...",
            });

            // Extract project ID from request URL or headers if available
            const url = new URL(request.url);
            const projectIdMatch = url.pathname.match(/\/projects\/([^\/]+)\//);

            if (projectIdMatch) {
              const projectId = projectIdMatch[1];
              const saveResponse = await fetch(
                `${
                  process.env.BETTER_AUTH_URL || "http://localhost:3000"
                }/api/v1/projects/${projectId}/save`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Cookie: request.headers.get("cookie") || "",
                  },
                }
              );

              if (saveResponse.ok) {
                const saveResult = await saveResponse.json();
                console.log(
                  `[V1 Code Apply API] Auto-saved ${
                    saveResult.data?.filesCount || 0
                  } files to project`
                );

                await sendProgress({
                  type: "status",
                  message: `Saved ${
                    saveResult.data?.filesCount || 0
                  } files to project`,
                });
              } else {
                console.warn(
                  "[V1 Code Apply API] Failed to auto-save files:",
                  await saveResponse.text()
                );
              }
            }
          } catch (saveError) {
            console.warn("[V1 Code Apply API] Auto-save failed:", saveError);
            // Don't fail the entire application if save fails
          }
        }, 3000); // 3 second delay

        // Send final results
        await sendProgress({
          type: "complete",
          results,
          explanation: parsed.explanation,
          structure: parsed.structure,
          message: `Successfully applied ${results.filesCreated.length} files`,
        });

        // Track applied files in conversation state
        if (global.conversationState && results.filesCreated.length > 0) {
          const messages = global.conversationState.context.messages;
          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === "user") {
              lastMessage.metadata = {
                ...lastMessage.metadata,
                editedFiles: results.filesCreated,
              };
            }
          }

          // Track applied code in project evolution
          if (global.conversationState.context.projectEvolution) {
            global.conversationState.context.projectEvolution.majorChanges.push(
              {
                timestamp: Date.now(),
                description: parsed.explanation || "Code applied",
                filesAffected: results.filesCreated || [],
              }
            );
          }

          global.conversationState.lastUpdated = Date.now();
        }
      } catch (error) {
        await sendProgress({
          type: "error",
          error: (error as Error).message,
        });
      } finally {
        await writer.close();
      }
    })(sandbox, request);

    // Return the stream
    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-API-Version": "v1",
      },
    });
  } catch (error) {
    console.error("[V1 Chat Apply API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to parse AI code",
        version: "v1",
      },
      { status: 500 }
    );
  }
}
