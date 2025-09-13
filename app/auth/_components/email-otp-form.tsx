"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/common/button";

interface EmailOTPFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface EmailOTPState {
  step: "email" | "otp";
  email: string;
  otp: string;
  isLoading: boolean;
  error: string | null;
  canResend: boolean;
  countdown: number;
}

export default function EmailOTPForm({
  onSuccess,
  onError,
}: EmailOTPFormProps) {
  const [state, setState] = useState<EmailOTPState>({
    step: "email",
    email: "",
    otp: "",
    isLoading: false,
    error: null,
    canResend: true,
    countdown: 0,
  });

  // Countdown timer for resend functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.countdown > 0) {
      interval = setInterval(() => {
        setState((prev) => ({
          ...prev,
          countdown: prev.countdown - 1,
          canResend: prev.countdown <= 1,
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.countdown]);

  // Validate email format
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle email submission and OTP sending
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail(state.email)) {
      setState((prev) => ({
        ...prev,
        error: "Please enter a valid email address",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Send OTP for sign-in
      const { data, error } = await authClient.emailOtp.sendVerificationOtp({
        email: state.email,
        type: "sign-in",
      });

      if (error) {
        throw new Error(error.message || "Failed to send verification code");
      }

      console.log("[Email OTP Form] OTP sent successfully:", data);

      setState((prev) => ({
        ...prev,
        step: "otp",
        isLoading: false,
        error: null,
        canResend: false,
        countdown: 60, // 60 second cooldown
      }));
    } catch (error) {
      console.error("[Email OTP Form] Error sending OTP:", error);
      const errorMessage =
        (error as Error).message ||
        "Failed to send verification code. Please try again.";
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      onError?.(errorMessage);
    }
  };

  // Handle OTP verification and sign-in
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (state.otp.length !== 6) {
      setState((prev) => ({
        ...prev,
        error: "Please enter the 6-digit verification code",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Sign in with email and OTP
      const { data, error } = await authClient.signIn.emailOtp({
        email: state.email,
        otp: state.otp,
      });

      if (error) {
        throw new Error(error.message || "Invalid verification code");
      }

      console.log("[Email OTP Form] Sign-in successful:", data);
      onSuccess?.();
    } catch (error) {
      console.error("[Email OTP Form] Error verifying OTP:", error);
      const errorMessage =
        (error as Error).message ||
        "Invalid verification code. Please try again.";
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      onError?.(errorMessage);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (!state.canResend) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await authClient.emailOtp.sendVerificationOtp({
        email: state.email,
        type: "sign-in",
      });

      if (error) {
        throw new Error(error.message || "Failed to resend verification code");
      }

      console.log("[Email OTP Form] OTP resent successfully:", data);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: null,
        canResend: false,
        countdown: 60,
      }));
    } catch (error) {
      console.error("[Email OTP Form] Error resending OTP:", error);
      const errorMessage =
        (error as Error).message ||
        "Failed to resend verification code. Please try again.";
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      onError?.(errorMessage);
    }
  };

  // Handle back to email step
  const handleBackToEmail = () => {
    setState((prev) => ({
      ...prev,
      step: "email",
      otp: "",
      error: null,
      canResend: true,
      countdown: 0,
    }));
  };

  // Handle input changes
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, email: e.target.value, error: null }));
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6); // Only digits, max 6
    setState((prev) => ({ ...prev, otp: value, error: null }));
  };

  return (
    <div className="space-y-3">
      {/* Error Message */}
      {state.error && (
        <div className="bg-bk-50 border border-bd-50 text-fg-30 px-3 py-2 rounded-md text-xs">
          {state.error}
        </div>
      )}

      {/* Email Step */}
      {state.step === "email" && (
        <form onSubmit={handleSendOTP} className="space-y-3">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-fg-30 mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={state.email}
              onChange={handleEmailChange}
              placeholder="Enter your email address"
              className="w-full px-3 py-2 border border-bd-50 rounded-md bg-bk-50 text-fg-30 placeholder-fg-60 focus:outline-none focus:border-bd-40 text-xs"
              disabled={state.isLoading}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={state.isLoading || !state.email}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            {state.isLoading ? "Sending..." : "Send Verification Code"}
          </Button>
        </form>
      )}

      {/* OTP Step */}
      {state.step === "otp" && (
        <div className="space-y-3">
          {/* Back button */}
          <button
            onClick={handleBackToEmail}
            className="flex items-center text-fg-60 hover:text-fg-30 text-xs font-medium cursor-pointer"
          >
            <svg
              className="w-3 h-3 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to email
          </button>

          <div className="text-center">
            <p className="text-fg-60 text-xs mb-2">
              We sent a 6-digit verification code to
            </p>
            <p className="text-fg-30 text-xs font-medium mb-4">{state.email}</p>
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-3">
            <div>
              <label
                htmlFor="otp"
                className="block text-xs font-medium text-fg-30 mb-2"
              >
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                value={state.otp}
                onChange={handleOTPChange}
                placeholder="000000"
                className="w-full px-3 py-2 border border-bd-50 rounded-md bg-bk-50 text-fg-30 placeholder-fg-60 focus:outline-none focus:border-bd-40 text-center text-lg font-mono tracking-widest"
                disabled={state.isLoading}
                maxLength={6}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={state.isLoading || state.otp.length !== 6}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              {state.isLoading ? "Verifying..." : "Verify & Sign In"}
            </Button>
          </form>

          {/* Resend OTP */}
          <div className="text-center">
            {state.canResend ? (
              <Button
                onClick={handleResendOTP}
                disabled={state.isLoading}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                Resend verification code
              </Button>
            ) : (
              <p className="text-fg-60 text-xs">
                Resend code in {state.countdown}s
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
