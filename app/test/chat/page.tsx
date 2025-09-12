"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ChatPanel } from "./_components/chat-panel";
import { CodePanel } from "./_components/code-panel";
import { PreviewPanel } from "./_components/preview-panel";
import { VersionPanel } from "./_components/version-panel";
import { ProjectInfo } from "./_components/project-info";
import { TabNavigation } from "./_components/tab-navigation";
import { FilesPanel } from "./_components/files-panel";
import { ResizablePanel } from "../../../components/widgets/resizable-panel";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  metadata?: {
    generatedCode?: string;
    appliedFiles?: string[];
    sandboxId?: string;
  };
}

interface SandboxData {
  sandboxId: string;
  url: string;
  status: string;
}

interface ProjectData {
  id: string;
  name: string;
  description?: string;
  files?: Record<string, string>;
  sandboxId?: string;
  previewUrl?: string;
  version?: number;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sandboxData, setSandboxData] = useState<SandboxData | null>(null);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [activeTab, setActiveTab] = useState<
    "preview" | "code" | "files" | "versions"
  >("preview");
  const [isCreatingSandbox, setIsCreatingSandbox] = useState(false);

  // Debug project data changes
  useEffect(() => {
    console.log("[Chat] Project data changed:", projectData);
  }, [projectData]);

  // Initialize with prompt or project from URL
  useEffect(() => {
    const initialPrompt = searchParams.get("prompt");
    const projectId = searchParams.get("projectId");

    if (projectId) {
      // Load existing project
      const welcomeMessage: ChatMessage = {
        id: "welcome",
        role: "system",
        content: "Loading your project...",
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);

      loadProject(projectId);
    } else if (initialPrompt) {
      // Create new project from prompt
      const welcomeMessage: ChatMessage = {
        id: "welcome",
        role: "system",
        content:
          "Welcome! I'll help you build your app. Let me start by creating a sandbox for you...",
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);

      // Auto-create sandbox and then process the initial prompt
      createSandbox().then(() => {
        if (initialPrompt.trim()) {
          // Auto-create a project based on the prompt
          const projectName =
            initialPrompt.length > 50
              ? initialPrompt.substring(0, 47) + "..."
              : initialPrompt;
          createProject(projectName, initialPrompt).then(() => {
            handleSendMessage(initialPrompt);
          });
        }
      });
    } else {
      // Just show welcome message
      const welcomeMessage: ChatMessage = {
        id: "welcome",
        role: "system",
        content:
          "Welcome! I can help you build React apps with AI. Start by describing what you'd like to create.",
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
    }
  }, [searchParams]);

  const addMessage = (message: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  };

  const loadProject = async (projectId: string) => {
    setIsSavingProject(true);
    try {
      console.log("[Chat] Loading project:", projectId);

      const response = await fetch(`/api/v1/projects/${projectId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      console.log("[Chat] Load project API response:", data);

      if (data.success) {
        const loadedProject: ProjectData = {
          id: data.data.project.id,
          name: data.data.project.name,
          description: data.data.project.description,
          files: data.data.project.files || {},
          sandboxId: data.data.project.sandboxId,
          previewUrl: data.data.project.previewUrl,
          version: data.data.project.version,
        };

        console.log("[Chat] Loaded project data:", loadedProject);
        setProjectData(loadedProject);

        addMessage({
          role: "system",
          content: `Project "${loadedProject.name}" loaded successfully! ${
            Object.keys(loadedProject.files || {}).length
          } files loaded.`,
        });

        // If project has a sandbox, try to sync it
        if (loadedProject.sandboxId && loadedProject.previewUrl) {
          setSandboxData({
            sandboxId: loadedProject.sandboxId,
            url: loadedProject.previewUrl,
            status: "ready",
          });

          addMessage({
            role: "system",
            content: `Existing sandbox found. You can continue working on your project!`,
          });
        } else {
          // Offer to sync the project to create a new sandbox
          addMessage({
            role: "system",
            content: `Project loaded! Click "Sync to Sandbox" to create a live preview of your project.`,
          });
        }

        return loadedProject;
      } else {
        addMessage({
          role: "system",
          content: `Failed to load project: ${data.error}`,
        });
        return null;
      }
    } catch (error) {
      console.error("[Chat] Error loading project:", error);
      addMessage({
        role: "system",
        content: `Error loading project: ${error}`,
      });
      return null;
    } finally {
      setIsSavingProject(false);
    }
  };

  const createProject = async (name: string, description?: string) => {
    setIsSavingProject(true);
    try {
      const response = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const newProject: ProjectData = {
          id: data.data.project.id,
          name: data.data.project.name,
          description: data.data.project.description,
          files: data.data.project.files || {},
          sandboxId: data.data.project.sandboxId,
          previewUrl: data.data.project.previewUrl,
          version: data.data.project.version,
        };
        setProjectData(newProject);

        addMessage({
          role: "system",
          content: `Project "${name}" created successfully! ID: ${newProject.id}`,
        });

        return newProject;
      } else {
        addMessage({
          role: "system",
          content: `Failed to create project: ${data.error}`,
        });
        return null;
      }
    } catch (error) {
      addMessage({
        role: "system",
        content: `Error creating project: ${error}`,
      });
      return null;
    } finally {
      setIsSavingProject(false);
    }
  };

  const updateProjectFiles = async (files: Record<string, string>) => {
    if (!projectData) {
      console.log("[Chat] No project data available for file update");
      return;
    }

    console.log("[Chat] Updating project files for project:", projectData.id);
    console.log("[Chat] Files to update:", Object.keys(files));
    console.log("[Chat] Current project data:", projectData);

    try {
      const response = await fetch(`/api/v1/projects/${projectData.id}/files`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      });

      console.log("[Chat] Update files response status:", response.status);
      const data = await response.json();
      console.log("[Chat] Update files response data:", data);

      if (data.success) {
        const updatedProjectData = {
          ...projectData,
          files,
          version: data.data.version,
        };

        console.log("[Chat] Setting updated project data:", updatedProjectData);
        setProjectData(updatedProjectData);

        addMessage({
          role: "system",
          content: `Project files updated! ${
            Object.keys(files).length
          } files saved to database. Version: ${data.data.version}`,
        });
      } else {
        console.error("[Chat] Failed to update project files:", data);
        addMessage({
          role: "system",
          content: `Failed to update project files: ${data.error}`,
        });
      }
    } catch (error) {
      console.error("[Chat] Error updating project files:", error);
      addMessage({
        role: "system",
        content: `Error updating project files: ${error}`,
      });
    }
  };

  const syncProjectToSandbox = async () => {
    if (!projectData) {
      console.log("[Chat] No project data available for sync");
      alert("No project data available for sync");
      return;
    }

    console.log("[Chat] Syncing project to sandbox:", projectData.id);
    console.log("[Chat] Project data:", projectData);
    console.log("[Chat] Project data keys:", Object.keys(projectData));
    console.log("[Chat] Project data ID type:", typeof projectData.id);
    console.log(
      "[Chat] Project data ID value:",
      JSON.stringify(projectData.id)
    );

    try {
      const response = await fetch(`/api/v1/projects/${projectData.id}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      console.log("[Chat] Sync response status:", response.status);
      const data = await response.json();
      console.log("[Chat] Sync response data:", data);
      if (data.success) {
        setSandboxData({
          sandboxId: data.data.sandboxId,
          url: data.data.previewUrl,
          status: "ready",
        });

        setProjectData((prev) =>
          prev
            ? {
                ...prev,
                sandboxId: data.data.sandboxId,
                previewUrl: data.data.previewUrl,
              }
            : null
        );

        addMessage({
          role: "system",
          content: `Project synced to sandbox! Preview URL: ${data.data.previewUrl}`,
        });
      } else {
        addMessage({
          role: "system",
          content: `Failed to sync project: ${data.error}`,
        });
      }
    } catch (error) {
      addMessage({
        role: "system",
        content: `Error syncing project: ${error}`,
      });
    }
  };

  const createSandbox = async () => {
    setIsCreatingSandbox(true);
    try {
      const response = await fetch("/api/v1/sandbox/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (data.success) {
        setSandboxData({
          sandboxId: data.sandboxId,
          url: data.url,
          status: "ready",
        });

        addMessage({
          role: "system",
          content: `Sandbox created successfully! You can now start building your app.`,
          metadata: { sandboxId: data.sandboxId },
        });
      } else {
        addMessage({
          role: "system",
          content: `Failed to create sandbox: ${data.error}`,
        });
      }
    } catch (error) {
      addMessage({
        role: "system",
        content: `Error creating sandbox: ${error}`,
      });
    } finally {
      setIsCreatingSandbox(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    // Add user message
    addMessage({ role: "user", content });

    // Generate code with AI
    setIsGenerating(true);
    setGeneratedCode("");

    try {
      const response = await fetch("/api/v1/code/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: content,
          model: "openai/gpt-4o-mini",
          context: { sandboxId: sandboxData?.sandboxId },
          isEdit: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullCode = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "stream") {
                fullCode += data.text;
                setGeneratedCode(fullCode);
              } else if (data.type === "complete") {
                // Add assistant message with generated code
                addMessage({
                  role: "assistant",
                  content:
                    "I've generated the code for your app. Would you like me to apply it to your sandbox?",
                  metadata: { generatedCode: fullCode },
                });
              } else if (data.type === "error") {
                addMessage({
                  role: "system",
                  content: `Generation error: ${data.error}`,
                });
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      // Auto-apply the generated code
      if (fullCode.trim() && sandboxData) {
        console.log(
          "[Chat] Auto-applying generated code:",
          fullCode.length,
          "characters"
        );
        await applyGeneratedCode(fullCode);
      } else {
        console.log(
          "[Chat] Not auto-applying - fullCode:",
          !!fullCode.trim(),
          "sandboxData:",
          !!sandboxData
        );
      }
    } catch (error) {
      addMessage({
        role: "system",
        content: `Error generating code: ${error}`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const applyGeneratedCode = async (code: string) => {
    if (!sandboxData) {
      addMessage({
        role: "system",
        content: "No sandbox available. Please create a sandbox first.",
      });
      return;
    }

    console.log(
      "[Chat] Starting code application to sandbox:",
      sandboxData.sandboxId
    );
    console.log("[Chat] Code to apply:", code.substring(0, 200) + "...");
    setIsApplying(true);

    try {
      const response = await fetch("/api/v1/code/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: code,
          isEdit: false,
          packages: [],
          sandboxId: sandboxData.sandboxId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let appliedFiles: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "complete") {
                appliedFiles = data.results?.filesCreated || [];
                console.log("[Chat] Code application completed:", data.results);

                // If we have a project, get files from sandbox and save to database
                if (projectData && appliedFiles.length > 0) {
                  console.log(
                    "[Chat] Getting files from sandbox to save to database..."
                  );
                  console.log("[Chat] Applied files:", appliedFiles);
                  console.log("[Chat] Sandbox ID:", sandboxData.sandboxId);

                  try {
                    // Get files from the sandbox using the manifest endpoint
                    const manifestResponse = await fetch(
                      "/api/v1/sandbox/files/manifest"
                    );

                    console.log(
                      "[Chat] Manifest response status:",
                      manifestResponse.status
                    );
                    const manifestData = await manifestResponse.json();
                    console.log("[Chat] Manifest response data:", manifestData);

                    if (manifestData.success && manifestData.files) {
                      const files = manifestData.files;
                      console.log(
                        "[Chat] Saving files to database:",
                        Object.keys(files).length,
                        "files"
                      );
                      console.log("[Chat] File paths:", Object.keys(files));

                      await updateProjectFiles(files);
                    } else {
                      console.error(
                        "[Chat] Invalid manifest response:",
                        manifestData
                      );
                      addMessage({
                        role: "system",
                        content: `Warning: Files applied to sandbox but couldn't retrieve them for database save: ${
                          manifestData.error || "Unknown error"
                        }`,
                      });
                    }
                  } catch (manifestError) {
                    console.error(
                      "[Chat] Failed to get files from sandbox:",
                      manifestError
                    );
                    addMessage({
                      role: "system",
                      content: `Warning: Files applied to sandbox but couldn't save to database: ${manifestError}`,
                    });
                  }
                }

                addMessage({
                  role: "system",
                  content: `Successfully applied ${
                    appliedFiles.length
                  } files to your sandbox! ${
                    projectData ? "Files saved to database." : ""
                  } The preview should update shortly.`,
                  metadata: { appliedFiles },
                });

                // Force refresh the preview after a short delay
                setTimeout(() => {
                  console.log("[Chat] Triggering preview refresh");
                  window.dispatchEvent(new CustomEvent("refreshPreview"));
                }, 2000);
              } else if (data.type === "error") {
                console.log("[Chat] Apply error:", data.error);
                addMessage({
                  role: "system",
                  content: `Apply error: ${data.error}`,
                });
              } else {
                console.log("[Chat] Apply progress:", data.type, data);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      addMessage({
        role: "system",
        content: `Error applying code: ${error}`,
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="h-screen bg-bk-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-bk-40 border-b border-bd-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Tabs */}
          <TabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            projectData={projectData}
            sandboxData={sandboxData}
          />

          {/* Live Preview Status (only show when preview tab is active and sandbox exists) */}
          {activeTab === "preview" && sandboxData && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-fg-50 text-[11px] font-medium">
                Live Preview
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Project Info and Actions */}
          <ProjectInfo
            projectData={projectData}
            isSavingProject={isSavingProject}
            onCreateProject={() => {
              const name = prompt("Enter project name:", "My App");
              if (name) {
                const description = prompt(
                  "Enter project description (optional):",
                  ""
                );
                createProject(name, description || undefined);
              }
            }}
            onSyncProject={syncProjectToSandbox}
            sandboxData={sandboxData}
          />

          {/* Preview Controls (only show when preview tab is active and sandbox exists) */}
          {activeTab === "preview" && sandboxData && (
            <>
              {/* Refresh Button */}
              <button
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("refreshPreview"))
                }
                className="px-2 py-1 text-[10px] bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                title="Refresh preview"
              >
                Refresh
              </button>

              {/* Open in New Tab */}
              <a
                href={sandboxData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-fg-60 hover:text-fg-50 hover:bg-bk-50 rounded transition-colors"
                title="Open in new tab"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </>
          )}

          {/* Sandbox Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-bk-50 rounded-lg">
            <div
              className={`w-2 h-2 rounded-full ${
                sandboxData ? "bg-green-400" : "bg-red-400"
              }`}
            />
            <span className="text-fg-60 text-[10px]">
              {sandboxData ? "Sandbox Active" : "No Sandbox"}
            </span>
          </div>

          {/* Create Sandbox Button */}
          {!sandboxData && (
            <button
              onClick={createSandbox}
              disabled={isCreatingSandbox}
              className="px-3 py-1.5 text-[11px] bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 disabled:opacity-50 transition-colors"
            >
              {isCreatingSandbox ? "Creating..." : "Create Sandbox"}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Preview/Code */}
        <div className="flex-1 flex flex-col">
          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "preview" ? (
              <PreviewPanel sandboxData={sandboxData} />
            ) : activeTab === "code" ? (
              <CodePanel
                generatedCode={generatedCode}
                isGenerating={isGenerating}
                sandboxData={sandboxData}
              />
            ) : activeTab === "files" ? (
              <FilesPanel projectData={projectData} />
            ) : activeTab === "versions" ? (
              <VersionPanel
                projectId={projectData?.id || null}
                onMessage={(
                  message: string,
                  type: "success" | "error" | "info"
                ) => {
                  addMessage({
                    role: "system",
                    content: message,
                    metadata: {},
                  });
                }}
              />
            ) : null}
          </div>
        </div>

        {/* Right Panel - Chat */}
        <ResizablePanel
          defaultWidth={400}
          minWidth={350}
          maxWidth={600}
          position="right"
          className="z-10"
        >
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
            isApplying={isApplying}
            sandboxData={sandboxData}
          />
        </ResizablePanel>
      </div>
    </div>
  );
}
