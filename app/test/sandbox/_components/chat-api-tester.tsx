"use client";

import { useState } from "react";

interface ChatApiTesterProps {
  onMessage: (text: string, type: "success" | "error" | "info") => void;
}

// Component for testing the V1 chat APIs
export function ChatApiTester({ onMessage }: ChatApiTesterProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prompt, setPrompt] = useState(
    "Create a simple hero section with a title and button"
  );
  const [generatedCode, setGeneratedCode] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Test the generate API
  const testGenerate = async () => {
    setIsGenerating(true);
    setGeneratedCode("");

    try {
      const response = await fetch("/api/v1/code/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: "openai/gpt-4o-mini",
          isEdit: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullCode = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "stream") {
                fullCode += data.text;
                setGeneratedCode(fullCode);
              } else if (data.type === "complete") {
                onMessage(
                  `Code generation completed! Generated ${
                    data.generatedCode?.length || 0
                  } characters`,
                  "success"
                );
              } else if (data.type === "error") {
                onMessage(`Generation error: ${data.error}`, "error");
              } else if (data.type === "status") {
                onMessage(`Status: ${data.message}`, "info");
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      onMessage(`Generate API error: ${error}`, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Test the apply API
  const testApply = async () => {
    if (!generatedCode.trim()) {
      onMessage("No generated code to apply. Generate code first.", "error");
      return;
    }

    setIsApplying(true);

    try {
      const response = await fetch("/api/v1/code/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: generatedCode,
          isEdit: false,
          packages: [],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "start") {
                onMessage(`Starting application: ${data.message}`, "info");
              } else if (data.type === "file-complete") {
                onMessage(`${data.action}: ${data.fileName}`, "success");
              } else if (data.type === "complete") {
                onMessage(
                  `Application completed! Created ${
                    data.results?.filesCreated?.length || 0
                  } files`,
                  "success"
                );
              } else if (data.type === "error") {
                onMessage(`Apply error: ${data.error}`, "error");
              } else if (data.type === "warning") {
                onMessage(`Warning: ${data.message}`, "error");
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      onMessage(`Apply API error: ${error}`, "error");
    } finally {
      setIsApplying(false);
    }
  };

  // Test the analyze API
  const testAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // First we need a mock manifest for testing
      const mockManifest = {
        files: {
          "/home/user/app/src/App.jsx": {
            componentInfo: { name: "App", childComponents: ["Header", "Hero"] },
          },
          "/home/user/app/src/components/Header.jsx": {
            componentInfo: { name: "Header", childComponents: [] },
          },
          "/home/user/app/src/components/Hero.jsx": {
            componentInfo: { name: "Hero", childComponents: [] },
          },
        },
      };

      const response = await fetch("/api/v1/code/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          manifest: mockManifest,
          model: "openai/gpt-4o-mini",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysisResult(data.searchPlan);
        onMessage(`Analysis completed: ${data.searchPlan.editType}`, "success");
      } else {
        onMessage(`Analysis failed: ${data.error}`, "error");
      }
    } catch (error) {
      onMessage(`Analyze API error: ${error}`, "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-3 border-b border-bd-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-fg-50 text-[11px] font-medium">
          Chat API Tester
        </span>
        <div className="w-2 h-2 rounded-full bg-blue-400" />
      </div>

      {/* Prompt Input */}
      <div className="mb-3">
        <label className="block text-[10px] text-fg-60 font-medium mb-1">
          Test Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full px-2 py-1 text-[10px] bg-bk-50 border border-bd-50 rounded resize-none"
          rows={2}
          placeholder="Enter your test prompt..."
        />
      </div>

      {/* API Test Buttons */}
      <div className="space-y-2 mb-3">
        <button
          onClick={testAnalyze}
          disabled={isAnalyzing || !prompt.trim()}
          className="w-full px-3 py-2 text-[11px] bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isAnalyzing
            ? "Analyzing..."
            : "1. Analyze Intent (POST /api/v1/code/analyze)"}
        </button>

        <button
          onClick={testGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full px-3 py-2 text-[11px] bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating
            ? "Generating..."
            : "2. Generate Code (POST /api/v1/code/generate)"}
        </button>

        <button
          onClick={testApply}
          disabled={isApplying || !generatedCode.trim()}
          className="w-full px-3 py-2 text-[11px] bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isApplying
            ? "Applying..."
            : "3. Apply Code (POST /api/v1/code/apply)"}
        </button>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="mb-3 bg-bk-40 rounded-md p-2">
          <div className="text-[10px] text-fg-60 font-medium mb-1">
            Analysis Result
          </div>
          <div className="space-y-1">
            <div className="text-[9px] text-fg-50">
              <span className="text-fg-60">Type:</span>{" "}
              {analysisResult.editType}
            </div>
            <div className="text-[9px] text-fg-50">
              <span className="text-fg-60">Search Terms:</span>{" "}
              {analysisResult.searchTerms?.join(", ")}
            </div>
            <div className="text-[9px] text-fg-50">
              <span className="text-fg-60">Reasoning:</span>{" "}
              {analysisResult.reasoning}
            </div>
          </div>
        </div>
      )}

      {/* Generated Code Preview */}
      {generatedCode && (
        <div className="bg-bk-40 rounded-md p-2">
          <div className="text-[10px] text-fg-60 font-medium mb-1">
            Generated Code Preview
          </div>
          <div className="text-[9px] text-fg-50 font-mono bg-bk-50 rounded px-2 py-1 max-h-32 overflow-y-auto">
            {generatedCode.substring(0, 500)}
            {generatedCode.length > 500 && "..."}
          </div>
          <div className="text-[9px] text-fg-60 mt-1">
            {generatedCode.length} characters generated
          </div>
        </div>
      )}
    </div>
  );
}
