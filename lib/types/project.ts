// Project-related types for database operations

export interface CreateProjectRequest {
  name: string;
  description?: string;
  userId: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  files?: Record<string, string>;
  // Legacy fields for backward compatibility
  sandboxId?: string;
  previewUrl?: string;
  // New sandbox info field
  sandboxInfo?: any; // Using any to match JSONB type
  isActive?: boolean;
}

export interface CreateVersionRequest {
  projectId: string;
  files: Record<string, string>;
  dependencies?: Record<string, string>;
  message?: string;
  changeType?: "manual" | "auto" | "sync";
}

// Database return types (inferred from schema)
export interface ProjectRecord {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  files: Record<string, string>;
  sandboxId: string | null;
  previewUrl: string | null;
  version: number | null;
  lastSavedAt: Date | null;
  isActive: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectVersionRecord {
  id: string;
  projectId: string;
  files: Record<string, string>;
  dependencies: Record<string, string> | null;
  version: number;
  message: string | null;
  changeType: "manual" | "auto" | "sync" | null;
  createdAt: Date;
}

// Utility types for API responses
export interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  sandboxId: string | null;
  previewUrl: string | null;
  version: number | null;
  lastSavedAt: Date | null;
  isActive: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectFiles {
  id: string;
  files: Record<string, string>;
  version: number | null;
}

export interface VersionHistoryItem {
  id: string;
  projectId: string;
  version: number;
  message: string | null;
  changeType: "manual" | "auto" | "sync" | null;
  createdAt: Date;
}
