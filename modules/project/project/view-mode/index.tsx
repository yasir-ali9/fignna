"use client";

import { observer } from "mobx-react-lite";
import { ChatPanel } from "../common/chat-panel";
import { CodeOrViewPanel } from "./code-or-view";
import { ResizablePanel } from "../../widgets/resizable-panel";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { ViewMode } from "@/lib/stores/editor/state";
import { CodePanel, SplitView } from "@/modules/project/project/code-mode";
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
          <CodePanel projectId={project.id} className="h-full" />
        </div>
      );

    case ViewMode.ONLY_PREVIEW:
      return (
        <div className="flex-1 relative overflow-hidden min-h-0 min-w-0 bg-bk-60">
          {engine.sandbox.previewUrl || project.previewUrl ? (
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
                  {engine.sandbox.isCreating
                    ? "Setting up sandbox..."
                    : "Start chatting to create your app and see the preview here"}
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
