"use client";

import { observer } from "mobx-react-lite";
import { useState, useEffect, useCallback, useRef } from "react";

interface SeamlessPreviewProps {
  src: string;
  className: string;
  title: string;
  sandbox?: string;
}

// Seamless preview component that only refreshes on actual code changes
export const SeamlessPreview = observer(
  ({
    src,
    className,
    title,
    sandbox = "allow-scripts allow-same-origin allow-forms allow-popups",
  }: SeamlessPreviewProps) => {
    const [refreshKey, setRefreshKey] = useState(0);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const lastRefreshTime = useRef<number>(0);
    const lastKnownUrl = useRef<string>("");

    // Seamless refresh function - no loading states
    const seamlessRefresh = useCallback(() => {
      const now = Date.now();
      // Debounce rapid refresh calls (minimum 1 second between refreshes)
      if (now - lastRefreshTime.current < 1000) {
        console.log(
          "Debouncing rapid refresh calls for:",
          src
        );
        return;
      }

      console.log(
        "Seamlessly refreshing preview for URL:",
        src
      );
      lastRefreshTime.current = now;
      setRefreshKey((prev) => {
        const newKey = prev + 1;
        console.log("Setting new refresh key:", newKey);
        return newKey;
      });
    }, [src]);

    // Listen for code change events and route changes
    useEffect(() => {
      const handleCodeChange = (event: CustomEvent) => {
        console.log(
          "Code change detected:",
          event.type,
          "for URL:",
          src
        );
        console.log("Event detail:", event.detail);
        seamlessRefresh();
      };

      const handleRouteChange = (event: CustomEvent) => {
        console.log(
          "Route change detected:",
          event.detail?.route,
          "for URL:",
          src
        );

        // Update iframe src with new route
        if (event.detail?.fullUrl && iframeRef.current) {
          console.log(
            "Updating iframe src to:",
            event.detail.fullUrl
          );
          iframeRef.current.src = event.detail.fullUrl;
        }
      };

      console.log(
        "🔧 Setting up event listeners for URL:",
        src
      );

      // Listen to code change events
      window.addEventListener(
        "code-applied",
        handleCodeChange as EventListener
      );
      window.addEventListener("file-saved", handleCodeChange as EventListener);
      window.addEventListener(
        "sandbox-synced",
        handleCodeChange as EventListener
      );

      // Listen to route change events
      window.addEventListener(
        "route-changed",
        handleRouteChange as EventListener
      );

      return () => {
        console.log(
          "Cleaning up event listeners for URL:",
          src
        );
        window.removeEventListener(
          "code-applied",
          handleCodeChange as EventListener
        );
        window.removeEventListener(
          "file-saved",
          handleCodeChange as EventListener
        );
        window.removeEventListener(
          "sandbox-synced",
          handleCodeChange as EventListener
        );
        window.removeEventListener(
          "route-changed",
          handleRouteChange as EventListener
        );
      };
    }, [seamlessRefresh]);

    // Listen for postMessage from iframe about URL changes
    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        // Verify the message is about URL changes
        if (event.data && event.data.type === "url-changed" && event.data.url) {
          console.log(
            "Received URL change from iframe:",
            event.data.url
          );

          if (event.data.url !== lastKnownUrl.current) {
            lastKnownUrl.current = event.data.url;

            // Dispatch iframe navigation event
            window.dispatchEvent(
              new CustomEvent("iframe-navigated", {
                detail: { url: event.data.url },
              })
            );
          }
        }
      };

      window.addEventListener("message", handleMessage);

      return () => {
        window.removeEventListener("message", handleMessage);
      };
    }, []);

    return (
      <iframe
        key={refreshKey}
        ref={iframeRef}
        src={src}
        className={className}
        title={title}
        sandbox={sandbox}
        onLoad={() => {
          console.log("Preview loaded");
          // Update last known URL on load
          lastKnownUrl.current = src;
        }}
        onError={(e) => {
          console.error("Preview error:", e);
        }}
      />
    );
  }
);
