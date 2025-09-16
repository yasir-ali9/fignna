"use client";

import { CentralArea } from "./central";
import { LeftPanel } from "./left-panel";
import { RightPanel } from "./right-panel";
import { ResizablePanel } from "@/components/resizable";

interface EditModeProps {
  project?: any; // We'll type this properly later
}

export function EditMode({ project }: EditModeProps) {
  return (
    <div className="flex-1 flex relative overflow-hidden min-h-0 min-w-0">
      {/* Left resizable panel */}
      <ResizablePanel
        defaultWidth={240}
        minWidth={200}
        maxWidth={500}
        position="left"
        className="z-10"
      >
        <LeftPanel />
      </ResizablePanel>

      {/* Central canvas area */}
      <div className="flex-1 relative h-full min-h-0 min-w-0 overflow-hidden">
        <CentralArea />
      </div>

      {/* Right resizable panel */}
      <ResizablePanel
        defaultWidth={280}
        minWidth={250}
        maxWidth={500}
        position="right"
        className="z-10"
      >
        <RightPanel />
      </ResizablePanel>
    </div>
  );
}
