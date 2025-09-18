"use client";

import React from "react";
import { useToastContext } from "./toast-provider";
import { ToastItem } from "./toast-item";
import { ToastContainerProps, ToastPosition } from "./types";

// Container component that renders all active toasts with proper positioning
export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = "top-right",
}) => {
  const { toasts, removeToast, pauseToast, resumeToast } = useToastContext();

  // Filter toasts for this specific position
  const positionToasts = toasts.filter((toast) => toast.position === position);

  // Don't render container if no toasts for this position
  if (positionToasts.length === 0) {
    return null;
  }

  // Get positioning classes based on position prop
  const getPositionClasses = (pos: ToastPosition): string => {
    switch (pos) {
      case "top-left":
        return "top-4 left-4";
      case "top-center":
        return "top-4 left-1/2 -translate-x-1/2";
      case "top-right":
        return "top-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-center":
        return "bottom-4 left-1/2 -translate-x-1/2";
      case "bottom-right":
        return "bottom-4 right-4";
      default:
        return "bottom-4 right-4";
    }
  };

  // Get flex direction for stacking (newer toasts at top)
  const getStackDirection = (pos: ToastPosition): string => {
    return pos.startsWith("bottom") ? "flex-col-reverse" : "flex-col";
  };

  return (
    <div
      className={`
        fixed 
        z-[1000] 
        pointer-events-none 
        ${getPositionClasses(position)}
      `}
    >
      <div
        className={`
          flex 
          ${getStackDirection(position)} 
          gap-2
          transition-all
          duration-150
          ease-in-out
        `}
      >
        {positionToasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto transform transition-all duration-150 ease-in-out"
          >
            <ToastItem
              toast={toast}
              onDismiss={removeToast}
              onPause={pauseToast}
              onResume={resumeToast}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
