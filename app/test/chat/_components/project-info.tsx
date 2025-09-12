"use client";

interface ProjectData {
  id: string;
  name: string;
  description?: string;
  files?: Record<string, string>;
  sandboxId?: string;
  previewUrl?: string;
  version?: number;
}

interface ProjectInfoProps {
  projectData: ProjectData | null;
  isSavingProject: boolean;
  onCreateProject: () => void;
  onSyncProject: () => void;
  sandboxData: any;
}

export function ProjectInfo({
  projectData,
  isSavingProject,
  onCreateProject,
  onSyncProject,
  sandboxData,
}: ProjectInfoProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Back to Projects */}
      <a
        href="/projects"
        className="px-3 py-1.5 text-[11px] bg-bk-50 text-fg-60 rounded hover:bg-bk-30 hover:text-fg-50 transition-colors"
      >
        ← Projects
      </a>

      {/* Project Info */}
      {projectData && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-bk-50 rounded-lg">
          <div className="w-2 h-2 bg-blue-400 rounded-full" />
          <span className="text-fg-50 text-[10px] font-medium">
            {projectData.name}
          </span>
          <span className="text-fg-60 text-[9px]">v{projectData.version}</span>
        </div>
      )}

      {/* Project Actions */}
      {!projectData && (
        <button
          onClick={onCreateProject}
          disabled={isSavingProject}
          className="px-3 py-1.5 text-[11px] bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 disabled:opacity-50 transition-colors"
        >
          {isSavingProject ? "Creating..." : "💾 Save as Project"}
        </button>
      )}

      {projectData && !sandboxData && (
        <button
          onClick={onSyncProject}
          className="px-3 py-1.5 text-[11px] bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors"
        >
          🔄 Sync to Sandbox
        </button>
      )}
    </div>
  );
}
