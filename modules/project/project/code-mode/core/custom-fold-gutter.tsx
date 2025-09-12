/**
 * Custom Fold Gutter with Lucide React Icons
 * Replaces default CodeMirror fold icons with Lucide React chevron icons
 */

import React from "react";
import { createRoot } from "react-dom/client";

// CodeMirror imports with fallback
let foldGutter: any = null;
let EditorView: any = null;

try {
  const languagePkg = require("@codemirror/language");
  foldGutter = languagePkg.foldGutter;

  const viewPkg = require("@codemirror/view");
  EditorView = viewPkg.EditorView;
} catch (error) {
  console.warn("⚠️ CodeMirror packages not available for custom fold gutter");
}

// Lucide React icons with fallback
let ChevronDown: any = null;
let ChevronRight: any = null;

try {
  const lucideReact = require("lucide-react");
  ChevronDown = lucideReact.ChevronDown;
  ChevronRight = lucideReact.ChevronRight;
} catch (error) {
  console.warn("⚠️ Lucide React not available, using SVG fallback");
}

/**
 * Create a custom fold gutter with Lucide React chevron icons
 * Uses React portals to render Lucide icons in CodeMirror DOM
 * VS Code-like behavior: chevrons only visible on hover
 */
export function createLucideReactFoldGutter() {
  if (!foldGutter || !EditorView) {
    console.warn("⚠️ foldGutter not available, using fallback");
    return [];
  }

  return [
    foldGutter({
      markerDOM: (open: boolean) => {
        // Create a container element
        const element = document.createElement("div");
        element.setAttribute("class", "cm-fold-marker");
        element.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          cursor: pointer;
          color: var(--fg-60, #6b7280);
          transition: all 0.15s ease;
          opacity: 0;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        `;

        // Try to use Lucide React icons if available
        if (ChevronDown && ChevronRight) {
          try {
            const root = createRoot(element);
            const IconComponent = open ? ChevronDown : ChevronRight;

            root.render(
              React.createElement(IconComponent, {
                size: 14,
                style: { pointerEvents: "none" },
              })
            );

            element.setAttribute(
              "title",
              open ? "Fold code block" : "Unfold code block"
            );

            // Store root for cleanup
            (element as any)._reactRoot = root;

            return element;
          } catch (error) {
            console.warn(
              "⚠️ Error rendering Lucide React icon, falling back to SVG"
            );
          }
        }

        // Fallback to SVG if Lucide React is not available
        return createSVGFoldIcon(element, open);
      },
    }),

    // VS Code-like hover behavior for fold gutter
    EditorView.theme({
      // Fold gutter styling
      ".cm-foldGutter": {
        width: "18px",
        minWidth: "18px",
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      },

      // Hide fold markers by default
      ".cm-fold-marker": {
        opacity: "0",
        transition: "opacity 0.15s ease",
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      },

      // Show ALL fold markers when hovering over the entire gutter area
      ".cm-gutters:hover .cm-fold-marker": {
        opacity: "1 !important",
      },

      // Show ALL fold markers when hovering over line numbers
      ".cm-lineNumbers:hover ~ .cm-foldGutter .cm-fold-marker": {
        opacity: "1 !important",
      },

      // Show ALL fold markers when hovering over fold gutter specifically
      ".cm-foldGutter:hover .cm-fold-marker": {
        opacity: "1 !important",
      },

      // Always show folded markers (collapsed code blocks) with reduced opacity
      ".cm-fold-marker[title*='Unfold']": {
        opacity: "0.7 !important",
      },

      // Enhanced hover effect for individual markers
      ".cm-fold-marker:hover": {
        opacity: "1 !important",
        transform: "scale(1.1)",
      },

      // Disable selection on all gutter elements
      ".cm-gutters": {
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      },

      // Disable selection on line numbers
      ".cm-lineNumbers .cm-gutterElement": {
        userSelect: "none !important",
        WebkitUserSelect: "none !important",
        MozUserSelect: "none !important",
        msUserSelect: "none !important",
      },
    }),

    // Add DOM event handlers for more reliable hover detection
    EditorView.domEventHandlers({
      mouseover: (event, view) => {
        const target = event.target as HTMLElement;
        const gutters = view.dom.querySelector(".cm-gutters");

        // Check if hovering over gutter area (line numbers or fold gutter)
        if (
          gutters &&
          (gutters.contains(target) || target.closest(".cm-gutters"))
        ) {
          // Show all fold markers
          const markers = view.dom.querySelectorAll(".cm-fold-marker");
          markers.forEach((marker: any) => {
            marker.style.opacity = "1";
          });
        }
      },

      mouseout: (event, view) => {
        const target = event.target as HTMLElement;
        const relatedTarget = event.relatedTarget as HTMLElement;
        const gutters = view.dom.querySelector(".cm-gutters");

        // Only hide if we're leaving the entire gutter area
        if (gutters && !gutters.contains(relatedTarget)) {
          const markers = view.dom.querySelectorAll(".cm-fold-marker");
          markers.forEach((marker: any) => {
            // Keep folded markers slightly visible
            if (marker.getAttribute("title")?.includes("Unfold")) {
              marker.style.opacity = "0.7";
            } else {
              marker.style.opacity = "0";
            }
          });
        }
      },
    }),
  ];
}

/**
 * Fallback SVG implementation when Lucide React is not available
 */
function createSVGFoldIcon(element: HTMLElement, open: boolean) {
  // Create SVG icon directly (Lucide-style chevrons)
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "14");
  svg.setAttribute("height", "14");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.style.cssText = "pointer-events: none;";

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

  if (open) {
    // Line can be folded (show down chevron for collapsing) - ChevronDown from Lucide
    path.setAttribute("d", "m6 9 6 6 6-6");
    svg.setAttribute("class", "cm-fold-icon-open");
    element.setAttribute("title", "Fold code block");
  } else {
    // Line is folded (show right chevron for expanding) - ChevronRight from Lucide
    path.setAttribute("d", "m9 18 6-6-6-6");
    svg.setAttribute("class", "cm-fold-icon-closed");
    element.setAttribute("title", "Unfold code block");
  }

  svg.appendChild(path);
  element.appendChild(svg);

  return element;
}

/**
 * Create a custom fold gutter with Lucide-style chevron icons using SVG
 * This approach is more reliable than React components in CodeMirror
 */
export function createCustomFoldGutter() {
  if (!foldGutter) {
    console.warn("⚠️ foldGutter not available, using fallback");
    return [];
  }

  return foldGutter({
    markerDOM: (open: boolean) => {
      // Create a container element
      const element = document.createElement("div");
      element.setAttribute("class", "cm-fold-marker");
      element.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        cursor: pointer;
        color: var(--fg-60, #6b7280);
        transition: color 0.2s ease;
      `;

      // Add hover effect
      element.addEventListener("mouseenter", () => {
        element.style.color = "var(--fg-30, #374151)";
      });

      element.addEventListener("mouseleave", () => {
        element.style.color = "var(--fg-60, #6b7280)";
      });

      return createSVGFoldIcon(element, open);
    },
  });
}

/**
 * Alternative implementation using CSS-only approach (fallback)
 * This creates custom CSS for the default fold markers with better styling
 */
export function createCSSFoldGutter() {
  if (!foldGutter || !EditorView) {
    return [];
  }

  return [
    foldGutter({
      openText: "⌄",
      closedText: "›",
    }),

    // Custom CSS theme extension to style the fold markers
    EditorView.theme({
      ".cm-foldGutter": {
        width: "20px",
        minWidth: "20px",
      },

      ".cm-foldGutter .cm-gutterElement": {
        display: "flex !important",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "14px",
        fontFamily: "inherit",
        color: "var(--fg-60, #6b7280)",
        transition: "color 0.2s ease",
        cursor: "pointer",
        padding: "0",
        textAlign: "center",
        lineHeight: "1",
      },

      ".cm-foldGutter .cm-gutterElement:hover": {
        color: "var(--fg-30, #374151)",
        backgroundColor: "var(--bg-hover, rgba(0,0,0,0.05))",
      },

      // Style for foldable lines (open state)
      ".cm-foldGutter .cm-gutterElement:not([aria-label*='folded'])": {
        fontSize: "16px",
      },

      // Style for folded lines
      ".cm-foldGutter .cm-gutterElement[aria-label*='folded']": {
        fontSize: "14px",
      },
    }),
  ].filter(Boolean);
}

/**
 * Enhanced CSS fold gutter with custom chevron-like symbols
 */
export function createEnhancedCSSFoldGutter() {
  if (!foldGutter || !EditorView) {
    return [];
  }

  return [
    foldGutter({
      openText: "▼", // Down-pointing triangle (for collapsing/folding)
      closedText: "▶", // Right-pointing triangle (for expanding/unfolding)
    }),

    EditorView.theme({
      ".cm-foldGutter": {
        width: "20px",
        minWidth: "20px",
        backgroundColor: "transparent",
      },

      ".cm-foldGutter .cm-gutterElement": {
        display: "flex !important",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontFamily: "inherit",
        color: "var(--fg-60, #6b7280)",
        transition: "all 0.2s ease",
        cursor: "pointer",
        padding: "2px",
        borderRadius: "2px",
        margin: "1px",
        lineHeight: "1",
        userSelect: "none",
      },

      ".cm-foldGutter .cm-gutterElement:hover": {
        color: "var(--fg-30, #374151)",
        backgroundColor: "var(--bg-hover, rgba(59, 130, 246, 0.1))",
        transform: "scale(1.1)",
      },

      // Ensure proper spacing and alignment
      ".cm-foldGutter .cm-gutterElement:not([aria-label*='folded'])": {
        opacity: "0.7",
      },

      ".cm-foldGutter .cm-gutterElement[aria-label*='folded']": {
        opacity: "1",
        color: "var(--fg-40, #4b5563)",
      },
    }),
  ].filter(Boolean);
}
/**
 * Lucide-style chevron fold gutter using Unicode chevrons
 * Most compatible approach with proper Lucide-style chevrons
 */
export function createLucideStyleFoldGutter() {
  if (!foldGutter || !EditorView) {
    return [];
  }

  return [
    foldGutter({
      openText: "⌄", // Chevron down (for collapsing) - matches Lucide ChevronDown
      closedText: "›", // Chevron right (for expanding) - matches Lucide ChevronRight
    }),

    EditorView.theme({
      ".cm-foldGutter": {
        width: "18px",
        minWidth: "18px",
        backgroundColor: "transparent",
      },

      ".cm-foldGutter .cm-gutterElement": {
        display: "flex !important",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "14px",
        fontFamily: "inherit",
        color: "var(--fg-60, #6b7280)",
        transition: "all 0.15s ease",
        cursor: "pointer",
        padding: "1px",
        borderRadius: "3px",
        lineHeight: "1",
        userSelect: "none",
        fontWeight: "normal",
      },

      ".cm-foldGutter .cm-gutterElement:hover": {
        color: "var(--fg-30, #374151)",
        backgroundColor: "var(--bg-hover, rgba(59, 130, 246, 0.08))",
        transform: "scale(1.05)",
      },

      // Style for foldable lines (open state) - down chevron
      ".cm-foldGutter .cm-gutterElement:not([aria-label*='folded'])": {
        opacity: "0.75",
      },

      // Style for folded lines - right chevron
      ".cm-foldGutter .cm-gutterElement[aria-label*='folded']": {
        opacity: "1",
        color: "var(--fg-40, #4b5563)",
        fontWeight: "500",
      },

      // Add subtle animation
      ".cm-foldGutter .cm-gutterElement:active": {
        transform: "scale(0.95)",
      },
    }),
  ].filter(Boolean);
}
