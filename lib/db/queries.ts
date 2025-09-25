import { db } from "./index";
import { project, version, chat, message } from "./schema";
import { eq, and, desc, notInArray } from "drizzle-orm";
import type {
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateVersionRequest,
} from "../types/project";
import type { SandboxInfo } from "./schema";

// Project CRUD Operations
export const projectQueries = {
  // Create a new project (files will be handled by sandbox creation)
  async create(data: CreateProjectRequest) {
    // Validate input data
    if (!data.name?.trim()) {
      throw new Error("Project name is required");
    }
    if (data.name.length > 255) {
      throw new Error("Project name must be less than 255 characters");
    }
    if (!data.userId?.trim()) {
      throw new Error("User ID is required");
    }

    try {
      const [projectResult] = await db
        .insert(project)
        .values({
          name: data.name,
          description: data.description,
          userId: data.userId,
          files: {}, // Empty initially, populated by sandbox/file operations
          version: 1,
          isActive: true,
        })
        .returning();

      return projectResult;
    } catch (error) {
      console.error("[DB] Failed to create project:", error);
      if (error instanceof Error && error.message.includes("duplicate key")) {
        throw new Error("A project with this name already exists");
      }
      throw new Error(
        `Failed to create project: ${
          error instanceof Error ? error.message : "Database operation failed"
        }`
      );
    }
  },

  // Get a single project by ID with all files
  // Verifies user ownership and returns complete project data including files
  async getById(projectId: string, userId: string) {
    try {
      const [projectResult] = await db
        .select()
        .from(project)
        .where(
          and(
            eq(project.id, projectId),
            eq(project.userId, userId),
            eq(project.isActive, true)
          )
        );

      if (!projectResult) {
        throw new Error("Project not found");
      }

      return projectResult;
    } catch (error) {
      throw new Error(
        `Failed to fetch project: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // List projects for a user (minimal data without files for better performance)
  async listByUser(userId: string, limit: number = 50, offset: number = 0) {
    try {
      const userProjects = await db
        .select({
          id: project.id,
          name: project.name,
          description: project.description,
          userId: project.userId,
          // files: project.files, // Excluded for better performance in project listing
          sandboxInfo: project.sandboxInfo,
          version: project.version,
          lastSavedAt: project.lastSavedAt,
          isActive: project.isActive,
          activeChatId: project.activeChatId,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        })
        .from(project)
        .where(and(eq(project.userId, userId), eq(project.isActive, true)))
        .orderBy(desc(project.updatedAt))
        .limit(limit)
        .offset(offset);

      return userProjects;
    } catch (error) {
      throw new Error(
        `Failed to list projects: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // Update project with partial data
  async update(projectId: string, userId: string, data: UpdateProjectRequest) {
    try {
      const [projectResult] = await db
        .update(project)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(project.id, projectId),
            eq(project.userId, userId),
            eq(project.isActive, true)
          )
        )
        .returning();

      if (!projectResult) {
        throw new Error("Project not found or access denied");
      }

      return projectResult;
    } catch (error) {
      throw new Error(
        `Failed to update project: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // Soft delete project (mark as inactive)
  // Performs soft delete and logs the operation for audit trail
  async delete(projectId: string, userId: string) {
    // Log security-sensitive operation
    console.log(
      `[AUDIT] User ${userId} attempting to delete project ${projectId}`
    );

    try {
      const [projectResult] = await db
        .update(project)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(and(eq(project.id, projectId), eq(project.userId, userId)))
        .returning({
          id: project.id,
          name: project.name,
        });

      if (!projectResult) {
        throw new Error("Project not found or access denied");
      }

      return projectResult;
    } catch (error) {
      throw new Error(
        `Failed to delete project: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // Update only files (efficient for frequent saves)
  // Validates file data and updates project files with timestamp
  async updateFiles(
    projectId: string,
    userId: string,
    files: Record<string, string>
  ) {
    // Validate input parameters
    if (!projectId?.trim() || !userId?.trim()) {
      throw new Error("Project ID and User ID are required");
    }
    if (!files || typeof files !== "object") {
      throw new Error("Files must be a valid object");
    }

    // Check file size limits (prevent abuse)
    const totalSize = JSON.stringify(files).length;
    if (totalSize > 10 * 1024 * 1024) {
      // 10MB limit
      throw new Error("Project files exceed maximum size limit");
    }

    try {
      const [projectResult] = await db
        .update(project)
        .set({
          files,
          lastSavedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(project.id, projectId),
            eq(project.userId, userId),
            eq(project.isActive, true)
          )
        )
        .returning({
          id: project.id,
          version: project.version,
          lastSavedAt: project.lastSavedAt,
        });

      if (!projectResult) {
        throw new Error("Project not found or access denied");
      }

      return projectResult;
    } catch (error) {
      throw new Error(
        `Failed to update project files: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // Get project files only (efficient for file operations)
  async getFiles(projectId: string, userId: string) {
    try {
      const [projectResult] = await db
        .select({
          id: project.id,
          files: project.files,
          version: project.version,
        })
        .from(project)
        .where(
          and(
            eq(project.id, projectId),
            eq(project.userId, userId),
            eq(project.isActive, true)
          )
        );

      if (!projectResult) {
        throw new Error("Project not found");
      }

      return projectResult;
    } catch (error) {
      throw new Error(
        `Failed to fetch project files: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // Update sandbox info only (efficient for sandbox lifecycle management)
  async updateSandboxInfo(
    projectId: string,
    userId: string,
    sandboxInfo: SandboxInfo
  ) {
    // Validate input parameters
    if (!projectId?.trim() || !userId?.trim()) {
      throw new Error("Project ID and User ID are required");
    }
    if (!sandboxInfo || typeof sandboxInfo !== "object") {
      throw new Error("Sandbox info must be a valid object");
    }

    try {
      const [projectResult] = await db
        .update(project)
        .set({
          sandboxInfo: sandboxInfo,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(project.id, projectId),
            eq(project.userId, userId),
            eq(project.isActive, true)
          )
        )
        .returning({
          id: project.id,
          sandboxInfo: project.sandboxInfo,
          updatedAt: project.updatedAt,
        });

      if (!projectResult) {
        throw new Error("Project not found or access denied");
      }

      return projectResult;
    } catch (error) {
      throw new Error(
        `Failed to update sandbox info: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // Get sandbox info only (efficient for status checking)
  async getSandboxInfo(projectId: string, userId: string) {
    try {
      const [projectResult] = await db
        .select({
          id: project.id,
          sandboxInfo: project.sandboxInfo,
        })
        .from(project)
        .where(
          and(
            eq(project.id, projectId),
            eq(project.userId, userId),
            eq(project.isActive, true)
          )
        );

      if (!projectResult) {
        throw new Error("Project not found");
      }

      return projectResult;
    } catch (error) {
      throw new Error(
        `Failed to fetch sandbox info: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
};

// Version Management Operations
export const versionQueries = {
  // Create a version snapshot
  async create(data: CreateVersionRequest) {
    try {
      // First get the current project to determine the next version number
      const [currentProject] = await db
        .select({ version: project.version })
        .from(project)
        .where(eq(project.id, data.projectId));

      if (!currentProject) {
        throw new Error("Project not found");
      }

      const [versionResult] = await db
        .insert(version)
        .values({
          projectId: data.projectId,
          files: data.files,
          dependencies: data.dependencies || {},
          version: currentProject.version || 1,
          message: data.message,
          changeType: data.changeType || "manual",
        })
        .returning();

      return versionResult;
    } catch (error) {
      throw new Error(
        `Failed to create version: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // Get version history for a project
  async getHistory(
    projectId: string,
    userId: string,
    limit: number = 20,
    offset: number = 0
  ) {
    try {
      // Verify user owns the project
      const [projectResult] = await db
        .select({ id: project.id })
        .from(project)
        .where(
          and(
            eq(project.id, projectId),
            eq(project.userId, userId),
            eq(project.isActive, true)
          )
        );

      if (!projectResult) {
        throw new Error("Project not found or access denied");
      }

      const versions = await db
        .select({
          id: version.id,
          projectId: version.projectId,
          version: version.version,
          message: version.message,
          changeType: version.changeType,
          createdAt: version.createdAt,
          // Exclude heavy files and dependencies for listing
        })
        .from(version)
        .where(eq(version.projectId, projectId))
        .orderBy(desc(version.version))
        .limit(limit)
        .offset(offset);

      return versions;
    } catch (error) {
      throw new Error(
        `Failed to fetch version history: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // Get a specific version with full data
  async getById(versionId: string, userId: string) {
    try {
      const [versionResult] = await db
        .select({
          id: version.id,
          projectId: version.projectId,
          files: version.files,
          dependencies: version.dependencies,
          version: version.version,
          message: version.message,
          changeType: version.changeType,
          createdAt: version.createdAt,
        })
        .from(version)
        .innerJoin(project, eq(project.id, version.projectId))
        .where(
          and(
            eq(version.id, versionId),
            eq(project.userId, userId),
            eq(project.isActive, true)
          )
        );

      if (!versionResult) {
        throw new Error("Version not found or access denied");
      }

      return versionResult;
    } catch (error) {
      throw new Error(
        `Failed to fetch version: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // Restore a project to a specific version
  async restore(versionId: string, userId: string) {
    try {
      // Get the version data
      const versionData = await this.getById(versionId, userId);

      // Update the project with the version data
      const [restoredProject] = await db
        .update(project)
        .set({
          files: versionData.files,
          lastSavedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(project.id, versionData.projectId),
            eq(project.userId, userId),
            eq(project.isActive, true)
          )
        )
        .returning();

      if (!restoredProject) {
        throw new Error("Failed to restore project");
      }

      // Create a new version entry for the restore action
      await this.create({
        projectId: versionData.projectId,
        files: versionData.files,
        dependencies: versionData.dependencies || undefined,
        message: `Restored from version ${versionData.version}`,
        changeType: "manual",
      });

      return restoredProject;
    } catch (error) {
      throw new Error(
        `Failed to restore version: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // Delete old versions (cleanup utility)
  // Safely removes old versions while preserving recent history
  async cleanup(projectId: string, userId: string, keepCount: number = 10) {
    // Validate cleanup parameters
    if (keepCount < 1 || keepCount > 100) {
      throw new Error("Keep count must be between 1 and 100");
    }

    try {
      // Verify user owns the project
      const [projectResult] = await db
        .select({ id: project.id })
        .from(project)
        .where(
          and(
            eq(project.id, projectId),
            eq(project.userId, userId),
            eq(project.isActive, true)
          )
        );

      if (!projectResult) {
        throw new Error("Project not found or access denied");
      }

      // Get versions to keep (most recent ones)
      const versionsToKeep = await db
        .select({ id: version.id })
        .from(version)
        .where(eq(version.projectId, projectId))
        .orderBy(desc(version.version))
        .limit(keepCount);

      if (versionsToKeep.length === 0) {
        return { deletedCount: 0 };
      }

      const keepIds = versionsToKeep.map((v) => v.id);

      // Delete old versions (only if we have versions to keep)
      let deletedVersions: { id: string }[] = [];
      if (keepIds.length > 0) {
        deletedVersions = await db
          .delete(version)
          .where(
            and(
              eq(version.projectId, projectId),
              notInArray(version.id, keepIds)
            )
          )
          .returning({ id: version.id });
      }

      return { deletedCount: deletedVersions.length };
    } catch (error) {
      throw new Error(
        `Failed to cleanup versions: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
};

// Chat Management Operations (Project-Scoped)
export const chatQueries = {
  // Create a new chat in a project
  async createInProject(
    projectId: string,
    userId: string,
    name: string = "New Chat"
  ) {
    try {
      // Verify user owns the project
      const ownsProject = await projectUtils.verifyOwnership(projectId, userId);
      if (!ownsProject) {
        throw new Error("Project not found or access denied");
      }

      const [chatResult] = await db
        .insert(chat)
        .values({
          projectId,
          name,
          messageCount: 0,
        })
        .returning();

      return chatResult;
    } catch (error) {
      throw new Error(
        `Failed to create chat: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // List all chats for a project
  async listByProject(projectId: string, userId: string, limit: number = 50) {
    try {
      // Verify user owns the project
      const ownsProject = await projectUtils.verifyOwnership(projectId, userId);
      if (!ownsProject) {
        throw new Error("Project not found or access denied");
      }

      const chats = await db
        .select()
        .from(chat)
        .where(eq(chat.projectId, projectId))
        .orderBy(desc(chat.updatedAt))
        .limit(limit);

      return chats;
    } catch (error) {
      throw new Error(
        `Failed to list chats: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // Get a single chat by ID (with project ownership verification)
  async getById(chatId: string, userId: string) {
    try {
      const [chatResult] = await db
        .select({
          id: chat.id,
          projectId: chat.projectId,
          name: chat.name,
          messageCount: chat.messageCount,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
        })
        .from(chat)
        .innerJoin(project, eq(project.id, chat.projectId))
        .where(
          and(
            eq(chat.id, chatId),
            eq(project.userId, userId),
            eq(project.isActive, true)
          )
        );

      if (!chatResult) {
        throw new Error("Chat not found or access denied");
      }

      return chatResult;
    } catch (error) {
      throw new Error(
        `Failed to fetch chat: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // Update chat (name, etc.)
  async update(chatId: string, userId: string, data: { name?: string }) {
    try {
      const [chatResult] = await db
        .update(chat)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .from(chat)
        .innerJoin(project, eq(project.id, chat.projectId))
        .where(
          and(
            eq(chat.id, chatId),
            eq(project.userId, userId),
            eq(project.isActive, true)
          )
        )
        .returning();

      if (!chatResult) {
        throw new Error("Chat not found or access denied");
      }

      return chatResult;
    } catch (error) {
      throw new Error(
        `Failed to update chat: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // Delete chat and all its messages
  async delete(chatId: string, userId: string) {
    try {
      // Verify ownership through project
      await this.getById(chatId, userId);

      const [deletedChat] = await db
        .delete(chat)
        .where(eq(chat.id, chatId))
        .returning({
          id: chat.id,
          name: chat.name,
        });

      return deletedChat;
    } catch (error) {
      throw new Error(
        `Failed to delete chat: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // Set chat as active for project
  async setAsActiveForProject(
    chatId: string,
    projectId: string,
    userId: string
  ) {
    try {
      // Verify chat belongs to project and user owns project
      const chatData = await this.getById(chatId, userId);
      if (chatData.projectId !== projectId) {
        throw new Error("Chat does not belong to this project");
      }

      const [updatedProject] = await db
        .update(project)
        .set({
          activeChatId: chatId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(project.id, projectId),
            eq(project.userId, userId),
            eq(project.isActive, true)
          )
        )
        .returning();

      return updatedProject;
    } catch (error) {
      throw new Error(
        `Failed to set active chat: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
};

// Message Management Operations (Chat-Scoped)
export const messageQueries = {
  // Create a new message in a chat
  async createInChat(
    chatId: string,
    userId: string,
    data: {
      role: "user" | "assistant" | "system";
      content: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    try {
      // Verify user owns the chat through project ownership
      await chatQueries.getById(chatId, userId);

      // Get next sequence number
      const [lastMessage] = await db
        .select({ sequence: message.sequence })
        .from(message)
        .where(eq(message.chatId, chatId))
        .orderBy(desc(message.sequence))
        .limit(1);

      const nextSequence = (lastMessage?.sequence || 0) + 1;

      const [messageResult] = await db
        .insert(message)
        .values({
          chatId,
          role: data.role,
          content: data.content,
          sequence: nextSequence,
          metadata: data.metadata || {},
        })
        .returning();

      // Update chat message count
      await db
        .update(chat)
        .set({
          messageCount: nextSequence,
          updatedAt: new Date(),
        })
        .where(eq(chat.id, chatId));

      return messageResult;
    } catch (error) {
      throw new Error(
        `Failed to create message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // List messages in a chat
  async listByChat(
    chatId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    try {
      // Verify user owns the chat through project ownership
      await chatQueries.getById(chatId, userId);

      const messages = await db
        .select()
        .from(message)
        .where(eq(message.chatId, chatId))
        .orderBy(message.sequence)
        .limit(limit)
        .offset(offset);

      return messages;
    } catch (error) {
      throw new Error(
        `Failed to list messages: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // Get messages for AI context (recent messages)
  async getContextForAI(chatId: string, userId: string, limit: number = 15) {
    try {
      // Verify user owns the chat through project ownership
      await chatQueries.getById(chatId, userId);

      const messages = await db
        .select({
          role: message.role,
          content: message.content,
          sequence: message.sequence,
          metadata: message.metadata,
        })
        .from(message)
        .where(eq(message.chatId, chatId))
        .orderBy(desc(message.sequence))
        .limit(limit);

      // Return in chronological order for AI context
      return messages.reverse();
    } catch (error) {
      throw new Error(
        `Failed to get context: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // Get a single message by ID
  async getById(messageId: string, userId: string) {
    try {
      const [messageResult] = await db
        .select()
        .from(message)
        .innerJoin(chat, eq(chat.id, message.chatId))
        .innerJoin(project, eq(project.id, chat.projectId))
        .where(
          and(
            eq(message.id, messageId),
            eq(project.userId, userId),
            eq(project.isActive, true)
          )
        );

      if (!messageResult) {
        throw new Error("Message not found or access denied");
      }

      return messageResult;
    } catch (error) {
      throw new Error(
        `Failed to fetch message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // Update message content
  async update(
    messageId: string,
    userId: string,
    data: { content?: string; metadata?: Record<string, unknown> }
  ) {
    try {
      // Verify ownership first
      await this.getById(messageId, userId);

      const [messageResult] = await db
        .update(message)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(message.id, messageId))
        .returning();

      return messageResult;
    } catch (error) {
      throw new Error(
        `Failed to update message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },

  // Delete message
  async delete(messageId: string, userId: string) {
    try {
      // Verify ownership first
      const messageData = await this.getById(messageId, userId);

      const [deletedMessage] = await db
        .delete(message)
        .where(eq(message.id, messageId))
        .returning({
          id: message.id,
          content: message.content,
        });

      // Update chat message count
      const remainingCount = await db
        .select({ count: message.sequence })
        .from(message)
        .where(eq(message.chatId, messageData.message.chatId))
        .orderBy(desc(message.sequence))
        .limit(1);

      await db
        .update(chat)
        .set({
          messageCount: remainingCount[0]?.count || 0,
          updatedAt: new Date(),
        })
        .where(eq(chat.id, messageData.message.chatId));

      return deletedMessage;
    } catch (error) {
      throw new Error(
        `Failed to delete message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
};

// Utility functions for efficient queries
export const projectUtils = {
  // Check if user owns project (utility for middleware)
  async verifyOwnership(projectId: string, userId: string): Promise<boolean> {
    try {
      const [projectResult] = await db
        .select({ id: project.id })
        .from(project)
        .where(
          and(
            eq(project.id, projectId),
            eq(project.userId, userId),
            eq(project.isActive, true)
          )
        );

      return !!projectResult;
    } catch {
      return false;
    }
  },
};
