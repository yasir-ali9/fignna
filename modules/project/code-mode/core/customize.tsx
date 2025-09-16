/**
 * Customizable CodeMirror Theme System
 * Uses CSS variables for both light and dark modes
 * Allows easy customization of editor colors and syntax highlighting
 */

import {
  getEditorColors,
  getSyntaxColors,
  getCurrentTheme,
} from "./theme-config";

// CodeMirror imports with fallback
let EditorView: any = null;
let HighlightStyle: any = null;
let syntaxHighlighting: any = null;
let tags: any = null;

try {
  const viewPkg = require("@codemirror/view");
  EditorView = viewPkg.EditorView;

  const languagePkg = require("@codemirror/language");
  HighlightStyle = languagePkg.HighlightStyle;
  syntaxHighlighting = languagePkg.syntaxHighlighting;

  const highlightPkg = require("@lezer/highlight");
  tags = highlightPkg.tags;

  console.log("✅ CodeMirror theme packages loaded");
} catch (error) {
  console.warn("⚠️ CodeMirror theme packages not available");
}

/**
 * Create custom syntax highlighting theme
 */
export const createSyntaxTheme = () => {
  if (!HighlightStyle || !syntaxHighlighting || !tags) return [];

  const colors = getSyntaxColors();

  const highlightStyle = HighlightStyle.define([
    // Comments
    { tag: tags.comment, color: colors.comment, fontStyle: "italic" },
    { tag: tags.lineComment, color: colors.comment, fontStyle: "italic" },
    { tag: tags.blockComment, color: colors.comment, fontStyle: "italic" },

    // Keywords
    { tag: tags.keyword, color: colors.keyword, fontWeight: "bold" },
    { tag: tags.controlKeyword, color: colors.keyword, fontWeight: "bold" },
    { tag: tags.operatorKeyword, color: colors.keyword },
    { tag: tags.modifier, color: colors.keyword },

    // Strings
    { tag: tags.string, color: colors.string },
    { tag: tags.special(tags.string), color: colors.string },
    { tag: tags.regexp, color: colors.string },

    // Numbers
    { tag: tags.number, color: colors.number },
    { tag: tags.integer, color: colors.number },
    { tag: tags.float, color: colors.number },

    // Variables
    { tag: tags.variableName, color: colors.variable },
    { tag: tags.special(tags.variableName), color: colors.variableSpecial },
    { tag: tags.local(tags.variableName), color: colors.variable },
    { tag: tags.definition(tags.variableName), color: colors.variable },

    // Functions
    {
      tag: tags.function(tags.variableName),
      color: colors.function,
      fontWeight: "bold",
    },
    { tag: tags.function(tags.propertyName), color: colors.function },

    // Types & Classes
    { tag: tags.typeName, color: colors.type, fontWeight: "bold" },
    { tag: tags.className, color: colors.className, fontWeight: "bold" },
    { tag: tags.namespace, color: colors.type },

    // Properties
    { tag: tags.propertyName, color: colors.property },
    { tag: tags.attributeName, color: colors.attribute },

    // Operators & Punctuation
    { tag: tags.operator, color: colors.operator },
    { tag: tags.punctuation, color: colors.punctuation },
    { tag: tags.bracket, color: colors.bracket },
    { tag: tags.paren, color: colors.bracket },
    { tag: tags.squareBracket, color: colors.bracket },
    { tag: tags.brace, color: colors.bracket },

    // HTML/JSX Tags
    { tag: tags.tagName, color: colors.tag, fontWeight: "bold" },
    { tag: tags.angleBracket, color: colors.tagBracket },

    // Constants
    { tag: tags.bool, color: colors.constant, fontWeight: "bold" },
    { tag: tags.null, color: colors.constant, fontWeight: "bold" },
    { tag: tags.atom, color: colors.constant },

    // Special
    { tag: tags.invalid, color: colors.error, textDecoration: "underline" },
    { tag: tags.emphasis, fontStyle: "italic" },
    { tag: tags.strong, fontWeight: "bold" },
    { tag: tags.link, color: colors.function, textDecoration: "underline" },
  ]);

  return [syntaxHighlighting(highlightStyle)];
};

