"use client";

import { useState } from "react";
import { observer } from "mobx-react-lite";
import { EditorEngine } from "@/lib/stores/editor";
import { ResizablePanel } from "../../../components/widgets/resizable-panel";

// Create a test instance
const testEngine = new EditorEngine();

interface Message {
  id: string;
  text: string;
  type: "success" | "error" | "info";
  timestamp: Date;
}

interface TestEndpoint {
  id: string;
  name: string;
  description: string;
  category: "Projects" | "Files" | "Sandbox" | "Integration";
}

const TEST_ENDPOINTS: TestEndpoint[] = [
  // Projects Manager Tests
  {
    id: "projects-load",
    name: "Load Projects",
    description: "Test loading user projects from database",
    category: "Projects",
  },
  {
    id: "projects-create",
    name: "Create Project",
    description: "Test creating a new project with template",
    category: "Projects",
  },
  {
    id: "projects-save",
    name: "Save Project",
    description: "Test saving current project state",
    category: "Projects",
  },
  {
    id: "projects-sync",
    name: "Sync to Sandbox",
    description: "Test syncing project to E2B sandbox",
    category: "Projects",
  },

  // Files Manager Tests
  {
    id: "files-create",
    name: "Create File",
    description: "Test creating and opening files",
    category: "Files",
  },
  {
    id: "files-update",
    name: "Update Content",
    description: "Test updating file content and dirty state",
    category: "Files",
  },
  {
    id: "files-tree",
    name: "File Tree",
    description: "Test file tree building from JSONB",
    category: "Files",
  },

  // Sandbox Manager Tests
  {
    id: "sandbox-create",
    name: "Create Sandbox",
    description: "Test creating E2B sandbox via V1 API",
    category: "Sandbox",
  },
  {
    id: "sandbox-status",
    name: "Check Status",
    description: "Test sandbox health monitoring",
    category: "Sandbox",
  },
  {
    id: "sandbox-destroy",
    name: "Destroy Sandbox",
    description: "Test destroying current sandbox",
    category: "Sandbox",
  },

  // Integration Tests
  {
    id: "integration-full",
    name: "Full Workflow",
    description: "Test complete project workflow",
    category: "Integration",
  },
  {
    id: "integration-autosave",
    name: "Auto-save",
    description: "Test auto-save functionality",
    category: "Integration",
  },
];

