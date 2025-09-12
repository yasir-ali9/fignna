/**
 * Sandbox State Types
 */

export interface SandboxFile {
  content: string;
  lastModified: number;
}

export interface SandboxFileCache {
  files: Record<string, SandboxFile>;
  lastSync: number;
  sandboxId: string;
  manifest?: unknown; // FileManifest type from file-manifest.ts
}

export interface SandboxState {
  fileCache: SandboxFileCache | null;
  sandbox: unknown; // E2B sandbox instance
  sandboxData: {
    sandboxId: string;
    url: string;
  } | null;
}
