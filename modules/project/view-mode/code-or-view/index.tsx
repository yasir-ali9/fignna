"use client";

import { ViewModeTab } from "@/lib/stores/editor/state";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { observer } from "mobx-react-lite";
import { CodePanel } from "@/modules/project/code-mode";
// Import the reusable turning-on widget
import TurningOn, { LoadingStates } from "@/modules/project/widgets/turning-on";
// Mock project type for now
interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
  sandboxId?: string;
  previewUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CodeOrViewPanelProps {
  activeTab?: ViewModeTab;
  project: Project;
}

export const CodeOrViewPanel = observer(
  ({ activeTab = ViewModeTab.PREVIEW, project }: CodeOrViewPanelProps) => {
    const editorEngine = useEditorEngine();

    const renderTabContent = () => {
      switch (activeTab) {
        case ViewModeTab.PREVIEW:
          const previewUrl =
            editorEngine.sandbox.previewUrl || project.previewUrl || "";

          // Debug logging for iframe URL
          if (previewUrl) {
            console.log("[ViewMode] Loading preview URL:", previewUrl);
          }

          // Show TurningOn widget for syncing, restarting, or creating states
          if (editorEngine.projects.isSyncing || 
              editorEngine.sandbox.isRestarting || 
              editorEngine.sandbox.isCreating || 
              editorEngine.sandbox.currentSandbox?.status === "creating") {
            
            const loadingState = editorEngine.sandbox.isRestarting 
              ? LoadingStates.RESTARTING 
              : editorEngine.projects.isSyncing 
                ? LoadingStates.SYNCING
                : LoadingStates.SANDBOX_CREATION;
            
            return (
              <TurningOn 
                title={loadingState.title}
                subtitle={loadingState.subtitle}
              />
            );
          }

          // Show iframe if preview URL is available
          if (previewUrl) {
            return (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="Live Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                onLoad={() =>
                  console.log("[ViewMode] Iframe loaded successfully")
                }
                onError={(e) => console.error("[ViewMode] Iframe error:", e)}
              />
            );
          }

          // Show default message when no preview URL and not in any loading state
          return (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <div className="text-[11px] text-fg-60">
                  Start chatting to create your app and see the preview here
                </div>
              </div>
            </div>
          );
        case ViewModeTab.CODE:
          return <CodePanel projectId={project.id} />;
        default:
          return null;
      }
    };

    return (
      <div className="h-full flex flex-col bg-bk-60 border-r border-bd-50">
        <div className="flex-1 overflow-hidden">{renderTabContent()}</div>
      </div>
    );
  }
);
