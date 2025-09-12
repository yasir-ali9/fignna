"use client";

import { useState, useEffect } from "react";
import { EditorProvider } from "@/modules/project/providers/editor-provider";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { observer } from "mobx-react-lite";

// Test component to verify chat integration
function ChatIntegrationTestInner() {
  const engine = useEditorEngine();
  const [projectId, setProjectId] = useState<string>("");
  const [testResults, setTestResults] = useState<string[]>([]);

  // Add test result
  const addResult = (message: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  // Test project creation and chat initialization
  const testProjectAndChatCreation = async () => {
    try {
      addResult("Creating test project...");

      // Create a test project
      const response = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Chat Integration Test",
          description: "Testing chat functionality",
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      const newProjectId = result.data.project.id;
      setProjectId(newProjectId);
      addResult(`Project created: ${newProjectId}`);

      // Load project in engine
      addResult("Loading project in engine...");
      await engine.projects.loadProject(newProjectId);
      addResult("Project loaded successfully");

      // Initialize chat
      addResult("Initializing chat...");
      await engine.chat.loadProjectChats(newProjectId);
      addResult(
        `Chat initialized. Active chat: ${
          engine.chat.activeChat?.name || "None"
        }`
      );
      addResult(`Total chats: ${engine.chat.chats.length}`);
    } catch (error) {
      addResult(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  // Test sending a message
  const testSendMessage = async () => {
    if (!engine.chat.activeChat) {
      addResult("Error: No active chat");
      return;
    }

    try {
      addResult("Sending test message...");
      await engine.chat.sendMessage("Create a simple hello world component");
      addResult("Message sent successfully");
      addResult(`Messages in chat: ${engine.chat.messages.length}`);
    } catch (error) {
      addResult(
        `Error sending message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Test creating a new chat
  const testCreateNewChat = async () => {
    if (!engine.projects.currentProject) {
      addResult("Error: No current project");
      return;
    }

    try {
      addResult("Creating new chat...");
      await engine.chat.createChat(
        engine.projects.currentProject.id,
        "Test Chat 2"
      );
      addResult("New chat created successfully");
      addResult(`Total chats: ${engine.chat.chats.length}`);
      addResult(`Active chat: ${engine.chat.activeChat?.name || "None"}`);
    } catch (error) {
      addResult(
        `Error creating chat: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Clear results
  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-bk-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-fg-70 mb-6">
          Chat Integration Test
        </h1>

        {/* Test Controls */}
        <div className="bg-bk-40 p-6 rounded-lg mb-6">
          <h2 className="text-lg font-semibold text-fg-60 mb-4">
            Test Controls
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={testProjectAndChatCreation}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
            >
              1. Create Project & Initialize Chat
            </button>
            <button
              onClick={testSendMessage}
              disabled={!engine.chat.activeChat}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              2. Send Test Message
            </button>
            <button
              onClick={testCreateNewChat}
              disabled={!engine.projects.currentProject}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              3. Create New Chat
            </button>
            <button
              onClick={clearResults}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 cursor-pointer"
            >
              Clear Results
            </button>
          </div>
        </div>

        {/* Current State */}
        <div className="bg-bk-40 p-6 rounded-lg mb-6">
          <h2 className="text-lg font-semibold text-fg-60 mb-4">
            Current State
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong className="text-fg-70">Project ID:</strong>
              <div className="text-fg-50">{projectId || "None"}</div>
            </div>
            <div>
              <strong className="text-fg-70">Current Project:</strong>
              <div className="text-fg-50">
                {engine.projects.currentProject?.name || "None"}
              </div>
            </div>
            <div>
              <strong className="text-fg-70">Active Chat:</strong>
              <div className="text-fg-50">
                {engine.chat.activeChat?.name || "None"}
              </div>
            </div>
            <div>
              <strong className="text-fg-70">Total Chats:</strong>
              <div className="text-fg-50">{engine.chat.chats.length}</div>
            </div>
            <div>
              <strong className="text-fg-70">Messages in Active Chat:</strong>
              <div className="text-fg-50">{engine.chat.messages.length}</div>
            </div>
            <div>
              <strong className="text-fg-70">Chat Status:</strong>
              <div className="text-fg-50">
                {engine.chat.isLoadingChats
                  ? "Loading..."
                  : engine.chat.isSendingMessage
                  ? "Sending..."
                  : engine.chat.isStreaming
                  ? "Streaming..."
                  : "Ready"}
              </div>
            </div>
          </div>
          {engine.chat.error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
              <strong>Error:</strong> {engine.chat.error}
            </div>
          )}
        </div>

        {/* Test Results */}
        <div className="bg-bk-40 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-fg-60 mb-4">
            Test Results
          </h2>
          <div className="bg-bk-60 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <div className="text-fg-30">
                No test results yet. Run a test to see results.
              </div>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-fg-50 mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const ObservedChatIntegrationTestInner = observer(ChatIntegrationTestInner);

export default function ChatIntegrationTest() {
  return (
    <EditorProvider>
      <ObservedChatIntegrationTestInner />
    </EditorProvider>
  );
}
