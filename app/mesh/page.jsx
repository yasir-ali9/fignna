import MeshGradient from '@/components/mesh/mesh';

// Design preview page showing the TurningOn widget design
export default function MeshPage() {
  return (
    <div className="h-screen w-full relative">
      {/* Beautiful mesh gradient background animation */}
      <MeshGradient />

      {/* Loading message overlay with glassmorphism design */}
      <div className="absolute inset-0 flex items-center justify-center z-50">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 px-8 py-6 shadow-2xl">
          <div className="text-center">
            {/* Main loading title */}
            <div className="text-white text-lg font-semibold mb-2">
              Your virtual machine is turning on...
            </div>

            {/* Optional subtitle text */}
            <div className="text-white/70 text-sm">
              Creating a secure cloud environment for your project
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
