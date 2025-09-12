"use client";

import { useState, useRef, useEffect } from "react";

interface SandboxData {
  sandboxId: string;
  url: string;
  status: string;
}

interface PreviewPanelProps {
  sandboxData: SandboxData | null;
}

export function PreviewPanel({ sandboxData }: PreviewPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (sandboxData?.url) {
      setIsLoading(true);
      setError(null);
    }
  }, [sandboxData?.url]);

  // Listen for refresh events from code application
  useEffect(() => {
    const handleRefresh = () => {
      refreshPreview();
    };

    window.addEventListener("refreshPreview", handleRefresh);
    return () => window.removeEventListener("refreshPreview", handleRefresh);
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError("Failed to load preview");
  };

  const refreshPreview = () => {
    if (iframeRef.current && sandboxData?.url) {
      setIsLoading(true);
      setError(null);
      // Add cache-busting parameter to force refresh
      const refreshUrl = `${sandboxData.url}?t=${Date.now()}`;
      iframeRef.current.src = refreshUrl;
    }
  };

  if (!sandboxData) {
    return (
      <div className="h-full bg-bk-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-bk-40 rounded-lg flex items-center justify-center mb-4">
            <span className="text-fg-60 text-2xl">🚀</span>
          </div>
          <h3 className="text-fg-50 text-[12px] font-medium mb-2">
            No Sandbox
          </h3>
          <p className="text-fg-60 text-[10px] max-w-xs">
            Create a sandbox to see your app preview here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-bk-50 flex flex-col">
      {/* Preview Content */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-bk-50 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <p className="text-fg-60 text-[11px]">Loading preview...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-bk-50 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-3">
                <span className="text-red-400 text-xl">⚠️</span>
              </div>
              <h3 className="text-fg-50 text-[12px] font-medium mb-2">
                Preview Error
              </h3>
              <p className="text-fg-60 text-[10px] mb-3">{error}</p>
              <button
                onClick={refreshPreview}
                className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded text-[10px] hover:bg-blue-500/30 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={sandboxData.url}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="App Preview"
        />
      </div>

      {/* Preview Footer */}
      <div className="bg-bk-40 border-t border-bd-50 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="text-fg-60 text-[9px] font-mono">
            {sandboxData.url}
          </div>
          <div className="text-fg-60 text-[9px]">
            Sandbox: {sandboxData.sandboxId.substring(0, 8)}...
          </div>
        </div>
      </div>
    </div>
  );
}
