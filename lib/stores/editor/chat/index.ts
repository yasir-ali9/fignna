import { makeAutoObservable } from "mobx";
import type { EditorEngine } from "../index";
import type { ChatRecord, MessageRecord } from "@/lib/types/chat";

export interface Chat {
  id: string;
  projectId: string;
  name: string;
  messageCount: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  sequence: number;
  metadata: {
    model?: string;
    generatedCode?: string;
    appliedFiles?: string[];
    status?: "pending" | "streaming" | "completed" | "failed";
    errorMessage?: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ChatManager {
  private engine: EditorEngine;

  // Chat management
  chats: Chat[] = [];
  activeChat: Chat | null = null;

  // Messages for active chat
  messages: Message[] = [];

  // Loading states
  isLoadingChats: boolean = false;
  isLoadingMessages: boolean = false;
  isCreatingChat: boolean = false;
  isSendingMessage: boolean = false;
  error: string | null = null;

  // Streaming state
  isStreaming: boolean = false;
  streamingMessageId: string | null = null;

  // Package installation progress state
  packageProgress: {
    stage: "detecting" | "installing" | "restarting" | "complete" | null;
    packages?: string[];
    installedPackages?: string[];
    message?: string;
    error?: string;
  } = { stage: null };

  constructor(engine: EditorEngine) {
    this.engine = engine;
    makeAutoObservable(this);
  }

  // Load chats for current project
  async loadProjectChats(projectId: string) {
    // Prevent duplicate loading
    if (this.isLoadingChats) {
      console.log(
        "[ChatManager] Already loading chats, skipping duplicate call"
      );
      return;
    }

    this.isLoadingChats = true;
    this.error = null;

    try {
      console.log(`[ChatManager] Loading chats for project ${projectId}`);

      const response = await fetch(`/api/v1/projects/${projectId}/chat`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load chats");
      }

      this.chats = result.data.chats.map((chat: ChatRecord) => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.updatedAt),
      }));

      console.log(`[ChatManager] Loaded ${this.chats.length} chats`);

      // Auto-select first chat or create default if none exist
      if (this.chats.length > 0) {
        console.log(
          `[ChatManager] Switching to existing chat: ${this.chats[0].id}`
        );
        await this.switchToChat(this.chats[0].id);
      } else {
        console.log("[ChatManager] No chats found, creating default chat");
        await this.createDefaultChat(projectId);
      }

      this.isLoadingChats = false;
      console.log(
        `[ChatManager] Chat loading completed. Active chat: ${this.activeChat?.id}`
      );
    } catch (error) {
      console.error("[ChatManager] Error loading chats:", error);
      this.error = error instanceof Error ? error.message : "Unknown error";
      this.isLoadingChats = false;
    }
  }

  // Create default "Main Chat" for new projects
  async createDefaultChat(projectId: string) {
    console.log(`[ChatManager] Creating default chat for project ${projectId}`);
    const chat = await this.createChat(projectId, "Main Chat");
    console.log(`[ChatManager] Default chat created: ${chat.id}`);
    return chat;
  }

  // Create a new chat
  async createChat(projectId: string, name: string = "New Chat") {
    this.isCreatingChat = true;
    this.error = null;

    try {
      console.log(
        `[ChatManager] Creating chat "${name}" for project ${projectId}`
      );

      const response = await fetch(`/api/v1/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create chat");
      }

      const newChat: Chat = {
        ...result.data.chat,
        createdAt: new Date(result.data.chat.createdAt),
        updatedAt: new Date(result.data.chat.updatedAt),
      };

      console.log(`[ChatManager] Chat created successfully: ${newChat.id}`);

      this.chats.unshift(newChat);
      await this.switchToChat(newChat.id);

      this.isCreatingChat = false;
      return newChat;
    } catch (error) {
      console.error("[ChatManager] Error creating chat:", error);
      this.error = error instanceof Error ? error.message : "Unknown error";
      this.isCreatingChat = false;
      throw error;
    }
  }

  // Switch to a different chat
  async switchToChat(chatId: string) {
    const chat = this.chats.find((c) => c.id === chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    this.activeChat = chat;
    await this.loadChatMessages(chatId);

    // TODO: Update project's active chat when activeChatId is added to the project schema
    // For now, we just track the active chat in memory without persisting it
  }

  // Load messages for a chat
  async loadChatMessages(chatId: string) {
    this.isLoadingMessages = true;
    this.error = null;

    try {
      const response = await fetch(
        `/api/v1/projects/${this.engine.projects.currentProject?.id}/chat/${chatId}/messages`
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load messages");
      }

      this.messages = result.data.messages.map((msg: MessageRecord) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
        updatedAt: new Date(msg.updatedAt),
      }));

      this.isLoadingMessages = false;
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Unknown error";
      this.isLoadingMessages = false;
    }
  }

  // Send a message and generate AI response
  async sendMessage(content: string, model?: string) {
    if (!this.activeChat || !this.engine.projects.currentProject) {
      throw new Error("No active chat or project");
    }

    // Guard: Prevent duplicate calls if already sending a message
    if (this.isSendingMessage) {
      console.log("[ChatManager] Already sending a message, ignoring duplicate call");
      return;
    }

    this.isSendingMessage = true;
    this.error = null;

    // Notify status manager that operation is starting
    if (this.engine.statusManager) {
      this.engine.statusManager.setOperationInProgress(true);
    }

    try {
      // Add user message to UI immediately
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        chatId: this.activeChat.id,
        role: "user",
        content,
        sequence: this.messages.length + 1,
        metadata: { status: "completed" },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.messages.push(userMessage);

      // Create AI message placeholder for streaming
      const aiMessage: Message = {
        id: `temp-${Date.now() + 1}`,
        chatId: this.activeChat.id,
        role: "assistant",
        content: "",
        sequence: this.messages.length + 1,
        metadata: { status: "streaming" },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.messages.push(aiMessage);
      this.isStreaming = true;
      this.streamingMessageId = aiMessage.id;

      // Call the chat-aware generate API
      const response = await fetch(
        `/api/v1/projects/${this.engine.projects.currentProject.id}/chat/${this.activeChat.id}/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: content,
            model: model || "moonshotai/kimi-k2-instruct",
            isEdit: false,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate response");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response stream");
      }

      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "stream" && data.text) {
                fullResponse += data.text;
                // Update streaming message
                const messageIndex = this.messages.findIndex(
                  (m) => m.id === this.streamingMessageId
                );
                if (messageIndex !== -1) {
                  this.messages[messageIndex] = {
                    ...this.messages[messageIndex],
                    content: fullResponse,
                  };
                }
              } else if (data.type === "complete") {
                fullResponse = data.generatedCode || fullResponse;
                // Update final message
                const messageIndex = this.messages.findIndex(
                  (m) => m.id === this.streamingMessageId
                );
                if (messageIndex !== -1) {
                  this.messages[messageIndex] = {
                    ...this.messages[messageIndex],
                    content: fullResponse,
                    metadata: {
                      ...this.messages[messageIndex].metadata,
                      status: "completed",
                      generatedCode: fullResponse,
                    },
                  };
                }

                // Auto-apply the generated code
                console.log("[ChatManager] Code generation complete, checking if we can apply...");
                console.log("[ChatManager] Generated code length:", fullResponse.trim().length);
                console.log("[ChatManager] Current sandbox ID:", this.engine.sandbox.currentSandboxId);
                console.log("[ChatManager] Current sandbox object:", this.engine.sandbox.currentSandbox);
                
                if (
                  fullResponse.trim() &&
                  this.engine.sandbox.currentSandboxId
                ) {
                  console.log("[ChatManager] Applying generated code to sandbox...");
                  await this.applyGeneratedCode(fullResponse);
                } else {
                  console.warn("[ChatManager] Cannot apply code - missing requirements:", {
                    hasCode: !!fullResponse.trim(),
                    hasSandboxId: !!this.engine.sandbox.currentSandboxId,
                    sandboxStatus: this.engine.sandbox.currentSandbox?.status
                  });
                }
              } else if (data.type === "error") {
                // Update message with error
                const messageIndex = this.messages.findIndex(
                  (m) => m.id === this.streamingMessageId
                );
                if (messageIndex !== -1) {
                  this.messages[messageIndex] = {
                    ...this.messages[messageIndex],
                    content: `Error: ${data.error}`,
                    metadata: {
                      ...this.messages[messageIndex].metadata,
                      status: "failed",
                      errorMessage: data.error,
                    },
                  };
                }
              } else if (data.type === "package-success") {
                // Handle package installation success
                this.updatePackageProgress({
                  stage: "complete",
                  installedPackages: data.packages || [],
                  message: data.message,
                });
                // Clear progress after a delay
                setTimeout(() => {
                  this.clearPackageProgress();
                }, 3000);
              } else if (data.type === "package-progress") {
                // Handle package installation progress from apply API
                this.updatePackageProgress({
                  stage: data.stage || "detecting",
                  packages: data.packages,
                  message: data.message,
                });
              }
            } catch (e) {
              console.error("Error parsing stream data:", e);
            }
          }
        }
      }

      // Reload messages to get the actual saved messages from database
      await this.loadChatMessages(this.activeChat.id);
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Unknown error";

      // Update streaming message with error
      if (this.streamingMessageId) {
        const messageIndex = this.messages.findIndex(
          (m) => m.id === this.streamingMessageId
        );
        if (messageIndex !== -1) {
          this.messages[messageIndex] = {
            ...this.messages[messageIndex],
            content: `Error: ${this.error}`,
            metadata: {
              ...this.messages[messageIndex].metadata,
              status: "failed",
              errorMessage: this.error,
            },
          };
        }
      }
    } finally {
      this.isSendingMessage = false;
      this.isStreaming = false;
      this.streamingMessageId = null;

      // Always notify status manager that operation is complete
      if (this.engine.statusManager) {
        this.engine.statusManager.setOperationInProgress(false);
      }
    }
  }

  // Apply generated code to sandbox (similar to existing implementation)
  private isApplyingCode: boolean = false;

  private async applyGeneratedCode(code: string) {
    console.log("[ChatManager] applyGeneratedCode called with code length:", code.length);
    
    // Guard: Prevent duplicate code application
    if (this.isApplyingCode) {
      console.log("[ChatManager] Already applying code, ignoring duplicate call");
      return;
    }
    
    if (!this.engine.sandbox.currentSandboxId) {
      console.error("[ChatManager] Cannot apply code - no current sandbox ID");
      return;
    }

    console.log("[ChatManager] Applying code to sandbox ID:", this.engine.sandbox.currentSandboxId);
    this.isApplyingCode = true;

    // Notify status manager that code application is starting
    if (this.engine.statusManager) {
      this.engine.statusManager.setOperationInProgress(true);
    }

    try {
      const response = await fetch("/api/v1/code/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: code,
          isEdit: false,
          packages: [],
          sandboxId: this.engine.sandbox.currentSandboxId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) return;

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

                // Files are now auto-saved by the apply API after 3 seconds
                // No need to manually save here to avoid race conditions and empty file issues
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Error applying code:", error);
    } finally {
      this.isApplyingCode = false;
    }
  }

  // Update chat name
  async updateChatName(chatId: string, name: string) {
    if (!this.engine.projects.currentProject) return;

    try {
      const response = await fetch(
        `/api/v1/projects/${this.engine.projects.currentProject.id}/chat/${chatId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update chat");
      }

      // Update local chat
      const chatIndex = this.chats.findIndex((c) => c.id === chatId);
      if (chatIndex !== -1) {
        this.chats[chatIndex] = {
          ...this.chats[chatIndex],
          name,
          updatedAt: new Date(),
        };
      }

      // Update active chat if it's the one being updated
      if (this.activeChat?.id === chatId) {
        this.activeChat = { ...this.activeChat, name, updatedAt: new Date() };
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Unknown error";
      throw error;
    }
  }

  // Delete chat
  async deleteChat(chatId: string) {
    if (!this.engine.projects.currentProject) return;

    try {
      const response = await fetch(
        `/api/v1/projects/${this.engine.projects.currentProject.id}/chat/${chatId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to delete chat");
      }

      // Remove from chats list
      this.chats = this.chats.filter((c) => c.id !== chatId);

      // If this was the active chat, switch to another or create new
      if (this.activeChat?.id === chatId) {
        if (this.chats.length > 0) {
          await this.switchToChat(this.chats[0].id);
        } else {
          await this.createDefaultChat(this.engine.projects.currentProject.id);
        }
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Unknown error";
      throw error;
    }
  }

  // Clear error
  clearError() {
    this.error = null;
  }

  // Package progress management
  updatePackageProgress(update: Partial<typeof this.packageProgress>) {
    this.packageProgress = { ...this.packageProgress, ...update };
  }

  clearPackageProgress() {
    this.packageProgress = { stage: null };
  }

  // Getters
  get canSendMessage() {
    return this.activeChat && !this.isSendingMessage && !this.isStreaming;
  }

  get hasActiveChat() {
    return !!this.activeChat;
  }

  // Cleanup
  dispose() {
    this.chats = [];
    this.activeChat = null;
    this.messages = [];
    this.error = null;
  }
}
