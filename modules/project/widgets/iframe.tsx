"use client";

import { observer } from "mobx-react-lite";
import { useEffect, useState, useRef, useCallback } from "react";
import { SandboxLoading } from "./sandbox-loading";
// Import the reusable turning-on widget
import TurningOn, { LoadingStates } from "./turning-on";
import {
  IframeCommunication,
  createParentCommunication,
} from "@/lib/iframe/communication";
import type {
  DomElement,
  IframeChildMethods,
  IframeParentMethods,
} from "@/lib/iframe/penpal-types";

interface IframeProps {
  /** URL to load in iframe */
  url?: string;
  /** CSS classes */
  className?: string;
  /** Loading message */
  loadingMessage?: string;
  /** Error message */
  errorMessage?: string;
  /** Whether iframe is loading */
  isLoading?: boolean;
  /** Frame ID for communication */
  frameId?: string;
  /** Enable iframe communication */
  enableCommunication?: boolean;
  /** Element selection handler */
  onElementSelected?: (element: DomElement) => void;
  /** Element hover handler */
  onElementHovered?: (element: DomElement | null) => void;
  /** DOM change handler */
  onDomChanged?: (elements: DomElement[]) => void;
  /** Whether to show TurningOn widget instead of SandboxLoading */
  showTurningOn?: boolean;
  /** TurningOn widget title */
  turningOnTitle?: string;
  /** TurningOn widget subtitle */
  turningOnSubtitle?: string;
}

