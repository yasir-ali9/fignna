/**
 * Code Editor - Main exports
 * Complete code editor experience with database integration
 */

// Core components
export { CodeMirrorEditor } from "./editor-core/codemirror-editor";
export { TabBar } from "./editor-tabs/tab-bar";
export { FileTree } from "./file-explorer/file-tree";
export { NewFileModal } from "./file-explorer/new-file-modal";

// Panel components
export { CodePanel } from "./panels/code-panel";
export { SplitView } from "./panels/split-view";

// Extensions and utilities
export {
  getLanguageExtension,
  editorConfigs,
  isCodeMirrorAvailable,
  getRequiredPackages,
} from "./core/extensions";

// File Icons
export { FileIcon, getFileIcon } from "./icons/file-icons";

// Main CodeMode component
export { CodeMode } from "./code-mode";

// Re-export store types for convenience
export type { FileNode, FileTab } from "@/lib/stores/editor/files";
