'use client';

// Import the mesh gradient components
import MeshGradient from '@/components/mesh/mesh';

// Interface for the turning-on widget props
interface TurningOnProps {
  // Main loading message displayed prominently
  title: string;
  // Subtitle or description text shown below the title
  subtitle?: string;
  // Whether to show the loading animation (default: true)
  isVisible?: boolean;
  // Custom styling for the container
  className?: string;
}

// Reusable turning-on widget component with mesh gradient background
export default function TurningOn({
  title,
  subtitle,
  isVisible = true,
  className = ""
}: TurningOnProps) {
  // Don't render anything if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`h-full w-full relative overflow-hidden ${className}`} style={{ minHeight: '100%' }}>
      {/* Beautiful mesh gradient background animation - ensure it fills the container */}
      <div className="absolute inset-0 w-full h-full">
        <MeshGradient />
      </div>

      {/* Loading message overlay with glassmorphism design */}
      <div className="absolute inset-0 flex items-center justify-center z-50">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 px-8 py-6 shadow-2xl">
          <div className="text-center">
            {/* Main loading title */}
            <div className="text-white text-lg font-semibold mb-2">
              {title}
            </div>

            {/* Optional subtitle text */}
            {subtitle && (
              <div className="text-white/70 text-sm">
                {subtitle}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Pre-configured loading states for common scenarios
export const LoadingStates = {
  // Project syncing to cloud sandbox
  SYNCING: {
    title: "Syncing project to cloud sandbox...",
    subtitle: "Uploading your code changes to the virtual machine"
  },

  // Development server restarting
  RESTARTING: {
    title: "Restarting development server...",
    subtitle: "Please wait while we restart your Vite server"
  },

  // Virtual machine setup
  SANDBOX_CREATION: {
    title: "Setting up your virtual machine...",
    subtitle: "Creating a secure cloud environment for your project"
  },

  // General loading state
  LOADING: {
    title: "Loading...",
    subtitle: "Please wait while we prepare your environment"
  },

  // Building project
  BUILDING: {
    title: "Building your project...",
    subtitle: "Compiling and optimizing your application"
  }
};