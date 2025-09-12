"use client";

import { useState } from "react";
import { CreateSandbox } from "./_components/create-sandbox";
import { KillSandbox } from "./_components/kill-sandbox";
import { SandboxLogs } from "./_components/sandbox-logs";
import { ProjectLogs } from "./_components/project-logs";
import { SandboxStatus } from "./_components/sandbox-status";
import { ApiStatusChecker } from "./_components/api-status-checker";
import { ChatApiTester } from "./_components/chat-api-tester";
import { MessagePanel } from "./_components/message-panel";
import { ResizablePanel } from "../../../components/widgets/resizable-panel";

interface Message {
  id: string;
  text: string;
  type: "success" | "error" | "info";
  timestamp: Date;
}

interface ApiEndpoint {
  id: string;
  method: "GET" | "POST" | "DELETE";
  path: string;
  description: string;
  category: "Sandbox" | "Code";
}

const API_ENDPOINTS: ApiEndpoint[] = [
  // Sandbox APIs
  {
    id: "sandbox-create",
    method: "POST",
    path: "/api/v1/sandbox/create",
    description: "Create new Vite React sandbox",
    category: "Sandbox",
  },
  {
    id: "sandbox-kill",
    method: "POST",
    path: "/api/v1/sandbox/kill",
    description: "Destroy active sandbox",
    category: "Sandbox",
  },
  {
    id: "sandbox-status",
    method: "GET",
    path: "/api/v1/sandbox/status",
    description: "Check sandbox status",
    category: "Sandbox",
  },
  {
    id: "sandbox-logs-sandbox",
    method: "GET",
    path: "/api/v1/sandbox/logs/sandbox",
    description: "Get system logs",
    category: "Sandbox",
  },
  {
    id: "sandbox-logs-project",
    method: "GET",
    path: "/api/v1/sandbox/logs/project",
    description: "Get project error logs",
    category: "Sandbox",
  },

  // Chat APIs
  {
    id: "code-analyze",
    method: "POST",
    path: "/api/v1/code/analyze",
    description: "Analyze user intent for targeted edits",
    category: "Code",
  },
  {
    id: "code-generate",
    method: "POST",
    path: "/api/v1/code/generate",
    description: "Generate code with AI streaming",
    category: "Code",
  },
  {
    id: "code-apply",
    method: "POST",
    path: "/api/v1/code/apply",
    description: "Apply generated code to sandbox",
    category: "Code",
  },
];

