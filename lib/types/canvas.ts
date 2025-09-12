export interface Position {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface Rect extends Position, Size {}

export enum InteractionMode {
    SELECT = 'SELECT',
    HAND = 'HAND',
    PAN = 'PAN'
}

export interface CanvasConstraints {
    minZoom: number;
    maxZoom: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}
