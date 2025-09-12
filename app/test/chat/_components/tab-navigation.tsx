"use client";

interface TabNavigationProps {
  activeTab: "preview" | "code" | "files" | "versions";
  onTabChange: (tab: "preview" | "code" | "files" | "versions") => void;
  projectData: any;
  sandboxData: any;
}

export function TabNavigation({
  activeTab,
  onTabChange,
  projectData,
  sandboxData,
}: TabNavigationProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onTabChange("preview")}
        className={`px-3 py-1.5 text-[11px] rounded transition-colors ${
          activeTab === "preview"
            ? "bg-blue-500/20 text-blue-400"
            : "text-fg-60 hover:text-fg-50"
        }`}
      >
        Preview
      </button>
      <button
        onClick={() => onTabChange("code")}
        className={`px-3 py-1.5 text-[11px] rounded transition-colors ${
          activeTab === "code"
            ? "bg-blue-500/20 text-blue-400"
            : "text-fg-60 hover:text-fg-50"
        }`}
      >
        Code
      </button>
      {projectData && (
        <>
          <button
            onClick={() => onTabChange("files")}
            className={`px-3 py-1.5 text-[11px] rounded transition-colors ${
              activeTab === "files"
                ? "bg-blue-500/20 text-blue-400"
                : "text-fg-60 hover:text-fg-50"
            }`}
          >
            Files ({Object.keys(projectData.files || {}).length})
          </button>
          <button
            onClick={() => onTabChange("versions")}
            className={`px-3 py-1.5 text-[11px] rounded transition-colors ${
              activeTab === "versions"
                ? "bg-blue-500/20 text-blue-400"
                : "text-fg-60 hover:text-fg-50"
            }`}
          >
            Versions
          </button>
        </>
      )}
    </div>
  );
}
