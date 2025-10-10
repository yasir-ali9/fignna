"use client";

import { useState, useEffect } from "react";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { observer } from "mobx-react-lite";

type LeftPanelTab = "layers" | "pages" | "code";

interface LeftPanelProps {
  className?: string;
}

export const LeftPanel = observer(({ className = "" }: LeftPanelProps) => {
  const [activeTab, setActiveTab] = useState<LeftPanelTab>("layers");
  const editorEngine = useEditorEngine();

  // Removed auto-open terminal logic

  const tabs = [
    { id: "layers" as const, label: "Layers" },
    { id: "pages" as const, label: "Pages" },
    { id: "code" as const, label: "Code" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "layers":
        return (
          <div className="p-4 text-center text-fg-30 text-xs">Coming Soon</div>
        );
      case "pages":
        return (
          <div className="p-4 text-center text-fg-30 text-xs">Coming Soon</div>
        );
      case "code":
        return (
          <div className="p-4 text-center text-fg-30 text-xs">Coming Soon</div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`h-full flex flex-col border-r border-bd-50 ${className}`}>
      {/* Tab Headers */}
      <div className="flex gap-1 p-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2 py-1 font-medium transition-colors rounded-md cursor-pointer text-[11px] ${
              activeTab === tab.id
                ? "bg-bk-30 text-fg-50" // active tab
                : "text-fg-60 hover:text-fg-50 hover:bg-bk-40" // other tabs
            }`}
            style={{ fontSize: "11px" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">{renderTabContent()}</div>
    </div>
  );
});
