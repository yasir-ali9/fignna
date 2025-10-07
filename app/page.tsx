import MeshGradientV2 from "@/components/mesh/mesh-v2";
import Header from "@/modules/home/header";
import PromptInput from "@/modules/home/prompt-input";

// Home page with mesh gradient animation
export default function Home() {
  return (
    <div className="h-screen w-full relative overflow-hidden">
      {/* Mesh gradient animation background */}
      <MeshGradientV2 />

      {/* Content overlay */}
      <div className="absolute inset-0 z-10 flex flex-col">
        {/* Header */}
        <Header />

        {/* Main content area - aligned to bottom center */}
        <div className="flex-1 flex flex-col items-center justify-end px-4 pb-6">
          {/* Hero text */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-medium text-fg-30 mb-2">
              Your freedom on your app.
            </h1>
            <p className="text-fg-50 text-xs">
              design, develop, deploy - all in one place.
            </p>
          </div>

          {/* Prompt input */}
          <PromptInput />
        </div>

        {/* Build with Kiro link - bottom right (hidden on small devices) */}
        <div className="fixed bottom-6 right-6 hidden md:block">
          <a
            href="https://kiro.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fg-50 hover:text-fg-50 text-xs transition-colors cursor-pointer"
          >
            Build with Kiro
          </a>
        </div>
      </div>
    </div>
  );
}
