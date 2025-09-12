'use client';

import { useState } from 'react';

interface CreateSandboxProps {
  onSandboxCreated: (data: any) => void;
  onMessage: (message: string, type: 'success' | 'error' | 'info') => void;
}

// Component for creating a new sandbox
export function CreateSandbox({ onSandboxCreated, onMessage }: CreateSandboxProps) {
  const [isCreating, setIsCreating] = useState(false);

  // Handle sandbox creation API call
  const handleCreate = async () => {
    setIsCreating(true);
    onMessage('Creating sandbox...', 'info');
    
    try {
      const response = await fetch('/api/v1/sandbox/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        onSandboxCreated(data);
        onMessage(`Sandbox created successfully! ID: ${data.sandboxId}`, 'success');
      } else {
        onMessage(`Failed to create sandbox: ${data.error}`, 'error');
      }
    } catch (error) {
      onMessage(`Error creating sandbox: ${(error as Error).message}`, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-3 border-b border-bd-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-fg-50 text-[11px] font-medium">Create Sandbox</span>
      </div>
      <button
        onClick={handleCreate}
        disabled={isCreating}
        className={`w-full px-3 py-2 text-[11px] font-medium rounded-md transition-colors ${
          isCreating
            ? 'bg-bk-40 text-fg-60 cursor-not-allowed'
            : 'bg-bk-40 text-fg-50 hover:bg-bk-30 hover:text-fg-100'
        }`}
      >
        {isCreating ? 'Creating...' : 'Create New Sandbox'}
      </button>
    </div>
  );
}