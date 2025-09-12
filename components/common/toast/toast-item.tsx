"use client";

import React, { useState, useEffect } from "react";
import { ToastItemProps } from "./types";

// Individual toast component that displays a single notification with animations
export const ToastItem: React.FC<ToastItemProps> = React.memo(
  ({ toast, onDismiss, onPause, onResume }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Handle enter animation on mount
    useEffect(() => {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10); // Small delay to ensure DOM is ready

      return () => clearTimeout(timer);
    }, []);

    // Handle hover pause/resume functionality
    useEffect(() => {
      if (toast.duration > 0) {
        // Only handle pause/resume for toasts with auto-dismiss
        if (isHovered) {
          onPause(toast.id);
        } else {
          onResume(toast.id);
        }
      }
    }, [isHovered, toast.id, toast.duration, onPause, onResume]);

    // Cleanup on unmount to prevent memory leaks
    useEffect(() => {
      return () => {
        setIsVisible(false);
        setIsExiting(false);
        setIsHovered(false);
      };
    }, []);

    // Handle click to dismiss toast with exit animation
    const handleClick = () => {
      try {
        setIsExiting(true);
        // Wait for exit animation to complete before removing
        setTimeout(() => {
          onDismiss(toast.id);
        }, 300);
      } catch (error) {
        console.warn("Failed to dismiss toast:", error);
        // Fallback: dismiss immediately if animation fails
        onDismiss(toast.id);
      }
    };

    // Get type-specific icon and color
    const getTypeIcon = () => {
      switch (toast.type) {
        case "success":
          return {
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 20 20"
              >
                <path
                  fill="currentColor"
                  d="M10 2a8 8 0 1 1 0 16a8 8 0 0 1 0-16m0 1a7 7 0 1 0 0 14a7 7 0 0 0 0-14m3.358 4.646a.5.5 0 0 1 .058.638l-.058.07l-4.004 4.004a.5.5 0 0 1-.638.058l-.07-.058l-2-2a.5.5 0 0 1 .638-.765l.07.058L9 11.298l3.651-3.652a.5.5 0 0 1 .707 0"
                />
              </svg>
            ),
            color: "text-emerald-500",
          };
        case "error":
          return {
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 20 20"
              >
                <path
                  fill="currentColor"
                  d="M10 2a8 8 0 1 1 0 16a8 8 0 0 1 0-16m0 1a7 7 0 1 0 0 14a7 7 0 0 0 0-14M7.81 7.114l.069.058L10 9.292l2.121-2.12a.5.5 0 0 1 .638-.058l.07.058a.5.5 0 0 1 .057.637l-.058.07L10.708 10l2.12 2.121a.5.5 0 0 1 .058.638l-.058.07a.5.5 0 0 1-.637.057l-.07-.058L10 10.708l-2.121 2.12a.5.5 0 0 1-.638.058l-.07-.058a.5.5 0 0 1-.057-.637l.058-.07L9.292 10l-2.12-2.121a.5.5 0 0 1-.058-.638l.058-.07a.5.5 0 0 1 .637-.057"
                />
              </svg>
            ),
            color: "text-rose-500",
          };
        case "warning":
          return {
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 20 20"
              >
                <path
                  fill="currentColor"
                  d="M9.562 3.262a.5.5 0 0 1 .88 0l6.5 12a.5.5 0 0 1-.44.739H3.5a.5.5 0 0 1-.44-.738zm1.758-.476c-.567-1.048-2.07-1.048-2.637 0l-6.502 12a1.5 1.5 0 0 0 1.318 2.215h13.003a1.5 1.5 0 0 0 1.319-2.215zM10.5 7.5a.5.5 0 0 0-1 0v4a.5.5 0 1 0 1 0zm.25 6.25a.75.75 0 1 1-1.5 0a.75.75 0 0 1 1.5 0"
                />
              </svg>
            ),
            color: "text-orange-500",
          };
        case "info":
          return {
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 20 20"
              >
                <path
                  fill="currentColor"
                  d="M10.492 8.91A.5.5 0 0 0 9.5 9v4.502l.008.09a.5.5 0 0 0 .992-.09V9zm.307-2.16a.75.75 0 1 0-1.5 0a.75.75 0 0 0 1.5 0M18 10a8 8 0 1 0-16 0a8 8 0 0 0 16 0M3 10a7 7 0 1 1 14 0a7 7 0 0 1-14 0"
                />
              </svg>
            ),
            color: "text-sky-500",
          };
        case "default":
        default:
          return null; // No icon for default type
      }
    };

    // Get animation classes based on position and state with hardware acceleration
    const getAnimationClasses = () => {
      const isRightPosition = toast.position.includes("right");

      if (isExiting) {
        return `
        opacity-0 
        ${isRightPosition ? "translate-x-full" : "-translate-x-full"} 
        transition-all 
        duration-300 
        ease-in
        transform-gpu
      `;
      }

      if (isVisible) {
        return `
        opacity-100 
        translate-x-0 
        transition-all 
        duration-200 
        ease-out
        transform-gpu
        motion-reduce:transition-none
        motion-reduce:transform-none
      `;
      }

      return `
      opacity-0 
      ${isRightPosition ? "translate-x-full" : "-translate-x-full"} 
      transition-all 
      duration-200 
      ease-out
      transform-gpu
      motion-reduce:transition-none
      motion-reduce:transform-none
    `;
    };

    return (
      <div
        className={`
        bg-bk-40 
        border 
        border-bd-50 
        rounded-lg 
        shadow-lg 
        px-4 
        py-3 
        min-w-[200px] 
        max-w-[400px] 
        cursor-pointer 
        hover:bg-bk-30
        focus:outline-none
        transform
        relative
        group
        ${getAnimationClasses()}
      `}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            handleClick();
          }
        }}
        tabIndex={0}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        aria-label={`${
          toast.type === "default" ? "Notification" : toast.type
        } notification: ${
          toast.message
        }. Press Enter, Space, or Escape to dismiss.`}
      >
        <div className="flex items-center gap-3">
          {/* Type icon - only show for non-default types */}
          {getTypeIcon() && (
            <div className={`flex-shrink-0 ${getTypeIcon()?.color}`}>
              {getTypeIcon()?.icon}
            </div>
          )}

          {/* Message content */}
          <div className="flex-1 flex items-center justify-between gap-2">
            <div
              className="text-fg-70 group-hover:text-fg-50 text-[11px] tracking-tight leading-tight flex-1 transition-colors duration-200"
              style={{ fontSize: "11px", letterSpacing: "-0.025em" }}
            >
              {toast.message}
            </div>

            {/* Cross icon - only visible on hover */}
            <button
              className="opacity-0 group-hover:opacity-100 text-fg-70 group-hover:text-fg-50 cursor-pointer p-1 -m-1 transition-all duration-200 flex-shrink-0 hover:bg-bk-30 rounded flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              aria-label="Dismiss notification"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 20 20"
              >
                <path
                  fill="currentColor"
                  d="m4.089 4.216l.057-.07a.5.5 0 0 1 .638-.057l.07.057L10 9.293l5.146-5.147a.5.5 0 0 1 .638-.057l.07.057a.5.5 0 0 1 .057.638l-.057.07L10.707 10l5.147 5.146a.5.5 0 0 1 .057.638l-.057.07a.5.5 0 0 1-.638.057l-.07-.057L10 10.707l-5.146 5.147a.5.5 0 0 1-.638.057l-.07-.057a.5.5 0 0 1-.057-.638l.057.07L9.293 10L4.146 4.854a.5.5 0 0 1-.057-.638l.057-.07z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }
);

// Add display name for better debugging
ToastItem.displayName = "ToastItem";
