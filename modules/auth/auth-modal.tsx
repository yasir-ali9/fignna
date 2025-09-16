"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/button";
import EmailOTPForm from "./email-otp-form";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Sign in to continue",
}: AuthModalProps) {
  const [authMethod, setAuthMethod] = useState<"google" | "email">("google");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Handle mounting for portal rendering
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });

      // Success will be handled by the auth state change
      onSuccess?.();
    } catch (err: unknown) {
      console.error("[Auth Modal] Google authentication error:", err);

      // Handle different types of errors
      let errorMessage = "Failed to sign in with Google. Please try again.";

      const errorObj = err as { message?: string };
      if (
        errorObj?.message?.includes("network") ||
        errorObj?.message?.includes("fetch")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (
        errorObj?.message?.includes("popup") ||
        errorObj?.message?.includes("blocked")
      ) {
        errorMessage = "Popup was blocked. Please allow popups and try again.";
      } else if (
        errorObj?.message?.includes("cancelled") ||
        errorObj?.message?.includes("closed")
      ) {
        errorMessage = "Sign-in was cancelled. Please try again.";
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // Handle email OTP success
  const handleEmailOTPSuccess = () => {
    console.log("[Auth Modal] Email OTP authentication successful");
    onSuccess?.();
  };

  // Handle email OTP error
  const handleEmailOTPError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // Handle modal backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle retry
  const handleRetry = () => {
    setError(null);
    if (authMethod === "google") {
      handleGoogleSignIn();
    }
  };

  // Don't render anything if not mounted (SSR safety)
  if (!mounted) return null;

  // Don't render if not open
  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-sm bg-bk-40 rounded-lg border border-bd-50 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-bd-50">
          <h2 className="text-fg-30 text-sm font-medium">{title}</h2>
          <button
            onClick={onClose}
            className="text-fg-60 hover:text-fg-30 transition-colors cursor-pointer p-1"
            aria-label="Close modal"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4">
          {/* Error Message */}
          {error && (
            <div className="bg-bk-50 border border-bd-50 text-fg-30 px-3 py-2 rounded-md text-xs mb-4">
              {error}
            </div>
          )}

          {/* Authentication Method Tabs */}
          <div className="flex gap-1 p-1 bg-bk-50 rounded-md mb-4">
            <button
              onClick={() => {
                setAuthMethod("google");
                setError(null);
              }}
              className={`flex-1 py-1.5 px-3 text-xs font-medium transition-colors rounded-md cursor-pointer ${
                authMethod === "google"
                  ? "bg-bk-30 text-fg-30"
                  : "text-fg-60 hover:text-fg-30 hover:bg-bk-40"
              }`}
            >
              Google
            </button>
            <button
              onClick={() => {
                setAuthMethod("email");
                setError(null);
              }}
              className={`flex-1 py-1.5 px-3 text-xs font-medium transition-colors rounded-md cursor-pointer ${
                authMethod === "email"
                  ? "bg-bk-30 text-fg-30"
                  : "text-fg-60 hover:text-fg-30 hover:bg-bk-40"
              }`}
            >
              Email
            </button>
          </div>

          {/* Authentication Forms */}
          {authMethod === "google" && (
            <div className="space-y-3">
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                variant="secondary"
                size="sm"
                className="w-full justify-center gap-2"
              >
                {/* Google Logo */}
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {isLoading ? "Signing in..." : "Continue with Google"}
              </Button>

              {/* Retry Button (shown only when there's an error) */}
              {error && (
                <Button
                  onClick={handleRetry}
                  disabled={isLoading}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  Try Again
                </Button>
              )}
            </div>
          )}

          {authMethod === "email" && (
            <EmailOTPForm
              onSuccess={handleEmailOTPSuccess}
              onError={handleEmailOTPError}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 border-t border-bd-50 text-center">
          <p className="text-fg-60 text-xs">
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );

  // Render modal using portal
  return createPortal(modalContent, document.body);
}
