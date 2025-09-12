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

  constructor(engine: EditorEngine) {
    this.engine = engine;
    makeAutoObservable(this);
  }

  // Load chats for current project
  async loadProjectChats(projectId: string) {
    this.isLoadingChats = true;
    this.error = null;

    try {
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

      // Auto-select first chat or create default if none exist
      if (this.chats.length > 0) {
        await this.switchToChat(this.chats[0].id);
      } else {
        await this.createDefaultChat(projectId);
      }

      this.isLoadingChats = false;
    } catch (error) {
      this.error = error instanceof Error ? error.message : "Unknown error";
      this.isLoadingChats = false;
    }
  }

  // Create default "Main Chat" for new projects
  async createDefaultChat(projectId: string) {
    return await this.createChat(projectId, "Main Chat");
  }

  // Create a new chat
  async createChat(projectId: string, name: string = "New Chat") {
    this.isCreatingChat = true;
    this.error = null;

    try {
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

      this.chats.unshift(newChat);
      await this.switchToChat(newChat.id);

      this.isCreatingChat = false;
      return newChat;
    } catch (error) {
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

    // Update project's active chat
    if (this.engine.projects.currentProject) {
      try {
        await this.engine.projects.updateProjectMetadata({});
        // Note: We'd need to add activeChatId to the project update API
      } catch (error) {
        console.warn("Failed to update project active chat:", error);
      }
    }
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

    this.isSendingMessage = true;
    this.error = null;

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
                if (
                  fullResponse.trim() &&
                  this.engine.sandbox.currentSandboxId
                ) {
                  await this.applyGeneratedCode(fullResponse);
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
    }
  }

  // Apply generated code to sandbox (similar to existing implementation)
  private async applyGeneratedCode(code: string) {
    if (!this.engine.sandbox.currentSandboxId) {
      return;
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

                // Update project files if we have a project
                if (
                  this.engine.projects.currentProject &&
                  appliedFiles.length > 0
                ) {
                  try {
                    const manifestResponse = await fetch(
                      "/api/v1/sandbox/files/manifest"
                    );
                    const manifestData = await manifestResponse.json();

                    if (manifestData.success && manifestData.files) {
                      this.engine.files.setFiles(manifestData.files);
                      await this.engine.projects.saveProject();
                    }
                  } catch (manifestError) {
                    console.error("Failed to sync files:", manifestError);
                  }
                }
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Error applying code:", error);
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
