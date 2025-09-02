"use client";

import { useTheme } from "@/components/context/theme-context";
import { Toggle } from "@/components/common/toggle";

// Theme demonstration page showcasing all color variables and components
export default function ThemePage() {
  const { theme } = useTheme();

  // Color swatches data for demonstration
  const colorCategories = [
    {
      name: "Background (bk)",
      prefix: "bk",
      description: "Background colors for surfaces and containers",
    },
    {
      name: "Foreground (fg)",
      prefix: "fg",
      description: "Text and icon colors",
    },
    {
      name: "Border (bd)",
      prefix: "bd",
      description: "Border and divider colors",
    },
    {
      name: "Accent (ac)",
      prefix: "ac",
      description: "Primary action and highlight colors",
    },
  ];

  const variants = ["30", "40", "50", "60", "70"];

  return (
    <div className="min-h-screen bg-bk-50 text-fg-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header section with theme toggle */}
        <header className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-fg-50 mb-2">
                Theme System
              </h1>
              <p className="text-fg-60">
                Current theme: <span className="font-semibold">{theme}</span>
              </p>
            </div>
            <Toggle />
          </div>
          <div className="h-px bg-bd-50"></div>
        </header>

        {/* Color swatches section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-fg-50 mb-6">
            Color Variables
          </h2>
          <div className="grid gap-8">
            {colorCategories.map((category) => (
              <div key={category.prefix} className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium text-fg-50">
                    {category.name}
                  </h3>
                  <p className="text-fg-60 text-sm">{category.description}</p>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {variants.map((variant) => (
                    <div
                      key={variant}
                      className="space-y-2 p-4 rounded-lg border border-bd-50"
                    >
                      {category.prefix === "fg" ? (
                        <div className="w-full h-16 rounded-md bg-bk-40 border border-bd-50 flex items-center justify-center">
                          <span
                            className={`text-${category.prefix}-${variant} font-semibold`}
                          >
                            fignna
                          </span>
                        </div>
                      ) : category.prefix === "bd" &&
                        variant !== "50" ? null : (
                        <div
                          className={`w-full h-16 rounded-md ${
                            category.prefix === "bd"
                              ? `bg-bk-40 border-2 border-${category.prefix}-${variant}`
                              : `bg-${category.prefix}-${variant} border border-bd-50`
                          }`}
                        ></div>
                      )}
                      {(category.prefix !== "bd" || variant === "50") && (
                        <div className="text-center">
                          <p className="text-sm font-mono text-fg-60">
                            {category.prefix}-{variant}
                          </p>
                          <p className="text-xs text-fg-70">
                            {category.prefix === "fg"
                              ? "text"
                              : category.prefix === "bd"
                              ? "border"
                              : "bg"}
                            -{category.prefix}-{variant}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography samples */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-fg-50 mb-6">
            Typography Samples
          </h2>
          <div className="space-y-6 p-6 bg-bk-40 rounded-lg border border-bd-50">
            <h1 className="text-4xl font-bold text-fg-50">
              Heading 1 - Main Title
            </h1>
            <h2 className="text-3xl font-semibold text-fg-50">
              Heading 2 - Section Title
            </h2>
            <h3 className="text-2xl font-medium text-fg-50">
              Heading 3 - Subsection
            </h3>
            <p className="text-base text-fg-50">
              Regular paragraph text with normal weight and standard line height
              for optimal readability.
            </p>
            <p className="text-sm text-fg-60">
              Secondary text with reduced opacity for less important
              information.
            </p>
            <p className="text-xs text-fg-70">
              Small text for captions, footnotes, and metadata.
            </p>
          </div>
        </section>

        {/* Interactive elements */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-fg-50 mb-6">
            Interactive Elements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Primary buttons */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-fg-50">Buttons</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-ac-01 text-white rounded-lg hover:opacity-80 transition-opacity cursor-pointer">
                  Primary Button
                </button>
                <button className="w-full px-4 py-2 bg-bk-60 text-fg-50 border border-bd-50 rounded-lg hover:bg-bk-70 transition-colors cursor-pointer">
                  Secondary Button
                </button>
                <button className="w-full px-4 py-2 text-ac-01 border border-ac-01 rounded-lg hover:bg-ac-01 hover:text-white transition-colors cursor-pointer">
                  Outline Button
                </button>
              </div>
            </div>

            {/* Form elements */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-fg-50">Form Elements</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Text input"
                  className="w-full px-3 py-2 bg-bk-50 text-fg-50 border border-bd-50 rounded-lg focus:border-ac-01 focus:outline-none transition-colors"
                />
                <select className="w-full px-3 py-2 bg-bk-50 text-fg-50 border border-bd-50 rounded-lg focus:border-ac-01 focus:outline-none transition-colors">
                  <option>Select option</option>
                  <option>Option 1</option>
                  <option>Option 2</option>
                </select>
                <textarea
                  placeholder="Textarea"
                  rows={3}
                  className="w-full px-3 py-2 bg-bk-50 text-fg-50 border border-bd-50 rounded-lg focus:border-ac-01 focus:outline-none transition-colors resize-none"
                ></textarea>
              </div>
            </div>

            {/* Cards and surfaces */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-fg-50">Cards</h3>
              <div className="space-y-3">
                <div className="p-4 bg-bk-40 border border-bd-50 rounded-lg">
                  <h4 className="font-medium text-fg-50 mb-2">Card Title</h4>
                  <p className="text-sm text-fg-60">
                    Card content with secondary text color.
                  </p>
                </div>
                <div className="p-4 bg-bk-30 border border-bd-40 rounded-lg">
                  <h4 className="font-medium text-fg-50 mb-2">Elevated Card</h4>
                  <p className="text-sm text-fg-60">
                    Higher contrast card surface.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Usage examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-fg-50 mb-6">
            Usage Examples
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-fg-50">CSS Classes</h3>
              <div className="p-4 bg-bk-40 border border-bd-50 rounded-lg font-mono text-sm">
                <div className="space-y-2 text-fg-60">
                  <div>
                    <span className="text-ac-01">bg-bk-50</span> - Background
                  </div>
                  <div>
                    <span className="text-ac-01">text-fg-50</span> - Text color
                  </div>
                  <div>
                    <span className="text-ac-01">border-bd-50</span> - Border
                  </div>
                  <div>
                    <span className="text-ac-01">bg-ac-01</span> - Accent
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-fg-50">CSS Variables</h3>
              <div className="p-4 bg-bk-40 border border-bd-50 rounded-lg font-mono text-sm">
                <div className="space-y-2 text-fg-60">
                  <div>
                    <span className="text-ac-01">--bk-50</span> - RGB values
                  </div>
                  <div>
                    <span className="text-ac-01">--fg-50</span> - RGB values
                  </div>
                  <div>
                    <span className="text-ac-01">--bd-50</span> - RGB values
                  </div>
                  <div>
                    <span className="text-ac-01">--ac-01</span> - RGB values
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-bd-50">
          <p className="text-center text-fg-70 text-sm">
            Theme system demonstration - Toggle between light and dark modes to
            see all variations
          </p>
        </footer>
      </div>
    </div>
  );
}
