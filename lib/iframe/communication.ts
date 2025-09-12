// Simple penpal-style communication for iframe interaction

import type { IframeChildMethods, IframeParentMethods, IFRAME_COMMUNICATION_CHANNEL } from './penpal-types';

export class IframeCommunication {
  private messageId = 0;
  private pendingPromises = new Map<number, { resolve: Function; reject: Function }>();
  private methods: Record<string, Function> = {};
  
  constructor(
    private targetWindow: Window,
    private allowedOrigin: string = '*'
  ) {
    this.setupMessageListener();
  }

  // Register methods that can be called from the other side
  registerMethods(methods: Record<string, Function>) {
    this.methods = { ...this.methods, ...methods };
  }

  // Call a method on the other side
  async callMethod<T = any>(methodName: string, ...args: any[]): Promise<T> {
    const messageId = ++this.messageId;
    
    return new Promise((resolve, reject) => {
      this.pendingPromises.set(messageId, { resolve, reject });
      
      this.targetWindow.postMessage({
        type: 'FIGNNA_IFRAME_CALL',
        messageId,
        methodName,
        args
      }, this.allowedOrigin);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingPromises.has(messageId)) {
          this.pendingPromises.delete(messageId);
          reject(new Error(`Method call timeout: ${methodName}`));
        }
      }, 10000);
    });
  }

  private setupMessageListener() {
    window.addEventListener('message', (event) => {
      if (event.origin !== this.allowedOrigin && this.allowedOrigin !== '*') {
        return;
      }

      const { data } = event;
      
      if (data.type === 'FIGNNA_IFRAME_CALL') {
        this.handleMethodCall(data, event.source as Window);
      } else if (data.type === 'FIGNNA_IFRAME_RESPONSE') {
        this.handleMethodResponse(data);
      }
    });
  }

  private async handleMethodCall(data: any, source: Window) {
    const { messageId, methodName, args } = data;
    
    try {
      const method = this.methods[methodName];
      if (!method) {
        throw new Error(`Method not found: ${methodName}`);
      }
      
      const result = await method(...args);
      
      source.postMessage({
        type: 'FIGNNA_IFRAME_RESPONSE',
        messageId,
        success: true,
        result
      }, this.allowedOrigin);
    } catch (error) {
      source.postMessage({
        type: 'FIGNNA_IFRAME_RESPONSE',
        messageId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, this.allowedOrigin);
    }
  }

  private handleMethodResponse(data: any) {
    const { messageId, success, result, error } = data;
    const promise = this.pendingPromises.get(messageId);
    
    if (promise) {
      this.pendingPromises.delete(messageId);
      
      if (success) {
        promise.resolve(result);
      } else {
        promise.reject(new Error(error));
      }
    }
  }

  destroy() {
    this.pendingPromises.clear();
    // Note: We don't remove the event listener as it's global
  }
}

// Factory functions for parent and child communication
export function createParentCommunication(iframe: HTMLIFrameElement): IframeCommunication | null {
  if (!iframe.contentWindow) {
    return null;
  }
  
  return new IframeCommunication(iframe.contentWindow, '*');
}

export function createChildCommunication(): IframeCommunication {
  return new IframeCommunication(window.parent, '*');
}
