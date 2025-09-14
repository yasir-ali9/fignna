"use client";

import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
// Removed tRPC import - now using fetch for API calls

interface TerminalProps {
  workspaceId?: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  content: string;
  type: "output" | "error" | "input";
}

/**
 * Terminal component that displays logs from development server
 * Uses fetch API calls for command execution
 */
export const Terminal = observer(({ workspaceId }: TerminalProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [command, setCommand] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get project ID from URL
  const projectId =
    typeof window !== "undefined" ? window.location.pathname.split("/")[2] : "";

  // State for logs and connection status
  const [logsData, setLogsData] = useState<{
    logs: string;
    timestamp: string;
  } | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  // Fetch logs from V1 API endpoint
  const fetchLogs = async () => {
    try {
      // Fetch both sandbox and project logs from V1 API
      const [sandboxResponse, projectResponse] = await Promise.all([
        fetch("/api/v1/sandbox/logs/sandbox"),
        fetch("/api/v1/sandbox/logs/project"),
      ]);

      const combinedLogs: string[] = [];

      // Process sandbox logs
      if (sandboxResponse.ok) {
        const sandboxData = await sandboxResponse.json();
        if (sandboxData.success && sandboxData.logs) {
          combinedLogs.push("=== Sandbox Status ===");
          combinedLogs.push(...sandboxData.logs);
          combinedLogs.push("");
        }
      }

      // Process project logs (errors/warnings)
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        if (projectData.success) {
          if (projectData.errors && projectData.errors.length > 0) {
            combinedLogs.push("=== Project Errors ===");
            projectData.errors.forEach((error: any) => {
              combinedLogs.push(`[${error.type}] ${error.message}`);
              if (error.package) {
                combinedLogs.push(`  Package: ${error.package}`);
              }
            });
            combinedLogs.push("");
          }

          if (projectData.warnings && projectData.warnings.length > 0) {
            combinedLogs.push("=== Project Warnings ===");
            projectData.warnings.forEach((warning: any) => {
              combinedLogs.push(`[${warning.type}] ${warning.message}`);
            });
            combinedLogs.push("");
          }

          if (
            projectData.errors.length === 0 &&
            projectData.warnings.length === 0
          ) {
            combinedLogs.push("✓ No project errors or warnings");
          }
        }
      }

      // Update logs data
      setLogsData({
        logs: combinedLogs.join("\n"),
        timestamp: new Date().toISOString(),
      });
      setIsError(false);
    } catch (error) {
      console.error("Error fetching V1 logs:", error);
      setIsError(true);
    }
  };

  // Poll for logs every 5 seconds (V1 API is more comprehensive)
  useEffect(() => {
    setIsPolling(true);
    fetchLogs(); // Initial fetch

    const interval = setInterval(fetchLogs, 5000);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, []);

  /**
   * Add a new log entry to the terminal
   */
  const addLog = (type: LogEntry["type"], content: string) => {
    const newLog: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      content,
      type,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  // Update logs when data changes
  useEffect(() => {
    if (logsData?.logs) {
      const logLines = logsData.logs.split("\n").filter((line) => line.trim());

      const newLogs: LogEntry[] = logLines.map((line, index) => ({
        id: `api-${logsData.timestamp}-${index}`,
        timestamp: new Date(logsData.timestamp),
        content: line,
        type: "output" as const,
      }));

      setLogs(newLogs);
    }
  }, [logsData]);

  // Handle connection status
  const isConnected = !!logsData && !isError;

  /**
   * Handle package installation commands with streaming feedback
   */
  const handlePackageInstallCommand = async (command: string) => {
    // Parse package installation command
    const parts = command.split(/\s+/);
    const packageManager = parts[0]; // npm, yarn, pnpm
    const action = parts[1]; // install, i, add

    // Extract packages (skip flags for now)
    const packages = parts.slice(2).filter((part) => !part.startsWith("-"));
    const isDev = parts.some((part) => part === "--save-dev" || part === "-D");

    if (packages.length === 0) {
      addLog("error", "❌ No packages specified");
      return;
    }

    try {
      addLog("output", `🚀 Installing ${packages.join(", ")}...`);

      // Call the V1 package installation API
      const response = await fetch("/api/v1/packages/install", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packages,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              // Add progress message to terminal
              const message = getProgressMessage(data);
              const logType = data.type === "error" ? "error" : "output";
              addLog(logType, message);
            } catch (parseError) {
              console.warn("Failed to parse progress data:", parseError);
            }
          }
        }
      }
    } catch (error) {
      addLog(
        "error",
        `❌ Package installation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  /**
   * Handle package detection command
   */
  const handleDetectPackages = async () => {
    try {
      addLog("output", "🔍 Scanning project for missing packages...");

      const response = await fetch("/api/v1/packages/detect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        const {
          missingPackages,
          detectedPackages,
          installedPackages,
          filesScanned,
        } = result.data;

        // Show scan results
        addLog(
          "output",
          `📊 Scanned ${filesScanned} files, found ${detectedPackages.length} total packages`
        );

        if (missingPackages.length > 0) {
          addLog(
            "output",
            `❌ Missing packages (${
              missingPackages.length
            }): ${missingPackages.join(", ")}`
          );
          addLog(
            "output",
            `💡 To install: npm install ${missingPackages.join(" ")}`
          );
        } else {
          addLog("output", "✅ All packages are installed!");
        }

        if (installedPackages.length > 0) {
          addLog(
            "output",
            `📦 Installed (${
              installedPackages.length
            }): ${installedPackages.join(", ")}`
          );
        }
      } else {
        addLog("error", `❌ ${result.error}: ${result.details || ""}`);
      }
    } catch (error) {
      addLog(
        "error",
        `Error detecting packages: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  /**
   * Format progress messages from streaming API
   */
  const getProgressMessage = (data: any): string => {
    switch (data.type) {
      case "start":
        return `🚀 ${data.message}`;
      case "status":
        return `⏳ ${data.message}`;
      case "info":
        return `ℹ️ ${data.message}`;
      case "success":
        return `✅ ${data.message}`;
      case "warning":
        return `⚠️ ${data.message}`;
      case "error":
        return `❌ ${data.message}`;
      case "output":
        return `📄 ${data.message}`;
      case "complete":
        return `🎉 ${data.message}`;
      default:
        return data.message || "Unknown progress update";
    }
  };

  /**
   * Execute a command using fetch API
   */
  const executeCommand = async (cmd: string) => {
    if (!cmd.trim() || !projectId) return;

    // Add command to logs
    addLog("input", `$ ${cmd}`);
    setIsLoading(true);

    try {
      // Handle special commands locally
      if (cmd === "clear") {
        setLogs([]);
        setIsLoading(false);
        return;
      }

      // Handle package installation commands
      if (
        cmd.startsWith("npm install") ||
        cmd.startsWith("npm i ") ||
        cmd.startsWith("yarn add") ||
        cmd.startsWith("pnpm add")
      ) {
        await handlePackageInstallCommand(cmd);
      } else if (
        cmd.startsWith("npm ") ||
        cmd.startsWith("yarn ") ||
        cmd.startsWith("pnpm ")
      ) {
        addLog(
          "output",
          "Package management commands are handled automatically by the sandbox"
        );
        addLog(
          "output",
          "Dependencies are installed when code is applied via chat"
        );
        addLog(
          "output",
          "Supported commands: npm install <package>, detect-packages"
        );
      } else if (cmd === "ls" || cmd === "dir") {
        addLog("output", "Files are managed through the file explorer panel");
        addLog("output", "Use the Code tab to view and edit project files");
      } else if (cmd.startsWith("cd ")) {
        addLog(
          "output",
          "Directory navigation is handled through the file explorer"
        );
      } else if (cmd === "pwd") {
        addLog("output", "/home/user/app");
      } else if (cmd === "help") {
        addLog("output", "Available commands:");
        addLog("output", "");
        addLog("output", "📦 Package Management:");
        addLog("output", "  npm install <package>     - Install npm packages");
        addLog(
          "output",
          "  npm i <package>          - Install npm packages (short)"
        );
        addLog("output", "  yarn add <package>       - Install with Yarn");
        addLog("output", "  pnpm add <package>       - Install with PNPM");
        addLog(
          "output",
          "  detect-packages          - Scan for missing packages"
        );
        addLog("output", "");
        addLog("output", "🔧 System Commands:");
        addLog("output", "  clear                    - Clear terminal");
        addLog("output", "  refresh                  - Refresh logs");
        addLog("output", "  help                     - Show this help");
        addLog("output", "");
        addLog("output", "📊 Information:");
        addLog("output", "  - Sandbox status and system logs");
        addLog("output", "  - Project errors and warnings");
        addLog("output", "  - Development server status");
        addLog("output", "");
        addLog("output", "💡 Tips:");
        addLog("output", "  Use the chat panel to modify your project");
        addLog("output", "  Use the code editor to view and edit files");
      } else if (cmd === "refresh" || cmd === "reload") {
        addLog("output", "Refreshing logs...");
        await fetchLogs();
        addLog("output", "Logs refreshed ✓");
      } else {
        addLog("output", `Command '${cmd}' is not available in this terminal`);
        addLog("output", "This terminal shows sandbox logs and project status");
        addLog("output", "Use the chat panel to make changes to your project");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addLog("error", `Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Initialize terminal with connection message
  useEffect(() => {
    if (logs.length === 0) {
      addLog("output", "Connecting to sandbox logs...");
      addLog("output", "Type 'help' for available commands");
      if (isError) {
        addLog("error", "Failed to connect to sandbox");
      }
    }
  }, [isError, logs.length]);

  /**
   * Handle command input submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      executeCommand(command);
      setCommand("");
    }
  };

  /**
   * Handle key shortcuts and prevent space from activating hand tool
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent space key from bubbling up to activate hand tool
    if (e.key === " ") {
      e.stopPropagation();
    }

    if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLogs([]);
    }
  };

  /**
   * Format timestamp for display - now just returns ">"
   */
  const formatTime = (timestamp: Date) => {
    return ">";
  };

  return (
    <div className="h-full flex flex-col bg-bk-70 font-mono text-[11px]">
      {/* Terminal output area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-1">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2">
            <span className="text-fg-70 text-[11px] min-w-[20px]">
              {formatTime(log.timestamp)}
            </span>
            <span
              className={`flex-1 ${
                log.type === "input"
                  ? "text-fg-30 font-normal"
                  : log.type === "error"
                  ? "text-ac-01"
                  : "text-fg-50"
              }`}
            >
              {log.content}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2">
            <span className="text-fg-70 text-[11px] min-w-[20px]">
              {formatTime(new Date())}
            </span>
            <span className="text-fg-60 animate-pulse">Executing...</span>
          </div>
        )}
      </div>

      {/* Command input area */}
      <form onSubmit={handleSubmit} className="p-3">
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] ${
              isConnected ? "text-green-500" : "text-ac-01"
            }`}
          >
            {isConnected ? "●" : "○"}
          </span>
          <span className="text-fg-60">$</span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyPress={(e) => {
              // Also prevent space key from propagating during key press
              if (e.key === " ") {
                e.stopPropagation();
              }
            }}
            placeholder={
              isConnected
                ? "Enter command (try 'help')..."
                : "Connecting to sandbox..."
            }
            disabled={!isConnected || isLoading}
            className="flex-1 bg-transparent text-fg-30 placeholder-fg-70 outline-none font-mono"
          />
        </div>
      </form>
    </div>
  );
});
