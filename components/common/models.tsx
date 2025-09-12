"use client";

import { useState } from "react";
import { modelsConfig } from "@/lib/config/models.config";

interface ModelsProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export function Models({
  selectedModel,
  onModelChange,
  disabled = false,
}: ModelsProps) {
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-2 py-1.5 
          bg-bk-50 border border-bd-50 rounded text-[11px] text-fg-50
          hover:bg-bk-60 transition-colors cursor-pointer
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
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-bk-50 border border-bd-50 rounded shadow-lg max-h-60 overflow-y-auto">
            {modelsConfig.availableModels.map((modelId) => (
              <button
                key={modelId}
                onClick={() => handleModelSelect(modelId)}
                className={`
                  w-full px-2 py-1.5 text-left text-[11px] hover:bg-bk-60 
                  transition-colors cursor-pointer
                  ${
                    selectedModel === modelId
                      ? "bg-bk-60 text-fg-30"
                      : "text-fg-50"
                  }
                `}
              >
                {getDisplayName(modelId)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
