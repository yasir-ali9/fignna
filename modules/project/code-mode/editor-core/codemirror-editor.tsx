"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
// Removed tRPC import - now using fetch for API calls
import { editorConfigs, isCodeMirrorAvailable } from "../core/extensions";
import { getCurrentTheme } from "../core/theme-config";
import { useTheme } from "@/lib/providers/theme-provider";

// CodeMirror imports with fallback
let EditorView: any = null;
let EditorState: any = null;

try {
  const viewPkg = require("@codemirror/view");
  EditorView = viewPkg.EditorView;

  const statePkg = require("@codemirror/state");
  EditorState = statePkg.EditorState;

  console.log("✅ CodeMirror core loaded in editor");
} catch (error) {
  console.warn("⚠️ CodeMirror not available in editor component");
}

/**
 * CodeMirrorEditor - Core editor component with database integration
 * Handles file content editing and auto-save to database
 */
export const CodeMirrorEditor = observer(() => {
  const engine = useEditorEngine();
  const { theme } = useTheme(); // Use your theme context
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef<boolean>(false);

  // State for tracking save operations
  const [isSaving, setIsSaving] = React.useState(false);

  const activeFile = engine.files.activeFile;

  // Debounced save function - must be declared before createExtensions
  const debouncedSave = useCallback(
    (content: string, filePath: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        if (!engine.files.projectId) {
          console.warn("⚠️ No project ID available for saving");
          return;
        }

        console.log(
          "💾 Attempting to save file:",
          filePath,
          "Project:",
          engine.files.projectId
        );
        console.log("📝 Save payload:", {
          projectId: engine.files.projectId,
          path: filePath,
          contentLength: content.length,
        });

        try {
          isSavingRef.current = true;
          setIsSaving(true);

          // PROPER FLOW: Update sandbox first, then database
          // Step 1: Update file in sandbox for immediate preview
          try {
            const sandboxResponse = await fetch("/api/v1/sandbox/files/write", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                files: {
                  [filePath]: content,
                },
              }),
            });

            if (!sandboxResponse.ok) {
              console.warn(
                "Failed to update sandbox, continuing with database save..."
              );
            } else {
              console.log("✅ File updated in sandbox for immediate preview");
            }
          } catch (sandboxError) {
            console.warn(
              "Sandbox update failed, continuing with database save:",
              sandboxError
            );
          }

          // Step 2: Update database with PATCH endpoint for persistence
          const response = await fetch(
            `/api/v1/projects/${engine.projects.currentProject?.id}/files/update`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                files: {
                  [filePath]: content,
                },
                metadata: {
                  source: "editor",
                  updatedBy: "user",
                },
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to save file");
          }

          const result = await response.json();
          console.log("✅ File saved successfully:", result);

          // Mark file as saved
          const tab = engine.files.openTabs.find((t) => t.path === filePath);
          if (tab) {
            engine.files.markFileSaved(tab.id);
          }

          // Trigger seamless preview refresh after file save
          console.log("🔄 Triggering seamless preview refresh after file save");
          window.dispatchEvent(new CustomEvent("file-saved"));

          console.log("✅ File save operation completed");
        } catch (error) {
          console.error("❌ Failed to save file:", error);
          console.error("Error details:", {
            projectId: engine.files.projectId,
            path: filePath,
            contentLength: content.length,
            error: error,
          });
          engine.files.setError(
            `Failed to save file: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        } finally {
          isSavingRef.current = false;
          setIsSaving(false);
        }
      }, 2000); // 2 second debounce for smoother typing
    },
    [engine.files]
  );

  // Create editor extensions using our config
  const createExtensions = useCallback(
    (filename: string) => {
      const extensions = editorConfigs.full(
        filename,
        "dark",
        engine.files.isTextWrapEnabled
      );

      // Add update listener for auto-save
      if (EditorView) {
        extensions.push(
          EditorView.updateListener.of((update: any) => {
            if (update.docChanged) {
              const newContent = update.state.doc.toString();

              // Get current active file from engine
              const currentActiveFile = engine.files.activeFile;
              if (currentActiveFile) {
                // Only update if content actually changed
                if (currentActiveFile.content !== newContent) {
                  engine.files.updateFileContent(
                    currentActiveFile.id,
                    newContent
                  );

                  // Trigger debounced save
                  debouncedSave(newContent, currentActiveFile.path);
                }
              }
            }
          })
        );
      }

      return extensions;
    },
    [engine.files, debouncedSave, engine.files.isTextWrapEnabled]
  );

  // Track the current file ID, text wrap state, and theme to prevent unnecessary recreations
  const currentFileIdRef = useRef<string | null>(null);
  const currentTextWrapRef = useRef<boolean>(false);
  const currentThemeRef = useRef<string>(theme);

  // Initialize/update editor when active file changes
  useEffect(() => {
    if (!editorRef.current) return;

    // If CodeMirror is not available, skip editor creation
    if (!EditorView || !EditorState || !isCodeMirrorAvailable()) {
      return;
    }

    // If no active file, destroy editor and clear container
    if (!activeFile) {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
        currentFileIdRef.current = null;
        currentTextWrapRef.current = false;
      }
      // Clear the editor container to ensure no content remains
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
      return;
    }

    // If same file, same text wrap setting, and same theme, just update content without recreating editor
    if (
      currentFileIdRef.current === activeFile.id &&
      currentTextWrapRef.current === engine.files.isTextWrapEnabled &&
      currentThemeRef.current === theme &&
      viewRef.current
    ) {
      const currentContent = viewRef.current.state.doc.toString();
      // Only update if content is different and we're not currently saving
      if (currentContent !== activeFile.content && !isSavingRef.current) {
        // Update content while preserving cursor position
        const transaction = viewRef.current.state.update({
          changes: {
            from: 0,
            to: currentContent.length,
            insert: activeFile.content,
          },
        });
        viewRef.current.dispatch(transaction);
      }
      return;
    }

    // Create new editor for different file
    const extensions = createExtensions(activeFile.name);

    const state = EditorState.create({
      doc: activeFile.content,
      extensions,
    });

    // Destroy existing editor
    if (viewRef.current) {
      viewRef.current.destroy();
    }

    // Create new editor
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;
    currentFileIdRef.current = activeFile.id;
    currentTextWrapRef.current = engine.files.isTextWrapEnabled;
    currentThemeRef.current = theme;

    // Focus the editor
    view.focus();

    // Debug: Log editor dimensions
    console.log("📐 Editor created:", {
      containerHeight: editorRef.current?.clientHeight,
      scrollerHeight: view.scrollDOM.clientHeight,
      contentHeight: view.contentDOM.clientHeight,
      scrollTop: view.scrollDOM.scrollTop,
      scrollHeight: view.scrollDOM.scrollHeight,
    });

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [activeFile, createExtensions, engine.files.isTextWrapEnabled, theme]);

  // Log theme changes for debugging
  useEffect(() => {
    if (currentThemeRef.current !== theme) {
      console.log("🎨 Editor theme changed to:", theme);
      currentThemeRef.current = theme;
    }
  }, [theme]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Clear container on unmount
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
      currentFileIdRef.current = null;
    };
  }, []);

  // Check if CodeMirror is available
  const codeMirrorAvailable =
    isCodeMirrorAvailable() && EditorView && EditorState;

  // Fallback editor if CodeMirror is not available
  if (!codeMirrorAvailable) {
    return (
      <div className="h-full flex flex-col bg-bk-40">
        <div className="p-4 bg-yellow-100 border-b border-yellow-300 text-yellow-800 text-sm">
          <strong>CodeMirror not available.</strong> Using fallback editor.
          <div className="mt-1 text-xs">
            Run:{" "}
            <code className="bg-yellow-200 px-1 rounded">
              node scripts/install-codemirror.js
            </code>
          </div>
        </div>
        {activeFile ? (
          <textarea
            value={activeFile.content}
            onChange={(e) => {
              engine.files.updateFileContent(activeFile.id, e.target.value);
              debouncedSave(e.target.value, activeFile.path);
            }}
            className="flex-1 p-4 bg-bk-40 text-fg-30 font-mono text-sm border-0 outline-none resize-none"
            placeholder="Start typing..."
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-fg-60">
            Select a file to start editing
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full bg-bk-60 relative">
      {/* Editor Container - Always present but conditionally visible */}
      <div
        ref={editorRef}
        className={`absolute inset-0 ${activeFile ? "block" : "hidden"}`}
        style={{
          height: "100%",
          overflow: "hidden",
        }}
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
        spellCheck="false"
      />

      {/* No File Selected Message - Only show when no active file */}
      {!activeFile && (
        <div className="absolute inset-0 flex items-center justify-center text-fg-60 bg-bk-60 z-10">
          <div className="text-center">
            <div className="text-[11px] max-w-[180px]">
              Choose a file from the explorer to start editing
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
