"use client";

import { useState, useRef, useEffect } from "react";

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

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isGenerating: boolean;
  isApplying: boolean;
  sandboxData: SandboxData | null;
}

export function ChatPanel({
  messages,
  onSendMessage,
  isGenerating,
  isApplying,
  sandboxData,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isGenerating && !isApplying) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="h-full bg-bk-40 flex flex-col">
      {/* Chat Header */}
      <div className="p-3 border-b border-bd-50">
        <h3 className="text-fg-50 text-[12px] font-medium">AI Assistant</h3>
        <p className="text-fg-60 text-[10px] mt-1">
          Describe what you want to build
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-3">
        {messages.map((message) => (
          <div key={message.id} className="block">
            <div
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : message.role === "system"
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    : "bg-bk-50 text-fg-50"
                }`}
              >
                <div className="text-[11px] leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>

                {/* Show applied files if available */}
                {message.metadata?.appliedFiles && (
                  <div className="mt-2 pt-2 border-t border-bd-50/30">
                    <div className="text-[9px] text-fg-60 mb-1">
                      Applied Files:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {message.metadata.appliedFiles.map((file, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[8px] font-mono"
                        >
                          {file.split("/").pop()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-[9px] text-fg-60 mt-1 opacity-70">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicators */}
        {(isGenerating || isApplying) && (
          <div className="flex justify-start">
            <div className="bg-bk-50 text-fg-50 rounded-lg px-3 py-2 max-w-[85%]">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-fg-60 rounded-full animate-bounce"></div>
                  <div
                    className="w-1 h-1 bg-fg-60 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-1 h-1 bg-fg-60 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-[11px] text-fg-60">
                  {isGenerating
                    ? "Generating code..."
                    : "Applying to sandbox..."}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-bd-50 p-3">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                !sandboxData
                  ? "Create a sandbox first..."
                  : isGenerating || isApplying
                  ? "Please wait..."
                  : "Describe what you want to build..."
              }
              disabled={!sandboxData || isGenerating || isApplying}
              className="w-full bg-bk-50 border border-bd-50 rounded-lg px-3 py-2 text-[11px] text-fg-50 placeholder-fg-60 resize-none min-h-[40px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
              rows={1}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-[9px] text-fg-60">
              {sandboxData
                ? "Press Enter to send, Shift+Enter for new line"
                : "Sandbox required"}
            </div>
            <button
              type="submit"
              disabled={
                !input.trim() || !sandboxData || isGenerating || isApplying
              }
              className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[10px] font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating || isApplying ? "..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
