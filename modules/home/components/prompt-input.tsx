"use client";

import { useState } from "react";
import { Models } from "@/components/common/models";
import { modelsConfig } from "@/lib/config/models.config";

export default function PromptInput() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(modelsConfig.defaultModel);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      setIsLoading(true);
      try {
        // Create a new project
        const response = await fetch("/api/v1/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: `Project ${new Date().toLocaleDateString()}`,
            description: prompt.trim(),
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Store the prompt and model in sessionStorage for the editor to pick up
          sessionStorage.setItem("initialPrompt", prompt.trim());
          sessionStorage.setItem("selectedModel", selectedModel);

          // Navigate to the new project without URL parameters
          window.location.href = `/project/${result.data.project.id}`;
        } else {
          console.error("Failed to create project:", result.error);
          alert(`Failed to create project: ${result.error}`);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error creating project:", error);
        alert(`Error creating project: ${error}`);
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*,.pdf,.doc,.docx,.txt";
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        console.log(
          "Files selected:",
          Array.from(files).map((f) => f.name)
        );
        // TODO: Handle file upload logic here
      }
    };
    input.click();
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="bg-bk-60 rounded-lg p-4">
          {/* Input Area */}
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your app idea..."
              rows={2}
              className="
                w-full bg-transparent text-fg-30 placeholder-fg-60 
                border-none outline-none resize-none text-sm leading-relaxed
              "
              style={{ fontSize: "12px" }}
            />
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-bd-50/20">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFileUpload}
                className="text-fg-60 hover:text-fg-30 transition-colors cursor-pointer"
                title="Upload files"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M11.883 3.007L12 3a1 1 0 0 1 .993.883L13 4v7h7a1 1 0 0 1 .993.883L21 12a1 1 0 0 1-.883.993L20 13h-7v7a1 1 0 0 1-.883.993L12 21a1 1 0 0 1-.993-.883L11 20v-7H4a1 1 0 0 1-.993-.883L3 12a1 1 0 0 1 .883-.993L4 11h7V4a1 1 0 0 1 .883-.993L12 3z"
                  />
                </svg>
              </button>

              {/* Model Selector */}
              <div className="w-40">
                <Models
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  disabled={isLoading}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className={`transition-all duration-200 ${
                prompt.trim() && !isLoading
                  ? "text-fg-30 hover:text-fg-10 cursor-pointer"
                  : "text-fg-70 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 20 20"
                  className="transition-colors duration-200 animate-spin"
                >
                  <path
                    fill="currentColor"
                    d="M10 3.5A6.5 6.5 0 0 0 3.5 10A.75.75 0 0 1 2 10a8 8 0 1 1 8 8a.75.75 0 0 1 0-1.5a6.5 6.5 0 1 0 0-13"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  className="transition-colors duration-200"
                >
                  <path
                    fill="currentColor"
                    d="M22.001 12c0-5.523-4.477-10-10-10s-10 4.477-10 10s4.477 10 10 10s10-4.477 10-10m-14.53.28a.75.75 0 0 1-.073-.976l.072-.085l4.001-4a.75.75 0 0 1 .977-.073l.084.073l4 4.001a.75.75 0 0 1-.977 1.133l-.084-.072l-2.72-2.722v6.692a.75.75 0 0 1-.649.743l-.101.006a.75.75 0 0 1-.743-.648l-.007-.102V9.56l-2.72 2.72a.75.75 0 0 1-.977.073z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
