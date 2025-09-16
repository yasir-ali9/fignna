"use client";

import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { CanvasMode } from "@/lib/stores/editor/canvas";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FloatingToolbar } from "../bottom-ribbon/floating-toolbar";
import { CanvasFrame } from "@/modules/project/widgets/canvas-frame";

// Canvas interaction constants (Figma-like smooth zoom)
const ZOOM_STEP = 0.05; // 4% zoom per scroll step (like Figma)
const PAN_SENSITIVITY = 1; // Smooth panning

export const Canvas = observer(() => {
  const editorEngine = useEditorEngine();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const { scale, position } = editorEngine.canvas;
  const { isHandToolActive } = editorEngine.state;

  // Get current project's workspace ID from sandbox
  const workspaceId = editorEngine.sandbox.currentSandbox?.id;

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== containerRef.current) {
      return;
    }

    // If hand tool is active, start dragging
    if (isHandToolActive) {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(true);
      setDragStart({ x: event.clientX, y: event.clientY });
      // Prevent text selection during dragging
      document.body.style.userSelect = "none";
      document.body.style.webkitUserSelect = "none";
      return;
    }

    editorEngine.clearUI();
  };

  const handleCanvasMouseMove = useCallback(
    (event: MouseEvent) => {
      if (isDragging && isHandToolActive) {
        const deltaX = event.clientX - dragStart.x;
        const deltaY = event.clientY - dragStart.y;

        editorEngine.canvas.setPosition({
          x: position.x + deltaX,
          y: position.y + deltaY,
        });

        setDragStart({ x: event.clientX, y: event.clientY });
      }
    },
    [isDragging, isHandToolActive, dragStart, position, editorEngine.canvas]
  );

  const handleCanvasMouseUp = useCallback(() => {
    if (isDragging) {
      // Restore text selection when dragging ends
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
    }
    setIsDragging(false);
  }, [isDragging]);

  const handleZoom = useCallback(
    (event: WheelEvent) => {
      if (!containerRef.current) return;

      event.preventDefault();

      // Determine zoom direction (normalize deltaY for different browsers/OS)
      const normalizedDelta = Math.sign(event.deltaY);

      // Calculate new scale with fixed 4% steps (like Figma)
      const zoomDirection = normalizedDelta > 0 ? -1 : 1; // Negative deltaY = zoom in
      const newScale = scale * (1 + ZOOM_STEP * zoomDirection);

      // Clamp the scale within bounds
      const clampedScale = Math.min(
        Math.max(newScale, editorEngine.canvas.MIN_ZOOM),
        editorEngine.canvas.MAX_ZOOM
      );

      // Only proceed if scale actually changed
      if (Math.abs(clampedScale - scale) < 0.001) return;

      // Get cursor position relative to container
      const rect = containerRef.current.getBoundingClientRect();
      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;

      // Calculate zoom factor for position adjustment
      const zoomFactor = (clampedScale - scale) / scale;

      // Adjust position to zoom towards cursor
      const deltaX = (cursorX - position.x) * zoomFactor;
      const deltaY = (cursorY - position.y) * zoomFactor;

      // Update scale and position
      editorEngine.canvas.setScale(clampedScale);
      editorEngine.canvas.setPosition({
        x: position.x - deltaX,
        y: position.y - deltaY,
      });
    },
    [scale, position, editorEngine.canvas]
  );

  const handlePan = useCallback(
    (event: WheelEvent) => {
      // Smooth panning with proper sensitivity
      const deltaX =
        (event.deltaX + (event.shiftKey ? event.deltaY : 0)) * PAN_SENSITIVITY;
      const deltaY = (event.shiftKey ? 0 : event.deltaY) * PAN_SENSITIVITY;

      editorEngine.canvas.setPosition({
        x: position.x - deltaX,
        y: position.y - deltaY,
      });
    },
    [position, editorEngine.canvas]
  );

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      // Check if the event is within the canvas container
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const isWithinCanvas =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      // Only handle wheel events within the canvas area
      if (!isWithinCanvas) return;

      // Prevent default scrolling
      event.preventDefault();
      event.stopPropagation();

      editorEngine.state.setCanvasScrolling(true);

      if (event.ctrlKey || event.metaKey) {
        handleZoom(event);
      } else {
        handlePan(event);
      }

      // Reset scrolling state after a delay
      setTimeout(() => {
        editorEngine.state.setCanvasScrolling(false);
      }, 100);
    },
    [handleZoom, handlePan, editorEngine.state]
  );

  const handleMiddleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button === 1) {
        editorEngine.canvas.setMode(CanvasMode.PAN);
        editorEngine.state.setCanvasPanning(true);
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [editorEngine]
  );

  const handleMiddleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (e.button === 1) {
        editorEngine.canvas.setMode(CanvasMode.DESIGN);
        editorEngine.state.setCanvasPanning(false);
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [editorEngine]
  );

  // Keyboard handling for space key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.code === "Space" && !event.repeat) {
        event.preventDefault();
        editorEngine.state.setSpacePressed(true);
      }
    },
    [editorEngine.state]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        editorEngine.state.setSpacePressed(false);
        if (isDragging) {
          // Restore text selection when space is released
          document.body.style.userSelect = "";
          document.body.style.webkitUserSelect = "";
        }
        setIsDragging(false); // Stop dragging when space is released
      }
    },
    [editorEngine.state, isDragging]
  );

  const getCursor = () => {
    if (isDragging) return "grabbing";
    if (isHandToolActive) return "grab";
    return "default";
  };

  // Initialize canvas centering on mount and handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        editorEngine.canvas.initializeCanvas(rect.width, rect.height);
      }
    };

    handleResize(); // Initial centering
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [editorEngine.canvas]);

  const transformStyle = useMemo(
    () => editorEngine.canvas.transformStyle,
    [editorEngine.canvas.transformStyle]
  );

  useEffect(() => {
    const div = containerRef.current;
    if (div) {
      // Add listeners to both the container and document for iframe interaction
      div.addEventListener("wheel", handleWheel, { passive: false });
      div.addEventListener("mousedown", handleMiddleMouseDown);
      div.addEventListener("mouseup", handleMiddleMouseUp);

      // Add global wheel listener to capture events from iframe
      document.addEventListener("wheel", handleWheel, { passive: false });

      return () => {
        div.removeEventListener("wheel", handleWheel);
        div.removeEventListener("mousedown", handleMiddleMouseDown);
        div.removeEventListener("mouseup", handleMiddleMouseUp);
        document.removeEventListener("wheel", handleWheel);
      };
    }
  }, [handleWheel, handleMiddleMouseDown, handleMiddleMouseUp]);

  // Handle mouse events forwarded from iframe overlays
  const handleForwardedMouseDown = useCallback(
    (event: MouseEvent) => {
      if (isHandToolActive && event.target !== containerRef.current) {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
        setDragStart({ x: event.clientX, y: event.clientY });
        // Prevent text selection during dragging
        document.body.style.userSelect = "none";
        document.body.style.webkitUserSelect = "none";
      }
    },
    [isHandToolActive]
  );

  // Global event listeners for keyboard and mouse
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("mousemove", handleCanvasMouseMove);
    document.addEventListener("mouseup", handleCanvasMouseUp);
    document.addEventListener("mousedown", handleForwardedMouseDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("mousemove", handleCanvasMouseMove);
      document.removeEventListener("mouseup", handleCanvasMouseUp);
      document.removeEventListener("mousedown", handleForwardedMouseDown);
    };
  }, [
    handleKeyDown,
    handleKeyUp,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleForwardedMouseDown,
  ]);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden bg-bk-60 flex flex-grow relative w-full h-full"
      onMouseDown={handleCanvasMouseDown}
      style={{
        cursor: getCursor(),
      }}
    >
      {/* Canvas content container */}
      <div id="canvas-container" style={transformStyle} className="relative">
        {/* Frames will be rendered here */}
        <FramesContainer />
      </div>

      {/* Canvas UI overlays */}
      <CanvasOverlay />
      <ZoomControls
        containerRef={containerRef as React.RefObject<HTMLDivElement | null>}
      />

      {/* Floating Toolbar - positioned above terminal when open */}
      <FloatingToolbar />
    </div>
  );
});

