import { makeAutoObservable } from 'mobx';

export interface Frame {
    id: string;
    url: string;
    title: string;
    isLoading: boolean;
    isConnected: boolean;
}

export interface FrameData {
    frame: Frame;
    view?: any; // Will be defined when we implement iframe communication
}

export class FramesManager {
    frames: Map<string, FrameData> = new Map();
    selected: FrameData[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    // Frame management
    addFrame(frame: Frame): FrameData {
        const frameData: FrameData = { frame };
        this.frames.set(frame.id, frameData);
        return frameData;
    }

    removeFrame(frameId: string) {
        this.frames.delete(frameId);
        this.selected = this.selected.filter(f => f.frame.id !== frameId);
    }

    getFrame(frameId: string): FrameData | undefined {
        return this.frames.get(frameId);
    }

    updateFrame(frameId: string, updates: Partial<Frame>) {
        const frameData = this.frames.get(frameId);
        if (frameData) {
            Object.assign(frameData.frame, updates);
        }
    }

    // Selection management
    selectFrame(frameId: string) {
        const frameData = this.frames.get(frameId);
        if (frameData) {
            this.selected = [frameData];
        }
    }

    clearSelection() {
        this.selected = [];
    }

    // Getters
    getAll(): FrameData[] {
        return Array.from(this.frames.values());
    }

    get selectedFrame(): FrameData | null {
        return this.selected[0] || null;
    }

    get hasFrames(): boolean {
        return this.frames.size > 0;
    }

    get connectedFrames(): FrameData[] {
        return this.getAll().filter(f => f.frame.isConnected);
    }
}
