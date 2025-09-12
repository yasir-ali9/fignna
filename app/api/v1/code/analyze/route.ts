/**
 * V1 Chat Analyze API Route
 * Analyzes user intent and creates search plan for targeted edits
 */

import { NextRequest, NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

// Initialize AI providers
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1",
});

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

// Schema for the AI's search plan
const searchPlanSchema = z.object({
  editType: z
    .enum([
      "UPDATE_COMPONENT",
      "ADD_FEATURE",
      "FIX_ISSUE",
      "UPDATE_STYLE",
      "REFACTOR",
      "ADD_DEPENDENCY",
      "REMOVE_ELEMENT",
    ])
    .describe("The type of edit being requested"),

  reasoning: z.string().describe("Explanation of the search strategy"),

  searchTerms: z
    .array(z.string())
    .describe(
      "Specific text to search for (case-insensitive). Be VERY specific - exact button text, class names, etc."
    ),

  regexPatterns: z
    .array(z.string())
    .optional()
    .describe(
      'Regex patterns for finding code structures (e.g., "className=[\\"\\\'].*header.*[\\"\\\']")'
    ),

  fileTypesToSearch: z
    .array(z.string())
    .default([".jsx", ".tsx", ".js", ".ts"])
    .describe("File extensions to search"),

  expectedMatches: z
    .number()
    .min(1)
    .max(10)
    .default(1)
    .describe("Expected number of matches (helps validate search worked)"),

  fallbackSearch: z
    .object({
      terms: z.array(z.string()),
      patterns: z.array(z.string()).optional(),
    })
    .optional()
    .describe("Backup search if primary fails"),
});

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      manifest,
      model = "openai/gpt-4o-mini",
    } = await request.json();

    console.log("[V1 Chat Analyze API] Request received");
    console.log("[V1 Chat Analyze API] Prompt:", prompt);
    console.log("[V1 Chat Analyze API] Model:", model);
    console.log(
      "[V1 Chat Analyze API] Manifest files count:",
      manifest?.files ? Object.keys(manifest.files).length : 0
    );

    if (!prompt || !manifest) {
      return NextResponse.json(
        {
          success: false,
          error: "prompt and manifest are required",
          version: "v1",
        },
        { status: 400 }
      );
    }

    // Create a summary of available files for the AI
    const validFiles = Object.entries(
      manifest.files as Record<string, Record<string, unknown>>
    ).filter(([path]) => {
      // Filter out invalid paths
      return path.includes(".") && !path.match(/\/\d+$/);
    });

    const fileSummary = validFiles
      .map(([path, info]: [string, Record<string, unknown>]) => {
        const componentInfo = info.componentInfo as
          | { name?: string; childComponents?: string[] }
          | undefined;
        const componentName = componentInfo?.name || path.split("/").pop();
        const childComponents =
          componentInfo?.childComponents?.join(", ") || "none";
        return `- ${path} (${componentName}, renders: ${childComponents})`;
      })
      .join("\n");

    console.log("[V1 Chat Analyze API] Valid files found:", validFiles.length);

    if (validFiles.length === 0) {
      console.error("[V1 Chat Analyze API] No valid files found in manifest");
      return NextResponse.json(
        {
          success: false,
          error: "No valid files found in manifest",
          version: "v1",
        },
        { status: 400 }
      );
    }

    console.log("[V1 Chat Analyze API] Analyzing prompt:", prompt);
    console.log(
      "[V1 Chat Analyze API] File summary preview:",
      fileSummary.split("\n").slice(0, 5).join("\n")
    );

    // Select the appropriate AI model based on the request
    let aiModel;
    if (model.startsWith("anthropic/")) {
      aiModel = anthropic(model.replace("anthropic/", ""));
    } else if (model.startsWith("openai/")) {
      if (model.includes("gpt-oss")) {
        aiModel = groq(model);
      } else {
        aiModel = openai(model.replace("openai/", ""));
      }
    } else if (model.startsWith("google/")) {
      const googleModel = createGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY,
      });
      aiModel = googleModel(model.replace("google/", ""));
    } else {
      // Default to OpenAI GPT-4o-mini
      aiModel = openai("gpt-4o-mini");
    }

    console.log("[V1 Chat Analyze API] Using AI model:", model);

    // Use AI to create a search plan
    const result = await generateObject({
      model: aiModel,
      schema: searchPlanSchema,
      messages: [
        {
          role: "system",
          content: `You are an expert at planning code searches. Your job is to create a search strategy to find the exact code that needs to be edited.

DO NOT GUESS which files to edit. Instead, provide specific search terms that will locate the code.

SEARCH STRATEGY RULES:
1. For text changes (e.g., "change 'Start Deploying' to 'Go Now'"):
   - Search for the EXACT text: "Start Deploying"
   
2. For style changes (e.g., "make header black"):
   - Search for component names: "Header", "<header"
   - Search for class names: "header", "navbar"
   - Search for className attributes containing relevant words
   
3. For removing elements (e.g., "remove the deploy button"):
   - Search for the button text or aria-label
   - Search for relevant IDs or data-testids
   
4. For navigation/header issues:
   - Search for: "navigation", "nav", "Header", "navbar"
   - Look for Link components or href attributes
   
5. Be SPECIFIC:
   - Use exact capitalization for user-visible text
   - Include multiple search terms for redundancy
   - Add regex patterns for structural searches

Current project structure for context:
${fileSummary}`,
        },
        {
          role: "user",
          content: `User request: "${prompt}"

Create a search plan to find the exact code that needs to be modified. Include specific search terms and patterns.`,
        },
      ],
    });

    console.log("[V1 Chat Analyze API] Search plan created:", {
      editType: result.object.editType,
      searchTerms: result.object.searchTerms,
      patterns: result.object.regexPatterns?.length || 0,
      reasoning: result.object.reasoning,
    });

    // Return the search plan
    return NextResponse.json({
      success: true,
      searchPlan: result.object,
      version: "v1",
    });
  } catch (error) {
    console.error("[V1 Chat Analyze API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        version: "v1",
      },
      { status: 500 }
    );
  }
}
