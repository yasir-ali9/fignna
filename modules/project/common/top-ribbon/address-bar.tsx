"use client";

import { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useEditorEngine } from "@/lib/stores/editor/hooks";

export const AddressBar = observer(() => {
  const engine = useEditorEngine();
  const [currentRoute, setCurrentRoute] = useState("/");
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("/");
  const inputRef = useRef<HTMLInputElement>(null);

  // Get the preview URL from sandbox
  const previewUrl =
    engine.sandbox.previewUrl || engine.projects.currentProject?.previewUrl;

  // Handle refresh button click
  const handleRefresh = () => {
    console.log(
      "[AddressBar] Manual refresh triggered for route:",
      currentRoute
    );
    // Trigger refresh with current route
    window.dispatchEvent(
      new CustomEvent("code-applied", {
        detail: {
          timestamp: Date.now(),
          source: "address-bar-refresh",
          route: currentRoute,
        },
      })
    );
  };

  // Handle external view button click
  const handleExternalView = () => {
    if (previewUrl) {
      const fullUrl =
        currentRoute === "/" ? previewUrl : `${previewUrl}${currentRoute}`;
      window.open(fullUrl, "_blank", "noopener noreferrer");
    }
  };

  // Handle route input click
  const handleRouteClick = () => {
    setIsEditing(true);
    setInputValue(currentRoute);
  };

  // Handle route input change
  const handleRouteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Ensure it starts with "/"
    if (!value.startsWith("/")) {
      value = "/" + value;
    }

    setInputValue(value);
  };

  // Handle route submission
  const handleRouteSubmit = () => {
    const newRoute = inputValue.trim();
    setCurrentRoute(newRoute);
    setIsEditing(false);

    // Update the preview iframe with new route
    updatePreviewRoute(newRoute);
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRouteSubmit();
    } else if (e.key === "Escape") {
      setInputValue(currentRoute);
      setIsEditing(false);
    }
  };

  // Update preview iframe with new route
  const updatePreviewRoute = (route: string) => {
    console.log("[AddressBar] Navigating to route:", route);

    // Dispatch custom event to update all preview iframes
    window.dispatchEvent(
      new CustomEvent("route-changed", {
        detail: {
          route: route,
          fullUrl: previewUrl
            ? route === "/"
              ? previewUrl
              : `${previewUrl}${route}`
            : null,
        },
      })
    );
  };

  // Listen for URL changes from iframe navigation
  useEffect(() => {
    const handleIframeNavigation = (event: CustomEvent) => {
      const newUrl = event.detail?.url;
      if (newUrl && previewUrl) {
        // Extract route from the full URL
        const baseUrl = previewUrl.replace(/\/$/, ""); // Remove trailing slash
        let newRoute = "/";

        if (newUrl.startsWith(baseUrl)) {
          const routePart = newUrl.substring(baseUrl.length);
          newRoute = routePart || "/";
        }

        console.log("[AddressBar] Iframe navigated to:", newRoute);

        // Update address bar without triggering navigation
        if (newRoute !== currentRoute) {
          setCurrentRoute(newRoute);
          setInputValue(newRoute);
        }
      }
    };

    window.addEventListener(
      "iframe-navigated",
      handleIframeNavigation as EventListener
    );

    return () => {
      window.removeEventListener(
        "iframe-navigated",
        handleIframeNavigation as EventListener
      );
    };
  }, [previewUrl, currentRoute]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset route when preview URL changes
  useEffect(() => {
    setCurrentRoute("/");
    setInputValue("/");
  }, [previewUrl]);

  // Don't show address bar if no preview URL
  if (!previewUrl) {
    return null;
  }

  return (
    <div className="flex items-center bg-bk-60 border border-bd-50/60 rounded-md h-6 w-[180px]">
      {/* Refresh Button */}
      <button
        onClick={handleRefresh}
        className="flex items-center justify-center w-5 h-5 ml-0.5 text-fg-60 hover:text-fg-50 hover:bg-bk-30 rounded transition-colors cursor-pointer"
        title="Refresh preview"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M3 8a5 5 0 0 1 9-3h-2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-1 0v1.531a6 6 0 1 0 1.476 4.513a.5.5 0 0 0-.996-.089A5 5 0 0 1 3 8" />
        </svg>
      </button>

      {/* Route Input/Display */}
      <div className="flex-1 px-2">
        {isEditing ? (
          <input
            ref={inputRef}
            value={inputValue}
            onChange={handleRouteChange}
            onBlur={handleRouteSubmit}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-xs text-fg-50 outline-none border-none font-normal mb-1"
            placeholder="/"
          />
        ) : (
          <button
            onClick={handleRouteClick}
            className="w-full text-left text-xs text-fg-50 truncate hover:text-fg-40 transition-colors cursor-text font-normal mb-1"
            title="Click to edit route"
          >
            {currentRoute}
          </button>
        )}
      </div>

      {/* External View Button */}
      <button
        onClick={handleExternalView}
        className="flex items-center justify-center w-5 h-5 mr-0.5 text-fg-60 hover:text-fg-50 hover:bg-bk-30 rounded transition-colors cursor-pointer"
        title="Open in new tab"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path d="M15 10.833V15.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 15.5v-9A1.5 1.5 0 0 1 4.5 5H9.167" />
          <path d="M12.5 3h4.5v4.5" />
          <path d="M17 3l-6.5 6.5" />
        </svg>
      </button>
    </div>
  );
});
