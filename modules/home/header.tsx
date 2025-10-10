"use client";

import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { useTheme } from "@/lib/providers/theme-provider";
import { authClient } from "@/lib/auth-client";
import { useAuthGuard } from "@/lib/hooks/use-auth-guard";
import { Button } from "@/components/button";
import AuthModal from "@/modules/auth/auth-modal";
import { Logo, LogoText } from "@/components/logo";
import Badge from "@/components/badge";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Home page header component with conditional auth display
const Header = observer(() => {
  // Get theme context and router for navigation
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // Get current session status
  const { data: session, isPending } = authClient.useSession();

  // Auth guard hook for sign in button
  const authGuard = useAuthGuard() as any;

  // Use original image URL without enhancement
  const imageUrl = session?.user?.image || null;

  // Track image loading errors
  const [imageError, setImageError] = useState(false);

  // Reset image error when URL changes
  React.useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  // Handle successful authentication
  const handleAuthSuccess = () => {
    authGuard._handleAuthSuccess();
  };

  // Handle sign in button click
  const handleSignInClick = () => {
    authGuard.openAuthModal();
  };

  return (
    <>
      <header className="bg-transparent">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Logo */}
            <div className="flex items-center">
              {/* Application logo with theme-aware styling */}
              <button
                className="cursor-pointer hover:opacity-80 transition-opacity focus:outline-none text-fg-70 flex items-center gap-2 relative"
                aria-label="Go to home page"
                onClick={() => router.push("/")}
              >
                <Logo className="w-6 h-6" />
                <LogoText className="h-8 pt-1" />

                {/* Beta badge positioned in top-right of logo text */}
                <Badge
                  variant="default"
                  size="xs"
                  className="absolute -right-4 translate-x-1/2 -translate-y-1/2"
                >
                  Beta
                </Badge>
              </button>
            </div>

            {/* Right side - Theme toggle and Auth */}
            <div className="flex items-center gap-3">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md hover:bg-bk-50 transition-colors duration-200 cursor-pointer focus:outline-none"
                aria-label={`Switch to ${
                  theme === "light" ? "dark" : "light"
                } theme`}
              >
                {theme === "light" ? (
                  // Moon icon for dark mode
                  <svg
                    className="w-4 h-4 text-fg-60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                ) : (
                  // Sun icon for light mode
                  <svg
                    className="w-4 h-4 text-fg-60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                )}
              </button>

              {/* Conditional Auth Display */}
              {isPending ? (
                // Loading state
                <div className="w-8 h-8 rounded-full bg-bk-50 animate-pulse"></div>
              ) : session?.user ? (
                // Signed in - Show profile picture
                <button
                  className="flex items-center cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
                  aria-label={`User profile menu for ${session.user.name}`}
                  aria-haspopup="true"
                  onClick={() => router.push("/projects")}
                >
                  {imageUrl && !imageError ? (
                    <Image
                      src={imageUrl}
                      alt={session.user.name || "User"}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                      unoptimized={imageUrl.includes("googleusercontent.com")}
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-ac-01 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {session.user.name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                </button>
              ) : (
                // Not signed in - Show sign in button
                <Button
                  onClick={handleSignInClick}
                  variant="secondary"
                  size="sm"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authGuard.showAuthModal}
        onClose={authGuard.closeAuthModal}
        onSuccess={handleAuthSuccess}
        title="Sign in to fignna.com"
      />
    </>
  );
});

// Set display name for debugging
Header.displayName = "Header";

export default Header;
