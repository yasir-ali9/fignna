"use client";

import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { CanvasTool } from "@/lib/stores/editor/state";
import { observer } from "mobx-react-lite";
import { useState } from "react";

export const FloatingToolbar = observer(() => {
  const editorEngine = useEditorEngine();
  const { canvasTool, isSpacePressed } = editorEngine.state;
  const [promptValue, setPromptValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToolChange = (tool: CanvasTool) => {
    editorEngine.state.setCanvasTool(tool);
  };

  const handleSendPrompt = () => {
    if (promptValue.trim()) {
      // TODO: Send to AI backend
      console.log("Sending prompt:", promptValue);
      setPromptValue("");
      setIsExpanded(false); // Close after sending
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      // Focus textarea when expanding
      setTimeout(() => {
        const textarea = document.querySelector("textarea");
        textarea?.focus();
      }, 100);
    }
  };

  return (
    <div
      className="absolute left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300"
      style={{
        bottom: "16px",
      }}
    >
      <div
        className={`bg-bk-50 rounded-lg shadow-lg p-1 px-2 transition-all duration-500 ease-in-out ${
          isExpanded ? "min-w-80 max-w-md" : "w-auto"
        }`}
      >
        {isExpanded ? (
          /* AI Prompt Mode */
          <div className="flex h-8 items-center">
            <div className="relative flex-1">
              <textarea
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask AI to build something..."
                rows={1}
                className="w-full h-8 bg-bk-40 border-0 placeholder-fg-60 rounded-md
                                         focus:outline-none focus:ring-0 text-fg-50
                                         resize-none overflow-hidden"
                style={{
                  fontSize: "11px",
                  padding: "8px 24px 8px 6px",
                  lineHeight: "16px",
                  verticalAlign: "middle",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "32px";
                  target.style.height =
                    Math.min(target.scrollHeight, 32) + "px";
                }}
              />
              {/* Send Button */}
              <button
                onClick={handleSendPrompt}
                disabled={!promptValue.trim()}
                className="absolute right-0 top-0 w-6 h-8 flex items-center justify-center cursor-pointer
                                         text-fg-60 hover:text-fg-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Send (Enter)"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M21 4a1 1 0 0 1 .993.883L22 5v6.5a3.5 3.5 0 0 1-3.308 3.495L18.5 15H5.415l3.292 3.293a1 1 0 0 1 .083 1.32l-.083.094a1 1 0 0 1-1.32.083l-.094-.083l-5-5a1.008 1.008 0 0 1-.097-.112l-.071-.11l-.054-.114l-.035-.105l-.025-.118l-.007-.058L2 14l.003-.075l.017-.126l.03-.111l.044-.111l.052-.098l.064-.092l.083-.094l5-5a1 1 0 0 1 1.497 1.32l-.083.094L5.415 13H18.5a1.5 1.5 0 0 0 1.493-1.356L20 11.5V5a1 1 0 0 1 1-1z"
                    fillRule="nonzero"
                  />
                </svg>
              </button>
            </div>
            {/* Close Button */}
            <button
              onClick={handleExpandToggle}
              className="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer
                                     text-fg-60 hover:text-fg-100 hover:bg-bk-40 transition-colors flex-shrink-0"
              title="Close"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59L7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12L5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 0 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z" />
              </svg>
            </button>
          </div>
        ) : (
          /* Toolbar Mode */
          <div className="flex h-10 items-center gap-1">
            {/* Move/Select Tool */}
            <button
              onClick={() => handleToolChange(CanvasTool.SELECT)}
              className={`
                                flex items-center justify-center w-8 h-8 text-sm font-medium transition-colors rounded-md cursor-pointer
                                ${
                                  canvasTool === CanvasTool.SELECT
                                    ? "bg-bk-30 text-ac-01"
                                    : "text-fg-50 hover:bg-bk-40 hover:text-fg-30"
                                }
                                ${isSpacePressed ? "opacity-50" : ""}
                            `}
              title="Move tool (V)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 20 20"
              >
                <path
                  fill="currentColor"
                  d="M5 3.059a1 1 0 0 1 1.636-.772l11.006 9.062c.724.596.302 1.772-.636 1.772h-5.592a1.5 1.5 0 0 0-1.134.518l-3.524 4.073c-.606.7-1.756.271-1.756-.655zm12.006 9.062L6 3.059v13.998l3.524-4.072a2.5 2.5 0 0 1 1.89-.864z"
                />
              </svg>
            </button>

            {/* Hand/Pan Tool */}
            <button
              onClick={() => handleToolChange(CanvasTool.HAND)}
              className={`
                                flex items-center justify-center w-8 h-8 text-sm font-medium transition-colors rounded-md cursor-pointer
                                ${
                                  canvasTool === CanvasTool.HAND ||
                                  isSpacePressed
                                    ? "bg-bk-30 text-ac-01"
                                    : "text-fg-50 hover:bg-bk-40 hover:text-fg-30"
                                }
                            `}
              title="Hand tool (H or Space)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 20 20"
              >
                <path
                  fill="currentColor"
                  d="M16 12.02a8.1 8.1 0 0 1-.608 3.077l-.585 1.421a2.55 2.55 0 0 1-1.18 1.29a1.9 1.9 0 0 1-.861.212H10.22a2.16 2.16 0 0 1-1.872-1.082c-.5-.867-1.015-1.704-1.713-2.43l-1.328-1.384c-.442-.46-.965-.848-1.483-1.232q-.302-.222-.592-.447A.6.6 0 0 1 3 10.97c0-.754.536-1.575 1.217-1.79c.91-.306 1.796-.213 2.652.215l.131.07V4.5a1.5 1.5 0 0 1 2.053-1.395a1.5 1.5 0 0 1 2.894 0q.26-.104.553-.105A1.5 1.5 0 0 1 14 4.5v.085q.236-.084.5-.085A1.5 1.5 0 0 1 16 6zM12 4.5v4a.5.5 0 0 1-1 0v-5a.5.5 0 0 0-1 0v5a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-1 0v6a.499.499 0 0 1-.854.373l-.008-.008c-.22-.22-.434-.434-.716-.575c-.697-.349-2.223-.575-2.407.498q.265.205.537.408c.514.385 1.034.775 1.476 1.235l1.328 1.384c.754.785 1.319 1.687 1.858 2.623c.207.36.59.582 1.006.582h2.546a.9.9 0 0 0 .4-.098c.323-.169.577-.447.716-.784l.585-1.421A7.1 7.1 0 0 0 15 12.02V6a.5.5 0 0 0-1 0v3.5a.5.5 0 0 1-1 0v-5a.5.5 0 0 0-1 0"
                />
              </svg>
            </button>

            {/* Divider before AI/Logo Tool */}
            <div className="h-6 w-px bg-bd-50 mx-0.5"></div>

            {/* AI/Logo Tool */}
            <button
              onClick={handleExpandToggle}
              className="flex items-center justify-center w-8 h-8 text-sm font-medium transition-colors rounded-md cursor-pointer
                                     text-fg-50 hover:bg-bk-40 hover:text-fg-30"
              title="AI Assistant"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.98485 8.15152L8.98485 7.4697L7.62121 7.4697L7.62121 8.15152L8.30303 8.15152L8.98485 8.15152ZM13.8333 9.36364L13.8333 8.68182L12.4697 8.68182L12.4697 9.36364L13.1515 9.36364L13.8333 9.36364ZM7.51788 7.36637L7.03576 7.84848L8 8.81272L8.48212 8.3306L8 7.84848L7.51788 7.36637ZM12.6694 8.27546L12.1873 8.75758L13.1515 9.72181L13.6336 9.23969L13.1515 8.75758L12.6694 8.27546ZM8.30303 20.8788L8.98485 20.8788L8.98485 8.15152L8.30303 8.15152L7.62121 8.15152L7.62121 20.8788L8.30303 20.8788ZM13.1515 20.8788L13.8333 20.8788L13.8333 9.36364L13.1515 9.36364L12.4697 9.36364L12.4697 20.8788L13.1515 20.8788ZM12.8485 3L12.3664 2.51788L7.51788 7.36637L8 7.84848L8.48212 8.3306L13.3306 3.48212L12.8485 3ZM18 3.90909L17.5179 3.42697L12.6694 8.27546L13.1515 8.75758L13.6336 9.23969L18.4821 4.39121L18 3.90909Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
