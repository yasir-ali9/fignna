import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { useTheme } from "@/lib/providers/theme-provider";
import { Logo } from "@/components/logo";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Interface for user data passed to header component
interface HeaderProps {
  user: {
    name: string;
    image?: string;
    email: string;
  };
}

// Header component with theme toggle and user profile display
const Header = observer(({ user }: HeaderProps) => {
  // Get theme context and router for navigation
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // Use original image URL without enhancement
  const imageUrl = user.image;

  // Track image loading errors
  const [imageError, setImageError] = useState(false);

  // Reset image error when URL changes
  React.useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  return (
    <header className="bg-bk-60">
      <div className="max-w-6xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Logo */}
          <div className="flex items-center">
            {/* Application logo with theme-aware styling */}
            <button
              className="cursor-pointer hover:opacity-80 transition-opacity focus:outline-none text-fg-70"
              aria-label="Go to home page"
              onClick={() => router.push("/")}
            >
              <Logo className="w-6 h-6" />
            </button>
          </div>

          {/* Right side - Theme toggle and User profile */}
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

            {/* Profile picture with interactive hover state */}
            <button
              className="flex items-center cursor-pointer hover:opacity-80 transition-opacity focus:outline-none"
              aria-label={`User profile menu for ${user.name}`}
              aria-haspopup="true"
            >
              {imageUrl && !imageError ? (
                <Image
                  src={imageUrl}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                  unoptimized={imageUrl.includes("googleusercontent.com")}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-ac-01 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
});

// Set display name for debugging
Header.displayName = "Header";

export default Header;
