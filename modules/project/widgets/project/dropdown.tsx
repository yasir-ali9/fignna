"use client";

import { useState, useRef, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useTheme } from "@/components/context/theme-context";

interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  submenu?: DropdownItem[];
  shortcut?: string;
  onClick?: () => void;
}

interface LogoDropdownProps {
  items: DropdownItem[];
}

export const LogoDropdown = observer(({ items }: LogoDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setOpenSubmenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;

    if (item.submenu) {
      setOpenSubmenu(openSubmenu === item.id ? null : item.id);
    } else {
      item.onClick?.();
      setIsOpen(false);
      setOpenSubmenu(null);
    }
  };

  const handleSubmenuItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    item.onClick?.();
    setIsOpen(false);
    setOpenSubmenu(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Logo Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 pl-1 px-1.5 py-1.5 hover:bg-bk-40 rounded-lg transition-colors group cursor-pointer"
      >
        {/* Fignna Logo */}
        <div className="w-5 h-5 text-fg-50 group-hover:text-fg-30">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.98485 8.15152L8.98485 7.4697L7.62121 7.4697L7.62121 8.15152L8.30303 8.15152L8.98485 8.15152ZM13.8333 9.36364L13.8333 8.68182L12.4697 8.68182L12.4697 9.36364L13.1515 9.36364L13.8333 9.36364ZM7.51788 7.36637L7.03576 7.84848L8 8.81272L8.48212 8.3306L8 7.84848L7.51788 7.36637ZM12.6694 8.27546L12.1873 8.75758L13.1515 9.72181L13.6336 9.23969L13.1515 8.75758L12.6694 8.27546ZM8.30303 20.8788L8.98485 20.8788L8.98485 8.15152L8.30303 8.15152L7.62121 8.15152L7.62121 20.8788L8.30303 20.8788ZM13.1515 20.8788L13.8333 20.8788L13.8333 9.36364L13.1515 9.36364L12.4697 9.36364L12.4697 20.8788L13.1515 20.8788ZM12.8485 3L12.3664 2.51788L7.51788 7.36637L8 7.84848L8.48212 8.3306L13.3306 3.48212L12.8485 3ZM18 3.90909L17.5179 3.42697L12.6694 8.27546L13.1515 8.75758L13.6336 9.23969L18.4821 4.39121L18 3.90909Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Chevron Down */}
        <div
          className={`w-3 h-3 text-fg-60 group-hover:text-fg-50 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-bk-40 border border-bd-50 rounded-lg shadow-xl backdrop-blur-sm z-50 py-1">
          {items.map((item) => (
            <div key={item.id} className="relative">
              <button
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={`
                                    w-full flex items-center justify-between px-3 py-2 text-xs text-left
                                    ${
                                      item.disabled
                                        ? "text-fg-60 cursor-not-allowed"
                                        : "text-fg-50 hover:text-fg-30 hover:bg-bk-30"
                                    }
                                    ${
                                      openSubmenu === item.id
                                        ? "bg-bk-30 text-fg-30"
                                        : ""
                                    }
                                    transition-colors
                                `}
              >
                <div className="flex items-center gap-2">
                  {item.icon && <div className="w-4 h-4">{item.icon}</div>}
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.shortcut && (
                    <span className="text-xs text-fg-60">{item.shortcut}</span>
                  )}
                  {item.submenu && (
                    <div className="w-3 h-3 text-fg-60">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="currentColor"
                      >
                        <path
                          d="M4.5 3L7.5 6L4.5 9"
                          stroke="currentColor"
                          strokeWidth="1"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </button>

              {/* Submenu */}
              {item.submenu && openSubmenu === item.id && (
                <div className="absolute left-full top-0 ml-1 w-48 bg-bk-40 border border-bd-50 rounded-lg shadow-xl backdrop-blur-sm py-1">
                  {item.submenu.map((subItem) => {
                    const isSelected =
                      item.id === "theme" &&
                      ((subItem.id === "light" && theme === "light") ||
                        (subItem.id === "dark" && theme === "dark") ||
                        (subItem.id === "system" && theme === "system"));

                    return (
                      <button
                        key={subItem.id}
                        onClick={() => {
                          if (item.id === "theme") {
                            setTheme(subItem.id as "light" | "dark" | "system");
                          }
                          handleSubmenuItemClick(subItem);
                        }}
                        disabled={subItem.disabled}
                        className={`
                                                    w-full flex items-center justify-between px-3 py-2 text-xs text-left
                                                    ${
                                                      subItem.disabled
                                                        ? "text-fg-60 cursor-not-allowed"
                                                        : isSelected
                                                        ? "text-fg-30 bg-bk-30"
                                                        : "text-fg-50 hover:text-fg-30 hover:bg-bk-30"
                                                    }
                                                    transition-colors
                                                `}
                      >
                        <div className="flex items-center gap-2">
                          {subItem.icon && (
                            <div className="w-4 h-4">{subItem.icon}</div>
                          )}
                          <span>{subItem.label}</span>
                          {isSelected && (
                            <div className="w-3 h-3 text-fg-50">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="currentColor"
                              >
                                <path
                                  d="M10 3L4.5 8.5L2 6"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        {subItem.shortcut && (
                          <span className="text-xs text-fg-60">
                            {subItem.shortcut}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
