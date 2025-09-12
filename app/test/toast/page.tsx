"use client";

import React from "react";
import { useToast } from "@/components/common/toast";

// Toast testing page to demonstrate all toast functionality with simplified API
export default function ToastTestPage() {
  const { toast, dismiss, dismissAll } = useToast();

  // Test default toast (no visual color)
  const showDefaultToast = () => {
    toast("This is a default toast with no color");
  };

  // Test different toast types with simplified API
  const showSuccessToast = () => {
    toast("Operation completed successfully! 🎉", "success");
  };

  const showErrorToast = () => {
    toast("Something went wrong. Please try again.", "error");
  };

  const showWarningToast = () => {
    toast("This action cannot be undone.", "warning");
  };

  const showInfoToast = () => {
    toast("Here is some helpful information.", "info");
  };

  // Test different positions with simplified API
  const showTopLeftToast = () => {
    toast("Top left toast!", "info", "top-left");
  };

  const showTopCenterToast = () => {
    toast("Top center toast!", "success", "top-center");
  };

  const showTopRightToast = () => {
    toast("Top right toast!", "success", "top-right");
  };

  const showBottomLeftToast = () => {
    toast("Bottom left toast!", "warning", "bottom-left");
  };

  const showBottomCenterToast = () => {
    toast("Bottom center toast!", "error", "bottom-center");
  };

  const showBottomRightToast = () => {
    toast("Bottom right toast!", "error", "bottom-right");
  };

  // Test custom duration with simplified API
  const showLongToast = () => {
    toast("This toast will stay for 10 seconds", "info", "bottom-right", 10000);
  };

  const showPersistentToast = () => {
    const id = toast(
      "This toast won't auto-dismiss",
      "warning",
      "bottom-right",
      0
    );

    // Demonstrate manual dismiss after 5 seconds
    setTimeout(() => {
      dismiss(id);
    }, 5000);
  };

  // Test multiple toasts with simplified API
  const showMultipleToasts = () => {
    toast("First toast", "info");
    setTimeout(() => toast("Second toast", "success"), 200);
    setTimeout(() => toast("Third toast", "warning"), 400);
    setTimeout(() => toast("Fourth toast", "error"), 600);
    setTimeout(() => toast("Fifth toast", "default"), 800);
    setTimeout(
      () => toast("Sixth toast (should replace first)", "success"),
      1000
    );
  };

  return (
    <div className="min-h-screen bg-bk-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-fg-70 mb-8">
          Toast System Test Page
        </h1>

        <div className="mb-6 bg-bk-40 border border-bd-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-fg-70 mb-2">
            New Simplified API
          </h2>
          <div className="text-fg-60 text-sm space-y-1">
            <p>
              • <code className="bg-bk-30 px-1 rounded">toast("message")</code>{" "}
              - Default toast, bottom-right, 4s duration
            </p>
            <p>
              •{" "}
              <code className="bg-bk-30 px-1 rounded">
                toast("message", "success")
              </code>{" "}
              - Success toast
            </p>
            <p>
              •{" "}
              <code className="bg-bk-30 px-1 rounded">
                toast("message", "error", "top-left")
              </code>{" "}
              - Error toast, top-left
            </p>
            <p>
              •{" "}
              <code className="bg-bk-30 px-1 rounded">
                toast("message", "info", "bottom-right", 10000)
              </code>{" "}
              - Info toast, 10s duration
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Toast Types Section */}
          <div className="bg-bk-40 border border-bd-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-fg-70 mb-4">
              Toast Types
            </h2>
            <div className="space-y-3">
              <button
                onClick={showDefaultToast}
                className="w-full px-4 py-2 bg-bk-30 hover:bg-bk-20 text-fg-70 border border-bd-50 rounded-md cursor-pointer transition-colors"
              >
                Default Toast (No Color)
              </button>
              <button
                onClick={showSuccessToast}
                className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md cursor-pointer transition-colors"
              >
                Success Toast
              </button>
              <button
                onClick={showErrorToast}
                className="w-full px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-md cursor-pointer transition-colors"
              >
                Error Toast
              </button>
              <button
                onClick={showWarningToast}
                className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md cursor-pointer transition-colors"
              >
                Warning Toast
              </button>
              <button
                onClick={showInfoToast}
                className="w-full px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-md cursor-pointer transition-colors"
              >
                Info Toast
              </button>
            </div>
          </div>

          {/* Positions Section */}
          <div className="bg-bk-40 border border-bd-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-fg-70 mb-4">Positions</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={showTopLeftToast}
                className="px-3 py-2 bg-ac-01 hover:bg-ac-01/90 text-fg-70 rounded-md cursor-pointer transition-colors text-sm"
              >
                Top Left
              </button>
              <button
                onClick={showTopRightToast}
                className="px-3 py-2 bg-ac-01 hover:bg-ac-01/90 text-fg-70 rounded-md cursor-pointer transition-colors text-sm"
              >
                Top Right
              </button>
              <button
                onClick={showTopCenterToast}
                className="col-span-2 px-3 py-2 bg-ac-01 hover:bg-ac-01/90 text-fg-70 rounded-md cursor-pointer transition-colors text-sm"
              >
                Top Center
              </button>
              <button
                onClick={showBottomLeftToast}
                className="px-3 py-2 bg-ac-01 hover:bg-ac-01/90 text-fg-70 rounded-md cursor-pointer transition-colors text-sm"
              >
                Bottom Left
              </button>
              <button
                onClick={showBottomRightToast}
                className="px-3 py-2 bg-ac-01 hover:bg-ac-01/90 text-fg-70 rounded-md cursor-pointer transition-colors text-sm"
              >
                Bottom Right
              </button>
              <button
                onClick={showBottomCenterToast}
                className="col-span-2 px-3 py-2 bg-ac-01 hover:bg-ac-01/90 text-fg-70 rounded-md cursor-pointer transition-colors text-sm"
              >
                Bottom Center (Default)
              </button>
            </div>
          </div>

          {/* Advanced Features Section */}
          <div className="bg-bk-40 border border-bd-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-fg-70 mb-4">Advanced</h2>
            <div className="space-y-3">
              <button
                onClick={showLongToast}
                className="w-full px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-md cursor-pointer transition-colors"
              >
                Long Duration (10s)
              </button>
              <button
                onClick={showPersistentToast}
                className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md cursor-pointer transition-colors"
              >
                Manual Dismiss
              </button>
              <button
                onClick={showMultipleToasts}
                className="w-full px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-md cursor-pointer transition-colors"
              >
                Multiple Toasts
              </button>
              <button
                onClick={dismissAll}
                className="w-full px-4 py-2 bg-bk-30 hover:bg-bk-20 text-fg-70 border border-bd-50 rounded-md cursor-pointer transition-colors"
              >
                Dismiss All
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-bk-40 border border-bd-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-fg-70 mb-4">
            Instructions
          </h2>
          <ul className="text-fg-60 space-y-2 text-sm">
            <li>• Click any button to show a toast notification</li>
            <li>• Toasts auto-dismiss after 4 seconds by default</li>
            <li>• Click on any toast to dismiss it manually</li>
            <li>• Hover over toasts to see the close (×) icon</li>
            <li>• Default position is now bottom-right</li>
            <li>• Default toast type has no colored border</li>
            <li>• Maximum 5 toasts are shown at once</li>
            <li>• Newer toasts appear at the top of the stack</li>
            <li>• Different positions can be used simultaneously</li>
            <li>• Smooth animations for enter/exit transitions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
