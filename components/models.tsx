"use client";

import { useState, useRef, useEffect } from "react";
import { modelsConfig } from "@/lib/config/models.config";

interface ModelsProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
  direction?: "up" | "down"; // Add direction prop
}

export function Models({
  selectedModel,
  onModelChange,
  disabled = false,
  direction = "down", // Default to down
}: ModelsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
    setIsOpen(false);
  };

  const getDisplayName = (modelId: string) => {
    return (
      modelsConfig.modelDisplayNames[
        modelId as keyof typeof modelsConfig.modelDisplayNames
      ] || modelId
    );
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-1.5 
          bg-bk-40 border border-bd-50 rounded-lg text-[11px] text-fg-30
          hover:bg-bk-30 hover:text-fg-10 focus:bg-bk-30 focus:text-fg-10 focus:outline-none transition-all cursor-pointer
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <span className="truncate">{getDisplayName(selectedModel)}</span>
        <svg
          className={`w-3 h-3 text-fg-60 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-50 bg-bk-40 border border-bd-50 rounded-lg shadow-lg py-1 px-1 w-max min-w-full max-h-60 overflow-y-auto ${
            direction === "up" ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          {modelsConfig.availableModels.map((modelId) => (
            <button
              key={modelId}
              onClick={() => handleModelSelect(modelId)}
              className={`
                w-full px-3 py-1.5 text-left flex items-center tracking-tight whitespace-nowrap rounded-md transition-all cursor-pointer
                ${
                  selectedModel === modelId
                    ? "bg-bk-30 text-fg-10"
                    : "text-fg-30 hover:bg-bk-30 hover:text-fg-10 focus:bg-bk-30 focus:text-fg-10 focus:outline-none"
                }
              `}
              style={{ fontSize: "11px" }}
            >
              <span>{getDisplayName(modelId)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
