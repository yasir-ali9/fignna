"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEditorEngine } from "@/lib/stores/editor/hooks";

interface SandboxCreateProps {
  projectId: string;
}

/**
 * Component to handle sandbox creation during project creation flow
 * Shows progress and creates sandbox before proceeding to chat
 */
export function SandboxCreate({ projectId }: SandboxCreateProps) {
  const router = useRouter();
  const engine = useEditorEngine();
  const [currentStep, setCurrentStep] = useState<'creating' | 'verifying' | 'complete' | 'error'>('creating');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  // Use ref to track current progress value to prevent jumping back
  const currentProgressRef = useRef(0);

  // Helper function to smoothly animate progress - fixed to prevent jumping back
  const animateProgress = (targetProgress: number, duration: number = 1000) => {
    return new Promise<void>((resolve) => {
      // Use ref value instead of state to get current progress
      const startProgress = currentProgressRef.current;
      const progressDiff = targetProgress - startProgress;
      
      // Don't animate if target is less than current (prevent jumping back)
      if (targetProgress <= startProgress) {
        currentProgressRef.current = targetProgress;
        setProgress(targetProgress);
        resolve();
        return;
      }
      
      const startTime = Date.now();

      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progressRatio = Math.min(elapsed / duration, 1);
        
        // Use easeOutCubic for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progressRatio, 3);
        const currentProgress = startProgress + (progressDiff * easeOutCubic);
        
        const roundedProgress = Math.round(currentProgress);
        currentProgressRef.current = roundedProgress;
        setProgress(roundedProgress);

        if (progressRatio < 1) {
          requestAnimationFrame(updateProgress);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(updateProgress);
    });
  };

  // Helper function for incremental progress updates
  const incrementalProgress = async (start: number, end: number, steps: number = 5, stepDelay: number = 200) => {
    const increment = (end - start) / steps;
    
    for (let i = 1; i <= steps; i++) {
      const targetProgress = start + (increment * i);
      await animateProgress(targetProgress, stepDelay);
      
      // Small delay between increments for visual effect
      if (i < steps) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  };

  useEffect(() => {
    const createSandbox = async () => {
      try {
        console.log("[SandboxCreate] Starting sandbox creation for project:", projectId);
        setCurrentStep('creating');
        
        // Initial progress animation (0% to 15%)
        await animateProgress(15, 800);

        // Load the project first so the sandbox manager can access the projectId
        await incrementalProgress(15, 35, 4, 300); // 15% to 35% in 4 steps
        await engine.projects.loadProject(projectId, { skipAutoSync: true });

        // Project loaded, continue progress (35% to 50%)
        await incrementalProgress(35, 50, 3, 250);

        // Create sandbox using the engine
        await engine.sandbox.createSandbox();
        
        // Check if sandbox creation failed
        if (engine.sandbox.error) {
          throw new Error(engine.sandbox.error);
        }
        
        // Sandbox creation initiated (50% to 65%)
        await incrementalProgress(50, 65, 3, 300);

        console.log("[SandboxCreate] Sandbox created, verifying...");
        setCurrentStep('verifying');

        // Wait for sandbox to be available (no timeout since API can take time)
        let verificationProgress = 65;
        while (!engine.sandbox.currentSandbox) {
          // Check for errors during waiting
          if (engine.sandbox.error) {
            throw new Error(engine.sandbox.error);
          }

          // Gradually increase progress during verification (65% to 85%)
          if (verificationProgress < 85) {
            verificationProgress += 2;
            await animateProgress(verificationProgress, 400);
          }

          // Wait before next check
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Ensure we're at 85% when verification completes
        await animateProgress(85, 300);
        console.log("[SandboxCreate] Sandbox object is now available");

        console.log("[SandboxCreate] Sandbox verified, starting status monitoring...");
        
        // Start status monitoring (85% to 95%)
        await incrementalProgress(85, 95, 2, 400);
        await engine.statusManager.startStatusChecking(projectId);
        
        // Final completion (95% to 100%)
        await animateProgress(100, 600);
        setCurrentStep('complete');
        
        // Small delay to show completion
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Redirect to main project page
        console.log("[SandboxCreate] Redirecting to main project page...");
        setTimeout(() => {
          window.location.href = `/project/${projectId}`;
        }, 2000);

      } catch (error) {
        console.error("[SandboxCreate] Sandbox creation failed:", error);
        setCurrentStep('error');
        
        // Provide more specific error messages based on the error type
        let errorMessage = "Failed to create sandbox";
        if (error instanceof Error) {
          if (error.message.includes("network") || error.message.includes("fetch")) {
            errorMessage = "Network error - please check your connection and try again";
          } else if (error.message.includes("timeout")) {
            errorMessage = "Sandbox creation timed out - please try again";
          } else if (error.message.includes("rate limit")) {
            errorMessage = "Too many requests - please wait a moment and try again";
          } else {
            errorMessage = error.message;
          }
        }
        
        setError(errorMessage);
      }
    };

    createSandbox();
  }, [projectId, engine.sandbox, engine.statusManager, router]);

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'creating':
      case 'verifying':
        return (
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-fg-60 border-t-transparent mx-auto"></div>
        );
      case 'complete':
        return (
          <div className="rounded-full h-6 w-6 bg-fg-60 mx-auto"></div>
        );
      case 'error':
        return (
          <div className="rounded-full h-6 w-6 bg-fg-60 mx-auto"></div>
        );
      default:
        return null;
    }
  };

  const getStepMessage = () => {
    switch (currentStep) {
      case 'creating':
        return {
          title: "Creating Your Sandbox",
          description: "Setting up a fresh development environment..."
        };
      case 'verifying':
        return {
          title: "Verifying Sandbox",
          description: "Ensuring everything is ready for development..."
        };
      case 'complete':
        return {
          title: "Sandbox Ready!",
          description: "Redirecting to your project..."
        };
      case 'error':
        return {
          title: "Creation Failed",
          description: error || "Something went wrong during sandbox creation"
        };
      default:
        return { title: "", description: "" };
    }
  };

  if (currentStep === 'error') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-bk-40">
        <div className="text-center">
          {getStepIcon('error')}
          <div className="text-lg text-fg-30 mb-4 mt-4">
            {getStepMessage().title}
          </div>
          <div className="text-fg-60 mb-6 text-sm">{getStepMessage().description}</div>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-bk-60 text-fg-30 rounded border border-bd-50 hover:bg-bk-70 transition-colors text-sm"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-bk-60 text-fg-30 rounded border border-bd-50 hover:bg-bk-70 transition-colors text-sm ml-2"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const message = getStepMessage();

  return (
    <div className="h-screen w-full flex items-center justify-center bg-bk-60">
      <div className="text-center">
        {getStepIcon(currentStep)}
        <div className="text-lg text-fg-30 mb-2 mt-4">
          {message.title}
        </div>
        <div className="text-fg-60 text-sm mb-6">
          {message.description}
        </div>
        
        {/* Minimal Progress Bar */}
        <div className="w-80 mx-auto mb-4">
          {/* Progress Bar Background */}
          <div className="relative w-full bg-bk-40 rounded-full h-2 overflow-hidden border border-bd-50">
            {/* Animated Progress Fill */}
            <div 
              className="h-full rounded-full transition-all duration-500 ease-out bg-fg-30"
              style={{ 
                width: `${progress}%`
              }}
            />
          </div>
        </div>
        
        {/* Progress Percentage */}
        <div className="text-fg-60 text-xs mb-2">
          {progress}%
        </div>
      </div>
    </div>
  );
}