"use client";

import { observer } from "mobx-react-lite";
import { useState, useRef, useCallback, useEffect } from "react";
import { Iframe } from "./iframe";
import { useEditorEngine } from "@/lib/stores/editor/hooks";
import type { DomElement } from "@/lib/iframe/penpal-types";
// Import the loading states for TurningOn widget
import { LoadingStates } from "./turning-on";

interface CanvasFrameProps {
  /** Frame title */
  title: string;
  /** Frame URL to preview */
  url?: string;
  /** Frame position */
  x: number;
  y: number;
  /** Frame dimensions */
  width: number;
  height: number;
  /** Whether the frame is loading */
  isLoading?: boolean;
  /** CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Whether the frame is selected */
  isSelected?: boolean;
  /** Whether the frame can be resized */
  resizable?: boolean;
  /** Whether the frame can be moved */
  movable?: boolean;
  /** Position/size change handler */
  onTransform?: (x: number, y: number, width: number, height: number) => void;
  /** Element selection handler */
  onElementSelected?: (element: DomElement) => void;
  /** Element hover handler */
  onElementHovered?: (element: DomElement | null) => void;
  /** Frame ID */
  frameId?: string;
}

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | null;

export const CanvasFrame = observer(
  ({
    title,
    url,
    x,
    y,
    width,
    height,
    isLoading = false,
    className = "",
    onClick,
    isSelected = false,
    resizable = true,
    movable = true,
    onTransform,
    onElementSelected,
    onElementHovered,
    frameId = "frame",
  }: CanvasFrameProps) => {
    const editorEngine = useEditorEngine();
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
    const frameRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef({
      x: 0,
      y: 0,
      frameX: 0,
      frameY: 0,
      frameWidth: 0,
      frameHeight: 0,
    });

    const handleMouseDown = useCallback(
      (e: React.MouseEvent, action: "move" | ResizeHandle) => {
        if (!movable && action === "move") return;
        if (!resizable && action !== "move") return;

        e.preventDefault();
        e.stopPropagation();

        dragStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          frameX: x,
          frameY: y,
          frameWidth: width,
          frameHeight: height,
        };

        if (action === "move") {
          setIsDragging(true);
        } else {
          setIsResizing(true);
          setActiveHandle(action);
        }

        onClick?.();
      },
      [x, y, width, height, movable, resizable, onClick]
    );

    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!isDragging && !isResizing) return;

        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        const { frameX, frameY, frameWidth, frameHeight } =
          dragStartRef.current;

        if (isDragging) {
          // Move the frame
          const newX = frameX + deltaX;
          const newY = frameY + deltaY;
          onTransform?.(newX, newY, width, height);
        } else if (isResizing && activeHandle) {
          // Resize the frame based on the active handle
          let newX = frameX;
          let newY = frameY;
          let newWidth = frameWidth;
          let newHeight = frameHeight;

          switch (activeHandle) {
            case "nw":
              newX = frameX + deltaX;
              newY = frameY + deltaY;
              newWidth = frameWidth - deltaX;
              newHeight = frameHeight - deltaY;
              break;
            case "n":
              newY = frameY + deltaY;
              newHeight = frameHeight - deltaY;
              break;
            case "ne":
              newY = frameY + deltaY;
              newWidth = frameWidth + deltaX;
              newHeight = frameHeight - deltaY;
              break;
            case "e":
              newWidth = frameWidth + deltaX;
              break;
            case "se":
              newWidth = frameWidth + deltaX;
              newHeight = frameHeight + deltaY;
              break;
            case "s":
              newHeight = frameHeight + deltaY;
              break;
            case "sw":
              newX = frameX + deltaX;
              newWidth = frameWidth - deltaX;
              newHeight = frameHeight + deltaY;
              break;
            case "w":
              newX = frameX + deltaX;
              newWidth = frameWidth - deltaX;
              break;
          }

          // Enforce minimum size
          const minWidth = 200;
          const minHeight = 150;

          if (newWidth < minWidth) {
            if (activeHandle?.includes("w")) {
              newX = frameX + frameWidth - minWidth;
            }
            newWidth = minWidth;
          }

          if (newHeight < minHeight) {
            if (activeHandle?.includes("n")) {
              newY = frameY + frameHeight - minHeight;
            }
            newHeight = minHeight;
          }

          onTransform?.(newX, newY, newWidth, newHeight);
        }
      },
      [isDragging, isResizing, activeHandle, width, height, onTransform]
    );

    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
      setIsResizing(false);
      setActiveHandle(null);
    }, []);

    // Global mouse event listeners
    useEffect(() => {
      if (isDragging || isResizing) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = isDragging
          ? "grabbing"
          : getCursorForHandle(activeHandle);
        document.body.style.userSelect = "none";

        return () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
          document.body.style.cursor = "";
          document.body.style.userSelect = "";
        };
      }
    }, [isDragging, isResizing, activeHandle, handleMouseMove, handleMouseUp]);

    const getCursorForHandle = (handle: ResizeHandle): string => {
      switch (handle) {
        case "nw":
        case "se":
          return "nw-resize";
        case "n":
        case "s":
          return "n-resize";
        case "ne":
        case "sw":
          return "ne-resize";
        case "e":
        case "w":
          return "e-resize";
        default:
          return "default";
      }
    };

    const handleFrameClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick?.();
      },
      [onClick]
    );

    // Ref for iframe content container
    const iframeContainerRef = useRef<HTMLDivElement>(null);

    // Add wheel event listener to iframe container to capture zoom events
    useEffect(() => {
      const container = iframeContainerRef.current;

      const handleWheel = (e: WheelEvent) => {
        // Always capture wheel events and forward to canvas for zoom/pan
        e.preventDefault();
        e.stopPropagation();
        const forwardedEvent = new WheelEvent("wheel", {
          bubbles: true,
          clientX: e.clientX,
          clientY: e.clientY,
          deltaX: e.deltaX,
          deltaY: e.deltaY,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          shiftKey: e.shiftKey,
        });
        document.dispatchEvent(forwardedEvent);
      };

      if (container) {
        container.addEventListener("wheel", handleWheel as EventListener, {
          passive: false,
        });

        return () => {
          container.removeEventListener("wheel", handleWheel as EventListener);
        };
      }
    }, []);

    return (
      <div
        ref={frameRef}
        className={`absolute select-none ${className}`}
        style={{
          left: x,
          top: y,
          width,
          height,
          zIndex: isSelected ? 10 : 1,
        }}
        onClick={handleFrameClick}
      >
        {/* Frame container */}
        <div
          className={`relative w-full h-full bg-white rounded-lg shadow-lg border-1 transition-colors overflow-hidden ${
            isSelected ? "border-bd-50" : "border-bd-50"
          }`}
        >
          {/* Frame header */}
          <div
            className={`absolute -top-8 left-0 right-0 h-6 flex items-center justify-between px-2 rounded-t-md border border-bd-50 border-b-0 ${
              movable ? "cursor-move" : "cursor-default"
            } ${isSelected ? "bg-blue-100" : "bg-bk-80"}`}
            onMouseDown={(e) => handleMouseDown(e, "move")}
          >
            <div className="text-xs text-fg-80 font-medium truncate">
              {title}
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
            </div>
          </div>

          {/* Frame content */}
          <div
            ref={iframeContainerRef}
            className="w-full h-full rounded-lg overflow-hidden relative"
          >
            <Iframe
              url={url}
              isLoading={isLoading}
              loadingMessage="Loading app..."
              errorMessage="Failed to load preview"
              className="w-full h-full"
              frameId={frameId}
              enableCommunication={true}
              onElementSelected={onElementSelected}
              onElementHovered={onElementHovered}
              // Turning on stuff
              showTurningOn={isLoading && (
                editorEngine.projects.isSyncing || 
                editorEngine.sandbox.isRestarting || 
                editorEngine.sandbox.isCreating ||
                editorEngine.sandbox.currentSandbox?.status === "creating"
              )}
              turningOnTitle={
                editorEngine.sandbox.isRestarting 
                  ? LoadingStates.RESTARTING.title
                  : editorEngine.projects.isSyncing 
                    ? LoadingStates.SYNCING.title
                    : (editorEngine.sandbox.isCreating || editorEngine.sandbox.currentSandbox?.status === "creating")
                      ? LoadingStates.SANDBOX_CREATION.title
                      : undefined
              }
              turningOnSubtitle={
                editorEngine.sandbox.isRestarting 
                  ? LoadingStates.RESTARTING.subtitle
                  : editorEngine.projects.isSyncing 
                    ? LoadingStates.SYNCING.subtitle
                    : (editorEngine.sandbox.isCreating || editorEngine.sandbox.currentSandbox?.status === "creating")
                      ? LoadingStates.SANDBOX_CREATION.subtitle
                      : undefined
              }
            />

            {/* Canvas interaction overlay */}
            {editorEngine.state.isHandToolActive && (
              <div
                className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
                style={{ pointerEvents: "auto" }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Forward the event to the parent canvas
                  const canvasEvent = new MouseEvent("mousedown", {
                    bubbles: true,
                    clientX: e.clientX,
                    clientY: e.clientY,
                    button: e.button,
                  });
                  document.dispatchEvent(canvasEvent);
                }}
              />
            )}
          </div>

          {/* Selection overlay and resize handles */}
          {isSelected && (
            <>
              {/* Selection outline */}
              <div className="absolute inset-0 border border-bd-50 rounded-lg pointer-events-none" />

              {/* Resize handles - Temporarily disabled for Edit Mode implementation */}
              {/* {resizable && (
              <>
                <ResizeHandle position="nw" onMouseDown={(e) => handleMouseDown(e, 'nw')} />
                <ResizeHandle position="ne" onMouseDown={(e) => handleMouseDown(e, 'ne')} />
                <ResizeHandle position="se" onMouseDown={(e) => handleMouseDown(e, 'se')} />
                <ResizeHandle position="sw" onMouseDown={(e) => handleMouseDown(e, 'sw')} />
                <ResizeHandle position="n" onMouseDown={(e) => handleMouseDown(e, 'n')} />
                <ResizeHandle position="e" onMouseDown={(e) => handleMouseDown(e, 'e')} />
                <ResizeHandle position="s" onMouseDown={(e) => handleMouseDown(e, 's')} />
                <ResizeHandle position="w" onMouseDown={(e) => handleMouseDown(e, 'w')} />
              </>
            )} */}
            </>
          )}
        </div>
      </div>
    );
  }
);

// Resize handle component
interface ResizeHandleProps {
  position: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
  onMouseDown: (e: React.MouseEvent) => void;
}

const ResizeHandle = ({ position, onMouseDown }: ResizeHandleProps) => {
  const getPositionClasses = () => {
    switch (position) {
      case "nw":
        return "top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize";
      case "n":
        return "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-n-resize";
      case "ne":
        return "top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize";
      case "e":
        return "top-1/2 right-0 translate-x-1/2 -translate-y-1/2 cursor-e-resize";
      case "se":
        return "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize";
      case "s":
        return "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-s-resize";
      case "sw":
        return "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize";
      case "w":
        return "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 cursor-e-resize";
    }
  };

  return (
    <div
      className={`absolute w-3 h-3 bg-blue-500 border border-white rounded-sm hover:bg-blue-600 ${getPositionClasses()}`}
      onMouseDown={onMouseDown}
    />
  );
};
