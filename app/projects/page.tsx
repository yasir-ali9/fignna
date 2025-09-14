"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Header from "./_components/header";
import { ContextMenu, useContextMenu } from "@/components/common/dropdowns";

interface Project {
  id: string;
  name: string;
  description?: string;
  files?: Record<string, string>;
  sandboxId?: string;
  previewUrl?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

function ProjectsList() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/v1/projects?limit=50", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("[Projects] Fetched projects:", data.data.projects);
        setProjects(data.data.projects);
      } else {
        console.error("[Projects] Failed to fetch projects:", data);
        setError(data.error || "Failed to fetch projects");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const openProject = (projectId: string) => {
    // Navigate to project editor
    router.push(`/project/${projectId}`);
  };

  const createNewProject = () => {
    // Navigate to home page to create new project
    router.push("/");
  };

  // Handle context menu actions
  const handleContextMenu = (event: React.MouseEvent, project: Project) => {
    setSelectedProject(project);
    showContextMenu(event);
  };

  const handleOpenProject = (project: Project) => {
    router.push(`/project/${project.id}`);
  };

  const handleOpenInNewTab = (project: Project) => {
    window.open(`/project/${project.id}`, "_blank");
  };

  const handleRenameProject = (project: Project) => {
    setSelectedProject(project);
    setNewProjectName(project.name);
    setIsRenaming(true);
    hideContextMenu();
  };

  const submitRename = async () => {
    if (!selectedProject || !newProjectName.trim()) return;

    const oldName = selectedProject.name;
    const newName = newProjectName.trim();

    // Input validation and sanitization
    if (newName.length < 1 || newName.length > 255) {
      alert("Project name must be between 1 and 255 characters");
      return;
    }

    // Basic XSS prevention - remove potentially dangerous characters
    const cleanName = newName.replace(/[<>\"'&]/g, "");
    if (cleanName !== newName) {
      alert("Project name contains invalid characters");
      return;
    }

    // Update UI instantly with sanitized name
    setProjects((prev) =>
      prev.map((p) =>
        p.id === selectedProject.id ? { ...p, name: cleanName } : p
      )
    );
    setIsRenaming(false);
    setSelectedProject(null);
    setNewProjectName("");

    // Make API call in background
    try {
      const response = await fetch(`/api/v1/projects/${selectedProject.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Revert on error
        setProjects((prev) =>
          prev.map((p) =>
            p.id === selectedProject.id ? { ...p, name: oldName } : p
          )
        );
        console.error("Failed to rename project:", data.error);
        alert(`Failed to rename project: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      // Revert on error
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProject.id ? { ...p, name: oldName } : p
        )
      );
      console.error("Error renaming project:", error);
      alert(`Error renaming project: ${error}`);
    }
  };

  const cancelRename = () => {
    setIsRenaming(false);
    setSelectedProject(null);
    setNewProjectName("");
  };

  // Context menu items
  const contextMenuItems = selectedProject
    ? [
        {
          label: "Open here",
          onClick: () => handleOpenProject(selectedProject),
        },
        {
          label: "Open in new tab",
          onClick: () => handleOpenInNewTab(selectedProject),
        },
        {
          label: "Rename project",
          onClick: () => handleRenameProject(selectedProject),
        },
      ]
    : [];

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Header Skeleton */}
        <div className="mb-12">
          <div className="h-8 w-32 bg-bk-50 rounded animate-pulse mb-2"></div>
        </div>

        {/* Projects Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {/* Generate 8 skeleton cards */}
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex flex-col">
              {/* Project Preview/Thumbnail Skeleton */}
              <div className="w-full aspect-[4/3] bg-bk-50 rounded-lg mb-3 animate-pulse"></div>

              {/* Project Name Skeleton */}
              <div className="w-full">
                <div className="h-4 bg-bk-50 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-20 bg-bk-50 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-fg-30 text-sm mb-4 px-4 py-2 bg-bk-50 border border-bd-50 rounded">
          Error: {error}
        </div>
        <button
          onClick={fetchProjects}
          className="px-4 py-2 bg-bk-50 text-fg-30 rounded hover:bg-bk-40 focus:bg-bk-40 focus:outline-none focus:ring-2 focus:ring-ac-01 focus:ring-offset-2 focus:ring-offset-bk-60 transition-all text-sm cursor-pointer"
          aria-label="Retry loading projects"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-fg-30 text-2xl font-medium mb-2">Your apps</h1>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          {/* Create New Project Card */}
          <div
            onClick={createNewProject}
            className="w-48 h-32 bg-bk-50 rounded-lg flex items-center justify-center hover:bg-bk-40 focus:bg-bk-40 focus:outline-none focus:ring-2 focus:ring-ac-01 focus:ring-offset-1 focus:ring-offset-bk-60 transition-all cursor-pointer group"
            role="button"
            tabIndex={0}
            aria-label="Create new project"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                createNewProject();
              }
            }}
          >
            <div className="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 20 20"
                className="text-fg-60 group-hover:text-fg-50 group-focus:text-fg-50 transition-colors mb-2"
              >
                <path
                  fill="currentColor"
                  d="M10 2.5a.5.5 0 0 1 .5.5v6.5H17a.5.5 0 0 1 0 1h-6.5V17a.5.5 0 0 1-1 0v-6.5H3a.5.5 0 0 1 0-1h6.5V3a.5.5 0 0 1 .5-.5"
                />
              </svg>
              <div className="text-fg-60 text-sm group-hover:text-fg-50 group-focus:text-fg-50 transition-colors">
                New project
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {/* Existing Projects */}
          {projects.map((project: Project) => (
            <div key={project.id} className="flex flex-col">
              <div
                onClick={() => openProject(project.id)}
                onContextMenu={(e) => handleContextMenu(e, project)}
                className="w-full aspect-[4/3] bg-bk-50 rounded-lg overflow-hidden hover:bg-bk-40 focus:bg-bk-40 focus:outline-none focus:ring-1 focus:ring-ac-01 focus:ring-offset-1 focus:ring-offset-bk-60 transition-all cursor-pointer group mb-3 relative"
                role="button"
                tabIndex={0}
                aria-label={`Open project ${project.name}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openProject(project.id);
                  }
                }}
              >
                {/* Project Preview/Thumbnail */}
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    className="text-fg-60 group-hover:text-fg-50 group-focus:text-fg-50 transition-colors"
                  >
                    <path
                      fill="currentColor"
                      d="M6.189 17.289L5.5 16.6L15.58 6.5H6.289v-1h11v11h-1V7.208z"
                    />
                  </svg>
                </div>
              </div>

              <div className="w-full">
                {isRenaming && selectedProject?.id === project.id ? (
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        submitRename();
                      } else if (e.key === "Escape") {
                        cancelRename();
                      }
                    }}
                    onBlur={submitRename}
                    onFocus={(e) => e.target.select()}
                    data-project-id={project.id}
                    className="w-full text-fg-30 text-sm font-medium bg-bk-70 border border-bd-50 rounded px-2 py-1 mb-1 focus:outline-none focus:border-bd-50 transition-all"
                    autoFocus
                  />
                ) : (
                  <div className="text-fg-30 text-sm font-medium truncate mb-1">
                    {project.name}
                  </div>
                )}
                <div className="text-fg-60 text-xs">
                  Edited {getRelativeTime(project.updatedAt)}
                </div>
              </div>
            </div>
          ))}

          {/* Create New Project Card - at the end */}
          <div className="flex flex-col">
            <div
              onClick={createNewProject}
              className="w-full aspect-[4/3] bg-bk-50 rounded-lg flex items-center justify-center hover:bg-bk-40 focus:bg-bk-40 focus:outline-none focus:ring-1 focus:ring-ac-01 focus:ring-offset-1 focus:ring-offset-bk-60 transition-all cursor-pointer group mb-3"
              role="button"
              tabIndex={0}
              aria-label="Create new project"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  createNewProject();
                }
              }}
            >
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="26"
                  height="26"
                  viewBox="0 0 20 20"
                  className="text-fg-60 group-hover:text-fg-50 group-focus:text-fg-50 transition-colors"
                >
                  <path
                    fill="currentColor"
                    d="M10 2.5a.5.5 0 0 1 .5.5v6.5H17a.5.5 0 0 1 0 1h-6.5V17a.5.5 0 0 1-1 0v-6.5H3a.5.5 0 0 1 0-1h6.5V3a.5.5 0 0 1 .5-.5"
                  />
                </svg>
              </div>
            </div>
            <div className="w-full">
              <div className="text-fg-30 text-sm font-medium">New project</div>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      <ContextMenu
        items={contextMenuItems}
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={hideContextMenu}
      />
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth");
    }
  }, [session, isPending, router]);

  // Show loading state while checking session
  if (isPending) {
    return (
      <div className="min-h-screen bg-bk-60 flex items-center justify-center">
        <div className="text-fg-60">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!session) {
    return (
      <div className="min-h-screen bg-bk-60 flex items-center justify-center">
        <div className="text-fg-60">Redirecting to sign in...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bk-60">
      {/* Header with session data */}
      <Header
        user={{
          ...session.user,
          image: session.user.image ?? undefined,
        }}
      />

      {/* Main content area */}
      <main className="container mx-auto px-4 py-8">
        <ProjectsList />
      </main>
    </div>
  );
}
