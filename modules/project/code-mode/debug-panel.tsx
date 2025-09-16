"use client";

import React from "react";
import { observer } from "mobx-react-lite";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
// Removed tRPC import - now using fetch for API calls
import { isCodeMirrorAvailable } from "./core/extensions";

interface DebugPanelProps {
  projectId: string;
}

/*
 * DebugPanel - Debug component to see what's happening with file loading
 * Remove this once issues are resolved
 */
export const DebugPanel = observer(({ projectId }: DebugPanelProps) => {
  const engine = useEditorEngine();

  // State for files and loading
  const [files, setFiles] = React.useState<any[] | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  // Fetch files from API endpoint
  React.useEffect(() => {
    if (!projectId) return;

    const fetchFiles = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/v1/projects/${projectId}/files`);
        if (!response.ok) {
          throw new Error("Failed to fetch project files");
        }
        const result = await response.json();
        const data = result.success
          ? Object.entries(result.data.files).map(([path, content]) => ({
              path,
              content: content as string,
              createdAt: new Date(),
              updatedAt: new Date(),
            }))
          : [];
        setFiles(data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, [projectId]);

  return (
    <div className="p-4 bg-bk-50 border border-bd-50 rounded">
      <h3 className="text-lg font-semibold text-fg-30 mb-4">Debug Panel</h3>

      <div className="space-y-4">
        {/* CodeMirror Status */}
        <div>
          <h4 className="font-medium text-fg-40">CodeMirror Status:</h4>
          <div
            className={`text-sm ${
              isCodeMirrorAvailable() ? "text-green-400" : "text-red-400"
            }`}
          >
            {isCodeMirrorAvailable() ? "✅ Available" : "❌ Not Available"}
          </div>
        </div>

        {/* API Status */}
        <div>
          <h4 className="font-medium text-fg-40">API Status:</h4>
          <div className="text-sm text-fg-60">
            Loading: {isLoading ? "⏳ Yes" : "✅ No"}
            <br />
            Error: {error ? `❌ ${error.message}` : "✅ None"}
            <br />
            Files Count: {files ? `📁 ${files.length}` : "❓ Unknown"}
          </div>
        </div>

        {/* Files Manager Status */}
        <div>
          <h4 className="font-medium text-fg-40">Files Manager Status:</h4>
          <div className="text-sm text-fg-60">
            Project ID: {engine.files.projectId || "❓ Not Set"}
            <br />
            File Tree Length: {engine.files.fileTree.length}
            <br />
            Open Tabs: {engine.files.openTabs.length}
            <br />
            Active File: {engine.files.activeFile?.name || "❓ None"}
            <br />
            Error: {engine.files.error || "✅ None"}
          </div>
        </div>

        {/* Raw Files Data */}
        <div>
          <h4 className="font-medium text-fg-40">Raw Files Data:</h4>
          <div className="text-xs text-fg-60 bg-bk-40 p-2 rounded max-h-40 overflow-y-auto">
            {files ? (
              <pre>{JSON.stringify(files.slice(0, 3), null, 2)}</pre>
            ) : (
              "No data"
            )}
          </div>
        </div>

        {/* File Tree Data */}
        <div>
          <h4 className="font-medium text-fg-40">File Tree Data:</h4>
          <div className="text-xs text-fg-60 bg-bk-40 p-2 rounded max-h-40 overflow-y-auto">
            <pre>{JSON.stringify(engine.files.fileTree, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
});
