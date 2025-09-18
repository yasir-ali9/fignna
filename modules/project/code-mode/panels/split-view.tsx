"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { TabBar } from "../editor-tabs/tab-bar";
import { CodeMirrorEditor } from "../editor-core/codemirror-editor";
import { Terminal } from "@/modules/project/common/terminal/terminal";
import { TerminalIcon, ChevronDown } from "lucide-react";
import TurningOn, { LoadingStates } from "@/modules/project/widgets/turning-on";

interface SplitViewProps {
  projectId: string;
  previewUrl?: string | null;
  className?: string;
  // Terminal props
  isTerminalOpen?: boolean;
  onTerminalClose?: () => void;
}

/**
 * SplitView - Code editor with live preview using percentage-based resizing
 * Shows code editor on left and preview iframe on right
 * Terminal appears only on the editor side when enabled
 */
export const SplitView = observer(
  ({ projectId, previewUrl, className, isTerminalOpen, onTerminalClose }: SplitViewProps) => {
    const engine = useEditorEngine();
    // Percentage-based width for responsive resizing
    const [leftWidthPercent, setLeftWidthPercent] = useState(50); // 50% initial split
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle mouse down on resize handle - inspired by ResizablePanel
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
    }, []);

    // Handle mouse move during resize - adapted for percentage-based resizing
    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!isResizing || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const newLeftPercent = (mouseX / containerRect.width) * 100;

        // Constrain between 20% and 80% for usability
        const constrainedPercent = Math.max(20, Math.min(80, newLeftPercent));
        setLeftWidthPercent(constrainedPercent);
      },
      [isResizing]
    );

    // Handle mouse up to stop resizing - same as ResizablePanel
    const handleMouseUp = useCallback(() => {
      setIsResizing(false);
    }, []);

    // Add/remove event listeners for resizing - same pattern as ResizablePanel
    useEffect(() => {
      if (isResizing) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "col-resize";
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
      <div ref={containerRef} className={`h-full flex bg-bk-60 ${className}`}>
        {/* Code Editor - Only the editor part, no file explorer */}
        <div
          className="relative bg-bk-50 overflow-hidden flex flex-col"
          style={{ width: `${leftWidthPercent}%` }}
        >
          {/* Tab Bar */}
          <TabBar />

          {/* Editor */}
          <div className="flex-1 relative">
            <CodeMirrorEditor />

            {/* Terminal Panel - Only on editor side */}
            {isTerminalOpen && (
              <div className="absolute bottom-0 left-0 right-0 h-64 bg-bk-70 border-t border-bd-50 z-10">
                {/* Terminal Header */}
                <div className="flex items-center justify-between h-8 px-3 bg-bk-60">
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-2 py-1 text-xs bg-bk-70 text-fg-30 rounded">
                      <TerminalIcon size={14} />
                      Terminal
                    </button>
                  </div>
                  <button
                    onClick={onTerminalClose}
                    className="p-1 text-fg-60 hover:text-fg-40 transition-colors"
                    title="Close Terminal"
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>

                {/* Terminal Content */}
                <div className="h-full pb-8">
                  <Terminal />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resize Handle - Styled like ResizablePanel */}
        <div
          className={`w-1 cursor-col-resize hover:bg-ac-01 transition-colors flex-shrink-0 ${isResizing ? "bg-ac-01" : "bg-transparent"
            }`}
          onMouseDown={handleMouseDown}
        />

        {/* Preview */}
        <div
          className="bg-bk-40 overflow-hidden"
          style={{ width: `${100 - leftWidthPercent}%` }}
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
                {engine.sandbox.isCreating ? (
                  <TurningOn
                    title={LoadingStates.SANDBOX_CREATION.title}
                    subtitle={LoadingStates.SANDBOX_CREATION.subtitle}
                  />
                ) : (
                  <div className="text-[11px] text-fg-60">
                    Preview will appear here once the development server starts
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);
