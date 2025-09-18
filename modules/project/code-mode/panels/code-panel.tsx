"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { FileTree } from "../file-explorer/file-tree";
import { TabBar } from "../editor-tabs/tab-bar";
import { CodeMirrorEditor } from "../editor-core/codemirror-editor";
import { ResizablePanel } from "@/components/resizable";
import { Terminal } from "@/modules/project/common/terminal/terminal";
import { SplitView } from "./split-view";
import { TerminalIcon, ChevronDown } from "lucide-react";

interface CodePanelProps {
  projectId: string;
}

/**
 * Main code panel component that handles both normal and split view modes
 */
export const CodePanel = observer(({ projectId }: CodePanelProps) => {
    const engine = useEditorEngine();
    const [isTerminalOpen, setIsTerminalOpen] = React.useState(false);
    const [isSplitViewOpen, setIsSplitViewOpen] = React.useState(false);

    // Initialize files manager with project ID only
    useEffect(() => {
      engine.files.initialize(projectId);
    }, [projectId, engine.files]);

    return (
      <div className={`h-full flex bg-bk-60 `}>
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
                isTerminalActive={isTerminalOpen}
                onSplitViewToggle={() => setIsSplitViewOpen(!isSplitViewOpen)}
                showSplitViewButton={true}
                isSplitViewActive={isSplitViewOpen}
              />
            </div>
          </div>
        </ResizablePanel>

        {/* Editor Area */}
        {isSplitViewOpen ? (
          <div className="flex-1 min-w-0">
            <SplitView 
              projectId={projectId} 
              isTerminalOpen={isTerminalOpen}
              onTerminalClose={() => setIsTerminalOpen(false)}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0 relative">
            {/* Tab Bar */}
            <TabBar />

            {/* Editor Container */}
            <div className="flex-1 relative">
              <CodeMirrorEditor />
            </div>

            {/* Terminal Panel - Available in normal view */}
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
        )}
      </div>
    );
  }
);
