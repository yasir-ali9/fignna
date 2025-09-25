"use client";

import { useState } from "react";
import { Models } from "@/components/models";
import { modelsConfig } from "@/lib/config/models.config";
import { useAuthGuard } from "@/lib/hooks/use-auth-guard";
import { useToast } from "@/components/toast/use-toast";
import AuthModal from "@/modules/auth/auth-modal";


export default function PromptInput() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(modelsConfig.defaultModel);

  // Auth guard, toast, and editor engine hooks
  const authGuard = useAuthGuard() as any;
  const { toast } = useToast();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      // Check authentication before creating project
      authGuard.requireAuth(async () => {
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
            // Store the selected model in sessionStorage for the editor to pick up
            sessionStorage.setItem("selectedModel", selectedModel);

            // Store the prompt in sessionStorage for the project creation flow
            sessionStorage.setItem("initialPrompt", prompt.trim());

            // Show success toast
            toast("Project created successfully! Redirecting...", "success");

            // Navigate to the new project with action-based flow starting with verification
            // No prompt parameter needed - it's now in sessionStorage
            setTimeout(() => {
              const projectId = result.data.project.id;
              window.location.href = `/project/${projectId}?a=create`;
            }, 1000);
          } else {
            console.error("Failed to create project:", result.error);
            toast(`Failed to create project: ${result.error}`, "error");
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error creating project:", error);
          toast(`Error creating project: ${error}`, "error");
          setIsLoading(false);
        }
      });
    }
  };

  // Handle successful authentication
  const handleAuthSuccess = () => {
    authGuard._handleAuthSuccess();
    toast("Successfully signed in!", "success");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = () => {
    toast("Coming soon", "info");
  };

  return (
    <>
      <div className="w-full max-w-6xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="bg-bk-40 border border-bd-50 rounded-xl shadow-lg p-4">
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
                border-none outline-none resize-none text-sm leading-relaxed overflow-hidden min-h-12 max-h-32
              "
                style={{ fontSize: "12px" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "48px"; // Reset height (min-h-12 = 48px)
                  target.style.height =
                    Math.min(target.scrollHeight, 128) + "px"; // Max 128px (max-h-32)
                }}
              />
            </div>

            {/* Status Indicator */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-bd-50/20">
              <div className="flex items-center gap-3">
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
                <div className="w-auto">
                  <Models
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    disabled={isLoading}
                    direction="down"
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

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authGuard.showAuthModal}
        onClose={authGuard.closeAuthModal}
        onSuccess={handleAuthSuccess}
        title="Sign in to create your project"
      />
    </>
  );
}