/**
 * Create custom editor theme using CSS variables
 */
export const createCustomTheme = () => {
  if (!EditorView) return [];

  const colors = getEditorColors();

  return EditorView.theme({
    // Main editor container
    "&": {
      color: colors.foreground,
      backgroundColor: colors.background,
      fontSize: "11px",
      fontFamily:
        "'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace",
      height: "100%",
    },

    // Disable browser extensions like Grammarly
    "& *": {
      "data-gramm": "false !important",
      "data-gramm_editor": "false !important",
      "data-enable-grammarly": "false !important",
      spellcheck: "false !important",
    },

    // Editor content area
    ".cm-content": {
      padding: "16px",
      minHeight: "100%",
      caretColor: colors.cursor,
    },

    // Cursor
    ".cm-focused .cm-cursor": {
      borderLeftColor: colors.cursor,
      borderLeftWidth: "2px",
    },

    // Text selection (click and drag) and primary selection
    ".cm-focused .cm-selectionBackground, ::selection": {
      backgroundColor: `${colors.selection} !important`,
      outline: "1px solid rgba(255, 255, 255, 0.25)",
      borderRadius: "2px",
    },

    // Selection matches (other instances of the selected word)
    ".cm-selectionMatch": {
      backgroundColor: colors.selectionMatch,
      outline: "1px solid rgba(255, 255, 255, 0.2)",
      borderRadius: "2px",
    },

    // Ensure primary selection is always visible with higher specificity
    ".cm-editor.cm-focused .cm-selectionBackground": {
      backgroundColor: `${colors.selection} !important`,
      outline: "1px solid rgba(255, 255, 255, 0.25)",
      borderRadius: "2px",
    },

    // Active line highlighting (VS Code style with inset shadows - no layout shift)
    ".cm-activeLine": {
      backgroundColor: colors.activeLine, // transparent
      boxShadow: `inset 0 1px 0 ${colors.activeLineBorder}, inset 0 -1px 0 ${colors.activeLineBorder}`,
      position: "relative",
    },

    // Hide active line shadows when text is selected
    ".cm-focused .cm-selectionBackground ~ .cm-activeLine": {
      boxShadow: "none",
    },

    // Also hide shadows when there's any selection in the editor
    ".cm-editor.cm-focused:has(.cm-selectionBackground) .cm-activeLine": {
      boxShadow: "none",
    },

    // Line numbers (gutter)
    ".cm-gutters": {
      backgroundColor: colors.gutter,
      color: colors.lineNumber,
      border: "none",
      // borderRight: `1px solid ${colors.border}`,
      fontSize: "13px",
      userSelect: "none",
      WebkitUserSelect: "none",
      MozUserSelect: "none",
      msUserSelect: "none",
    },

    // Active line number (no background, just different color)
    ".cm-activeLineGutter": {
      backgroundColor: "transparent",
      color: colors.lineNumberActive,
      fontWeight: "bold",
      userSelect: "none",
      WebkitUserSelect: "none",
      MozUserSelect: "none",
      msUserSelect: "none",
    },

    // Ensure line number elements are not selectable and add left padding
    ".cm-lineNumbers .cm-gutterElement": {
      userSelect: "none !important",
      WebkitUserSelect: "none !important",
      MozUserSelect: "none !important",
      msUserSelect: "none !important",
      paddingLeft: "12px",
      textAlign: "right",
    },

    // Search matches
    ".cm-searchMatch": {
      backgroundColor: "rgba(251, 191, 36, 0.3)", // Yellow highlight
      outline: "1px solid #f59e0b",
      borderRadius: "2px",
    },

    ".cm-searchMatch.cm-searchMatch-selected": {
      backgroundColor: "rgba(251, 191, 36, 0.5)",
    },

    // Matching brackets
    ".cm-matchingBracket": {
      backgroundColor: "rgba(var(--ac-01), 0.15)",
      outline: "1px solid rgb(var(--ac-01))",
      borderRadius: "2px",
    },

    ".cm-nonmatchingBracket": {
      backgroundColor: "rgba(239, 68, 68, 0.2)",
      outline: "1px solid #ef4444",
      borderRadius: "2px",
    },

    // Panels (search, replace, etc.)
    ".cm-panels": {
      backgroundColor: colors.gutter,
      color: colors.foreground,
      border: `1px solid ${colors.border}`,
    },

    ".cm-panels.cm-panels-top": {
      borderBottom: `1px solid ${colors.border}`,
    },

    ".cm-panels.cm-panels-bottom": {
      borderTop: `1px solid ${colors.border}`,
    },

    // Tooltips
    ".cm-tooltip": {
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.background,
      color: colors.foreground,
      borderRadius: "6px",
      boxShadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    },

    // Scrollbars
    ".cm-scroller": {
      overflow: "auto !important",
      overflowX: "auto !important",
      overflowY: "auto !important",
      height: "100%",
      fontFamily:
        "'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace",
    },

    // Webkit scrollbar styling (both vertical and horizontal)
    ".cm-scroller::-webkit-scrollbar": {
      width: "8px",
      height: "8px",
    },

    ".cm-scroller::-webkit-scrollbar-track": {
      background: colors.gutter,
    },

    ".cm-scroller::-webkit-scrollbar-thumb": {
      background: colors.border,
      borderRadius: "4px",
    },

    ".cm-scroller::-webkit-scrollbar-thumb:hover": {
      background: colors.lineNumber,
    },

    // Horizontal scrollbar specific styling
    ".cm-scroller::-webkit-scrollbar:horizontal": {
      height: "8px",
    },

    ".cm-scroller::-webkit-scrollbar-thumb:horizontal": {
      background: colors.border,
      borderRadius: "4px",
      minWidth: "20px",
    },

    ".cm-scroller::-webkit-scrollbar-thumb:horizontal:hover": {
      background: colors.lineNumber,
    },

    // Corner where scrollbars meet
    ".cm-scroller::-webkit-scrollbar-corner": {
      background: colors.gutter,
    },

    // Focus outline
    "&.cm-editor.cm-focused": {
      outline: "none",
    },

    // Fold placeholders
    ".cm-foldPlaceholder": {
      backgroundColor: colors.selection,
      border: `1px solid ${colors.border}`,
      color: colors.lineNumber,
      borderRadius: "3px",
      padding: "0 4px",
      margin: "0 2px",
    },
  });
};

