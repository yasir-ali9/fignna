"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { FileTree } from "../file-explorer/file-tree";
import { TabBar } from "../editor-tabs/tab-bar";
import { CodeMirrorEditor } from "../editor-core/codemirror-editor";
import { ResizablePanel } from "@/components/resizable";
import { Terminal } from "@/modules/project/common/terminal/terminal";

/**
 * Terminal icon component
 */
const TerminalIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 256 256"
    fill="currentColor"
  >
    <g>
      <path d="M216 80v112H40V64h160a16 16 0 0 1 16 16" opacity=".2" />
      <path d="m117.31 134l-72 64a8 8 0 1 1-10.63-12L100 128L34.69 70a8 8 0 1 1 10.63-12l72 64a8 8 0 0 1 0 12ZM216 184h-96a8 8 0 0 0 0 16h96a8 8 0 0 0 0-16" />
    </g>
  </svg>
);

/**
 * Chevron up icon for close button
 */
const ChevronUpIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 256 256"
    fill="currentColor"
  >
    <path d="M213.66 165.66a8 8 0 0 1-11.32 0L128 91.31 53.66 165.66a8 8 0 0 1-11.32-11.32l80-80a8 8 0 0 1 11.32 0l80 80a8 8 0 0 1 0 11.32Z" />
  </svg>
);

interface CodePanelProps {
  projectId: string;
  className?: string;
}

/**
 * CodePanel - Complete code editor experience
 * Combines file explorer, tabs, and editor with database integration
 */
export const CodePanel = observer(
  ({ projectId, className = "" }: CodePanelProps) => {
    const engine = useEditorEngine();
    const [isTerminalOpen, setIsTerminalOpen] = React.useState(false);

    // Initialize files manager with project ID only
    useEffect(() => {
      engine.files.initialize(projectId);
    }, [projectId, engine.files]);

    return (
      <div className={`h-full flex bg-bk-40 ${className}`}>
        {/* File Explorer */}
        <ResizablePanel
          defaultWidth={280}
          minWidth={200}
          maxWidth={400}
          position="left"
          className="border-r border-bd-50"
        >
          <div className="h-full bg-bk-50 flex flex-col">
            <div className="flex-1">
              <FileTree
                projectId={projectId}
                onTerminalToggle={() => setIsTerminalOpen(!isTerminalOpen)}
                showTerminalButton={true}
              />
            </div>
          </div>
        </ResizablePanel>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab Bar */}
          <TabBar />

          {/* Editor Container */}
          <div className="flex-1 relative">
            <CodeMirrorEditor />

            {/* Terminal Panel - Absolute positioned */}
            {isTerminalOpen && (
              <div className="absolute bottom-0 left-0 right-0 h-64 bg-bk-70 border-t border-bd-50 z-10">
                {/* Terminal Header - matching edit mode design */}
                <div className="flex items-center justify-between h-8 px-3 bg-bk-60">
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-2 py-1 text-xs bg-bk-70 text-fg-30 rounded">
                      <TerminalIcon size={14} />
                      Terminal
                    </button>
                  </div>
                  <button
                    onClick={() => setIsTerminalOpen(false)}
                    className="p-1 text-fg-60 hover:text-fg-40 transition-colors"
                    title="Close Terminal"
                  >
                    <ChevronUpIcon />
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
      </div>
    );
  }
);
