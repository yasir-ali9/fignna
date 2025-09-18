'use client';

// Function to generate glass bars with consistent width and positioning
const generateGlassBars = () => {
    const bars = [];
    const barWidth = 15; // Consistent width for all bars
    const numberOfBars = Math.ceil(window.innerWidth / barWidth);

    // Create bars array with consistent properties
    for (let i = 0; i < numberOfBars; i++) {
        bars.push({
            id: i,
            width: barWidth,
            left: i * barWidth,
            opacity: 0.2,
        });
    }
    return bars;
};

// Glass bars overlay component with macOS-style vertical glass effects
const GlassBars = () => {
    const glassBars = generateGlassBars();

    return (
        <div 
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 2,
                pointerEvents: 'none'
            }}
        >
            {glassBars.map((bar) => (
                <div
                    key={bar.id}
                    style={{
                        position: 'absolute',
                        left: `${bar.left}px`,
                        top: '0',
                        width: `${bar.width}px`,
                        height: '100%',
                        // Gradient background for glass effect
                        background: `linear-gradient(
                            180deg,
                            rgba(255, 255, 255, ${bar.opacity * 0.6}) 0%,
                            rgba(255, 255, 255, ${bar.opacity * 0.3}) 50%,
                            rgba(255, 255, 255, ${bar.opacity * 0.4}) 100%
                        )`,
                        // Backdrop blur for glass morphism effect
                        backdropFilter: 'blur(8px) saturate(150%)',
                        WebkitBackdropFilter: 'blur(8px) saturate(150%)',
                        border: 'none', // Remove border to eliminate gaps
                        // Performance optimizations
                        transform: 'translateZ(0)', // Hardware acceleration
                        willChange: 'transform',
                        // Inner shadows for depth effect (right side black, left side white)
                        boxShadow: `
                            inset 2px 0 3px rgba(0, 0, 0, 0.15),
                            inset -2px 0 3px rgba(255, 255, 255, 0.25)
                        `,
                    }}
                />
            ))}
        </div>
    );
};

export default GlassBars;