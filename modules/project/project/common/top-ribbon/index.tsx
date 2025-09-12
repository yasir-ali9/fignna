"use client";

import { useRef, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { X } from "lucide-react";
import { LogoDropdown } from "../../../widgets/project/dropdown";
import { Tooltip } from "../../../widgets/tooltip";

import { SandboxDropdown } from "../../../widgets/project/sandbox-dropdown";
import { TicTacToeGame } from "../../../widgets/project/tic-tac-toe-game";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { AppMode, ViewModeTab, ViewMode } from "@/lib/stores/editor/state";

interface TopRibbonProps {
  project?: any; // We'll type this properly later
}

export const TopRibbon = observer(({ project }: TopRibbonProps) => {
  const engine = useEditorEngine();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);

  // Handle project name editing
  const handleNameClick = () => {
    engine.state.setEditingProjectName(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    engine.state.setProjectName(e.target.value);
  };

  const handleNameSubmit = () => {
    engine.state.setEditingProjectName(false);
    if (!engine.state.projectName.trim()) {
      engine.state.setProjectName("Unnamed");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSubmit();
    } else if (e.key === "Escape") {
      engine.state.setEditingProjectName(false);
      // Reset to the stored value (no change needed as it's already in state)
    }
  };

  // Focus and select all text when editing starts
  useEffect(() => {
    if (engine.state.isEditingProjectName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [engine.state.isEditingProjectName]);

  return (
    <div className="h-10 bg-bk-50 border-b border-bd-50 flex px-2 flex-shrink-0 relative z-[100]">
      {/* Left Section */}
      <div className="flex items-center h-full">
        <div className="flex items-center h-full">
          <LogoDropdown />
        </div>

        {/* Project Name */}
        <div className="ml-3 flex items-center h-full">
          {engine.state.isEditingProjectName ? (
            <input
              ref={inputRef}
              value={engine.state.projectName}
              onChange={handleNameChange}
              onBlur={handleNameSubmit}
              onKeyDown={handleKeyDown}
              className="bg-transparent text-fg-50 text-[12px] outline-none border-none cursor-text"
              style={{
                width: `${Math.max(engine.state.projectName.length * 8, 60)}px`,
              }}
            />
          ) : (
            <button
              onClick={handleNameClick}
              className="text-fg-50 text-[12px] hover:text-fg-40 transition-colors cursor-text"
            >
              {engine.projects.currentProject?.name ||
                project?.name ||
                engine.state.projectName}
            </button>
          )}
        </div>
      </div>

      {/* Center Section - Absolutely Positioned */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-1">
        <Tooltip content="View Mode" position="bottom" delay={500}>
          <button
            onClick={() => {
              engine.state.setAppMode(AppMode.VIEW);
              engine.state.setViewModeTab(ViewModeTab.PREVIEW);
            }}
            className={`flex items-center justify-center w-7 h-7 transition-colors rounded-md cursor-pointer ${
              engine.state.isViewMode &&
              engine.state.viewModeTab === ViewModeTab.PREVIEW
                ? "bg-bk-30 text-fg-50"
                : "text-fg-60 hover:text-fg-50 hover:bg-bk-40"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 20 20"
            >
              <path
                fill="currentColor"
                d="M3.26 11.602C3.942 8.327 6.793 6 10 6s6.057 2.327 6.74 5.602a.5.5 0 0 0 .98-.204C16.943 7.673 13.693 5 10 5s-6.943 2.673-7.72 6.398a.5.5 0 0 0 .98.204M10 8a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7m-2.5 3.5a2.5 2.5 0 1 1 5 0a2.5 2.5 0 0 1-5 0"
              />
            </svg>
          </button>
        </Tooltip>

        <Tooltip content="Code Mode" position="bottom" delay={500}>
          <button
            onClick={() => {
              // Switch to code mode directly
              engine.state.setAppMode(AppMode.CODE);
            }}
            className={`flex items-center justify-center w-7 h-7 transition-colors rounded-md cursor-pointer ${
              engine.state.isCodeMode
                ? "bg-bk-30 text-fg-50"
                : "text-fg-60 hover:text-fg-50 hover:bg-bk-40"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 20 20"
            >
              <path
                fill="currentColor"
                d="M5.8 4.4a.5.5 0 0 0-.601-.8A7.99 7.99 0 0 0 2 10a7.99 7.99 0 0 0 3.199 6.4a.5.5 0 0 0 .6-.8A6.99 6.99 0 0 1 3 10a6.99 6.99 0 0 1 2.8-5.6m9.001-.8a.5.5 0 0 0-.6.8A6.99 6.99 0 0 1 17 10a6.99 6.99 0 0 1-2.8 5.6a.5.5 0 1 0 .601.8A7.99 7.99 0 0 0 18 10a7.99 7.99 0 0 0-3.199-6.4M6.5 9.5a.5.5 0 1 0 0 1h7a.5.5 0 1 0 0-1z"
              />
            </svg>
          </button>
        </Tooltip>

        <Tooltip content="Edit Mode" position="bottom" delay={500}>
          <button
            onClick={() => engine.state.setAppMode(AppMode.EDIT)}
            className={`flex items-center justify-center w-7 h-7 transition-colors rounded-md cursor-pointer ${
              engine.state.isEditMode
                ? "bg-bk-30 text-fg-50"
                : "text-fg-60 hover:text-fg-50 hover:bg-bk-40"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 20 20"
            >
              <path
                fill="currentColor"
                d="M6 2.5a.5.5 0 0 0-1 0v2A1.5 1.5 0 0 0 6.5 6h.21L5.25 9.08a2.5 2.5 0 0 0 .103 2.335l3.463 5.907a1.373 1.373 0 0 0 2.368 0l3.463-5.907a2.5 2.5 0 0 0 .102-2.335L13.29 6h.21A1.5 1.5 0 0 0 15 4.5v-2a.5.5 0 0 0-1 0v2a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5zM12.184 6l1.662 3.509a1.5 1.5 0 0 1-.062 1.4L10.5 16.511v-5.645a1 1 0 1 0-1 0v5.645L6.216 10.91a1.5 1.5 0 0 1-.062-1.4L7.816 6z"
              />
            </svg>
          </button>
        </Tooltip>
      </div>

      {/* Right Section */}
      <div className="ml-auto flex items-center gap-3 h-full">
        {/* Game Icon */}
        <Tooltip content="Play Game" position="bottom" delay={500}>
          <button
            onClick={() => setIsGameModalOpen(true)}
            className="flex items-center justify-center w-7 h-7 rounded-md transition-colors text-fg-50 hover:text-fg-30 hover:bg-bk-30 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 28 28"
            >
              <path
                fill="currentColor"
                d="M18 16.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0m1.5-2.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3m-14-.25a.75.75 0 0 1 .75-.75H8v-1.75a.75.75 0 0 1 1.5 0V13h1.75a.75.75 0 0 1 0 1.5H9.5v1.751a.75.75 0 0 1-1.5 0V14.5H6.25a.75.75 0 0 1-.75-.75M2 14a8.5 8.5 0 0 1 8.5-8.5h7a8.5 8.5 0 1 1 0 17h-7A8.5 8.5 0 0 1 2 14m8.5-7a7 7 0 1 0 0 14h7a7 7 0 1 0 0-14z"
              />
            </svg>
          </button>
        </Tooltip>

        <SandboxDropdown />

        {/* Preview Button - Available in Both Modes */}
        <Tooltip content="Preview Mode" position="bottom" delay={500}>
          <button
            onClick={() => {
              if (engine.state.viewMode === ViewMode.ONLY_PREVIEW) {
                // If already in preview mode, go back to default view mode
                engine.state.setViewMode(ViewMode.DEFAULT);
              } else {
                // Switch to view mode and set preview mode
                engine.state.setAppMode(AppMode.VIEW);
                engine.state.setViewMode(ViewMode.ONLY_PREVIEW);
              }
            }}
            className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors cursor-pointer ${
              engine.state.viewMode === ViewMode.ONLY_PREVIEW
                ? "bg-bk-30 text-fg-50"
                : "text-fg-50 hover:text-fg-30 hover:bg-bk-30"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 20 20"
            >
              <path
                fill="currentColor"
                d="M17.22 8.687a1.498 1.498 0 0 1 0 2.626l-9.997 5.499A1.5 1.5 0 0 1 5 15.499V4.501a1.5 1.5 0 0 1 2.223-1.313zm-.482 1.75a.5.5 0 0 0 0-.875L6.741 4.063A.5.5 0 0 0 6 4.501v10.998a.5.5 0 0 0 .741.438z"
              />
            </svg>
          </button>
        </Tooltip>

        {/* Publish Button */}
        <button className="flex items-center h-full group relative overflow-hidden cursor-pointer">
          {/* Expanding Background */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-7 h-7 bg-ac-01 transition-all duration-300 group-hover:w-full group-hover:h-full group-hover:top-1/2 group-hover:-translate-y-1/2"></div>

          {/* Icon */}
          <div className="flex items-center justify-center w-7 h-7 relative z-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 20 20"
              fill="white"
            >
              <path d="M2 10a8 8 0 1 1 16 0a8 8 0 0 1-16 0m8-7q-.128 0-.255.005c.118.222.253.504.373.823c.28.746.527 1.817.085 2.758c-.404.86-1.097 1.084-1.632 1.222l-.097.025c-.506.13-.755.194-.93.46c-.17.257-.129.574.037 1.113l.038.124c.067.211.144.457.184.688c.05.286.06.636-.113.97c-.18.343-.414.574-.69.724a2.4 2.4 0 0 1-.747.235l-.088.015c-.407.072-.645.113-.867.351c-.177.19-.278.508-.336.941c-.024.178-.038.355-.053.534l-.007.095a5 5 0 0 1-.079.605l-.005.02A6.98 6.98 0 0 0 10 17c1.35 0 2.612-.383 3.682-1.045a4 4 0 0 1-.275-.307c-.271-.34-.609-.909-.492-1.57c.056-.313.226-.581.397-.794c.175-.216.386-.417.576-.592l.128-.117c.146-.133.273-.25.382-.363c.147-.154.191-.237.2-.263c.068-.226-.013-.404-.126-.492c-.094-.073-.295-.142-.61.058a5 5 0 0 1-.323.191a1.1 1.1 0 0 1-.336.122a.6.6 0 0 1-.544-.177a.74.74 0 0 1-.178-.375a3 3 0 0 1-.03-.276l-.005-.066c-.006-.074-.011-.15-.02-.238a5 5 0 0 0-.143-.825c-.127-.491-.44-.888-.764-1.3l-.142-.181c-.16-.206-.363-.478-.436-.77a.9.9 0 0 1 .024-.547c.072-.19.203-.336.352-.448c.428-.32 1.128-1.013 1.743-1.652c.303-.314.576-.607.775-.822l.005-.006A6.97 6.97 0 0 0 10 3m4.638 1.757l-.069.074c-.201.218-.48.516-.788.836c-.602.626-1.352 1.373-1.855 1.753c.03.066.1.176.242.359l.124.158c.316.397.774.972.959 1.683c.103.395.147.725.172.984v.01c.588-.33 1.21-.296 1.66.053c.459.354.653.971.472 1.572c-.081.268-.273.495-.434.664a9 9 0 0 1-.446.425l-.11.1a5 5 0 0 0-.474.485c-.127.157-.178.268-.191.342c-.04.227.072.497.29.772c.101.128.209.234.291.31l.025.021A6.99 6.99 0 0 0 17 10.001a6.98 6.98 0 0 0-2.362-5.244m-5.84-1.403a6 6 0 0 0-.133-.227A7.003 7.003 0 0 0 3.947 13.52l.024-.198c.062-.467.193-1.059.596-1.491c.462-.495 1.026-.588 1.404-.65l.108-.019c.203-.036.336-.07.443-.128a.7.7 0 0 0 .28-.309c.03-.054.048-.147.016-.336a4 4 0 0 0-.146-.536L6.625 9.7c-.153-.497-.374-1.262.084-1.958c.4-.607 1.04-.762 1.477-.869l.135-.033c.467-.12.771-.242.977-.68c.261-.556.143-1.292-.116-1.98a6 6 0 0 0-.384-.826" />
            </svg>
          </div>

          {/* Text */}
          <span className="px-2 text-[11px] font-mono text-fg-50 group-hover:text-white transition-colors duration-300 relative z-10">
            PUBLISH
          </span>
        </button>
      </div>

      {/* Game Modal */}
      {isGameModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
          <div className="bg-bk-50 rounded-lg border border-bd-50 relative max-w-md w-full mx-4">
            {/* Close button */}
            <button
              onClick={() => setIsGameModalOpen(false)}
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-md text-fg-50 hover:text-fg-30 hover:bg-bk-30 transition-colors"
            >
              <X size={14} />
            </button>

            {/* Game content */}
            <div className="pt-8">
              <TicTacToeGame />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
