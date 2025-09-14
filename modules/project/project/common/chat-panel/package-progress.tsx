/**
 * Package Installation Progress Component
 *
 * Shows visual progress for package installation in the chat panel.
 * Inspired by open-lovable's CodeApplicationProgress component but adapted
 * for your chat system and design patterns.
 */

"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface PackageProgressState {
  stage: "detecting" | "installing" | "restarting" | "complete" | null;
  packages?: string[];
  installedPackages?: string[];
  message?: string;
  error?: string;
}

interface PackageProgressProps {
  state: PackageProgressState;
}

export const PackageProgress = ({ state }: PackageProgressProps) => {
  if (!state.stage || state.stage === "complete") return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="package-progress"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="inline-block bg-bk-40 border border-bd-50 rounded-lg p-3 mt-2 max-w-full"
      >
        <div className="flex items-start gap-3">
          {/* Animated Icon */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 flex-shrink-0 mt-0.5"
          >
            <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="31.416"
                strokeDashoffset="10"
                className="text-fg-50"
              />
            </svg>
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Stage Title */}
            <div className="text-[11px] font-medium text-fg-30 mb-1">
              {state.stage === "detecting" && "🔍 Detecting packages..."}
              {state.stage === "installing" && "📦 Installing packages..."}
              {state.stage === "restarting" && "🔄 Restarting dev server..."}
            </div>

            {/* Package List */}
            {state.packages && state.packages.length > 0 && (
              <div className="mb-2">
                <div className="flex flex-wrap gap-1">
                  {state.packages.map((pkg, index) => (
                    <motion.span
                      key={pkg}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="inline-flex items-center px-2 py-0.5 bg-bk-50 border border-bd-50 rounded text-[10px] text-fg-50"
                    >
                      <span className="w-1 h-1 bg-ac-01 rounded-full mr-1.5 animate-pulse"></span>
                      {pkg}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {/* Installed Packages */}
            {state.installedPackages && state.installedPackages.length > 0 && (
              <div className="mb-2">
                <div className="text-[10px] text-fg-60 mb-1">✅ Installed:</div>
                <div className="flex flex-wrap gap-1">
                  {state.installedPackages.map((pkg) => (
                    <span
                      key={pkg}
                      className="inline-flex items-center px-2 py-0.5 bg-green-50 border border-green-200 rounded text-[10px] text-green-700"
                    >
                      <span className="w-1 h-1 bg-green-500 rounded-full mr-1.5"></span>
                      {pkg}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Status Message */}
            <div className="text-[10px] text-fg-60">
              {state.stage === "detecting" &&
                "Scanning generated code for import statements..."}
              {state.stage === "installing" &&
                "Installing npm packages with --legacy-peer-deps..."}
              {state.stage === "restarting" &&
                "Restarting Vite dev server to apply changes..."}
              {state.message && (
                <div className="mt-1 text-fg-50">{state.message}</div>
              )}
            </div>

            {/* Error Message */}
            {state.error && (
              <div className="mt-2 text-[10px] text-red-400 flex items-center">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="mr-1 flex-shrink-0"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                {state.error}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
