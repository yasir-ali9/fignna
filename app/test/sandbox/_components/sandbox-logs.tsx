'use client';

import { useState, useEffect } from 'react';

interface SandboxLogsProps {
  onMessage: (message: string, type: 'success' | 'error' | 'info') => void;
  hasActiveSandbox: boolean;
}

interface LogData {
  hasErrors: boolean;
  logs: string[];
  status: string;
  processCount: number;
}

// Component for monitoring sandbox system logs
export function SandboxLogs({ onMessage, hasActiveSandbox }: SandboxLogsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [logData, setLogData] = useState<LogData | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch sandbox system logs
  const fetchLogs = async () => {
    if (!hasActiveSandbox) {
      onMessage('No active sandbox to monitor', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/v1/sandbox/logs/sandbox');
      const data = await response.json();
      
      if (data.success) {
        setLogData(data);
        onMessage(`System status: ${data.status} (${data.processCount} processes)`, 'info');
      } else {
        onMessage(`Failed to fetch logs: ${data.error}`, 'error');
        setLogData(null);
      }
    } catch (error) {
      onMessage(`Error fetching logs: ${(error as Error).message}`, 'error');
      setLogData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh && hasActiveSandbox) {
      interval = setInterval(fetchLogs, 3000); // Refresh every 3 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, hasActiveSandbox]);

  return (
    <div className="p-3 border-b border-bd-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-fg-50 text-[11px] font-medium">System Logs</span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-[10px] text-fg-60">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-3 h-3"
              disabled={!hasActiveSandbox}
            />
            Auto
          </label>
        </div>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={fetchLogs}
          disabled={isLoading || !hasActiveSandbox}
          className={`w-full px-3 py-2 text-[11px] font-medium rounded-md transition-colors ${
            isLoading || !hasActiveSandbox
              ? 'bg-bk-40 text-fg-60 cursor-not-allowed'
              : 'bg-bk-40 text-fg-50 hover:bg-bk-30 hover:text-fg-100'
          }`}
        >
          {isLoading ? 'Fetching...' : 'Fetch System Logs'}
        </button>
        
        {logData && (
          <div className="bg-bk-40 rounded-md p-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-medium ${
                logData.hasErrors ? 'text-red-400' : 'text-green-400'
              }`}>
                Status: {logData.status}
              </span>
              <span className="text-[10px] text-fg-60">
                {logData.processCount} processes
              </span>
            </div>
            
            <div className="max-h-32 overflow-y-auto space-y-1">
              {logData.logs && logData.logs.length > 0 ? (
                logData.logs.map((log, index) => (
                  <div key={index} className="text-[10px] text-fg-60 font-mono">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-fg-60 font-mono">
                  No logs available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}