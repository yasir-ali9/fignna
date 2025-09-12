import { makeAutoObservable } from 'mobx';

export interface DomElement {
    domId: string;
    tagName: string;
    frameId: string;
    instanceId?: string;
    textContent?: string;
    rect?: DOMRect;
}

export class ElementsManager {
    selected: DomElement[] = [];
    hovered: DomElement | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    // Selection management
    select(element: DomElement) {
        this.selected = [element];
    }

    addToSelection(element: DomElement) {
        if (!this.isSelected(element)) {
            this.selected.push(element);
        }
    }

    removeFromSelection(element: DomElement) {
        this.selected = this.selected.filter(el => el.domId !== element.domId);
    }

    clearSelection() {
        this.selected = [];
    }

    isSelected(element: DomElement): boolean {
        return this.selected.some(el => el.domId === element.domId);
    }

    // Hover management
    setHovered(element: DomElement | null) {
        this.hovered = element;
    }

    clearHover() {
        this.hovered = null;
    }

    // Getters
    get hasSelection(): boolean {
        return this.selected.length > 0;
    }

    get selectedElement(): DomElement | null {
        return this.selected[0] || null;
    }

    get selectedCount(): number {
        return this.selected.length;
    }
}
