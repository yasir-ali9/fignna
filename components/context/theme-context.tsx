"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

// Define the theme type and context interface
type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Create the theme context with default values
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

// Theme provider component that manages theme state and persistence
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const initializeTheme = () => {
      try {
        // Check localStorage first
        const savedTheme = localStorage.getItem("theme") as Theme | null;

        if (
          savedTheme &&
          (savedTheme === "light" ||
            savedTheme === "dark" ||
            savedTheme === "system")
        ) {
          setThemeState(savedTheme);
        } else {
          // Fall back to system preference
          const systemPrefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)"
          ).matches;
          const systemTheme: Theme = systemPrefersDark ? "dark" : "light";
          setThemeState(systemTheme);
          localStorage.setItem("theme", systemTheme);
        }
      } catch (error) {
        // If localStorage fails, default to light theme
        console.warn(
          "Failed to access localStorage for theme preference:",
          error
        );
        setThemeState("light");
      }

      setMounted(true);
    };

    initializeTheme();
  }, []);

  // Apply theme to document root when theme changes
  useEffect(() => {
    if (mounted) {
      let actualTheme = theme;

      // Handle system theme
      if (theme === "system") {
        const systemPrefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        actualTheme = systemPrefersDark ? "dark" : "light";
      }

      document.documentElement.setAttribute("data-theme", actualTheme);
    }
  }, [theme, mounted]);

  // Set theme with persistence
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);

    try {
      localStorage.setItem("theme", newTheme);
    } catch (error) {
      console.warn("Failed to save theme preference to localStorage:", error);
    }
  };

  // Toggle between light and dark themes with persistence
  const toggleTheme = () => {
    const newTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme context with error handling
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
