'use client';

interface SandboxStatusProps {
  sandboxData: any;
  hasActiveSandbox: boolean;
}

// Component for displaying current sandbox status and information
export function SandboxStatus({ sandboxData, hasActiveSandbox }: SandboxStatusProps) {
  return (
    <div className="p-3 border-b border-bd-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-fg-50 text-[11px] font-medium">Sandbox Status</span>
        <div className={`w-2 h-2 rounded-full ${
          hasActiveSandbox ? 'bg-green-400' : 'bg-red-400'
        }`} />
      </div>
      
      {hasActiveSandbox && sandboxData ? (
        <div className="bg-bk-40 rounded-md p-2 space-y-2">
          {/* Sandbox ID */}
          <div className="space-y-1">
            <div className="text-[10px] text-fg-60 font-medium">Sandbox ID</div>
            <div className="text-[10px] text-fg-50 font-mono bg-bk-50 rounded px-2 py-1">
              {sandboxData.sandboxId}
            </div>
          </div>
          
          {/* URL */}
          {sandboxData.url && (
            <div className="space-y-1">
              <div className="text-[10px] text-fg-60 font-medium">Preview URL</div>
              <div className="text-[10px] text-fg-50 font-mono bg-bk-50 rounded px-2 py-1">
                <a 
                  href={sandboxData.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {sandboxData.url}
                </a>
              </div>
            </div>
          )}
          
          {/* Message */}
          {sandboxData.message && (
            <div className="space-y-1">
              <div className="text-[10px] text-fg-60 font-medium">Status</div>
              <div className="text-[10px] text-fg-50 bg-bk-50 rounded px-2 py-1 whitespace-pre-wrap">
                {sandboxData.message}
              </div>
            </div>
          )}
          
          {/* Quick Actions */}
          <div className="pt-1 border-t border-bd-50">
            <div className="text-[10px] text-fg-60 font-medium mb-1">Quick Actions</div>
            <div className="flex gap-1">
              {sandboxData.url && (
                <a
                  href={sandboxData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 text-[9px] bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                >
                  Open Preview
                </a>
              )}
              <button
                onClick={() => navigator.clipboard.writeText(sandboxData.sandboxId)}
                className="px-2 py-1 text-[9px] bg-bk-50 text-fg-60 rounded hover:bg-bk-30 hover:text-fg-50 transition-colors"
              >
                Copy ID
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-bk-40 rounded-md p-2">
          <div className="text-[10px] text-fg-60 text-center">
            No active sandbox
          </div>
        </div>
      )}
    </div>
  );
}