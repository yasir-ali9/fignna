import { makeAutoObservable } from "mobx";

export enum EditorMode {
  DESIGN = "DESIGN",
  PREVIEW = "PREVIEW",
  PAN = "PAN",
}

export enum LeftPanelTab {
  LAYERS = "LAYERS",
  PAGES = "PAGES",
  CODE = "CODE",
}

export enum RightPanelTab {
  PROPERTIES = "PROPERTIES",
  CHAT = "CHAT",
}

export enum AppMode {
  EDIT = "EDIT",
  VIEW = "VIEW", // Previously CHAT
  CODE = "CODE", // New code mode
}

export enum ViewModeTab {
  PREVIEW = "PREVIEW",
  CODE = "CODE",
}

export enum ViewMode {
  DEFAULT = "DEFAULT", // Preview/Code + Chat panel
  ONLY_CODE = "ONLY_CODE", // Only code editor, no chat
  ONLY_PREVIEW = "ONLY_PREVIEW", // Only preview, no chat
  CODE_PREVIEW = "CODE_PREVIEW", // Code + Preview split, no chat
}

export enum CanvasTool {
  SELECT = "SELECT", // Default selection/move tool
  HAND = "HAND", // Hand/pan tool
}

export class StateManager {
  // Application modes
  appMode: AppMode = AppMode.VIEW;

  // Editor modes
  editorMode: EditorMode = EditorMode.DESIGN;

  // Panel states
  leftPanelTab: LeftPanelTab | null = LeftPanelTab.LAYERS;
  rightPanelTab: RightPanelTab = RightPanelTab.PROPERTIES;
  leftPanelLocked: boolean = false;

  // View mode specific states
  viewModeTab: ViewModeTab = ViewModeTab.PREVIEW;
  viewMode: ViewMode = ViewMode.DEFAULT;

  // Canvas tool states
  canvasTool: CanvasTool = CanvasTool.SELECT;
  isSpacePressed: boolean = false;

  // Canvas interaction states
  canvasScrolling: boolean = false;
  canvasPanning: boolean = false;

  // UI states
  isLoading: boolean = false;

  // Terminal states
  isTerminalOpen: boolean = false;

  // Project states
  projectName: string = "Unnamed";
  isEditingProjectName: boolean = false;

  // Initial prompt state (for home page -> editor flow)
  initialPrompt: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  // App mode management
  setAppMode(mode: AppMode) {
    this.appMode = mode;
  }

  // Mode management
  setEditorMode(mode: EditorMode) {
    this.editorMode = mode;
  }

  // Panel management
  setLeftPanelTab(tab: LeftPanelTab | null) {
    this.leftPanelTab = tab;
  }

  setRightPanelTab(tab: RightPanelTab) {
    this.rightPanelTab = tab;
  }

  // View mode management
  setViewModeTab(tab: ViewModeTab) {
    this.viewModeTab = tab;
  }

  setViewMode(mode: ViewMode) {
    this.viewMode = mode;
  }

  toggleLeftPanelLock() {
    this.leftPanelLocked = !this.leftPanelLocked;
  }

  // Canvas state management
  setCanvasScrolling(scrolling: boolean) {
    this.canvasScrolling = scrolling;
  }

  setCanvasPanning(panning: boolean) {
    this.canvasPanning = panning;
  }

  // Tool management
  setCanvasTool(tool: CanvasTool) {
    this.canvasTool = tool;
  }

  setSpacePressed(pressed: boolean) {
    this.isSpacePressed = pressed;
  }

  // Loading state
  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  // Terminal management
  setTerminalOpen(open: boolean) {
    this.isTerminalOpen = open;
  }

  toggleTerminal() {
    this.isTerminalOpen = !this.isTerminalOpen;
  }

  // Project management
  setProjectName(name: string) {
    this.projectName = name.trim() || "Unnamed";
  }

  setEditingProjectName(editing: boolean) {
    this.isEditingProjectName = editing;
  }

  // Initial prompt management
  setInitialPrompt(prompt: string | null) {
    this.initialPrompt = prompt;
  }

  clearInitialPrompt() {
    this.initialPrompt = null;
  }

  // Getters
  get isEditMode(): boolean {
    return this.appMode === AppMode.EDIT;
  }

  get isViewMode(): boolean {
    return this.appMode === AppMode.VIEW;
  }

  get isCodeMode(): boolean {
    return this.appMode === AppMode.CODE;
  }

  get isDesignMode(): boolean {
    return this.editorMode === EditorMode.DESIGN;
  }

  get isPreviewMode(): boolean {
    return this.editorMode === EditorMode.PREVIEW;
  }

  get isPanMode(): boolean {
    return this.editorMode === EditorMode.PAN;
  }

  get isPreviewTabActive(): boolean {
    return this.viewModeTab === ViewModeTab.PREVIEW;
  }

  get isCodeTabActive(): boolean {
    return this.viewModeTab === ViewModeTab.CODE;
  }

  get showLeftPanel(): boolean {
    return this.leftPanelTab !== null && this.isDesignMode;
  }

  get showRightPanel(): boolean {
    return this.isDesignMode;
  }

  // Tool state getters
  get activeCanvasTool(): CanvasTool {
    // Space key overrides current tool to hand
    return this.isSpacePressed ? CanvasTool.HAND : this.canvasTool;
  }

  get isHandToolActive(): boolean {
    return this.activeCanvasTool === CanvasTool.HAND;
  }

  get isSelectToolActive(): boolean {
    return this.activeCanvasTool === CanvasTool.SELECT;
  }
}
