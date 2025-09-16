"use client";

import { useTheme } from "@/lib/providers/theme-provider";

interface ToggleProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Reusable theme toggle component with accessibility support
export function Toggle({ size = "md", className = "" }: ToggleProps) {
  const { theme, toggleTheme } = useTheme();

  // Size configurations for different toggle sizes
  const sizeClasses = {
    sm: "w-10 h-6",
    md: "w-12 h-7",
    lg: "w-14 h-8",
  };

  const thumbSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  // Handle keyboard navigation for accessibility
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleTheme();
    }
  };

  // Handle mouse click to toggle theme
  const handleClick = () => {
    toggleTheme();
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={theme === "dark"}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        relative inline-flex items-center rounded-full
        ${sizeClasses[size]}
        ${theme === "dark"
          ? "bg-ac-01 hover:bg-ac-01/90"
          : "bg-bk-60 hover:bg-bk-70"
        }
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-ac-01 focus:ring-offset-2
        focus:ring-offset-bk-30
        cursor-pointer
        ${className}
      `}
    >
      {/* Toggle thumb with smooth animation */}
      <span
        className={`
          ${thumbSizeClasses[size]}
          bg-bk-30 rounded-full shadow-sm
          transform transition-transform duration-200 ease-in-out
          ${theme === "dark"
            ? size === "sm"
              ? "translate-x-4"
              : size === "md"
                ? "translate-x-5"
                : "translate-x-6"
            : "translate-x-1"
          }
          flex items-center justify-center
        `}
      >
        {/* Theme icons for visual feedback */}
        {theme === "light" ? (
          // Sun icon for light theme
          <svg
            className="w-3 h-3 text-fg-50"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          // Moon icon for dark theme
          <svg
            className="w-3 h-3 text-fg-50"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </span>
    </button>
  );
}
