"use client";

import { useState } from "react";
import { CreateProject } from "./_components/create-project";
import { ListProjects } from "./_components/list-projects";
import { GetProject } from "./_components/get-project";
import { UpdateProject } from "./_components/update-project";
import { DeleteProject } from "./_components/delete-project";
import { ProjectFiles } from "./_components/project-files";
import { ProjectSync } from "./_components/project-sync";

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
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  category: "Projects" | "Files" | "Utility" | "Sync";
}

const API_ENDPOINTS: ApiEndpoint[] = [
  // Project Management APIs
  {
    id: "projects-list",
    method: "GET",
    path: "/api/v1/projects",
    description: "List all projects with pagination",
    category: "Projects",
  },
  {
    id: "projects-create",
    method: "POST",
    path: "/api/v1/projects",
    description: "Create a new project",
    category: "Projects",
  },
  {
    id: "projects-get",
    method: "GET",
    path: "/api/v1/projects/[id]",
    description: "Get single project by ID",
    category: "Projects",
  },
  {
    id: "projects-update",
    method: "PUT",
    path: "/api/v1/projects/[id]",
    description: "Update project details",
    category: "Projects",
  },
  {
    id: "projects-delete",
    method: "DELETE",
    path: "/api/v1/projects/[id]",
    description: "Delete project (soft delete)",
    category: "Projects",
  },

  // File Management APIs
  {
    id: "files-get",
    method: "GET",
    path: "/api/v1/projects/[id]/files",
    description: "Get project files only",
    category: "Files",
  },
  {
    id: "files-update",
    method: "PUT",
    path: "/api/v1/projects/[id]/files",
    description: "Update project files",
    category: "Files",
  },

  // Sync APIs
  {
    id: "sync-project",
    method: "POST",
    path: "/api/v1/projects/[id]/sync",
    description: "Sync project to live sandbox",
    category: "Sync",
  },
  {
    id: "sync-status",
    method: "GET",
    path: "/api/v1/projects/[id]/sync",
    description: "Get project sync status",
    category: "Sync",
  },
];

// Main projects testing page with sidebar layout
export default function ProjectsTestPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] =
    useState<string>("projects-list");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Add message to the message panel
  const addMessage = (text: string, type: "success" | "error" | "info") => {
    const newMessage = {
      id: Date.now().toString(),
      text,
      type,
      timestamp: new Date(),
    };
    setMessages((prev) => [newMessage, ...prev].slice(0, 100)); // Keep last 100 messages
  };

  // Clear all messages
  const clearMessages = () => {
    setMessages([]);
  };

  const selectedEndpointData = API_ENDPOINTS.find(
    (ep) => ep.id === selectedEndpoint
  );

  // Group endpoints by category
  const projectEndpoints = API_ENDPOINTS.filter(
    (ep) => ep.category === "Projects"
  );
  const fileEndpoints = API_ENDPOINTS.filter((ep) => ep.category === "Files");
  const syncEndpoints = API_ENDPOINTS.filter((ep) => ep.category === "Sync");

  // Render the appropriate component for the selected endpoint
  const renderEndpointControls = () => {
    switch (selectedEndpoint) {
      case "projects-list":
        return (
          <ListProjects
            onMessage={addMessage}
            onProjectSelect={setSelectedProjectId}
          />
        );
      case "projects-create":
        return (
          <CreateProject
            onMessage={addMessage}
            onProjectCreated={(project) => {
              setSelectedProjectId(project.id);
              addMessage(
                `Project created: ${project.name} (${project.id})`,
                "success"
              );
            }}
          />
        );
      case "projects-get":
        return (
          <GetProject
            onMessage={addMessage}
            selectedProjectId={selectedProjectId}
            onProjectIdChange={setSelectedProjectId}
          />
        );
      case "projects-update":
        return (
          <UpdateProject
            onMessage={addMessage}
            selectedProjectId={selectedProjectId}
            onProjectIdChange={setSelectedProjectId}
          />
        );
      case "projects-delete":
        return (
          <DeleteProject
            onMessage={addMessage}
            selectedProjectId={selectedProjectId}
            onProjectIdChange={setSelectedProjectId}
          />
        );
      case "files-get":
        return (
          <ProjectFiles
            onMessage={addMessage}
            selectedProjectId={selectedProjectId}
            onProjectIdChange={setSelectedProjectId}
            mode="get"
          />
        );
      case "files-update":
        return (
          <ProjectFiles
            onMessage={addMessage}
            selectedProjectId={selectedProjectId}
            onProjectIdChange={setSelectedProjectId}
            mode="update"
          />
        );
      case "sync-project":
      case "sync-status":
        return (
          <ProjectSync
            onMessage={addMessage}
            selectedProjectId={selectedProjectId}
            onProjectIdChange={setSelectedProjectId}
          />
        );

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
          Projects API Testing Suite
        </h1>
        <p className="text-fg-60 text-[11px] mt-1">
          Interactive testing for V1 Projects Management APIs
        </p>
        {selectedProjectId && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-fg-60 text-[10px]">Selected Project:</span>
            <span className="text-blue-400 text-[10px] font-mono">
              {selectedProjectId}
            </span>
            <button
              onClick={() => setSelectedProjectId("")}
              className="text-fg-60 hover:text-fg-50 text-[10px] ml-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative overflow-hidden min-h-0 min-w-0">
        {/* Left Sidebar - API Endpoints List */}
        <ResizablePanel
          defaultWidth={300}
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
              {/* Project APIs */}
              <div className="border-b border-bd-50">
                <div className="p-2 bg-bk-50">
                  <span className="text-fg-60 text-[10px] font-medium uppercase tracking-wide">
                    Projects
                  </span>
                </div>
                {projectEndpoints.map((endpoint) => (
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
                            : endpoint.method === "PUT"
                            ? "bg-yellow-500/20 text-yellow-400"
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

              {/* File APIs */}
              <div className="border-b border-bd-50">
                <div className="p-2 bg-bk-50">
                  <span className="text-fg-60 text-[10px] font-medium uppercase tracking-wide">
                    Files
                  </span>
                </div>
                {fileEndpoints.map((endpoint) => (
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
                            : endpoint.method === "PUT"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-blue-500/20 text-blue-400"
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

              {/* Sync APIs */}
              <div>
                <div className="p-2 bg-bk-50">
                  <span className="text-fg-60 text-[10px] font-medium uppercase tracking-wide">
                    Sync
                  </span>
                </div>
                {syncEndpoints.map((endpoint) => (
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
                            : "bg-yellow-500/20 text-yellow-400"
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
          defaultWidth={450}
          minWidth={400}
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
                      : selectedEndpointData?.method === "PUT"
                      ? "bg-yellow-500/20 text-yellow-400"
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
