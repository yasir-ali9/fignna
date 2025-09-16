"use client";

import { ViewModeTab } from "@/lib/stores/editor/state";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { observer } from "mobx-react-lite";
import { CodePanel } from "@/modules/project/code-mode";
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

          // Show loading if syncing or restarting is in progress, even if we have a URL
          return editorEngine.projects.isSyncing ||
            editorEngine.sandbox.isRestarting ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-fg-50 mx-auto mb-3"></div>
                <div className="text-[11px] text-fg-60">
                  {editorEngine.sandbox.isRestarting
                    ? "Restarting Vite server..."
                    : "Syncing project to sandbox..."}
                </div>
              </div>
            </div>
          ) : previewUrl ? (
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
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                {editorEngine.sandbox.isCreating ? (
                  <div>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-fg-50 mx-auto mb-3"></div>
                    <div className="text-[11px] text-fg-60">
                      Setting up sandbox environment...
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-fg-60">
                    Start chatting to create your app and see the preview here
                  </div>
                )}
              </div>
            </div>
          );
        case ViewModeTab.CODE:
          return <CodePanel projectId={project.id} className="h-full" />;
        default:
          return null;
      }
    };

    return (
      <div className="h-full flex flex-col bg-bk-60 border-r border-bd-50">
        {/* Tab Content - Tabs are now in TopRibbon */}
        <div className="flex-1 overflow-hidden">{renderTabContent()}</div>
      </div>
    );
  }
);
