// Chat and Message related types for database operations

export interface CreateChatRequest {
  name?: string;
  projectId: string;
}

export interface UpdateChatRequest {
  name?: string;
}

export interface CreateMessageRequest {
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: {
    model?: string;
    generatedCode?: string;
    appliedFiles?: string[];
    status?: "pending" | "streaming" | "completed" | "failed";
    errorMessage?: string;
  };
}

export interface UpdateMessageRequest {
  content?: string;
  metadata?: {
    model?: string;
    generatedCode?: string;
    appliedFiles?: string[];
    status?: "pending" | "streaming" | "completed" | "failed";
    errorMessage?: string;
  };
}

// Database return types (inferred from schema)
export interface ChatRecord {
  id: string;
  projectId: string;
  name: string;
  messageCount: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageRecord {
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

// Utility types for API responses
export interface ChatListItem {
  id: string;
  projectId: string;
  name: string;
  messageCount: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageListItem {
  id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  sequence: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageContext {
  role: "user" | "assistant" | "system";
  content: string;
  sequence: number;
  metadata: Record<string, unknown>;
}
