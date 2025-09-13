"use client";

import PromptInput from "@/modules/home/components/prompt-input";
import Header from "@/modules/home/components/header";

export default function Home() {
  return (
    <div className="min-h-screen bg-bk-60">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-8">
        <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
          <div className="text-2xl text-fg-50 font-mono">
            hello world from fignna.
          </div>
          <PromptInput />
        </div>
      </div>
    </div>
  );
}
