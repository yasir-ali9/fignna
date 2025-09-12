/**
 * CodeMirror Extensions and Configurations
 * Provides language support, themes, and editor configurations
 */

import { getCustomTheme } from "./customize";
import {
  createLucideReactFoldGutter,
  createCustomFoldGutter,
} from "./custom-fold-gutter";

// CodeMirror imports with fallback handling
let basicSetup: any = null;
let javascript: any = null;
let html: any = null;
let css: any = null;
let json: any = null;
let oneDark: any = null;
let EditorView: any = null;
let keymap: any = null;
let defaultKeymap: any = null;
let searchKeymap: any = null;
let historyKeymap: any = null;
let foldKeymap: any = null;
let completionKeymap: any = null;

// Individual extensions for custom setup (to avoid default fold gutter)
let lineNumbers: any = null;
let highlightActiveLineGutter: any = null;
let highlightActiveLine: any = null;
let highlightSpecialChars: any = null;
let history: any = null;
let drawSelection: any = null;
let dropCursor: any = null;
let allowMultipleSelections: any = null;
let indentOnInput: any = null;
let bracketMatching: any = null;
let closeBrackets: any = null;
let autocompletion: any = null;
let highlightSelectionMatches: any = null;

try {
  // Import basic setup from codemirror package
  const codemirrorPkg = require("codemirror");
  basicSetup = codemirrorPkg.basicSetup;

  // Import individual extensions to create custom setup without default fold gutter
  const viewPkg = require("@codemirror/view");
  EditorView = viewPkg.EditorView;
  keymap = viewPkg.keymap;
  lineNumbers = viewPkg.lineNumbers;
  highlightActiveLineGutter = viewPkg.highlightActiveLineGutter;
  highlightActiveLine = viewPkg.highlightActiveLine;
  highlightSpecialChars = viewPkg.highlightSpecialChars;
  drawSelection = viewPkg.drawSelection;
  dropCursor = viewPkg.dropCursor;

  const statePkg = require("@codemirror/state");
  allowMultipleSelections = statePkg.EditorState.allowMultipleSelections;

  const commandsPkg = require("@codemirror/commands");
  defaultKeymap = commandsPkg.defaultKeymap;
  searchKeymap = commandsPkg.searchKeymap;
  historyKeymap = commandsPkg.historyKeymap;
  foldKeymap = commandsPkg.foldKeymap;
  completionKeymap = commandsPkg.completionKeymap;
  history = commandsPkg.history;
  indentOnInput = commandsPkg.indentOnInput;

  const languagePkg = require("@codemirror/language");
  bracketMatching = languagePkg.bracketMatching;

  const autocompletePkg = require("@codemirror/autocomplete");
  autocompletion = autocompletePkg.autocompletion;
  closeBrackets = autocompletePkg.closeBrackets;

  const searchPkg = require("@codemirror/search");
  highlightSelectionMatches = searchPkg.highlightSelectionMatches;

  // Import language support
  const jsLang = require("@codemirror/lang-javascript");
  javascript = jsLang.javascript;

  const htmlLang = require("@codemirror/lang-html");
  html = htmlLang.html;

  const cssLang = require("@codemirror/lang-css");
  css = cssLang.css;

  const jsonLang = require("@codemirror/lang-json");
  json = jsonLang.json;

  // Import theme
  const oneDarkTheme = require("@codemirror/theme-one-dark");
  oneDark = oneDarkTheme.oneDark;

  console.log("✅ CodeMirror packages loaded successfully");
} catch (error) {
  console.warn(
    "⚠️ CodeMirror packages not available. Editor will use fallback mode."
  );
  console.warn(
    "Run: node scripts/install-codemirror.js to install required packages"
  );
}

/**
 * Custom basic setup without default fold gutter
 * This replaces the default basicSetup to avoid duplicate fold gutters
 */
export function getCustomBasicSetup() {
  if (!lineNumbers || !EditorView) return [];

  const extensions = [];

  // Add core extensions (similar to basicSetup but without foldGutter)
  if (lineNumbers) extensions.push(lineNumbers());
  if (highlightActiveLineGutter) extensions.push(highlightActiveLineGutter());
  if (highlightActiveLine) extensions.push(highlightActiveLine()); // Add active line highlighting
  if (highlightSpecialChars) extensions.push(highlightSpecialChars());
  if (history) extensions.push(history());
  if (drawSelection) extensions.push(drawSelection());
  if (dropCursor) extensions.push(dropCursor());
  if (allowMultipleSelections)
    extensions.push(allowMultipleSelections.of(true));
  if (indentOnInput) extensions.push(indentOnInput());
  if (bracketMatching) extensions.push(bracketMatching());
  if (closeBrackets) extensions.push(closeBrackets());
  if (autocompletion) extensions.push(autocompletion());
  if (highlightSelectionMatches) extensions.push(highlightSelectionMatches());

  return extensions;
}

