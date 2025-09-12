export interface Project {
    id: string;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    sandboxId?: string;
    templateId?: string;
}

export type AppMode = 'edit' | 'chat';
export type CodeOrViewTab = 'preview' | 'code';

export interface AppState {
    currentMode: AppMode;
    activeCodeOrViewTab: CodeOrViewTab;
    projectName: string;
    isEditingProjectName: boolean;
}

export interface EditorSettings {
    theme: 'light' | 'dark';
    autoSave: boolean;
    showGrid: boolean;
    snapToGrid: boolean;
    gridSize: number;
}

export interface KeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    action: string;
}
