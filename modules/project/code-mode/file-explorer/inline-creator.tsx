"use client";

import React, { useState, useEffect, useRef } from "react";
import { FileIcon } from "../icons/file-icons";

interface InlineCreatorProps {
  type: "file" | "folder";
  level: number;
  onComplete: (name: string) => void;
  onCancel: () => void;
}

/**
 * InlineCreator - VS Code-like inline file/folder creation input
 */
export const InlineCreator: React.FC<InlineCreatorProps> = ({
  type,
  level,
  onComplete,
  onCancel,
}) => {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const paddingLeft = level * 16 + 8;

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (name.trim()) {
        onComplete(name.trim());
      } else {
        onCancel();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    if (name.trim()) {
      onComplete(name.trim());
    } else {
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1" style={{ paddingLeft }}>
      {/* Placeholder for chevron space */}
      <div className="w-4 h-4 flex items-center justify-center">
        <div className="w-3 h-3" />
      </div>

      {/* File/Folder Icon */}
      <div className="w-4 h-4 flex items-center justify-center">
        <FileIcon
          filename={name || (type === "folder" ? "new-folder" : "new-file.txt")}
          isDirectory={type === "folder"}
          size={16}
          className="flex-shrink-0"
        />
      </div>

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="flex-1 bg-transparent text-fg-30 text-[11px] outline-none border-none"
        placeholder={`${type === "folder" ? "Folder" : "File"} name...`}
      />
    </div>
  );
};
