"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { observer } from "mobx-react-lite";
import { Chats } from "./chats";
import { MessageRenderer } from "./renderers";
import { Models } from "@/components/models";
import { PackageProgress } from "./package-progress";
import { modelsConfig } from "@/lib/config/models.config";
import { useAuthGuard } from "@/lib/hooks/use-auth-guard";
import AuthModal from "@/modules/auth/auth-modal";

interface ChatPanelProps {
  placeholder?: string;
  className?: string;
}

export const ChatPanel = observer(({ className = "" }: ChatPanelProps) => {
  const engine = useEditorEngine();
  const [inputValue, setInputValue] = useState("");
  const [showChatList, setShowChatList] = useState(false);
  const [selectedModel, setSelectedModel] = useState(modelsConfig.defaultModel);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auth guard hook
  const authGuard = useAuthGuard() as any; // Type assertion to access internal method

  // Check if sandbox is ready for chat operations
  const isSandboxReady = useCallback(() => {
    return (
      engine.sandbox.currentSandbox &&
      engine.sandbox.currentSandbox.status === "running" &&
      engine.sandbox.currentSandbox.url &&
      !engine.sandbox.isCreating &&
      !engine.projects.isSyncing
    );
  }, [engine.sandbox, engine.projects]);

  // Initialize sandbox and send initial prompt (only when sandbox is ready)
  const initializeAndSendPrompt = useCallback(
    async (prompt: string) => {
      try {
        // Wait for sandbox to be ready before sending prompt
        if (!isSandboxReady()) {
          console.log("[ChatPanel] Waiting for sandbox to be ready before sending prompt...");
          
          // Check if we need to create a sandbox
          if (!engine.sandbox.currentSandbox && !engine.sandbox.isCreating) {
            console.log("[ChatPanel] No sandbox found, creating one...");
            await engine.sandbox.createSandbox();
          }

          // Wait for sandbox to be ready with timeout
          let attempts = 0;
          const maxAttempts = 30; // 30 seconds timeout
          
          while (!isSandboxReady() && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
          }

          if (!isSandboxReady()) {
            throw new Error("Sandbox not ready after timeout");
          }
        }

        console.log("[ChatPanel] Sandbox is ready, sending initial prompt...");
        await engine.chat.sendMessage(prompt, selectedModel);
      } catch (error) {
        console.error("Failed to initialize sandbox for chat:", error);
        // Still try to send the prompt as fallback
        console.log("[ChatPanel] Attempting to send prompt without sandbox readiness check...");
        await engine.chat.sendMessage(prompt, selectedModel);
      }
    },
    [engine.sandbox, engine.chat, engine.projects, selectedModel, isSandboxReady]
  );

  // Initialize chat when project loads (with guard to prevent duplicate calls)
  useEffect(() => {
    const initializeChat = async () => {
      if (
        engine.projects.currentProject &&
        !engine.chat.hasActiveChat &&
        !engine.chat.isLoadingChats
      ) {
        await engine.chat.loadProjectChats(engine.projects.currentProject.id);
      }
    };

    initializeChat();
  }, [engine.projects.currentProject?.id]);

  // Handle initial prompt from MobX state (not URL)
  useEffect(() => {
    const processInitialPrompt = async () => {
      const initialPrompt = engine.state.initialPrompt;
      const storedModel = sessionStorage.getItem("selectedModel");

      // Set stored model if available
      if (storedModel && modelsConfig.availableModels.includes(storedModel)) {
        setSelectedModel(storedModel);
        sessionStorage.removeItem("selectedModel"); // Clear after use
      }

      if (initialPrompt && engine.projects.currentProject) {
        console.log("Processing initial prompt from MobX state:", initialPrompt);
        
        // Ensure chat is loaded before processing initial prompt
        if (!engine.chat.hasActiveChat && !engine.chat.isLoadingChats) {
          console.log("Loading project chats before processing initial prompt...");
          await engine.chat.loadProjectChats(engine.projects.currentProject.id);
        }

        // Wait for chat to be ready
        let attempts = 0;
        const maxAttempts = 10; // 10 seconds timeout
        while (!engine.chat.hasActiveChat && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }

        if (engine.chat.hasActiveChat) {
          console.log("Chat is ready, processing initial prompt...");
          // Clear the prompt from state to prevent re-triggering
          engine.state.clearInitialPrompt();
          // First ensure we have a sandbox, then send the prompt
          await initializeAndSendPrompt(initialPrompt);
        } else {
          console.error("Chat failed to load within timeout, cannot process initial prompt");
        }
      }
    };

    if (engine.state.initialPrompt) {
      processInitialPrompt();
    }
  }, [
    engine.state.initialPrompt,
    engine.projects.currentProject?.id,
    engine.chat.hasActiveChat,
    engine.chat.isLoadingChats,
    engine.state,
    initializeAndSendPrompt,
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [engine.chat.messages]);

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputValue.trim();
    if (!content || !engine.chat.canSendMessage) return;

    // Check authentication before sending message
    authGuard.requireAuth(async () => {
      if (!messageContent) setInputValue("");

      try {
        await engine.chat.sendMessage(content, selectedModel);
      } catch (error) {
        console.error("Chat error:", error);
      }
    });
  };

  // Handle successful authentication
  const handleAuthSuccess = () => {
    authGuard._handleAuthSuccess();
  };

  // Create new chat
  const handleCreateChat = async () => {
    if (!engine.projects.currentProject) return;

    try {
      await engine.chat.createChat(engine.projects.currentProject.id);
      setShowChatList(false); // Go back to the new chat
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  // Switch to a chat and close the chat list
  const handleSelectChat = async (chatId: string) => {
    try {
      await engine.chat.switchToChat(chatId);
      setShowChatList(false);
    } catch (error) {
      console.error("Failed to switch chat:", error);
    }
  };

  // Delete a chat
  const handleDeleteChat = async (chatId: string, chatName: string) => {
    if (!confirm(`Are you sure you want to delete "${chatName}"?`)) {
      return;
    }

    try {
      await engine.chat.deleteChat(chatId);
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Render chat list panel
  if (showChatList) {
    return (
      <Chats
        onBack={() => setShowChatList(false)}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onCreateChat={handleCreateChat}
      />
    );
  }

  // Render main chat interface
  return (
    <>
      <div className={`h-full flex flex-col ${className}`}>
        {/* Chat Header */}
        <div className="p-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowChatList(true)}
              className="flex items-center space-x-2 text-fg-70 hover:text-fg-50 cursor-pointer"
            >
              <span className="text-[11px] font-medium">
                {engine.chat.activeChat?.name || "Select Chat"}
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>
            <button
              onClick={handleCreateChat}
              disabled={engine.chat.isCreatingChat}
              className="text-fg-60 hover:text-fg-70 cursor-pointer disabled:opacity-50"
              title="New Chat"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </button>
          </div>

          {/* Error Display */}
          {engine.chat.error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
              {engine.chat.error}
              <button
                onClick={() => engine.chat.clearError()}
                className="ml-2 text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-3 p-3">
          {engine.chat.messages.length === 0 && (
            <div className="flex items-center justify-start h-full">
              <div className="text-fg-60 text-[13px]">
                Hello! I&apos;m fignna.<br/> I can help you build React apps with AI.
              </div>
            </div>
          )}

          {engine.chat.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`${
                  message.role === "user" ? "max-w-[85%]" : "w-full"
                } rounded-lg ${
                  message.role === "user"
                    ? "bg-bk-40 text-fg-50 p-3"
                    : "bg-transparent text-fg-50"
                }`}
              >
                {message.role === "user" ? (
                  <div className="text-[11px] whitespace-pre-wrap">
                    {message.content}
                  </div>
                ) : (
                  <MessageRenderer
                    content={message.content}
                    id={message.id}
                    size="default"
                  />
                )}

                {message.metadata?.status === "streaming" && (
                  <div className="flex items-center mt-2">
                    <span className="inline-block w-2 h-2 bg-fg-50 rounded-full animate-pulse mr-1"></span>
                    <span className="text-[10px] text-fg-60">
                      Generating...
                    </span>
                  </div>
                )}

                {message.metadata?.status === "failed" && (
                  <div className="text-[10px] mt-2 text-red-400 flex items-center">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="mr-1"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    Failed to send
                  </div>
                )}
              </div>
            </div>
          ))}

          {engine.chat.isStreaming && (
            <div className="flex justify-start">
              <div className="text-fg-50 p-2 rounded-lg text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-fg-30 rounded-full animate-pulse"></div>
                  <div
                    className="w-1 h-1 bg-fg-30 rounded-full animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-1 h-1 bg-fg-30 rounded-full animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Package Installation Progress */}
          {engine.chat.packageProgress.stage && (
            <div className="flex justify-start">
              <PackageProgress state={engine.chat.packageProgress} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3">
          <div className="bg-bk-40 border border-bd-50 rounded-xl p-3">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  !engine.sandbox.currentSandbox
                    ? "Create a sandbox from the dropdown above..."
                    : engine.chat.isSendingMessage
                    ? "Please wait..."
                    : "Describe what you want to build..."
                }
                rows={1}
                className="w-full bg-transparent text-fg-50 placeholder-fg-60
                       border-none outline-none resize-none overflow-hidden min-h-6 max-h-24"
                style={{
                  fontSize: "11px",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "24px"; // Reset height
                  target.style.height =
                    Math.min(target.scrollHeight, 96) + "px"; // Max 4 lines
                }}
                disabled={
                  !engine.chat.canSendMessage || !engine.sandbox.currentSandbox
                }
              />
            </div>

            {/* Bottom row with model selector and send button */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-bd-50/20">
              <div className="flex items-center gap-2">
                {/* Model Selector */}
                <div className="w-32">
                  <Models
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    disabled={engine.chat.isSendingMessage}
                    direction="up"
                  />
                </div>
              </div>

              {/* Send Arrow Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={
                  !inputValue.trim() ||
                  !engine.chat.canSendMessage ||
                  !engine.sandbox.currentSandbox
                }
                className="w-6 h-6 flex items-center justify-center
                       text-fg-60 hover:text-fg-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Send (Enter)"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M21 4a1 1 0 0 1 .993.883L22 5v6.5a3.5 3.5 0 0 1-3.308 3.495L18.5 15H5.415l3.292 3.293a1 1 0 0 1 .083 1.32l-.083.094a1 1 0 0 1-1.32.083l-.094-.083l-5-5a1.008 1.008 0 0 1-.097-.112l-.071-.11l-.054-.114l-.035-.105l-.025-.118l-.007-.058L2 14l.003-.075l.017-.126l.03-.111l.044-.111l.052-.098l.064-.092l.083-.094l5-5a1 1 0 0 1 1.497 1.32l-.083.094L5.415 13H18.5a1.5 1.5 0 0 0 1.493-1.356L20 11.5V5a1 1 0 0 1 1-1z"
                    fillRule="nonzero"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authGuard.showAuthModal}
        onClose={authGuard.closeAuthModal}
        onSuccess={handleAuthSuccess}
        title="Sign in to continue chatting"
      />
    </>
  );
});
