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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      d