"use client";

import PromptInput from "@/modules/home/components/prompt-input";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 text-2xl sm:p-20 bg-bk-50 text-fg-50 font-mono">
      <div></div>
      <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
        <div>hello world from fignna.</div>
        <PromptInput />
      </div>
      <div></div>
    </div>
  );
}
