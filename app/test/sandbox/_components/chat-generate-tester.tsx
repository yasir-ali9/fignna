"use client";

import { useState } from "react";

interface ChatGenerateTesterProps {
  onMessage: (text: string, type: "success" | "error" | "info") => void;
}

interface StreamResponse {
  type: "status" | "stream" | "conversation" | "complete" | "error";
  message?: string;
  text?: string;
  error?: string;
  generatedCode?: string;
  conversationId?: string;
  version?: string;
  isInTag?: boolean;
}

// Component for testing the V1 chat generate API endpoint
export function ChatGenerateTester({ onMessage }: ChatGenerateTesterProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("openai/gpt-4o-mini");
  const [isEdit, setIsEdit] = useState(false);
  const [streamOutput, setStreamOutput] = useState("");
  const [conversationOutput, setConversationOutput] = useState("");

  // Test the generate API
  const testGenerate = async () => {
    if (!prompt.trim()) {
      onMessage("Please enter a prompt", "error");
      return;
    }

    setIsGenerating(true);
    setStreamOutput("");
    setConversationOutput("");

    try {
      const response = await fetch("/api/v1/code/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model,
          isEdit,
          context: {
            sandboxId: "test-sandbox",
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data: StreamResponse = JSON.parse(line.slice(6));

              switch (data.type) {
                case "status":
                  onMessage(`Status: ${data.message}`, "info");
                  break;
                case "stream":
                  if (data.text) {
                    setStreamOutput((prev) => prev + data.text);
                  }
                  break;
                case "conversation":
                  if (data.text) {
                    setConversationOutput((prev) => prev + data.text + "\n");
                  }
                  break;
                case "complete":
                  onMessage(
                    `Generation completed! Conversation ID: ${data.conversationId}`,
                    "success"
                  );
                  break;
                case "error":
                  onMessage(`Error: ${data.error}`, "error");
                  break;
              }
            } catch (e) {
              // Ignore parse errors for incomplete JSON
            }
          }
        }
      }
    } catch (error) {
      onMessage(`Generate API error: ${error}`, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear outputs
  const clearOutputs = () => {
    setStreamOutput("");
    setConversationOutput("");
  };

  return (
    <div className="p-3 border-b border-bd-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-fg-50 text-[11px] font-medium">
          Chat Generate API Test
        </span>
        <div
          className={`w-2 h-2 rounded-full ${
            isGenerating ? "bg-yellow-400" : "bg-green-400"
          }`}
        />
      </div>

      {/* Prompt Input */}
      <div className="mb-2">
        <label className="block text-[10px] text-fg-60 font-medium mb-1">
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your code generation prompt..."
          className="w-full px-2 py-1 text-[10px] bg-bk-50 border border-bd-50 rounded resize-none"
          rows={3}
          disabled={isGenerating}
        />
      </div>

      {/* Model Selection */}
      <div className="mb-2">
        <label className="block text-[10px] text-fg-60 font-medium mb-1">
          Model
        </label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full px-2 py-1 text-[10px] bg-bk-50 border border-bd-50 rounded"
          disabled={isGenerating}
        >
          <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini</option>
          <option value="openai/gpt-4o">OpenAI GPT-4o</option>
          <option value="openai/gpt-oss-20b">Groq Llama (Fast)</option>
          <option value="anthropic/claude-3-haiku-20240307">
            Claude 3 Haiku
          </option>
          <option value="anthropic/claude-3-sonnet-20240229">
            Claude 3 Sonnet
          </option>
        </select>
      </div>

      {/* Edit Mode Toggle */}
      <div className="mb-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isEdit}
            onChange={(e) => setIsEdit(e.target.checked)}
            className="w-3 h-3"
            disabled={isGenerating}
          />
          <span className="text-[10px] text-fg-60">
            Edit Mode (modify existing code)
          </span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1 mb-2">
        <button
          onClick={testGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="flex-1 px-3 py-2 text-[11px] bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? "Generating..." : "Generate Code"}
        </button>
        <button
          onClick={clearOutputs}
          className="px-3 py-2 text-[11px] bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Stream Output */}
      {streamOutput && (
        <div className="mb-2">
          <div className="text-[10px] text-fg-60 font-medium mb-1">
            Generated Code Stream:
          </div>
          <div className="bg-bk-40 rounded p-2 max-h-40 overflow-y-auto">
            <pre className="text-[9px] text-fg-50 whitespace-pre-wrap font-mono">
              {streamOutput}
            </pre>
          </div>
        </div>
      )}

      {/* Conversation Output */}
      {conversationOutput && (
        <div className="mb-2">
          <div className="text-[10px] text-fg-60 font-medium mb-1">
            AI Conversation:
          </div>
          <div className="bg-bk-40 rounded p-2 max-h-32 overflow-y-auto">
            <pre className="text-[9px] text-fg-50 whitespace-pre-wrap">
              {conversationOutput}
            </pre>
          </div>
        </div>
      )}

      {/* API Info */}
      <div className="text-[9px] text-fg-60 mt-2 p-2 bg-bk-40 rounded">
        <div>
          <strong>Endpoint:</strong> POST /api/v1/code/generate
        </div>
        <div>
          <strong>Features:</strong> Streaming, Conversation Memory, Multi-Model
        </div>
        <div>
          <strong>Status:</strong> {isGenerating ? "Active" : "Ready"}
        </div>
      </div>
    </div>
  );
}
