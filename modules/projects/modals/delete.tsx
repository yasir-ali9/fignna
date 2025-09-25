"use client";

import { useEffect, useRef } from "react";

interface DeleteProjectModalProps {
  isOpen: boolean;
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

// Delete confirmation modal component with minimal design
export function DeleteProjectModal({
  isOpen,
  projectName,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteProjectModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key and click outside to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) {
        onCancel();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        !isDeleting
      ) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onCancel, isDeleting]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        ref={modalRef}
        className="bg-bk-50 border border-bd-50 rounded-xl shadow-lg p-6 w-full max-w-md mx-4"
      >
        {/* Modal header */}
        <div className="mb-4">
          <h2 className="text-fg-30 text-lg font-medium text-left">
            Delete project
          </h2>
        </div>

        {/* Modal content */}
        <div className="mb-6">
          <p className="text-fg-50 text-sm text-left leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="text-fg-30 font-medium">"{projectName}"</span>?
          </p>
          <p className="text-fg-60 text-xs text-left mt-2">
            This action cannot be undone.
          </p>
        </div>

        {/* Modal actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm text-fg-50 bg-bk-40 rounded-lg hover:bg-bk-30 hover:text-fg-30 focus:bg-bk-30 focus:text-fg-30 focus:outline-none focus:ring-2 focus:ring-ac-01 focus:ring-offset-2 focus:ring-offset-bk-40 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm text-white bg-[#c70036] rounded-lg hover:bg-[#a50036] focus:outline-none  -all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}