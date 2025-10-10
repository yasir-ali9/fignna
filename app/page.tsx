"use client";

import Header from "@/modules/home/header";
import PromptInput from "@/modules/home/prompt-input";
import { useTheme } from "@/lib/providers/theme-provider";
import Image from "next/image";
import Badge from "@/components/badge";

// Home page with minimal design matching the mockup
export default function Home() {
  const { theme } = useTheme();

  return (
    <div className="h-screen w-full relative overflow-hidden bg-bk-70">
      {/* Absolute centered background outlined logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Image
          src={
            theme === "dark"
              ? "/svgs/home/logo-outline-dark.svg"
              : "/svgs/home/logo-outline-light.svg"
          }
          alt="Background Logo"
          width={400}
          height={400}
          className="w-96 h-96 md:w-[500px] md:h-[500px] opacity-30"
          priority
        />
      </div>

      {/* Content overlay */}
      <div className="absolute inset-0 z-10 flex flex-col">
        {/* Header */}
        <Header />

        {/* Main content area - bottom aligned */}
        <div className="flex-1 flex flex-col items-center justify-end px-4 pb-8">
          {/* Orange glassy badge */}
          <div className="mb-4">
            <Badge variant="accent" size="sm">
              Introducing Fignna v01
            </Badge>
          </div>

          {/* Hero text */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-medium text-fg-50 mb-3 tracking-tight">
              Build what you imagine.
            </h1>
            <p className="text-fg-60 text-xs tracking-tight">
              Design, Develop, Deploy - In one place.
            </p>
          </div>

          {/* Prompt input */}
          <PromptInput />

          {/* Build with Kiro link */}
          <div className="fixed bottom-6 right-8 hidden md:block">
            <a
              href="https://kiro.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg-70 hover:text-fg-50 text-xs transition-colors cursor-pointer"
            >
              Build with Kiro
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
