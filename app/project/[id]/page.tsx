"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EditMode } from "@/modules/project/project/edit-mode";
import { ViewModeComponent } from "@/modules/project/project/view-mode";
import { CodeMode } from "@/modules/project/project/code-mode";
import { TopRibbon } from "@/modules/project/project/common/top-ribbon";
import { EditorProvider } from "@/modules/project/providers/editor-provider";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { observer } from "mobx-react-lite";

// Project interface matching our V1 API
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

function ProjectPageInner() {
  const params = useParams();
  const engine = useEditorEngine();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = params.id as string;

  // Load project data and initialize editor
  useEffect(() => {
    const initializeProject = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check for initial prompt from sessionStorage
        const initialPrompt = sessionStorage.getItem("initialPrompt");
        if (initialPrompt) {
          // Store in MobX state for chat panel to pick up
          engine.state.setInitialPrompt(initialPrompt);
          // Clear from sessionStorage to prevent re-use
          sessionStorage.removeItem("initialPrompt");
          console.log(
            "Initial prompt loaded from sessionStorage:",
            initialPrompt
          );
        }

        // Load project from database
        await engine.projects.loadProject(projectId);

        if (engine.projects.currentProject) {
          setProject(engine.projects.currentProject);
        } else {
          throw new Error("Project not found");
        }
      } catch (error) {
        console.error("Failed to load project:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load project"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      initializeProject();
    }
  }, [projectId, engine.projects, engine.state]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-bk-40">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fg-50 mx-auto mb-4"></div>
          <div className="text-fg-50">Loading project...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !project) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-bk-40">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-fg-30 mb-4">
            {error || "Project not found"}
          </h1>
          <a
            href="/"
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:from-purple-600 hover:to-pink-600 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full max-w-full flex flex-col bg-bk-40 overflow-hidden">
      {/* Top ribbon with logo dropdown and mode switcher */}
      <TopRibbon project={project} />

      {/* Main Content Area */}
      {engine.state.isEditMode ? (
        <EditMode project={project} />
      ) : engine.state.isCodeMode ? (
        <CodeMode project={project} />
      ) : (
        <ViewModeComponent project={project} />
      )}
    </div>
  );
}

const ObservedProjectPageInner = observer(ProjectPageInner);

export default function ProjectPage() {
  return (
    <EditorProvider>
      <ObservedProjectPageInner />
    </EditorProvider>
  );
}
