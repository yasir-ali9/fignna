"use client";

import { useEffect, useRef, useState } from "react";

interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}

export function ContextMenu({
  items,
  isOpen,
  position,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Adjust position to keep menu within viewport
  const adjustedPosition = { ...position };
  if (menuRef.current && isOpen) {
    const rect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontal position
    if (position.x + rect.width > viewportWidth) {
      adjustedPosition.x = viewportWidth - rect.width - 10;
    }

    // Adjust vertical position
    if (position.y + rect.height > viewportHeight) {
      adjustedPosition.y = viewportHeight - rect.height - 10;
    }
  }

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-bk-40 border border-bd-50 rounded-lg shadow-lg py-1 px-1 w-max min-w-[120px]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            if (!item.disabled) {
              item.onClick();
              onClose();
            }
          }}
          disabled={item.disabled}
          className={`
            w-full px-3 py-1.5 text-left flex items-center tracking-tight whitespace-nowrap rounded-md transition-all
            ${
              item.disabled
                ? "text-fg-60 cursor-not-allowed"
                : "text-fg-30 hover:bg-bk-30 hover:text-fg-10 focus:bg-bk-30 focus:text-fg-10 focus:outline-none cursor-pointer"
            }
          `}
          style={{ fontSize: "11px" }}
        >
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

interface UseContextMenuReturn {
  contextMenu: {
    isOpen: boolean;
    position: { x: number; y: number };
  };
  showContextMenu: (event: React.MouseEvent) => void;
  hideContextMenu: () => void;
}

export function useContextMenu(): UseContextMenuReturn {
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
  });

  const showContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
    });
  };

  const hideContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  };

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
  };
}
