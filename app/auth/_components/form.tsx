"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/common/button";
import EmailOTPForm from "./email-otp-form";

export default function AuthForm() {
  const [authMethod, setAuthMethod] = useState<"google" | "email">("google");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check session status on client side
  const { data: session, isPending } = authClient.useSession();

  // Redirect if already authenticated (client-side check)
  useEffect(() => {
    if (session && !isPending) {
      router.push("/");
    }
  }, [session, isPending, router]);

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (err: unknown) {
      console.error("authentication error:", err);

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

  // Handle retry
  const handleRetry = () => {
    setError(null);
    if (authMethod === "google") {
      handleGoogleSignIn();
    }
  };

  // Handle email OTP success
  const handleEmailOTPSuccess = () => {
    console.log("[Auth Form] Email OTP authentication successful");
    // Redirect will be handled by the useEffect above
  };

  // Handle email OTP error
  const handleEmailOTPError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // Show loading state while checking session
  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-fg-60">Checking authentication...</div>
      </div>
    );
  }

  // Don't render form if already authenticated
  if (session) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-fg-60">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Authentication Method Tabs */}
      <div className="flex mb-6 bg-bk-50 rounded-lg p-1">
        <button
          onClick={() => {
            setAuthMethod("google");
            setError(null);
          }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            authMethod === "google"
              ? "bg-ac-01 text-fg-70"
              : "text-fg-60 hover:text-fg-70"
          }`}
        >
          Google
        </button>
        <button
          onClick={() => {
            setAuthMethod("email");
            setError(null);
          }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            authMethod === "email"
              ? "bg-ac-01 text-fg-70"
              : "text-fg-60 hover:text-fg-70"
          }`}
        >
          Email
        </button>
      </div>

      {/* Authentication Forms */}
      {authMethod === "google" && (
        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-medium py-3 px-4 border border-gray-300 rounded-md shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {/* Google Logo */}
            <svg
              className="w-5 h-5"
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
          </button>

          {/* Retry Button (shown only when there's an error) */}
          {error && (
            <button
              onClick={handleRetry}
              disabled={isLoading}
              className="w-full text-ac-01 hover:text-ac-01/80 font-medium py-2 transition-colors duration-200 disabled:opacity-50 cursor-pointer"
            >
              Try Again
            </button>
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
  );
}
