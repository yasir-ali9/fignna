"use client";

import { observer } from "mobx-react-lite";
import type { EditorEngine } from "@/lib/stores/editor";

interface StoreStateMonitorProps {
  engine: EditorEngine;
}

export const StoreStateMonitor = observer(
  ({ engine }: StoreStateMonitorProps) => {
    return (
      <div className="bg-bk-40 border border-bd-50 rounded p-3 space-y-3">
        <h4 className="text-fg-50 text-[11px] font-semibold">
          Live Store State
        </h4>

        {/* Projects State */}
        <div className="bg-bk-50 rounded p-2">
          <div className="text-fg-60 text-[9px] font-medium mb-1">
            ProjectsManager
          </div>
          <div className="space-y-1 text-[8px]">
            <div className="flex justify-between">
              <span className="text-fg-60">Current Project:</span>
              <span className="text-fg-50">
                {engine.projects.currentProject?.name || "None"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-60">Total Projects:</span>
              <span className="text-fg-50">
                {engine.projects.projects.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-60">Is Loading:</span>
              <span
                className={
                  engine.projects.isLoading ? "text-yellow-400" : "text-fg-50"
                }
              >
                {engine.projects.isLoading ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-60">Is Saving:</span>
              <span
                className={
                  engine.projects.isSaving ? "text-yellow-400" : "text-fg-50"
                }
              >
                {engine.projects.isSaving ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-60">Has Changes:</span>
              <span
                className={
                  engine.projects.hasUnsavedChanges
                    ? "text-orange-400"
                    : "text-green-400"
                }
              >
                {engine.projects.hasUnsavedChanges ? "Yes" : "No"}
              </span>
            </div>
            {engine.projects.error && (
              <div className="text-red-400 text-[7px] mt-1 p-1 bg-red-500/10 rounded">
                Error: {engine.projects.error}
              </div>
            )}
          </div>
        </div>

        {/* Files State */}
        <div className="bg-bk-50 rounded p-2">
          <div className="text-fg-60 text-[9px] font-medium mb-1">
            FilesManager
          </div>
          <div className="space-y-1 text-[8px]">
            <div className="flex justify-between">
              <span className="text-fg-60">File Tree Items:</span>
              <span className="text-fg-50">{engine.files.fileTree.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-60">Open Tabs:</span>
              <span className="text-fg-50">{engine.files.openTabs.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-60">Active File:</span>
              <span className="text-fg-50">
                {engine.files.activeFile?.name || "None"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-60">Dirty Files:</span>
              <span
                className={
                  engine.files.dirtyFilesCount > 0
                    ? "text-orange-400"
                    : "text-fg-50"
                }
              >
                {engine.files.dirtyFilesCount}
              </span>
            </div>
            {engine.files.error && (
              <div className="text-red-400 text-[7px] mt-1 p-1 bg-red-500/10 rounded">
                Error: {engine.files.error}
              </div>
            )}
          </div>
        </div>

        {/* Sandbox State */}
        <div className="bg-bk-50 rounded p-2">
          <div className="text-fg-60 text-[9px] font-medium mb-1">
            SandboxManager
          </div>
          <div className="space-y-1 text-[8px]">
            <div className="flex justify-between">
              <span className="text-fg-60">Sandbox ID:</span>
              <span className="text-fg-50 font-mono">
                {engine.sandbox.currentSandboxId || "None"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-60">Status:</span>
              <span
                className={`${
                  engine.sandbox.currentSandbox?.status === "running"
                    ? "text-green-400"
                    : engine.sandbox.currentSandbox?.status === "creating"
                    ? "text-yellow-400"
                    : engine.sandbox.currentSandbox?.status === "error"
                    ? "text-red-400"
                    : "text-fg-50"
                }`}
              >
                {engine.sandbox.currentSandbox?.status || "None"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-60">Is Creating:</span>
              <span
                className={
                  engine.sandbox.isCreating ? "text-yellow-400" : "text-fg-50"
                }
              >
                {engine.sandbox.isCreating ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-60">Is Syncing:</span>
              <span
                className={
                  engine.sandbox.isSyncing ? "text-yellow-400" : "text-fg-50"
                }
              >
                {engine.sandbox.isSyncing ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg-60">Is Ready:</span>
              <span
                className={
                  engine.sandbox.isReady ? "text-green-400" : "text-fg-50"
                }
              >
                {engine.sandbox.isReady ? "Yes" : "No"}
              </span>
            </div>
            {engine.sandbox.previewUrl && (
              <div className="mt-1">
                <div className="text-fg-60 text-[7px] mb-1">Preview URL:</div>
                <a
                  href={engine.sandbox.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-[7px] font-mono break-all"
                >
                  {engine.sandbox.previewUrl}
                </a>
              </div>
            )}
            {engine.sandbox.error && (
              <div className="text-red-400 text-[7px] mt-1 p-1 bg-red-500/10 rounded">
                Error: {engine.sandbox.error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
