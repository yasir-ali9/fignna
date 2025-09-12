import { observer } from "mobx-react-lite";
import { useTheme } from "@/components/context/theme-context";
import { enhanceGoogleImageUrl } from "@/lib/utils";
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

  // Enhance Google profile image URL for better quality
  const enhancedImageUrl = enhanceGoogleImageUrl(user.image, 96);

  return (
    <header className="bg-bk-60">
      <div className="max-w-6xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo */}
          <div className="flex items-center">
            {/* Application logo icon with theme-aware coloring */}
            <button
              className="w-6 h-6 text-fg-60 cursor-pointer hover:text-fg-50 transition-colors focus:outline-none"
              aria-label="Go to home page"
              onClick={() => router.push("/")}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.33898 7.76271L9.33898 6.76271L7.33898 6.76271L7.33898 7.76271L8.33898 7.76271L9.33898 7.76271ZM14.7627 9.11864L14.7627 8.11864L12.7627 8.11864L12.7627 9.11864L13.7627 9.11864L14.7627 9.11864ZM7.29289 6.71662L6.58579 7.42373L8 8.83794L8.70711 8.13084L8 7.42373L7.29289 6.71662ZM13.0556 7.73357L12.3485 8.44068L13.7627 9.85489L14.4698 9.14778L13.7627 8.44068L13.0556 7.73357ZM8.33898 22L9.33898 22L9.33898 7.76271L8.33898 7.76271L7.33898 7.76271L7.33898 22L8.33898 22ZM13.7627 22L14.7627 22L14.7627 9.11864L13.7627 9.11864L12.7627 9.11864L12.7627 22L13.7627 22ZM13.4237 2L12.7166 1.29289L7.29289 6.71662L8 7.42373L8.70711 8.13084L14.1308 2.70711L13.4237 2ZM19.1864 3.01695L18.4793 2.30984L13.0556 7.73357L13.7627 8.44068L14.4698 9.14778L19.8935 3.72406L19.1864 3.01695Z"
                  fill="currentColor"
                />
              </svg>
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
                    strokeWidth={2}
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
                    strokeWidth={2}
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
              {enhancedImageUrl ? (
                <Image
                  src={enhancedImageUrl}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                  unoptimized={enhancedImageUrl.includes(
                    "googleusercontent.com"
                  )}
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
