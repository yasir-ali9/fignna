import { useTheme } from "@/components/context/theme-context";
import { enhanceGoogleImageUrl } from "@/lib/utils";

interface HeaderProps {
  user: {
    name: string;
    image?: string;
    email: string;
  };
}

export default function Header({ user }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const enhancedImageUrl = enhanceGoogleImageUrl(user.image, 96);

  return (
    <header className="bg-bk-40 border-b border-bd-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - App branding */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-fg-70">fignna</h1>
          </div>

          {/* Right side - Theme toggle and User info */}
          <div className="flex items-center gap-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-bk-60 transition-colors duration-200 cursor-pointer"
              aria-label={`Switch to ${
                theme === "light" ? "dark" : "light"
              } theme`}
            >
              {theme === "light" ? (
                // Moon icon for dark mode
                <svg
                  className="w-5 h-5 text-fg-60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              ) : (
                // Sun icon for light mode
                <svg
                  className="w-5 h-5 text-fg-60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              )}
            </button>

            {/* User info */}
            <div className="flex items-center gap-3">
              {/* User name */}
              <span className="text-fg-60 font-medium hidden sm:block">
                {user.name}
              </span>

              {/* Profile picture */}
              <div className="flex items-center">
                {enhancedImageUrl ? (
                  <img
                    src={enhancedImageUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border-2 border-bd-50"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-ac-01 flex items-center justify-center border-2 border-bd-50">
                    <span className="text-white text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