/**
 * Get language extension based on file extension
 */
export function getLanguageExtension(filename: string) {
  if (!javascript || !html || !css || !json) return [];

  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
      return [javascript({ jsx: true })];
    case "ts":
    case "tsx":
      return [javascript({ jsx: true, typescript: true })];
    case "html":
      return [html()];
    case "css":
      return [css()];
    case "json":
      return [json()];
    default:
      return [];
  }
}

// Removed unused figmna themes - using custom theme system instead

/**
 * Editor configuration presets
 */
export const editorConfigs = {
  // Full-featured editor with all extensions
  full: (
    filename: string,
    theme: "light" | "dark" = "dark",
    textWrap: boolean = false
  ) => {
    if (!basicSetup || !EditorView) return [];

    const extensions = [
      ...getCustomBasicSetup(), // Use custom basic setup without default fold gutter
      ...getLanguageExtension(filename),
      ...getCustomTheme(), // Use custom theme that adapts to CSS variables
      createLucideReactFoldGutter(), // Add custom fold gutter with Lucide icons
      // Ensure scrollbars are visible and functional + consistent font sizing
      EditorView.theme({
        "&": {
          height: "100%",
          fontSize: "11px", // Set consistent font size for entire editor
        },
        ".cm-editor": {
          height: "100%",
          overflow: "hidden",
        },
        ".cm-scroller": {
          overflow: "auto !important",
          height: "100%",
          fontFamily:
            "'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace",
          fontSize: "11px", // Ensure code content uses 11px
        },
        ".cm-content": {
          minHeight: "100%",
          padding: "16px",
          fontSize: "11px", // Ensure code content uses 11px
        },
        ".cm-gutters": {
          fontSize: "11px", // Ensure line numbers use 11px
        },
        ".cm-lineNumbers .cm-gutterElement": {
          fontSize: "11px !important", // Force line numbers to use 11px
          fontFamily:
            "'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace",
        },

        "&.cm-editor.cm-focused": {
          outline: "none",
        },
        // Ensure scrollbars are visible
        ".cm-scroller::-webkit-scrollbar": {
          width: "12px",
          height: "12px",
        },
        ".cm-scroller::-webkit-scrollbar-track": {
          background: "rgba(0,0,0,0.1)",
        },
        ".cm-scroller::-webkit-scrollbar-thumb": {
          background: "rgba(255,255,255,0.2)",
          borderRadius: "6px",
        },
        ".cm-scroller::-webkit-scrollbar-thumb:hover": {
          background: "rgba(255,255,255,0.3)",
        },
      }),
    ];

    // Add line wrapping conditionally
    if (textWrap) {
      extensions.push(EditorView.lineWrapping);
    }

    // Add keymaps if available
    if (
      keymap &&
      defaultKeymap &&
      searchKeymap &&
      historyKeymap &&
      foldKeymap &&
      completionKeymap
    ) {
      extensions.push(
        keymap.of([
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          // Add custom scrolling shortcuts for testing
          {
            key: "Ctrl-End",
            run: (view: any) => {
              view.dispatch({
                selection: { anchor: view.state.doc.length },
                scrollIntoView: true,
              });
              return true;
            },
          },
          {
            key: "Ctrl-Home",
            run: (view: any) => {
              view.dispatch({
                selection: { anchor: 0 },
                scrollIntoView: true,
              });
              return true;
            },
          },
        ])
      );
    }

    return extensions;
  },

  // Read-only editor
  readonly: (filename: string, theme: "light" | "dark" = "dark") => {
    if (!basicSetup || !EditorView) return [];

    return [
      basicSetup,
      ...getLanguageExtension(filename),
      ...getCustomTheme(), // Use custom theme
      EditorView.editable.of(false),
    ];
  },

  // Minimal editor with basic features
  minimal: (filename: string, theme: "light" | "dark" = "dark") => {
    if (!EditorView) return [];

    return [
      ...getLanguageExtension(filename),
      ...getCustomTheme(), // Use custom theme
      EditorView.lineWrapping,
    ];
  },
};

/**
 * Check if CodeMirror is available
 */
export const isCodeMirrorAvailable = () => {
  return !!(basicSetup && javascript && html && css && json && EditorView);
};

/**
 * Get required CodeMirror packages for installation
 */
export const getRequiredPackages = () => [
  "codemirror",
  "@codemirror/view",
  "@codemirror/state",
  "@codemirror/language",
  "@codemirror/commands",
  "@codemirror/autocomplete",
  "@codemirror/search",
  "@codemirror/lang-javascript",
  "@codemirror/lang-html",
  "@codemirror/lang-css",
  "@codemirror/lang-json",
  "@codemirror/theme-one-dark",
];
