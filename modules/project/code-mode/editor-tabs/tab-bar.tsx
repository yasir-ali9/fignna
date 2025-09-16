"use client";

import { observer } from "mobx-react-lite";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { XMarkIcon } from "@heroicons/react/24/outline";

// Text wrap icon component
const TextWrapIcon = ({ enabled }: { enabled: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="currentColor"
    className={enabled ? "text-blue-400" : "text-fg-60"}
  >
    <path d="M2 3h12v1H2V3zm0 4h9.5a1.5 1.5 0 0 1 0 3H10v1.5l-2-2 2-2V9h1.5a.5.5 0 0 0 0-1H2V7zm0 4h5v1H2v-1z" />
  </svg>
);

/**
 * TabBar - Displays open file tabs with close functionality
 * Integrates with FilesManager for tab state management
 */
export const TabBar = observer(() => {
  const engine = useEditorEngine();

  const handleTabClick = (tabId: string) => {
    engine.files.setActiveFile(tabId);
  };

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    engine.files.closeFile(tabId);
  };

  if (engine.files.openTabs.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between bg-bk-50 overflow-x-auto">
      {/* Tabs Container */}
      <div className="flex items-center overflow-x-auto">
        {engine.files.openTabs.map((tab) => (
          <div
            key={tab.id}
            className={`
            flex items-center gap-2 px-3 py-2 border-r border-bd-50 cursor-pointer
            min-w-0 max-w-48 group relative
            ${
              tab.isActive
                ? "bg-bk-40 text-fg-30"
                : "bg-bk-50 text-fg-60 hover:bg-bk-45 hover:text-fg-40"
            }
          `}
            onClick={() => handleTabClick(tab.id)}
          >
            {/* File Name */}
            <span className="truncate text-[11px]">
              {tab.name}
              {tab.isDirty && <span className="text-orange-400 ml-1">•</span>}
            </span>

            {/* Close Button */}
            <button
              className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={(e) => handleTabClose(e, tab.id)}
              title="Close file"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Unsaved Changes Indicator */}
        {engine.files.hasUnsavedChanges && (
          <div className="px-3 py-2 text-xs text-orange-400">
            {engine.files.dirtyFilesCount} unsaved
          </div>
        )}
      </div>

      {/* Editor Controls */}
      <div className="flex items-center gap-1 px-2">
        <button
          className="p-1.5 hover:bg-bk-40 rounded transition-colors"
          onClick={() => engine.files.toggleTextWrap()}
          title={`${
            engine.files.isTextWrapEnabled ? "Disable" : "Enable"
          } Text Wrap`}
        >
          <TextWrapIcon enabled={engine.files.isTextWrapEnabled} />
        </button>
      </div>
    </div>
  );
});
