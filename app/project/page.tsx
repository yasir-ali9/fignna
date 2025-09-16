"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EditMode } from "@/modules/project/edit-mode";
import { ViewModeComponent } from "@/modules/project/view-mode";
import { TopRibbon } from "@/modules/project/common/top-ribbon";
import { EditorProvider } from "@/lib/providers/editor-provider";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { observer } from "mobx-react-lite";

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
  files: Record<string, string>;
  dependencies: Record<string, string>;
  version: number;
  lastSavedAt: Date;
}

function ProjectPageInner() {
  const engine = useEditorEngine();
  const [error] = useState<string | null>(null);

  // Mock project data for testing
  const project: Project = {
    id: "test-project",
    name: "Test Project",
    description: "A test project for development",
    userId: "test-user",
    sandboxId: undefined,
    previewUrl: undefined,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    files: {},
    dependencies: {},
    version: 1,
    lastSavedAt: new Date(),
  };

  // Initialize sandbox when component mounts
  useEffect(() => {
    // For now, we'll skip sandbox initialization
    // This can be added back when we integrate with actual sandbox providers
    console.log("Project page loaded, sandbox initialization skipped for now");
  }, []);

  // Show error state if any
  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-bk-40">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-fg-30 mb-4">{error}</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-ac-01 text-fg-30 rounded-md hover:bg-ac-01/90 transition-colors cursor-pointer"
          >
            Go Home
          </Link>
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
