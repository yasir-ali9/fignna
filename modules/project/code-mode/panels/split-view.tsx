"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { CodePanel } from "./code-panel";

interface SplitViewProps {
  projectId: string;
  previewUrl?: string | null;
  className?: string;
}

/**
 * SplitView - Code editor with live preview
 * Shows code editor on left and preview iframe on right
 */
export const SplitView = observer(
  ({ projectId, previewUrl, className = "" }: SplitViewProps) => {
    const engine = useEditorEngine();
    const [leftWidth, setLeftWidth] = useState(50); // Percentage
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
    }, []);

    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!isResizing || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;

        // Constrain between 20% and 80%
        const constrainedWidth = Math.max(20, Math.min(80, newLeftWidth));
        setLeftWidth(constrainedWidth);
      },
      [isResizing]
    );

    const handleMouseUp = useCallback(() => {
      setIsResizing(false);
    }, []);

    useEffect(() => {
      if (isResizing) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "e-resize";
        document.body.style.userSelect = "none";
      }

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    return (
      <div ref={containerRef} className={`h-full flex bg-bk-40 ${className}`}>
        {/* Code Editor */}
        <div
          className="relative bg-bk-50 overflow-hidden"
          style={{ width: `${leftWidth}%` }}
        >
          <CodePanel projectId={projectId} />
        </div>

        {/* Resize Handle */}
        <div
          className={`w-1 cursor-e-resize hover:bg-ac-01 transition-colors flex-shrink-0 ${
            isResizing ? "bg-ac-01" : "bg-transparent"
          }`}
          onMouseDown={handleMouseDown}
        />

        {/* Preview */}
        <div
          className="bg-bk-40 overflow-hidden"
          style={{ width: `${100 - leftWidth}%` }}
        >
          {engine.sandbox.previewUrl || previewUrl ? (
            <div className="h-full relative">
              <iframe
                src={engine.sandbox.previewUrl || previewUrl || ""}
                className="w-full h-full border-0"
                title="Live Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />

              {/* Loading Overlay */}
              <div className="absolute inset-0 bg-bk-40 flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-300">
                <div className="text-fg-60">Loading preview...</div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <div className="text-[11px] text-fg-60">
                  {engine.sandbox.isCreating
                    ? "Setting up sandbox..."
                    : "Preview will appear here once the development server starts"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);