export const Iframe = observer(
  ({
    url,
    className = "w-full h-full",
    loadingMessage = "Loading preview...",
    errorMessage = "Preview not available",
    isLoading = false,
    frameId = "main-frame",
    enableCommunication = false,
    onElementSelected,
    onElementHovered,
    onDomChanged,
    showTurningOn = false,
    turningOnTitle,
    turningOnSubtitle,
  }: IframeProps) => {
    const [iframeLoading, setIframeLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isCommReady, setIsCommReady] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const communicationRef = useRef<IframeCommunication | null>(null);

    // Reset loading states when URL changes
    useEffect(() => {
      if (url) {
        setIframeLoading(true);
        setHasError(false);
        setIsCommReady(false);
      }
    }, [url]);

    const setupCommunication = useCallback(() => {
      if (!enableCommunication || !iframeRef.current) return;

      const comm = createParentCommunication(iframeRef.current);
      if (!comm) return;

      communicationRef.current = comm;

      // Register parent methods
      const parentMethods: IframeParentMethods = {
        getFrameId: () => frameId,
        onElementSelected: (element: DomElement) => {
          onElementSelected?.(element);
        },
        onElementHovered: (element: DomElement | null) => {
          onElementHovered?.(element);
        },
        onDomChanged: (layerTree: any) => {
          // For now, just pass the layer tree as elements
          onDomChanged?.(layerTree.elements || []);
        },
        onElementsUpdated: (elements: DomElement[]) => {
          onDomChanged?.(elements);
        },
      };

      comm.registerMethods(
        parentMethods as unknown as Record<
          string,
          (...args: unknown[]) => unknown
        >
      );

      // Try to initialize communication with the iframe
      setTimeout(async () => {
        try {
          await comm.callMethod("initialize");
          await comm.callMethod("setFrameId", frameId);
          setIsCommReady(true);
          console.log(`Communication established with frame ${frameId}`);
        } catch (error) {
          console.log(
            "Communication not available (expected for external sites):",
            error
          );
        }
      }, 1000);
    }, [
      enableCommunication,
      frameId,
      onElementSelected,
      onElementHovered,
      onDomChanged,
    ]);

    const handleIframeLoad = useCallback(() => {
      setIframeLoading(false);
      setHasError(false);

      if (enableCommunication) {
        // Wait a bit for iframe to fully load before setting up communication
        setTimeout(setupCommunication, 500);
      }
    }, [enableCommunication, setupCommunication]);

    const handleIframeError = useCallback(() => {
      setIframeLoading(false);
      setHasError(true);
      setIsCommReady(false);
    }, []);

    // Public methods for external control
    const communicationMethods = {
      async getElementAtLoc(x: number, y: number): Promise<DomElement | null> {
        if (!communicationRef.current || !isCommReady) return null;
        try {
          return await communicationRef.current.callMethod(
            "getElementAtLoc",
            x,
            y
          );
        } catch (error) {
          console.error("Failed to get element at location:", error);
          return null;
        }
      },

      async highlightElement(selector: string): Promise<void> {
        if (!communicationRef.current || !isCommReady) return;
        try {
          await communicationRef.current.callMethod(
            "highlightElement",
            selector
          );
        } catch (error) {
          console.error("Failed to highlight element:", error);
        }
      },

      async updateElementStyle(
        selector: string,
        styles: Record<string, string>
      ): Promise<boolean> {
        if (!communicationRef.current || !isCommReady) return false;
        try {
          return await communicationRef.current.callMethod(
            "updateStyle",
            selector,
            styles
          );
        } catch (error) {
          console.error("Failed to update element style:", error);
          return false;
        }
      },

      async selectElement(selector: string): Promise<void> {
        if (!communicationRef.current || !isCommReady) return;
        try {
          await communicationRef.current.callMethod("selectElement", selector);
        } catch (error) {
          console.error("Failed to select element:", error);
        }
      },

      async clearSelection(): Promise<void> {
        if (!communicationRef.current || !isCommReady) return;
        try {
          await communicationRef.current.callMethod("clearSelection");
        } catch (error) {
          console.error("Failed to clear selection:", error);
        }
      },
    };

    // Expose methods via ref
    useEffect(() => {
      if (iframeRef.current) {
        (iframeRef.current as any).communicationMethods = communicationMethods;
      }
    }, [isCommReady]);

    // Cleanup
    useEffect(() => {
      return () => {
        if (communicationRef.current) {
          communicationRef.current.destroy();
        }
      };
    }, []);

    // Check if this is a mock preview URL
    const isMockUrl = url && url.includes("fignna.dev");

    // Show loading state with tic-tac-toe game
    if (isLoading || !url) {
      return (
        <div className={`${className}`}>
          {isLoading ? (
            showTurningOn && turningOnTitle ? (
              <TurningOn
                title={turningOnTitle}
                subtitle={turningOnSubtitle}
              />
            ) : (
              <SandboxLoading />
            )
          ) : (
            <div className="flex items-center justify-center bg-bk-60 h-full">
              <div className="text-center text-fg-40">
                <div className="text-sm">No preview available</div>
                <div className="text-xs text-fg-30 mt-1">
                  Create a project to get started
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Show mock preview for mock URLs
    if (isMockUrl) {
      return (
        <div
          className={`${className} bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center`}
        >
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Fignna
            </h1>
            <p className="text-gray-600 mb-6">
              Your project is ready! Start building something amazing.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
              Get Started
            </button>

            <div className="mt-6 p-3 bg-gray-50 rounded text-xs text-gray-500">
              Preview URL: {url}
            </div>

            <div className="mt-4 text-xs text-gray-400">
              🚀 Generated with Fignna • This is a mock preview
            </div>
          </div>
        </div>
      );
    }

    // Show error state
    if (hasError) {
      return (
        <div
          className={`flex items-center justify-center bg-bk-50 ${className}`}
        >
          <div className="text-center text-fg-40 p-6">
            <div className="text-lg mb-2">🔧</div>
            <div className="text-sm mb-3">{errorMessage}</div>
            <button
              onClick={() => {
                setHasError(false);
                setIframeLoading(true);
              }}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative ${className}`}>
        {/* Loading overlay */}
        {iframeLoading && (
          <div className="absolute inset-0 bg-white z-10">
            {showTurningOn && turningOnTitle ? (
              <TurningOn
                title={turningOnTitle}
                subtitle={turningOnSubtitle}
              />
            ) : (
              <SandboxLoading />
            )}
          </div>
        )}

        {/* Communication status indicator (debug) */}
        {enableCommunication && !iframeLoading && (
          <div className="absolute top-2 right-2 z-20">
            <div
              className={`w-2 h-2 rounded-full ${isCommReady ? "bg-green-400" : "bg-gray-400"
                }`}
              title={
                isCommReady
                  ? "Communication ready"
                  : "Communication not available"
              }
            />
          </div>
        )}

        {/* Iframe */}
        <iframe
          ref={iframeRef}
          src={url}
          className="w-full h-full border-0"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          allow="geolocation; microphone; camera; midi; encrypted-media"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="Preview"
        />
      </div>
    );
  }
);