// Main sandbox testing page with sidebar layout
export default function SandboxTestPage() {
  const [sandboxData, setSandboxData] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] =
    useState<string>("sandbox-create");

  // Add message to the message panel
  const addMessage = (text: string, type: "success" | "error" | "info") => {
    const newMessage = {
      id: Date.now().toString(),
      text,
      type,
      timestamp: new Date(),
    };
    setMessages((prev) => [newMessage, ...prev].slice(0, 50)); // Keep last 50 messages
  };

  // Handle sandbox creation
  const handleSandboxCreated = (data: any) => {
    setSandboxData(data);
  };

  // Handle sandbox destruction
  const handleSandboxKilled = () => {
    setSandboxData(null);
  };

  // Clear all messages
  const clearMessages = () => {
    setMessages([]);
  };

  const hasActiveSandbox = !!sandboxData;
  const selectedEndpointData = API_ENDPOINTS.find(
    (ep) => ep.id === selectedEndpoint
  );

  // Group endpoints by category
  const sandboxEndpoints = API_ENDPOINTS.filter(
    (ep) => ep.category === "Sandbox"
  );
  const codeEndpoints = API_ENDPOINTS.filter((ep) => ep.category === "Code");

  // Render the appropriate component for the selected endpoint
  const renderEndpointControls = () => {
    switch (selectedEndpoint) {
      case "sandbox-create":
        return (
          <CreateSandbox
            onSandboxCreated={handleSandboxCreated}
            onMessage={addMessage}
          />
        );
      case "sandbox-kill":
        return (
          <KillSandbox
            onSandboxKilled={handleSandboxKilled}
            onMessage={addMessage}
            hasActiveSandbox={hasActiveSandbox}
          />
        );
      case "sandbox-status":
        return <ApiStatusChecker onMessage={addMessage} />;
      case "sandbox-logs-sandbox":
        return (
          <SandboxLogs
            onMessage={addMessage}
            hasActiveSandbox={hasActiveSandbox}
          />
        );
      case "sandbox-logs-project":
        return (
          <ProjectLogs
            onMessage={addMessage}
            hasActiveSandbox={hasActiveSandbox}
          />
        );
      case "code-analyze":
      case "code-generate":
      case "code-apply":
        return <ChatApiTester onMessage={addMessage} />;
      default:
        return (
          <div className="p-4 text-center text-fg-60 text-[11px]">
            Select an API endpoint to test
          </div>
        );
    }
  };

  return (
    <div className="h-screen bg-bk-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-bk-40 border-b border-bd-50 px-4 py-3">
        <h1 className="text-fg-50 text-[14px] font-semibold">
          V1 API Testing Suite
        </h1>
        <p className="text-fg-60 text-[11px] mt-1">
          Interactive testing for V1 Sandbox and Chat APIs
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative overflow-hidden min-h-0 min-w-0">
        {/* Left Sidebar - API Endpoints List */}
        <ResizablePanel
          defaultWidth={280}
          minWidth={250}
          maxWidth={400}
          position="left"
          className="z-10"
        >
          <div className="h-full bg-bk-40 border-r border-bd-50 flex flex-col">
            {/* API Section Header */}
            <div className="p-3 border-b border-bd-50">
              <h2 className="text-fg-50 text-[12px] font-semibold">
                API Endpoints
              </h2>
              <p className="text-fg-60 text-[10px] mt-1">
                Click to test endpoints
              </p>
            </div>

            {/* API Endpoints List */}
            <div className="flex-1 overflow-y-auto">
              {/* Sandbox APIs */}
              <div className="border-b border-bd-50">
                <div className="p-2 bg-bk-50">
                  <span className="text-fg-60 text-[10px] font-medium uppercase tracking-wide">
                    Sandbox
                  </span>
                </div>
                {sandboxEndpoints.map((endpoint) => (
                  <button
                    key={endpoint.id}
                    onClick={() => setSelectedEndpoint(endpoint.id)}
                    className={`w-full text-left p-3 border-b border-bd-50 hover:bg-bk-50 transition-colors ${
                      selectedEndpoint === endpoint.id
                        ? "bg-blue-500/10 border-l-2 border-l-blue-400"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-1.5 py-0.5 text-[8px] font-medium rounded ${
                          endpoint.method === "GET"
                            ? "bg-green-500/20 text-green-400"
                            : endpoint.method === "POST"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {endpoint.method}
                      </span>
                      <span className="text-fg-50 text-[10px] font-medium">
                        {endpoint.category}
                      </span>
                    </div>
                    <div className="text-fg-50 text-[11px] font-mono mb-1">
                      {endpoint.path}
                    </div>
                    <div className="text-fg-60 text-[9px]">
                      {endpoint.description}
                    </div>
                  </button>
                ))}
              </div>

              {/* Code APIs */}
              <div>
                <div className="p-2 bg-bk-50">
                  <span className="text-fg-60 text-[10px] font-medium uppercase tracking-wide">
                    Code
                  </span>
                </div>
                {codeEndpoints.map((endpoint) => (
                  <button
                    key={endpoint.id}
                    onClick={() => setSelectedEndpoint(endpoint.id)}
                    className={`w-full text-left p-3 border-b border-bd-50 hover:bg-bk-50 transition-colors ${
                      selectedEndpoint === endpoint.id
                        ? "bg-blue-500/10 border-l-2 border-l-blue-400"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-1.5 py-0.5 text-[8px] font-medium rounded ${
                          endpoint.method === "GET"
                            ? "bg-green-500/20 text-green-400"
                            : endpoint.method === "POST"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {endpoint.method}
                      </span>
                      <span className="text-fg-50 text-[10px] font-medium">
                        {endpoint.category}
                      </span>
                    </div>
                    <div className="text-fg-50 text-[11px] font-mono mb-1">
                      {endpoint.path}
                    </div>
                    <div className="text-fg-60 text-[9px]">
                      {endpoint.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ResizablePanel>

        {/* Right Panel - API Controls */}
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
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-1.5 py-0.5 text-[8px] font-medium rounded ${
                    selectedEndpointData?.method === "GET"
                      ? "bg-green-500/20 text-green-400"
                      : selectedEndpointData?.method === "POST"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {selectedEndpointData?.method}
                </span>
                <h3 className="text-fg-50 text-[12px] font-medium">
                  {selectedEndpointData?.path}
                </h3>
              </div>
              <p className="text-fg-60 text-[10px]">
                {selectedEndpointData?.description}
              </p>
            </div>

            {/* API Controls */}
            <div className="flex-1 overflow-y-auto">
              {renderEndpointControls()}
            </div>

            {/* Sandbox Status Footer */}
            <div className="border-t border-bd-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-fg-60 text-[10px] font-medium">
                  Sandbox Status
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      hasActiveSandbox ? "bg-green-400" : "bg-red-400"
                    }`}
                  />
                  <span className="text-fg-60 text-[10px]">
                    {hasActiveSandbox ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              {hasActiveSandbox && sandboxData && (
                <div className="mt-2">
                  <div className="text-[9px] text-fg-60 mb-1">Sandbox URL</div>
                  <div className="text-[9px] text-blue-400 font-mono">
                    <a
                      href={sandboxData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-300 transition-colors"
                    >
                      {sandboxData.url}
                    </a>
                  </div>
                </div>
              )}
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
                  API Response Monitor
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
}
