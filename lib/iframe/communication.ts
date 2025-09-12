// Simple penpal-style communication for iframe interaction

import type {
  IframeChildMethods,
  IframeParentMethods,
  IFRAME_COMMUNICATION_CHANNEL,
} from "./penpal-types";

export class IframeCommunication {
  private messageId = 0;
  private pendingPromises = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }
  >();
  private methods: Record<string, (...args: unknown[]) => unknown> = {};

  constructor(
    private targetWindow: Window,
    private allowedOrigin: string = "*"
  ) {
    this.setupMessageListener();
  }

  // Register methods that can be called from the other side
  registerMethods(methods: Record<string, (...args: unknown[]) => unknown>) {
    this.methods = { ...this.methods, ...methods };
  }

  // Call a method on the other side
  async callMethod<T = unknown>(
    methodName: string,
    ...args: unknown[]
  ): Promise<T> {
    const messageId = ++this.messageId;

    return new Promise<T>((resolve, reject) => {
      this.pendingPromises.set(messageId, {
        resolve: (value: unknown) => resolve(value as T),
        reject,
      });

      this.targetWindow.postMessage(
        {
          type: "FIGNNA_IFRAME_CALL",
          messageId,
          methodName,
          args,
        },
        this.allowedOrigin
      );

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
    window.addEventListener("message", (event) => {
      if (event.origin !== this.allowedOrigin && this.allowedOrigin !== "*") {
        return;
      }

      const { data } = event;

      if (data.type === "FIGNNA_IFRAME_CALL") {
        this.handleMethodCall(data, event.source as Window);
      } else if (data.type === "FIGNNA_IFRAME_RESPONSE") {
        this.handleMethodResponse(data);
      }
    });
  }

  private async handleMethodCall(
    data: Record<string, unknown>,
    source: Window
  ) {
    const { messageId, methodName, args } = data;

    try {
      const method = this.methods[methodName as string];
      if (!method) {
        throw new Error(`Method not found: ${methodName}`);
      }

      const result = await method(...(args as unknown[]));

      source.postMessage(
        {
          type: "FIGNNA_IFRAME_RESPONSE",
          messageId,
          success: true,
          result,
        },
        this.allowedOrigin
      );
    } catch (error) {
      source.postMessage(
        {
          type: "FIGNNA_IFRAME_RESPONSE",
          messageId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        this.allowedOrigin
      );
    }
  }

  private handleMethodResponse(data: Record<string, unknown>) {
    const { messageId, success, result, error } = data;
    const promise = this.pendingPromises.get(messageId as number);

    if (promise) {
      this.pendingPromises.delete(messageId as number);

      if (success) {
        promise.resolve(result);
      } else {
        promise.reject(new Error(error as string));
      }
    }
  }

  destroy() {
    this.pendingPromises.clear();
    // Note: We don't remove the event listener as it's global
  }
}

// Factory functions for parent and child communication
export function createParentCommunication(
  iframe: HTMLIFrameElement
): IframeCommunication | null {
  if (!iframe.contentWindow) {
    return null;
  }

  return new IframeCommunication(iframe.contentWindow, "*");
}

export function createChildCommunication(): IframeCommunication {
  return new IframeCommunication(window.parent, "*");
}
