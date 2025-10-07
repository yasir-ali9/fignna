"use client";

import { useEffect, useRef, useState } from "react";

interface ContextMenuNestedItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  shortcut?: string;
  selected?: boolean;
  submenu?: ContextMenuNestedItem[];
  separator?: boolean; // Add separator after this item
}

interface ContextMenuNestedProps {
  items: ContextMenuNestedItem[];
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  level?: number; // Track nesting level for positioning
}

export function ContextMenuNested({
  items,
  isOpen,
  position,
  onClose,
  level = 0,
}: ContextMenuNestedProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });

  // Check if any items have icons or selected states to determine if we need icon space
  // Only check current level items, not submenu items
  const hasIcons = items.some((item) => item.icon || item.selected);

  // Store submenu ref to check if click is inside any submenu
  const submenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideMainMenu =
        menuRef.current && menuRef.current.contains(target);
      const isInsideSubmenu =
        submenuRef.current && submenuRef.current.contains(target);

      // Only close if click is outside both main menu and submenu
      if (!isInsideMainMenu && !isInsideSubmenu) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
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

  // Timeout ref for managing submenu close delays
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any pending close timeout
  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  // Handle submenu hover
  const handleSubmenuHover = (
    item: ContextMenuNestedItem,
    event: React.MouseEvent
  ) => {
    clearCloseTimeout(); // Cancel any pending close

    if (item.submenu && !item.disabled) {
      const buttonRect = (
        event.currentTarget as HTMLElement
      ).getBoundingClientRect();
      setSubmenuPosition({
        x: buttonRect.right + 2,
        y: buttonRect.top,
      });
      setOpenSubmenu(item.id);
    } else {
      // Close submenu if hovering over non-submenu item
      closeTimeoutRef.current = setTimeout(() => {
        setOpenSubmenu(null);
      }, 150);
    }
  };

  // Handle item click
  const handleItemClick = (
    item: ContextMenuNestedItem,
    event: React.MouseEvent
  ) => {
    if (item.disabled) return;

    if (item.submenu) {
      // Toggle submenu on click
      if (openSubmenu === item.id) {
        setOpenSubmenu(null);
      } else {
        const buttonRect = (
          event.currentTarget as HTMLElement
        ).getBoundingClientRect();
        setSubmenuPosition({
          x: buttonRect.right + 2,
          y: buttonRect.top,
        });
        setOpenSubmenu(item.id);
      }
    } else {
      // Execute action and close menu
      item.onClick?.();
      onClose();
    }
  };

  // Handle mouse leave from main menu
  const handleMouseLeave = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setOpenSubmenu(null);
    }, 300);
  };

  // Handle mouse enter on menu container
  const handleMouseEnter = () => {
    clearCloseTimeout(); // Cancel any pending close when mouse re-enters
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={menuRef}
        className="fixed z-50 bg-bk-40 border border-bd-50 rounded-lg shadow-lg py-1 px-1 w-max min-w-[120px]"
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {items.map((item, index) => (
          <div key={item.id}>
            <button
              onClick={(e) => handleItemClick(item, e)}
              onMouseEnter={(e) => handleSubmenuHover(item, e)}
              disabled={item.disabled}
              className={`
                w-full px-3 py-1.5 text-left flex items-center justify-between tracking-tight whitespace-nowrap rounded-md transition-all cursor-pointer
                ${
                  item.disabled
                    ? "text-fg-60 cursor-not-allowed"
                    : "text-fg-30 hover:bg-bk-30 hover:text-fg-50 focus:bg-bk-30 focus:text-fg-50 focus:outline-none"
                }
                ${openSubmenu === item.id ? "bg-bk-30 text-fg-50" : ""}
              `}
              style={{ fontSize: "11px" }}
            >
              {/* Left side: Icon or Selected indicator */}
              <div
                className="flex items-center flex-1"
                style={{ gap: hasIcons ? "8px" : "0px" }}
              >
                {hasIcons && (
                  <div className="w-3 h-3 flex items-center justify-center">
                    {item.selected ? (
                      // Tick icon for selected items
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="10"
                        viewBox="0 0 12 12"
                        className="text-fg-30"
                      >
                        <path
                          fill="currentColor"
                          d="M9.854 3.146a.5.5 0 0 1 0 .708l-4.5 4.5a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L5 7.293l4.146-4.147a.5.5 0 0 1 .708 0"
                        />
                      </svg>
                    ) : item.icon ? (
                      // Custom icon
                      <div className="w-3 h-3">{item.icon}</div>
                    ) : null}
                  </div>
                )}
                <span className="flex-1">{item.label}</span>
              </div>

              {/* Right side: Shortcut or Submenu indicator */}
              <div className="flex items-center gap-2 ml-4">
                {item.shortcut && (
                  <span className="text-xs text-fg-60 font-mono">
                    {item.shortcut}
                  </span>
                )}
                {item.submenu && (
                  <div className="w-3 h-3 text-fg-60">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill="currentColor"
                        d="M7.733 4.207a.75.75 0 0 1 1.06.026l5.001 5.25a.75.75 0 0 1 0 1.035l-5 5.25a.75.75 0 1 1-1.087-1.034L12.216 10l-4.51-4.734a.75.75 0 0 1 .027-1.06"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </button>

            {/* Separator */}
            {item.separator && index < items.length - 1 && (
              <div className="my-1 border-t border-bd-50"></div>
            )}
          </div>
        ))}
      </div>

      {/* Render submenu */}
      {openSubmenu && (
        <div
          ref={submenuRef}
          onMouseEnter={clearCloseTimeout}
          onMouseLeave={() => {
            closeTimeoutRef.current = setTimeout(() => {
              setOpenSubmenu(null);
            }, 200);
          }}
        >
          <ContextMenuNested
            items={items.find((item) => item.id === openSubmenu)?.submenu || []}
            isOpen={true}
            position={submenuPosition}
            onClose={() => {
              setOpenSubmenu(null);
              // Also close the parent menu when submenu item is clicked
              if (level === 0) {
                onClose();
              }
            }}
            level={level + 1}
          />
        </div>
      )}
    </>
  );
}

interface UseContextMenuNestedReturn {
  contextMenu: {
    isOpen: boolean;
    position: { x: number; y: number };
  };
  showContextMenu: (event: React.MouseEvent) => void;
  hideContextMenu: () => void;
}

export function useContextMenuNested(): UseContextMenuNestedReturn {
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
