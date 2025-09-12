// Penpal communication types for iframe interaction

export interface DomElement {
  selector: string;
  oid: string;
  tagName: string;
  attributes: Record<string, string>;
  textContent?: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface LayerNode {
  id: string;
  name: string;
  tagName: string;
  oid: string;
  children: LayerNode[];
  parent?: LayerNode;
  element?: DomElement;
}

// Methods available in the iframe (child)
export interface IframeChildMethods {
  // DOM querying
  getElementAtLoc: (x: number, y: number) => DomElement | null;
  getElementBySelector: (selector: string) => DomElement | null;
  getAllElements: () => DomElement[];
  
  // DOM manipulation
  updateElement: (selector: string, properties: Record<string, any>) => boolean;
  updateStyle: (selector: string, styles: Record<string, string>) => boolean;
  
  // Layer management
  processDom: () => void;
  buildLayerTree: () => LayerNode;
  
  // Element highlighting
  highlightElement: (selector: string) => void;
  unhighlightElement: (selector: string) => void;
  clearHighlights: () => void;
  
  // Selection
  selectElement: (selector: string) => void;
  clearSelection: () => void;
  
  // Communication setup
  setFrameId: (id: string) => void;
  initialize: () => void;
}

// Methods available in the parent (our app)
export interface IframeParentMethods {
  // Frame management
  getFrameId: () => string;
  
  // Event handlers
  onElementSelected: (element: DomElement) => void;
  onElementHovered: (element: DomElement | null) => void;
  onDomChanged: (layerTree: LayerNode) => void;
  onElementsUpdated: (elements: DomElement[]) => void;
}

// Promisified versions for async communication
export type PromisifiedChildMethods = {
  [K in keyof IframeChildMethods]: (
    ...args: Parameters<IframeChildMethods[K]>
  ) => Promise<ReturnType<IframeChildMethods[K]>>;
};

export type PromisifiedParentMethods = {
  [K in keyof IframeParentMethods]: (
    ...args: Parameters<IframeParentMethods[K]>
  ) => Promise<ReturnType<IframeParentMethods[K]>>;
};

export const IFRAME_COMMUNICATION_CHANNEL = 'FIGNNA_IFRAME_COMM';
