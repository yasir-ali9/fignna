"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/lib/providers/theme-provider";

// Color configurations for light and dark themes
const DARK_THEME_COLORS = {
  gradientStops: [
    { stop: 0, color: "#0a0f1a" }, // Very dark blue/black at top
    { stop: 0.2, color: "#1a2332" }, // Dark blue
    { stop: 0.45, color: "#1e3a8a" }, // Medium blue
    { stop: 0.7, color: "#2563eb" }, // Bright blue
    { stop: 1, color: "#60a5fa" }, // Light blue at bottom
  ],
  waveColors: [
    { r: 96, g: 165, b: 250 }, // Light blue
    { r: 59, g: 130, b: 246 }, // Medium blue
    { r: 37, g: 99, b: 235 }, // Darker blue
    { r: 29, g: 78, b: 216 }, // Deep blue
  ],
  background: "#0a0f1a",
};

const LIGHT_THEME_COLORS = {
  gradientStops: [
    { stop: 0, color: "#f0f4f8" }, // Very light gray at top
    { stop: 0.2, color: "#e1e8ed" }, // Light gray
    { stop: 0.45, color: "#bfdbfe" }, // Light blue
    { stop: 0.7, color: "#93c5fd" }, // Medium blue
    { stop: 1, color: "#60a5fa" }, // Bright blue at bottom
  ],
  waveColors: [
    { r: 147, g: 197, b: 253 }, // Light blue
    { r: 96, g: 165, b: 250 }, // Medium blue
    { r: 59, g: 130, b: 246 }, // Darker blue
    { r: 37, g: 99, b: 235 }, // Deep blue
  ],
  background: "#f0f4f8",
};

// Simple wavy gradient component with bottom-to-top animation
// Creates a smooth gradient that transitions from dark at top to bright at bottom with wavy layers
export default function MeshGradientV2() {
  const { theme } = useTheme();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationId;
    let time = 0;

    // Set canvas size to match window with high DPI support for crisp rendering
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      // Set actual size in memory (scaled to account for extra pixel density)
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // Scale all drawing operations by the dpr
      ctx.scale(dpr, dpr);

      // Set display size (css pixels)
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Animation loop for ultra-smooth, dynamic wavy gradient like WebGL
    const animate = () => {
      time += 0.008; // Smooth, continuous animation like WebGL

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Get theme-specific colors
      const colors = theme === "dark" ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Create smooth gradient from top to bottom based on theme
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      colors.gradientStops.forEach(({ stop, color }) => {
        gradient.addColorStop(stop, color);
      });

      // Fill background with gradient
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Apply heavy blur filter for ultra-smooth edges like WebGL
      ctx.filter = "blur(60px)";

      // Draw multiple smooth wavy layers from bottom to top with dynamic movement
      const waveCount = 15;
      for (let i = 0; i < waveCount; i++) {
        ctx.beginPath();

        // Position waves from bottom to top with better distribution
        const baseY = height - (i * height) / (waveCount + 2);

        // Dynamic layer-specific parameters for varied movement
        const layerSpeed1 = 0.5 + i * 0.1;
        const layerSpeed2 = 0.7 + i * 0.08;
        const layerSpeed3 = 0.9 + i * 0.06;
        const layerSpeed4 = 1.1 + i * 0.05;
        const layerSpeed5 = 0.6 + i * 0.12;

        // Draw ultra-smooth wavy line with dynamic, organic movement
        for (let x = 0; x <= width; x += 1.5) {
          // Multiple sine waves with different frequencies for ultra-dynamic, flowing movement
          // Each wave has its own speed and phase for maximum dynamism
          const wave1 = Math.sin(x * 0.002 + time * layerSpeed1 + i * 0.5) * 90;
          const wave2 =
            Math.sin(x * 0.0015 - time * layerSpeed2 + i * 0.3) * 70;
          const wave3 =
            Math.sin(x * 0.0025 + time * layerSpeed3 + i * 0.7) * 55;
          const wave4 = Math.sin(x * 0.001 - time * layerSpeed4 + i * 0.2) * 60;
          const wave5 = Math.sin(x * 0.003 + time * layerSpeed5 + i * 0.4) * 40;
          const wave6 =
            Math.sin(x * 0.0018 - time * (layerSpeed1 + 0.3) + i * 0.6) * 35;

          const y = baseY + wave1 + wave2 + wave3 + wave4 + wave5 + wave6;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Complete the shape to bottom
        ctx.lineTo(width, height + 150);
        ctx.lineTo(0, height + 150);
        ctx.closePath();

        // Create smooth gradient for this wave layer with professional blending
        const waveGradient = ctx.createLinearGradient(
          0,
          baseY - 300,
          0,
          height
        );
        const opacity = 0.12 - i * 0.007; // Very smooth opacity transitions

        const waveColors = colors.waveColors;
        waveGradient.addColorStop(
          0,
          `rgba(${waveColors[0].r}, ${waveColors[0].g}, ${waveColors[0].b}, ${
            opacity * 0.2
          })`
        );
        waveGradient.addColorStop(
          0.4,
          `rgba(${waveColors[1].r}, ${waveColors[1].g}, ${waveColors[1].b}, ${
            opacity * 0.5
          })`
        );
        waveGradient.addColorStop(
          0.7,
          `rgba(${waveColors[2].r}, ${waveColors[2].g}, ${waveColors[2].b}, ${
            opacity * 0.8
          })`
        );
        waveGradient.addColorStop(
          1,
          `rgba(${waveColors[3].r}, ${waveColors[3].g}, ${waveColors[3].b}, ${opacity})`
        );

        ctx.fillStyle = waveGradient;
        ctx.fill();
      }

      // Reset filter for next frame
      ctx.filter = "none";

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [theme]);

  // Get theme-specific background color
  const colors = theme === "dark" ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        minHeight: "100vh",
        background: colors.background,
      }}
    >
      {/* Canvas for wavy gradient animation */}
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "100vh",
          display: "block",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
}
