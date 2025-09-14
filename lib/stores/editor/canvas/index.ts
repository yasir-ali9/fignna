import { makeAutoObservable } from 'mobx';

export interface Position {
    x: number;
    y: number;
}

export enum CanvasMode {
    DESIGN = 'DESIGN',
    PREVIEW = 'PREVIEW',
    PAN = 'PAN'
}

export class CanvasManager {
    scale: number = 1;
    position: Position = { x: 0, y: 0 };
    mode: CanvasMode = CanvasMode.DESIGN;
    isInitialized: boolean = false;

    // Canvas constraints 
    readonly MIN_ZOOM = 0.1;
    readonly MAX_ZOOM = 3;
    readonly MAX_X = 10000;
    readonly MAX_Y = 10000;
    readonly MIN_X = -5000;
    readonly MIN_Y = -5000;

    constructor() {
        makeAutoObservable(this);
    }

    setScale(scale: number) {
        this.scale = this.clampZoom(scale);
    }

    setPosition(position: Position) {
        this.position = this.clampPosition(position, this.scale);
    }

    setMode(mode: CanvasMode) {
        this.mode = mode;
    }

    // Initialize canvas with centered position
    initializeCanvas(containerWidth: number, containerHeight: number, contentWidth: number = 384, contentHeight: number = 384) {
        // Always center on first load or if position is at origin
        if (!this.isInitialized || (this.position.x === 0 && this.position.y === 0)) {
            // Center the content in the viewport
            const centerX = (containerWidth - contentWidth) / 2;
            const centerY = (containerHeight - contentHeight) / 2;
            
            this.position = { x: centerX, y: centerY };
            this.isInitialized = true;
        }
    }

    // Reset canvas to center
    resetView(containerWidth?: number, containerHeight?: number) {
        this.scale = 1;
        if (containerWidth && containerHeight) {
            const centerX = (containerWidth - 384) / 2; // 384 is frame width
            const centerY = (containerHeight - 384) / 2; // 384 is frame height
            this.position = { x: centerX, y: centerY };
        } else {
            this.position = { x: 0, y: 0 };
        }
    }

    // Utility methods 
    private clampZoom(scale: number): number {
        return Math.min(Math.max(scale, this.MIN_ZOOM), this.MAX_ZOOM);
    }

    private clampPosition(position: Position, scale: number): Position {
        const effectiveMaxX = this.MAX_X * scale;
        const effectiveMaxY = this.MAX_Y * scale;
        const effectiveMinX = this.MIN_X * scale;
        const effectiveMinY = this.MIN_Y * scale;

        return {
            x: Math.min(Math.max(position.x, effectiveMinX), effectiveMaxX),
            y: Math.min(Math.max(position.y, effectiveMinY), effectiveMaxY),
        };
    }

    // Get transform style for CSS
    get transformStyle() {
        return {
            transform: `translate(${this.position.x}px, ${this.position.y}px) scale(${this.scale})`,
            transformOrigin: '0 0',
            transition: 'none', // No transition for smooth real-time zoom
        };
    }
}
