"use client";

import { useState, useEffect } from "react";

interface ApiStatusCheckerProps {
  onMessage: (text: string, type: "success" | "error" | "info") => void;
}

interface StatusResponse {
  success: boolean;
  status: "active" | "no_sandbox" | "unhealthy";
  sandbox?: {
    id: string;
    host: string;
    url: string;
    status: string;
    createdAt: string;
    filesTracked: string[];
    lastHealthCheck: string;
  };
  message: string;
  version: string;
  error?: string;
}

// Component for testing the V1 status API endpoint
export function ApiStatusChecker({ onMessage }: ApiStatusCheckerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Check sandbox status via API
  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/v1/sandbox/status");
      const data: StatusResponse = await response.json();

      setStatusData(data);

      if (data.success) {
        onMessage(`Status: ${data.status} - ${data.message}`, "success");
      } else {
        onMessage(`Status check failed: ${data.error}`, "error");
      }
    } catch (error) {
      onMessage(`Status API error: ${error}`, "error");
      setStatusData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(checkStatus, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className="p-3 border-b border-bd-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-fg-50 text-[11px] font-medium">
          API Status Check
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`w-2 h-2 rounded-full ${
              autoRefresh ? "bg-green-400" : "bg-gray-400"
            }`}
            title={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          />
        </div>
      </div>

      {/* Manual Check Button */}
      <button
        onClick={checkStatus}
        disabled={isLoading}
        className="w-full mb-2 px-3 py-2 text-[11px] bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading
          ? "Checking..."
          : "Check Status (GET /api/v1/sandbox/status)"}
      </button>

      {/* Auto-refresh Toggle */}
      <label className="flex items-center gap-2 mb-2 cursor-pointer">
        <input
          type="checkbox"
          checked={autoRefresh}
          onChange={(e) => setAutoRefresh(e.target.checked)}
          className="w-3 h-3"
        />
        <span className="text-[10px] text-fg-60">Auto-refresh (3s)</span>
      </label>

      {/* Status Display */}
      {statusData && (
        <div className="bg-bk-40 rounded-md p-2 space-y-2">
          {/* API Response Status */}
          <div className="space-y-1">
            <div className="text-[10px] text-fg-60 font-medium">
              API Response
            </div>
            <div
              className={`text-[10px] font-mono rounded px-2 py-1 ${
                statusData.success
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {statusData.success ? "✓ Success" : "✗ Failed"}
            </div>
          </div>

          {/* Sandbox Status */}
          <div className="space-y-1">
            <div className="text-[10px] text-fg-60 font-medium">
              Sandbox Status
            </div>
            <div
              className={`text-[10px] font-mono rounded px-2 py-1 ${
                statusData.status === "active"
                  ? "bg-green-500/20 text-green-400"
                  : statusData.status === "unhealthy"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {statusData.status}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-1">
            <div className="text-[10px] text-fg-60 font-medium">Message</div>
            <div className="text-[10px] text-fg-50 bg-bk-50 rounded px-2 py-1">
              {statusData.message}
            </div>
          </div>

          {/* Sandbox Details (if active) */}
          {statusData.sandbox && (
            <>
              <div className="space-y-1">
                <div className="text-[10px] text-fg-60 font-medium">
                  Sandbox ID
                </div>
                <div className="text-[10px] text-fg-50 font-mono bg-bk-50 rounded px-2 py-1">
                  {statusData.sandbox.id}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-fg-60 font-medium">URL</div>
                <div className="text-[10px] text-fg-50 font-mono bg-bk-50 rounded px-2 py-1">
                  <a
                    href={statusData.sandbox.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {statusData.sandbox.url}
                  </a>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-fg-60 font-medium">
                  Files Tracked
                </div>
                <div className="text-[10px] text-fg-50 bg-bk-50 rounded px-2 py-1">
                  {statusData.sandbox.filesTracked.length} files
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-fg-60 font-medium">
                  Last Health Check
                </div>
                <div className="text-[10px] text-fg-50 font-mono bg-bk-50 rounded px-2 py-1">
                  {new Date(
                    statusData.sandbox.lastHealthCheck
                  ).toLocaleTimeString()}
                </div>
              </div>
            </>
          )}

          {/* API Version */}
          <div className="space-y-1">
            <div className="text-[10px] text-fg-60 font-medium">
              API Version
            </div>
            <div className="text-[10px] text-fg-50 font-mono bg-bk-50 rounded px-2 py-1">
              {statusData.version}
            </div>
          </div>

          {/* Error Details (if any) */}
          {statusData.error && (
            <div className="space-y-1">
              <div className="text-[10px] text-fg-60 font-medium">Error</div>
              <div className="text-[10px] text-red-400 bg-red-500/20 rounded px-2 py-1">
                {statusData.error}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
