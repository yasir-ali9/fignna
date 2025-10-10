"use client";

import { useState } from "react";
import { ChatPanel } from "../../common/chat-panel";

type RightPanelTab = "styles" | "chat";

interface RightPanelProps {
  className?: string;
}

export function RightPanel({ className = "" }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<RightPanelTab>("styles");

  const tabs = [
    { id: "styles" as const, label: "Styles" },
    { id: "chat" as const, label: "Chat" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "styles":
        return (
          <div className="p-4 text-center text-fg-30 text-xs">Coming Soon</div>
        );
      case "chat":
        return <ChatPanel />;
      default:
        return null;
    }
  };

  return (
    <div className={`h-full flex flex-col border-l border-bd-50 ${className}`}>
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
      <div className="flex-1 overflow-hidden">{renderTabContent()}</div>
    </div>
  );
}
