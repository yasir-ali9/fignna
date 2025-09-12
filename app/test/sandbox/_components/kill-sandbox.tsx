'use client';

import { useState } from 'react';

interface KillSandboxProps {
  onSandboxKilled: () => void;
  onMessage: (message: string, type: 'success' | 'error' | 'info') => void;
  hasActiveSandbox: boolean;
}

// Component for destroying the active sandbox
export function KillSandbox({ onSandboxKilled, onMessage, hasActiveSandbox }: KillSandboxProps) {
  const [isKilling, setIsKilling] = useState(false);

  // Handle sandbox destruction API call
  const handleKill = async () => {
    setIsKilling(true);
    onMessage('Destroying sandbox...', 'info');
    
    try {
      const response = await fetch('/api/v1/sandbox/kill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        onSandboxKilled();
        onMessage('Sandbox destroyed successfully!', 'success');
      } else {
        onMessage(`Failed to destroy sandbox: ${data.error}`, 'error');
      }
    } catch (error) {
      onMessage(`Error destroying sandbox: ${(error as Error).message}`, 'error');
    } finally {
      setIsKilling(false);
    }
  };

  return (
    <div className="p-3 border-b border-bd-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-fg-50 text-[11px] font-medium">Kill Sandbox</span>
      </div>
      <button
        onClick={handleKill}
        disabled={isKilling || !hasActiveSandbox}
        className={`w-full px-3 py-2 text-[11px] font-medium rounded-md transition-colors ${
          isKilling || !hasActiveSandbox
            ? 'bg-bk-40 text-fg-60 cursor-not-allowed'
            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border border-red-500/30'
        }`}
      >
        {isKilling ? 'Destroying...' : hasActiveSandbox ? 'Destroy Sandbox' : 'No Active Sandbox'}
      </button>
    </div>
  );
}