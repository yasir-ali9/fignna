"use client";

import { observer } from "mobx-react-lite";
import { CodePanel } from "./panels/code-panel";

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

interface CodeModeProps {
  project: Project;
}

export const CodeMode = observer(({ project }: CodeModeProps) => {
  return (
    <div className="flex-1 relative overflow-hidden min-h-0 min-w-0 bg-bk-60">
      <CodePanel projectId={project.id} className="h-full" />
    </div>
  );
});
