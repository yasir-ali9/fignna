/**
 * THEME-AWARE EDITOR COLORS
 *
 * Separate color schemes for light and dark themes that automatically switch
 * based on the current theme detected via CSS variables or data attributes.
 */

// 🌞 LIGHT THEME COLORS
export const LIGHT_THEME_COLORS = {
  // Editor UI
  editor: {
    background: "rgb(var(--bk-50))", // Light background
    foreground: "rgb(var(--fg-30))", // Dark text
    cursor: "rgb(var(--ac-01))", // Accent cursor
    selection: "rgba(59, 130, 246, 0.2)", // Blue selection for light theme
    selectionMatch: "rgba(59, 130, 246, 0.2)", // Lighter blue for matches
    activeLine: "transparent",
    activeLineBorder: "rgb(var(--bd-50))",
    gutter: "rgb(var(--bk-60))",
    border: "rgb(var(--bd-50))",
    lineNumber: "rgb(var(--fg-60))",
    lineNumberActive: "rgb(var(--fg-40))",
  },

  // Syntax highlighting for light theme
  syntax: {
    comment: "#6b7280", // Gray comments
    keyword: "#7c3aed", // Purple keywords
    string: "#059669", // Green strings
    number: "#d97706", // Orange numbers
    variable: "rgb(var(--fg-30))", // Default text
    variableSpecial: "#0891b2", // Cyan special vars
    function: "#2563eb", // Blue functions
    type: "#7c3aed", // Purple types
    className: "#d97706", // Orange classes
    property: "#0891b2", // Cyan properties
    tag: "#dc2626", // Red tags
    tagBracket: "rgb(var(--fg-60))",
    attribute: "#7c3aed", // Purple attributes
    operator: "rgb(var(--fg-50))",
    bracket: "rgb(var(--fg-50))",
    punctuation: "rgb(var(--fg-60))",
    constant: "#d97706", // Orange constants
    error: "#dc2626",
    warning: "#d97706",
  },
};

// 🌙 DARK THEME COLORS
export const DARK_THEME_COLORS = {
  // Editor UI
  editor: {
    background: "rgb(var(--bk-50))", // Dark background
    foreground: "rgb(var(--fg-30))", // Light text
    cursor: "rgb(var(--ac-01))", // Accent cursor
    selection: "rgba(59, 130, 246, 0.3)", // Blue selection for dark theme (more visible)
    selectionMatch: "rgba(59, 130, 246, 0.2)", // Blue matches for dark theme
    activeLine: "transparent",
    activeLineBorder: "rgb(var(--bd-50))",
    gutter: "rgb(var(--bk-60))",
    border: "rgb(var(--bd-50))",
    lineNumber: "rgb(var(--fg-60))",
    lineNumberActive: "rgb(var(--fg-40))",
  },

  // Syntax highlighting for dark theme
  syntax: {
    comment: "#fff", // Lighter gray comments
    keyword: "#a78bfa", // Lighter purple keywords
    string: "#34d399", // Brighter green strings
    number: "#fbbf24", // Brighter orange numbers
    variable: "rgb(var(--fg-30))", // Default text
    variableSpecial: "#22d3ee", // Brighter cyan special vars
    function: "#60a5fa", // Brighter blue functions
    type: "#a78bfa", // Lighter purple types
    className: "#fbbf24", // Brighter orange classes
    property: "#22d3ee", // Brighter cyan properties
    tag: "#f87171", // Lighter red tags
    tagBracket: "rgb(var(--fg-60))",
    attribute: "#a78bfa", // Lighter purple attributes
    operator: "rgb(var(--fg-50))",
    bracket: "rgb(var(--fg-50))",
    punctuation: "rgb(var(--fg-60))",
    constant: "#fbbf24", // Brighter orange constants
    error: "#f87171",
    warning: "#fbbf24",
  },
};

/**
 * Detect current theme from your app's theme context
 * This integrates with your ThemeProvider and data-theme attribute
 */
export const getCurrentTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "dark"; // SSR fallback

  // Method 1: Check for data-theme attribute (set by your ThemeProvider)
  const htmlTheme = document.documentElement.getAttribute("data-theme");
  if (htmlTheme === "light" || htmlTheme === "dark") {
    return htmlTheme;
  }

  // Method 2: Check localStorage (your theme context stores it there)
  try {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }
    // If stored theme is "system", detect system preference
    if (storedTheme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
  } catch (e) {
    // localStorage might not be available
  }

  // Method 3: Check system preference as fallback
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light"; // Default to light to match your theme context
};

/**
 * Get theme-appropriate colors
 */
export const getEditorColors = () => {
  const theme = getCurrentTheme();
  return theme === "light"
    ? LIGHT_THEME_COLORS.editor
    : DARK_THEME_COLORS.editor;
};

export const getSyntaxColors = () => {
  const theme = getCurrentTheme();
  return theme === "light"
    ? LIGHT_THEME_COLORS.syntax
    : DARK_THEME_COLORS.syntax;
};

/**
 * QUICK COLOR PRESETS
 * You can use these to quickly change the color scheme
 */

// 🌊 Ocean Theme (for dark mode)
export const OCEAN_THEME_DARK = {
  keyword: "#4fc3f7", // Light blue
  string: "#4caf50", // Green
  number: "#ff9800", // Orange
  function: "#2196f3", // Blue
  type: "#9c27b0", // Purple
  property: "#00bcd4", // Cyan
  tag: "#f44336", // Red
  comment: "#9ca3af",
};

// 🌸 Sakura Theme (for light mode)
export const SAKURA_THEME_LIGHT = {
  keyword: "#e91e63", // Pink
  string: "#4caf50", // Green
  number: "#ff9800", // Orange
  function: "#3f51b5", // Indigo
  type: "#9c27b0", // Purple
  property: "#00bcd4", // Cyan
  tag: "#f44336", // Red
  comment: "#6b7280",
};

/**
 * TO USE A PRESET:
 * 1. Import the preset in customize.tsx
 * 2. Replace the syntax colors in the theme you want to modify
 *
 * Example:
 * Object.assign(DARK_THEME_COLORS.syntax, OCEAN_THEME_DARK);
 */

// Colors are now theme-aware and switch automatically!
