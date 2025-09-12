import { makeAutoObservable } from "mobx";
import { CanvasManager } from "./canvas";
import { ElementsManager } from "./elements";
import { FramesManager } from "./frames";
import { StateManager } from "./state";
import { AIManager } from "./ai";
import { SandboxManager } from "./sandbox";
import { FilesManager } from "./files";
import { ProjectsManager } from "./projects";
import { ChatManager } from "./chat";

export class EditorEngine {
  canvas: CanvasManager;
  elements: ElementsManager;
  frames: FramesManager;
  state: StateManager;
  ai: AIManager;
  sandbox: SandboxManager;
  files: FilesManager;
  projects: ProjectsManager;
  chat: ChatManager;

  constructor() {
    this.canvas = new CanvasManager();
    this.elements = new ElementsManager();
    this.frames = new FramesManager();
    this.state = new StateManager();
    this.ai = new AIManager();
    this.sandbox = new SandboxManager(this);
    this.files = new FilesManager(this);
    this.projects = new ProjectsManager(this);
    this.chat = new ChatManager(this);

    makeAutoObservable(this);
  }

  clearUI() {
    this.elements.clearSelection();
    this.elements.clearHover();
  }

  dispose() {
    // Cleanup resources when editor is unmounted
    this.sandbox.dispose();
    this.files.dispose();
    this.projects.dispose();
    this.chat.dispose();
  }
}