// Frames container for edit mode canvas
const FramesContainer = observer(() => {
  const editorEngine = useEditorEngine();
  const frames = editorEngine.frames.getAll();
  const { previewUrl, isCreating } = editorEngine.sandbox;

  // Show default frame if no frames exist but we have a sandbox
  if (frames.length === 0 && (previewUrl || isCreating)) {
    return (
      <CanvasFrame
        title="Main App"
        url={previewUrl || undefined}
        x={100}
        y={100}
        width={1200}
        height={800}
        isLoading={
          isCreating ||
          editorEngine.sandbox.isRestarting ||
          editorEngine.projects.isSyncing ||
          editorEngine.sandbox.currentSandbox?.status === "creating"
        }
        frameId="main-frame"
        onClick={() => {
          // Handle frame selection logic here
        }}
        onTransform={(x, y, width, height) => {
          // Handle frame transformation
          console.log("Frame transformed:", { x, y, width, height });
        }}
        onElementSelected={(element) => {
          console.log("Element selected:", element);
        }}
        onElementHovered={(element) => {
          console.log("Element hovered:", element);
        }}
        isSelected={true}
        resizable={true}
        movable={true}
      />
    );
  }

  // Show empty state if no frames and no sandbox
  if (frames.length === 0) {
    return (
      <div className="w-96 h-96 bg-white rounded-lg shadow-lg border border-bd-50 flex items-center justify-center mt-8">
        <div className="text-center text-fg-60">
          <div className="text-lg mb-2">No preview available</div>
          <div className="text-sm">Create a new project to get started</div>
        </div>
      </div>
    );
  }

  // Render existing frames
  return (
    <div className="grid grid-flow-col gap-16 mt-8">
      {frames.map((frameData) => (
        <CanvasFrame
          key={frameData.frame.id}
          title={frameData.frame.title || "Untitled Frame"}
          url={frameData.frame.url}
          x={100}
          y={100}
          width={1200}
          height={800}
          isLoading={false}
          onClick={() => {
            // Handle frame selection logic here
          }}
          isSelected={false}
        />
      ))}
    </div>
  );
});

