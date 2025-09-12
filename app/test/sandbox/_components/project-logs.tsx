'use client';

import { useState, useEffect } from 'react';

interface ProjectLogsProps {
  onMessage: (message: string, type: 'success' | 'error' | 'info') => void;
  hasActiveSandbox: boolean;
}

interface ErrorItem {
  type: string;
  message: string;
  file: string;
  package?: string;
}

interface ProjectLogData {
  hasErrors: boolean;
  hasWarnings: boolean;
  errors: ErrorItem[];
  warnings: ErrorItem[];
  errorCount: number;
  warningCount: number;
}

// Component for monitoring Next.js project build logs and errors
export function ProjectLogs({ onMessage, hasActiveSandbox }: ProjectLogsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [logData, setLogData] = useState<ProjectLogData | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch project build logs and errors
  const fetchLogs = async () => {
    if (!hasActiveSandbox) {
      onMessage('No active sandbox to monitor', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/v1/sandbox/logs/project');
      const data = await response.json();
      
      if (data.success) {
        setLogData(data);
        const status = data.hasErrors ? 'errors detected' : data.hasWarnings ? 'warnings found' : 'clean';
        onMessage(`Project status: ${status} (${data.errorCount} errors, ${data.warningCount} warnings)`, 
                 data.hasErrors ? 'error' : data.hasWarnings ? 'info' : 'success');
      } else {
        onMessage(`Failed to fetch project logs: ${data.error}`, 'error');
        setLogData(null);
      }
    } catch (error) {
      onMessage(`Error fetching project logs: ${(error as Error).message}`, 'error');
      setLogData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh && hasActiveSandbox) {
      interval = setInterval(fetchLogs, 5000); // Refresh every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, hasActiveSandbox]);

  // Get icon for error type
  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'npm-missing': return '📦';
      case 'typescript': return '🔷';
      case 'build': return '🔨';
      case 'warning': return '⚠️';
      default: return '❌';
    }
  };

  return (
    <div className="p-3 border-b border-bd-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-fg-50 text-[11px] font-medium">Project Logs</span>
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
          {isLoading ? 'Scanning...' : 'Scan Project Logs'}
        </button>
        
        {logData && (
          <div className="bg-bk-40 rounded-md p-2 space-y-2">
            {/* Status Summary */}
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-medium ${
                logData.hasErrors ? 'text-red-400' : 
                logData.hasWarnings ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {logData.hasErrors ? 'Has Errors' : 
                 logData.hasWarnings ? 'Has Warnings' : 'Clean'}
              </span>
              <span className="text-[10px] text-fg-60">
                {logData.errorCount}E {logData.warningCount}W
              </span>
            </div>
            
            {/* Errors */}
            {logData.errors.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-medium text-red-400">Errors:</div>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {logData.errors.map((error, index) => (
                    <div key={index} className="bg-bk-50 rounded p-1 space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px]">{getErrorIcon(error.type)}</span>
                        <span className="text-[9px] text-red-400 font-medium">{error.type}</span>
                        {error.package && (
                          <span className="text-[9px] text-fg-60">({error.package})</span>
                        )}
                      </div>
                      <div className="text-[9px] text-fg-60 font-mono leading-tight">
                        {error.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Warnings */}
            {logData.warnings.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-medium text-yellow-400">Warnings:</div>
                <div className="max-h-20 overflow-y-auto space-y-1">
                  {logData.warnings.map((warning, index) => (
                    <div key={index} className="bg-bk-50 rounded p-1 space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px]">{getErrorIcon(warning.type)}</span>
                        <span className="text-[9px] text-yellow-400 font-medium">{warning.type}</span>
                      </div>
                      <div className="text-[9px] text-fg-60 font-mono leading-tight">
                        {warning.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}