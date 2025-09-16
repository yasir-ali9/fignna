'use client';

import { Loader2 } from 'lucide-react';

// Simple loading component with Loader2 spinner
export function SandboxLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-bk-50 p-6">
      {/* Loading spinner */}
      <Loader2 className="w-8 h-8 text-fg-50 animate-spin" />
      
      {/* Loading text */}
      <div className="mt-4 text-sm text-fg-50">
        Showing Preview...
      </div>
    </div>
  );
}
