"use client";

import { useState } from "react";
import { CodePanel, SplitView, isCodeMirrorAvailable } from "./index";

/**
 * TestEditor - Simple test component to verify code editor functionality
 * Remove this file once integration is complete
 */
export function TestEditor() {
  const [mode, setMode] = useState<"code" | "split">("code");
  const [projectId] = useState("test-project-id");

  return (
    <div className="h-screen w-full bg-bk-40">
      {/* Test Header */}
      <div className="p-4 bg-bk-50 border-b border-bd-50">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-fg-30">Code Editor Test</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-fg-60">
              CodeMirror:{" "}
              {isCodeMirrorAvailable() ? "✅ Available" : "❌ Missing"}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMode("code")}
                className={`px-3 py-1 text-sm rounded ${
                  mode === "code"
                    ? "bg-blue-600 text-white"
                    : "bg-bk-60 text-fg-60 hover:bg-bk-70"
                }`}
              >
                Code Only
              </button>
              <button
                onClick={() => setMode("split")}
                className={`px-3 py-1 text-sm rounded ${
                  mode === "split"
                    ? "bg-blue-600 text-white"
                    : "bg-bk-60 text-fg-60 hover:bg-bk-70"
                }`}
              >
                Split View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Test Content */}
      <div className="flex-1 h-full">
        {mode === "code" ? (
          <CodePanel projectId={projectId} />
        ) : (
          <SplitView projectId={projectId} previewUrl="https://example.com" />
        )}
      </div>
    </div>
  );
}
