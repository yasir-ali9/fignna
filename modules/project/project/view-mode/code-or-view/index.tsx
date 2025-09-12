"use client";

import { ViewModeTab } from "@/lib/stores/editor/state";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { observer } from "mobx-react-lite";
import { CodePanel } from "@/modules/project/project/code-mode";
// Mock project type for now
interface Project {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  sandboxId: string | null;
  previewUrl: string | null;
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
          return editorEngine.sandbox.previewUrl || project.previewUrl ? (
            <iframe
              src={editorEngine.sandbox.previewUrl || project.previewUrl || ""}
              className="w-full h-full border-0"
              title="Live Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <div className="text-[11px] text-fg-60">
                  {editorEngine.sandbox.isCreating
                    ? "Setting up sandbox..."
                    : "Start chatting to create your app and see the preview here"}
                </div>
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
