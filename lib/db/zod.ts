import { z } from "zod";

// Validation schemas for project operations
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name too long"),
  description: z.string().max(500, "Description too long").optional(),
  userId: z.string().min(1, "User ID is required"),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name too long")
    .optional(),
  description: z.string().max(500, "Description too long").optional(),
  files: z.record(z.string(), z.string()).optional(),
  sandboxId: z.string().optional(),
  previewUrl: z.string().url("Invalid preview URL").optional(),
  isActive: z.boolean().optional(),
});

export const createVersionSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  files: z.record(z.string(), z.string()),
  dependencies: z.record(z.string(), z.string()).optional(),
  message: z.string().max(200, "Message too long").optional(),
  changeType: z.enum(["manual", "ai_generated", "auto_save"]).optional(),
});

// API request schemas (for route validation)
export const projectIdParamSchema = z.object({
  id: z.string().min(1, "Project ID is required"),
});

export const versionIdParamSchema = z.object({
  id: z.string().min(1, "Version ID is required"),
});

export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// File operation schemas
export const updateFilesSchema = z.object({
  files: z.record(z.string(), z.string()),
});

export const restoreVersionSchema = z.object({
  versionId: z.string().min(1, "Version ID is required"),
});

// Chat validation schemas
export const createChatSchema = z.object({
  name: z
    .string()
    .min(1, "Chat name is required")
    .max(100, "Chat name too long")
    .optional()
    .default("New Chat"),
  projectId: z.string().min(1, "Project ID is required"),
});

export const updateChatSchema = z.object({
  name: z
    .string()
    .min(1, "Chat name is required")
    .max(100, "Chat name too long")
    .optional(),
});

export const createMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1, "Message content is required"),
  metadata: z
    .object({
      model: z.string().optional(),
      generatedCode: z.string().optional(),
      appliedFiles: z.array(z.string()).optional(),
      status: z
        .enum(["pending", "streaming", "completed", "failed"])
        .optional(),
      errorMessage: z.string().optional(),
    })
    .optional(),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1, "Message content is required").optional(),
  metadata: z
    .object({
      model: z.string().optional(),
      generatedCode: z.string().optional(),
      appliedFiles: z.array(z.string()).optional(),
      status: z
        .enum(["pending", "streaming", "completed", "failed"])
        .optional(),
      errorMessage: z.string().optional(),
    })
    .optional(),
});

// Chat/Message ID parameter schemas
export const chatIdParamSchema = z.object({
  id: z.string().min(1, "Chat ID is required"),
});

export const messageIdParamSchema = z.object({
  id: z.string().min(1, "Message ID is required"),
});