const CanvasOverlay = () => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Selection overlays, hover effects, etc. will go here */}
    </div>
  );
};

const ZoomControls = observer(
  ({
    containerRef,
  }: {
    containerRef: React.RefObject<HTMLDivElement | null>;
  }) => {
    const editorEngine = useEditorEngine();

    const handleZoomIn = () => {
      const newScale = editorEngine.canvas.scale * (1 + ZOOM_STEP);
      editorEngine.canvas.setScale(newScale);
    };

    const handleZoomOut = () => {
      const newScale = editorEngine.canvas.scale * (1 - ZOOM_STEP);
      editorEngine.canvas.setScale(newScale);
    };

    const handleResetZoom = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        editorEngine.canvas.resetView(rect.width, rect.height);
      } else {
        editorEngine.canvas.resetView();
      }
    };

    const handleFitToScreen = () => {
      // Zoom to fit all frames on screen
      editorEngine.canvas.setScale(0.5);
      editorEngine.canvas.setPosition({ x: 0, y: 0 });
    };

    const zoomPresets = [25, 50, 75, 100, 125, 150, 200];
    const currentZoom = Math.round(editorEngine.canvas.scale * 100);

    return (
      <div className="absolute bottom-4 right-4 flex items-center gap-1 mix-blend-difference">
        {/* Zoom presets dropdown */}
        <select
          value={currentZoom}
          onChange={(e) => {
            const newScale = parseInt(e.target.value) / 100;
            editorEngine.canvas.setScale(newScale);
          }}
          className="text-xs font-mono bg-transparent text-white border-none outline-none cursor-pointer font-light"
        >
          {zoomPresets.map((zoom) => (
            <option key={zoom} value={zoom} className="bg-black text-white">
              {zoom}%
            </option>
          ))}
          {!zoomPresets.includes(currentZoom) && (
            <option value={currentZoom} className="bg-black text-white">
              {currentZoom}%
            </option>
          )}
        </select>

        {/* Zoom controls */}
        <button
          onClick={handleZoomOut}
          className="w-5 h-5 flex items-center justify-center text-white font-light text-sm"
          title="Zoom out"
        >
          −
        </button>

        <button
          onClick={handleResetZoom}
          className="w-5 h-5 flex items-center justify-center text-white font-light text-xs"
          title="Reset zoom (100%)"
        >
          ⌂
        </button>

        <button
          onClick={handleZoomIn}
          className="w-5 h-5 flex items-center justify-center text-white font-light text-sm"
          title="Zoom in"
        >
          +
        </button>

        <button
          onClick={handleFitToScreen}
          className="w-5 h-5 flex items-center justify-center text-white font-light text-xs"
          title="Fit to screen"
        >
          ⛶
        </button>
      </div>
    );
  }
);
