"use client";

import { observer } from "mobx-react-lite";
import { ChatPanel } from "../common/chat-panel";
import { CodeOrViewPanel } from "./code-or-view";
import { ResizablePanel } from "@/components/resizable";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { ViewMode } from "@/lib/stores/editor/state";
import { CodePanel, SplitView } from "@/modules/project/code-mode";
// Import the reusable turning-on widget
import TurningOn, { LoadingStates } from "@/modules/project/widgets/turning-on";

// Project type matching the V1 API
interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
  files: Record<string, string>;
  dependencies: Record<string, string>;
  sandboxId?: string;
  previewUrl?: string;
  version: number;
  lastSavedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ViewModeProps {
  project: Project;
}

export const ViewModeComponent = observer(({ project }: ViewModeProps) => {
  const engine = useEditorEngine();
  const { viewMode, viewModeTab } = engine.state;

  // Render different layouts based on view mode
  switch (viewMode) {
    case ViewMode.ONLY_CODE:
      return (
        <div className="flex-1 relative overflow-hidden min-h-0 min-w-0 bg-bk-60">
          <CodePanel projectId={project.id} />
        </div>
      );

    case ViewMode.ONLY_PREVIEW:
      return (
        <div className="flex-1 relative overflow-hidden min-h-0 min-w-0 bg-bk-60">
          {/* Show TurningOn widget for syncing, restarting, or creating states */}
          {(engine.projects.isSyncing || 
            engine.sandbox.isRestarting || 
            engine.sandbox.isCreating || 
            engine.sandbox.currentSandbox?.status === "creating") ? (
            
            <TurningOn 
              title={
                engine.sandbox.isRestarting 
                  ? LoadingStates.RESTARTING.title
                  : engine.projects.isSyncing 
                    ? LoadingStates.SYNCING.title
                    : LoadingStates.SANDBOX_CREATION.title
              }
              subtitle={
                engine.sandbox.isRestarting 
                  ? LoadingStates.RESTARTING.subtitle
                  : engine.projects.isSyncing 
                    ? LoadingStates.SYNCING.subtitle
                    : LoadingStates.SANDBOX_CREATION.subtitle
              }
            />
          ) : (engine.sandbox.previewUrl || project.previewUrl) ? (
            <iframe
              src={engine.sandbox.previewUrl || project.previewUrl || ""}
              className="w-full h-full border-0"
              title="Live Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <div className="text-[11px] text-fg-60">
                  Start chatting to create your app and see the preview here
                </div>
              </div>
            </div>
          )}
        </div>
      );

    case ViewMode.CODE_PREVIEW:
      return (
        <div className="flex-1 relative overflow-hidden min-h-0 min-w-0 bg-bk-60">
          <SplitView
            projectId={project.id}
            previewUrl={project.previewUrl}
            className="h-full"
          />
        </div>
      );

    case ViewMode.DEFAULT:
    default:
      return (
        <div className="flex-1 flex relative overflow-hidden min-h-0 min-w-0">
          {/* Left Panel - Code/Preview */}
          <div className="flex-1 relative h-full min-h-0 min-w-0 overflow-hidden">
            <CodeOrViewPanel activeTab={viewModeTab} project={project} />
          </div>

          {/* Right Panel - Chat */}
          <ResizablePanel
            defaultWidth={350}
            minWidth={280}
            maxWidth={500}
            position="right"
            className="z-10"
          >
            <ChatPanel placeholder="Ask AI to build or modify your app..." />
          </ResizablePanel>
        </div>
      );
  }
});
