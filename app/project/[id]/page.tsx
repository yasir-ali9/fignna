"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { EditMode } from "@/modules/project/edit-mode";
import { ViewModeComponent } from "@/modules/project/view-mode";
import { CodeMode } from "@/modules/project/code-mode";
import { TopRibbon } from "@/modules/project/common/top-ribbon";
import { EditorProvider } from "@/lib/providers/editor-provider";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { observer } from "mobx-react-lite";
import {
  SandboxStatusManager,
  type StatusCheckResult,
} from "@/lib/services/sandbox-status-manager";
import { SandboxCreate } from "@/modules/project/actions/create/create";

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
  const searchParams = useSearchParams();
  const engine = useEditorEngine();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sandboxStatus, setSandboxStatus] = useState<StatusCheckResult | null>(
    null
  );

  const projectId = params.id as string;
  const action = searchParams.get("a"); // Get action parameter

  // Check if this is a new project from home page prompt
  const isNewProject =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("source") === "new";

  // Handle action-based routing for creation flow
  if (action === "create") {
    return (
      <SandboxCreate 
        projectId={projectId}
      />
    );
  }

  // Set up status manager callbacks for existing projects only
  useEffect(() => {
    if (!projectId || isNewProject) return;

    // Use the centralized status manager from EditorEngine
    const statusManager = engine.statusManager;

    // Set up callbacks for existing projects
    statusManager.setStatusUpdateCallback((status: StatusCheckResult) => {
      setSandboxStatus(status);
      console.log("[ProjectPage] Sandbox status updated:", status);
    });

    statusManager.setSyncRequiredCallback(async () => {
      console.log("[ProjectPage] Auto-syncing expired sandbox...");
      if (engine.projects.currentProject) {
        await engine.projects.syncToSandbox();
      }
    });

    // Cleanup callbacks on unmount
    return () => {
      statusManager.setStatusUpdateCallback(() => {});
      statusManager.setSyncRequiredCallback(async () => {});
    };
  }, [projectId, isNewProject, engine.projects, engine.statusManager]);



  // Load project data with different flows for new vs existing projects
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

        if (isNewProject) {
          // NEW PROJECT FLOW: Skip status checking and sync, just load project and create sandbox
          console.log(
            "[ProjectPage] New project flow - loading project without sync..."
          );

          // Load project without auto-sync (skip status and sync APIs)
          await engine.projects.loadProject(projectId, { skipAutoSync: true });

          if (engine.projects.currentProject) {
            setProject(engine.projects.currentProject);

            // For new projects, create a fresh sandbox (not sync from DB)
            console.log(
              "[ProjectPage] Creating fresh sandbox for new project..."
            );
            await engine.sandbox.createSandbox();

            // The createSandbox method handles setting currentSandbox internally
            // No need to check immediately as the method is async and will complete
            console.log(
              "[ProjectPage] Sandbox creation completed, starting status monitoring..."
            );

            // IMPORTANT: Only start status manager AFTER sandbox creation is complete
            await engine.statusManager.startStatusChecking(projectId);
          } else {
            throw new Error("Project not found");
          }

          // Clean up URL parameter after handling
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.delete("source");
            window.history.replaceState({}, "", url.toString());
          }
        } else {
          // EXISTING PROJECT FLOW: Check status first, then sync if needed
          console.log(
            "[ProjectPage] Existing project flow - checking sandbox status..."
          );

          try {
            // Start status checking and get initial status
            await engine.statusManager.startStatusChecking(projectId);

            // Load project with auto-sync (will sync if sandbox expired)
            await engine.projects.loadProject(projectId);
          } catch (statusError) {
            console.warn(
              "[ProjectPage] Status check failed, proceeding with normal load:",
              statusError
            );
            // Fallback to normal project loading if status check fails
            await engine.projects.loadProject(projectId);
          }

          if (engine.projects.currentProject) {
            setProject(engine.projects.currentProject);
          } else {
            throw new Error("Project not found");
          }
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
  }, [projectId, isNewProject, engine.projects, engine.statusManager]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-bk-40">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-fg-60 border-t-transparent mx-auto mb-3"></div>
          <div className="text-fg-30 text-sm">
            {isNewProject ? "Setting up project..." : "Loading..."}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !project) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-bk-40">
        <div className="text-center">
          <div className="text-lg text-fg-30 mb-4">
            {error || "Project not found"}
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-bk-60 text-fg-30 rounded border border-bd-50 hover:bg-bk-70 transition-colors"
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