/**
 * Theme change observer
 */
let themeObserver: MutationObserver | null = null;
let currentTheme = getCurrentTheme();

export const observeThemeChanges = (callback: () => void) => {
  if (typeof window === "undefined") return;

  // Clean up existing observer
  if (themeObserver) {
    themeObserver.disconnect();
  }

  // Create new observer
  themeObserver = new MutationObserver(() => {
    const newTheme = getCurrentTheme();
    if (newTheme !== currentTheme) {
      currentTheme = newTheme;
      console.log("🎨 Theme changed to:", newTheme);
      callback();
    }
  });

  // Observe data-theme attribute changes
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "class"],
  });

  // Also listen for system theme changes
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", () => {
      const newTheme = getCurrentTheme();
      if (newTheme !== currentTheme) {
        currentTheme = newTheme;
        console.log("🎨 System theme changed to:", newTheme);
        callback();
      }
    });
  }
};

export const stopObservingThemeChanges = () => {
  if (themeObserver) {
    themeObserver.disconnect();
    themeObserver = null;
  }
};

/**
 * Get complete custom theme extensions
 */
export const getCustomTheme = () => {
  const extensions = [];

  // Add custom editor theme
  const editorTheme = createCustomTheme();
  if (editorTheme.length > 0) {
    extensions.push(editorTheme);
  }

  // Add custom syntax highlighting
  const syntaxTheme = createSyntaxTheme();
  if (syntaxTheme.length > 0) {
    extensions.push(...syntaxTheme);
  }

  return extensions;
};