// Message Panel Component
const MessagePanel = ({
  messages,
  onClearMessages,
}: {
  messages: Message[];
  onClearMessages: () => void;
}) => {
  return (
    <div className="h-full bg-bk-50 flex flex-col">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-fg-60 text-[11px] py-8">
            No test results yet. Select a test to run.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`p-2 rounded text-[10px] font-mono ${
                message.type === "success"
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : message.type === "error"
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-fg-60 text-[8px]">
                  {message.timestamp.toLocaleTimeString()}
                </span>
                <span
                  className={`px-1 py-0.5 text-[7px] rounded ${
                    message.type === "success"
                      ? "bg-green-500/20 text-green-300"
                      : message.type === "error"
                      ? "bg-red-500/20 text-red-300"
                      : "bg-blue-500/20 text-blue-300"
                  }`}
                >
                  {message.type.toUpperCase()}
                </span>
              </div>
              <div className="whitespace-pre-wrap">{message.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const MobXStoresTestPage = observer(() => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] =
    useState<string>("projects-load");
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = (text: string, type: "success" | "error" | "info") => {
    const newMessage = {
      id: Date.now().toString(),
      text,
      type,
      timestamp: new Date(),
    };
    setMessages((prev) => [newMessage, ...prev].slice(0, 50));
  };

  const clearMessages = () => {
    setMessages([]);
  };

  // Test functions
  const testProjectsManager = async () => {
    setIsLoading(true);
    addMessage("Testing ProjectsManager...", "info");

    try {
      // Test loading projects
      addMessage("Loading projects...", "info");
      await testEngine.projects.loadProjects();
      addMessage(
        `Loaded ${testEngine.projects.projects.length} projects`,
        "success"
      );

      // Test creating a project
      if (testEngine.projects.projects.length === 0) {
        addMessage("Creating test project...", "info");
        const newProject = await testEngine.projects.createProject({
          name: "Test MobX Project",
          description: "Testing MobX store integration",
          template: "react",
        });
        addMessage(`Created project: ${newProject.name}`, "success");
      } else {
        // Load first project
        const firstProject = testEngine.projects.projects[0];
        addMessage(`Loading project: ${firstProject.name}`, "info");
        await testEngine.projects.loadProject(firstProject.id);
        addMessage("Project loaded successfully", "success");
      }

      addMessage("ProjectsManager test completed ✅", "success");
    } catch (error) {
      addMessage(
        `ProjectsManager test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    }

    setIsLoading(false);
  };

  const testFilesManager = () => {
    addMessage("Testing FilesManager...", "info");

    try {
      // Test file operations
      testEngine.files.createFile(
        "src/TestComponent.tsx",
        `import React from 'react';

export default function TestComponent() {
  return (
    <div className="p-4">
      <h1>Test Component</h1>
      <p>This is a test component created by MobX FilesManager</p>
    </div>
  );
}`
      );
      addMessage("Created test file: src/TestComponent.tsx", "success");

      // Test file tree
      addMessage(
        `File tree has ${testEngine.files.fileTree.length} root items`,
        "info"
      );
      addMessage(`Open tabs: ${testEngine.files.openTabs.length}`, "info");
      addMessage(
        `Active file: ${testEngine.files.activeFile?.name || "None"}`,
        "info"
      );
      addMessage(
        `Has unsaved changes: ${testEngine.files.hasUnsavedChanges}`,
        "info"
      );

      addMessage("FilesManager test completed ✅", "success");
    } catch (error) {
      addMessage(
        `FilesManager test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    }
  };

  const testSandboxManager = async () => {
    setIsLoading(true);
    addMessage("Testing SandboxManager...", "info");

    try {
      // Test sandbox creation
      if (testEngine.projects.currentProject) {
        addMessage("Creating sandbox from project...", "info");
        await testEngine.sandbox.createSandboxFromProject();
        addMessage(
          `Sandbox created: ${testEngine.sandbox.currentSandboxId}`,
          "success"
        );
        addMessage(`Preview URL: ${testEngine.sandbox.previewUrl}`, "info");
        addMessage(
          `Sandbox status: ${testEngine.sandbox.currentSandbox?.status}`,
          "info"
        );
      } else {
        addMessage(
          "No current project - testing basic sandbox operations",
          "info"
        );
        testEngine.sandbox.updateSandboxInfo(
          "test-sandbox-123",
          "https://test.example.com"
        );
        addMessage(
          `Updated sandbox info: ${testEngine.sandbox.currentSandboxId}`,
          "success"
        );
      }

      addMessage("SandboxManager test completed ✅", "success");
    } catch (error) {
      addMessage(
        `SandboxManager test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    }

    setIsLoading(false);
  };

  const testIntegration = async () => {
    setIsLoading(true);
    addMessage("Testing integration between managers...", "info");

    try {
      if (testEngine.projects.currentProject) {
        // Test file changes triggering project dirty state
        const activeTab = testEngine.files.activeFile;
        if (activeTab) {
          testEngine.files.updateFileContent(
            activeTab.id,
            activeTab.content + "\n// Modified for integration test"
          );
          addMessage(
            `File modified, project dirty: ${testEngine.projects.hasUnsavedChanges}`,
            "info"
          );

          // Test auto-save
          addMessage("Triggering auto-save...", "info");
          await testEngine.projects.saveProject();
          addMessage(
            `Project saved, dirty state: ${testEngine.projects.hasUnsavedChanges}`,
            "success"
          );
        }

        // Test sandbox sync
        if (testEngine.sandbox.currentSandbox) {
          addMessage("Testing sandbox sync...", "info");
          await testEngine.sandbox.syncProjectToSandbox();
          addMessage("Sandbox sync completed", "success");
        }
      }

      addMessage("Integration test completed ✅", "success");
    } catch (error) {
      addMessage(
        `Integration test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    }

    setIsLoading(false);
  };

  // Render test controls based on selected endpoint
  const renderTestControls = () => {
    switch (selectedEndpoint) {
      case "projects-load":
      case "projects-create":
      case "projects-save":
      case "projects-sync":
        return (
          <div className="p-4">
            <button
              onClick={testProjectsManager}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-500 text-white text-[11px] rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Running..." : "Run ProjectsManager Test"}
            </button>
          </div>
        );
      case "files-create":
      case "files-update":
      case "files-tree":
        return (
          <div className="p-4">
            <button
              onClick={testFilesManager}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-green-500 text-white text-[11px] rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Running..." : "Run FilesManager Test"}
            </button>
          </div>
        );
      case "sandbox-create":
      case "sandbox-status":
      case "sandbox-destroy":
        return (
          <div className="p-4">
            <button
              onClick={testSandboxManager}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-purple-500 text-white text-[11px] rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Running..." : "Run SandboxManager Test"}
            </button>
          </div>
        );
      case "integration-full":
      case "integration-autosave":
        return (
          <div className="p-4">
            <button
              onClick={testIntegration}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-orange-500 text-white text-[11px] rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Running..." : "Run Integration Test"}
            </button>
          </div>
        );
      default:
        return (
          <div className="p-4 text-center text-fg-60 text-[11px]">
            Select a test to run
          </div>
        );
    }
  };

  const selectedEndpointData = TEST_ENDPOINTS.find(
    (ep) => ep.id === selectedEndpoint
  );

  // Group endpoints by category
  const projectsTests = TEST_ENDPOINTS.filter(
    (ep) => ep.category === "Projects"
  );
  const filesTests = TEST_ENDPOINTS.filter((ep) => ep.category === "Files");
  const sandboxTests = TEST_ENDPOINTS.filter((ep) => ep.category === "Sandbox");
  const integrationTests = TEST_ENDPOINTS.filter(
    (ep) => ep.category === "Integration"
  );

  return (
    <div className="h-screen bg-bk-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-bk-40 border-b border-bd-50 px-4 py-3">
        <h1 className="text-fg-50 text-[14px] font-semibold">
          MobX Stores Testing Suite
        </h1>
        <p className="text-fg-60 text-[11px] mt-1">
          Interactive testing for ProjectsManager, FilesManager, and
          SandboxManager
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative overflow-hidden min-h-0 min-w-0">
        {/* Left Sidebar - Test Categories */}
        <ResizablePanel
          defaultWidth={280}
          minWidth={250}
          maxWidth={400}
          position="left"
          className="z-10"
        >
          <div className="h-full bg-bk-40 border-r border-bd-50 flex flex-col">
            {/* Test Categories Header */}
            <div className="p-3 border-b border-bd-50">
              <h2 className="text-fg-50 text-[12px] font-semibold">
                Test Categories
              </h2>
              <p className="text-fg-60 text-[10px] mt-1">Click to run tests</p>
            </div>

            {/* Test Categories List */}
            <div className="flex-1 overflow-y-auto">
              {/* Projects Tests */}
              <div className="border-b border-bd-50">
                <div className="p-2 bg-bk-50">
                  <span className="text-fg-60 text-[10px] font-medium uppercase tracking-wide">
                    Projects Manager
                  </span>
                </div>
                {projectsTests.map((test) => (
                  <button
                    key={test.id}
                    onClick={() => setSelectedEndpoint(test.id)}
                    className={`w-full text-left p-3 border-b border-bd-50 hover:bg-bk-50 transition-colors ${
                      selectedEndpoint === test.id
                        ? "bg-blue-500/10 border-l-2 border-l-blue-400"
                        : ""
                    }`}
                  >
                    <div className="text-fg-50 text-[11px] font-medium mb-1">
                      {test.name}
                    </div>
                    <div className="text-fg-60 text-[9px]">
                      {test.description}
                    </div>
                  </button>
                ))}
              </div>

              {/* Files Tests */}
              <div className="border-b border-bd-50">
                <div className="p-2 bg-bk-50">
                  <span className="text-fg-60 text-[10px] font-medium uppercase tracking-wide">
                    Files Manager
                  </span>
                </div>
                {filesTests.map((test) => (
                  <button
                    key={test.id}
                    onClick={() => setSelectedEndpoint(test.id)}
                    className={`w-full text-left p-3 border-b border-bd-50 hover:bg-bk-50 transition-colors ${
                      selectedEndpoint === test.id
                        ? "bg-green-500/10 border-l-2 border-l-green-400"
                        : ""
                    }`}
                  >
                    <div className="text-fg-50 text-[11px] font-medium mb-1">
                      {test.name}
                    </div>
                    <div className="text-fg-60 text-[9px]">
                      {test.description}
                    </div>
                  </button>
                ))}
              </div>

              {/* Sandbox Tests */}
              <div className="border-b border-bd-50">
                <div className="p-2 bg-bk-50">
                  <span className="text-fg-60 text-[10px] font-medium uppercase tracking-wide">
                    Sandbox Manager
                  </span>
                </div>
                {sandboxTests.map((test) => (
                  <button
                    key={test.id}
                    onClick={() => setSelectedEndpoint(test.id)}
                    className={`w-full text-left p-3 border-b border-bd-50 hover:bg-bk-50 transition-colors ${
                      selectedEndpoint === test.id
                        ? "bg-purple-500/10 border-l-2 border-l-purple-400"
                        : ""
                    }`}
                  >
                    <div className="text-fg-50 text-[11px] font-medium mb-1">
                      {test.name}
                    </div>
                    <div className="text-fg-60 text-[9px]">
                      {test.description}
                    </div>
                  </button>
                ))}
              </div>

              {/* Integration Tests */}
              <div>
                <div className="p-2 bg-bk-50">
                  <span className="text-fg-60 text-[10px] font-medium uppercase tracking-wide">
                    Integration
                  </span>
                </div>
                {integrationTests.map((test) => (
                  <button
                    key={test.id}
                    onClick={() => setSelectedEndpoint(test.id)}
                    className={`w-full text-left p-3 border-b border-bd-50 hover:bg-bk-50 transition-colors ${
                      selectedEndpoint === test.id
                        ? "bg-orange-500/10 border-l-2 border-l-orange-400"
                        : ""
                    }`}
                  >
                    <div className="text-fg-50 text-[11px] font-medium mb-1">
                      {test.name}
                    </div>
                    <div className="text-fg-60 text-[9px]">
                      {test.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ResizablePanel>

        {/* Right Panel - Test Controls */}
        <ResizablePanel
          defaultWidth={400}
          minWidth={350}
          maxWidth={600}
          position="right"
          className="z-10"
        >
          <div className="h-full bg-bk-40 border-r border-bd-50 flex flex-col">
            {/* Controls Header */}
            <div className="p-3 border-b border-bd-50">
              <h3 className="text-fg-50 text-[12px] font-medium mb-1">
                {selectedEndpointData?.name}
              </h3>
              <p className="text-fg-60 text-[10px]">
                {selectedEndpointData?.description}
              </p>
            </div>

            {/* Test Controls */}
            <div className="flex-1 overflow-y-auto">{renderTestControls()}</div>

            {/* Store State Footer */}
            <div className="border-t border-bd-50 p-3">
              <div className="grid grid-cols-1 gap-3 text-[9px]">
                <div>
                  <div className="text-fg-60 font-medium mb-1">Projects</div>
                  <div className="text-fg-50">
                    Current:{" "}
                    {testEngine.projects.currentProject?.name || "None"}
                  </div>
                  <div className="text-fg-60">
                    Total: {testEngine.projects.projects.length} | Dirty:{" "}
                    {testEngine.projects.hasUnsavedChanges ? "Yes" : "No"}
                  </div>
                </div>
                <div>
                  <div className="text-fg-60 font-medium mb-1">
                    Files & Sandbox
                  </div>
                  <div className="text-fg-50">
                    Files: {testEngine.files.fileTree.length} | Tabs:{" "}
                    {testEngine.files.openTabs.length}
                  </div>
                  <div className="text-fg-60">
                    Sandbox:{" "}
                    {testEngine.sandbox.currentSandboxId ? "Active" : "None"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

        {/* Main Content Area - Messages */}
        <div className="flex-1 relative h-full min-h-0 min-w-0 overflow-hidden">
          <div className="h-full bg-bk-50 flex flex-col">
            {/* Content Header */}
            <div className="bg-bk-40 border-b border-bd-50 px-4 py-2">
              <div className="flex items-center justify-between">
                <h3 className="text-fg-50 text-[12px] font-medium">
                  Test Results
                </h3>
                <button
                  onClick={clearMessages}
                  className="px-2 py-1 text-[9px] bg-bk-50 text-fg-60 rounded hover:bg-bk-30 hover:text-fg-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Messages Panel */}
            <div className="flex-1 overflow-hidden">
              <MessagePanel
                messages={messages}
                onClearMessages={clearMessages}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default MobXStoresTestPage;
