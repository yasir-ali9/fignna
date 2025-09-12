"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EditMode } from "@/modules/project/project/edit-mode";
import { ViewModeComponent } from "@/modules/project/project/view-mode";
import { TopRibbon } from "@/modules/project/project/common/top-ribbon";
import { EditorProvider } from "@/modules/project/providers/editor-provider";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { observer } from "mobx-react-lite";

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

function ProjectPageInner() {
  const engine = useEditorEngine();
  const [error] = useState<string | null>(null);

  // Mock project data for testing
  const project: Project = {
    id: "test-project",
    name: "Test Project",
    description: "A test project for development",
    userId: "test-user",
    sandboxId: null,
    previewUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
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
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:from-purple-600 hover:to-pink-600 transition-colors"
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
