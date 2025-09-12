/**
 * V1 Chat Generate API Route
 * AI-powered code generation with streaming responses
 */

import { NextRequest, NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { modelsConfig } from "@/lib/config/models.config";

// Import types
import type {
  ConversationState,
  ConversationMessage,
} from "@/lib/types/conversation";
import type { SandboxState } from "@/lib/types/sandbox";
import type { Sandbox } from "@e2b/code-interpreter";

// Global state declarations
declare global {
  var activeSandbox: Sandbox | null;
  var sandboxData: Record<string, unknown> | null;
  var existingFiles: Set<string>;
  var conversationState: ConversationState | null;
  var sandboxState: SandboxState | null;
}

// Initialize AI providers
const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1",
});

const googleGenerativeAI = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to analyze user preferences from conversation history
function analyzeUserPreferences(messages: ConversationMessage[]): {
  commonPatterns: string[];
  preferredEditStyle: "targeted" | "comprehensive";
} {
  const userMessages = messages.filter((m) => m.role === "user");
  const patterns: string[] = [];

  // Count edit-related keywords
  let targetedEditCount = 0;
  let comprehensiveEditCount = 0;

  userMessages.forEach((msg) => {
    const content = msg.content.toLowerCase();

    // Check for targeted edit patterns
    if (
      content.match(
        /\b(update|change|fix|modify|edit|remove|delete)\s+(\w+\s+)?(\w+)\b/
      )
    ) {
      targetedEditCount++;
    }

    // Check for comprehensive edit patterns
    if (content.match(/\b(rebuild|recreate|redesign|overhaul|refactor)\b/)) {
      comprehensiveEditCount++;
    }

    // Extract common request patterns
    if (content.includes("hero")) patterns.push("hero section edits");
    if (content.includes("header")) patterns.push("header modifications");
    if (content.includes("color") || content.includes("style"))
      patterns.push("styling changes");
    if (content.includes("button")) patterns.push("button updates");
    if (content.includes("animation")) patterns.push("animation requests");
  });

  return {
    commonPatterns: [...new Set(patterns)].slice(0, 3), // Top 3 unique patterns
    preferredEditStyle:
      targetedEditCount > comprehensiveEditCount ? "targeted" : "comprehensive",
  };
}

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      model = modelsConfig.defaultModel,
      context,
      isEdit = false,
    } = await request.json();

    console.log("[V1 Chat Generate API] Received request:");
    console.log("[V1 Chat Generate API] - prompt:", prompt);
    console.log("[V1 Chat Generate API] - isEdit:", isEdit);
    console.log(
      "[V1 Chat Generate API] - context.sandboxId:",
      context?.sandboxId
    );
    console.log("[V1 Chat Generate API] - model:", model);

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error: "Prompt is required",
          version: "v1",
        },
        { status: 400 }
      );
    }

    // Initialize conversation state if not exists
    if (!global.conversationState) {
      global.conversationState = {
        conversationId: `conv-${Date.now()}`,
        startedAt: Date.now(),
        lastUpdated: Date.now(),
        context: {
          messages: [],
          edits: [],
          projectEvolution: { majorChanges: [] },
          userPreferences: {},
        },
      };
    }

    // Add user message to conversation history
    const userMessage: ConversationMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      metadata: {
        sandboxId: context?.sandboxId,
      },
    };
    global.conversationState.context.messages.push(userMessage);

    // Clean up old messages to prevent unbounded growth
    if (global.conversationState.context.messages.length > 20) {
      global.conversationState.context.messages =
        global.conversationState.context.messages.slice(-15);
      console.log(
        "[V1 Chat Generate API] Trimmed conversation history to prevent context overflow"
      );
    }

    // Clean up old edits
    if (global.conversationState.context.edits.length > 10) {
      global.conversationState.context.edits =
        global.conversationState.context.edits.slice(-8);
    }

    // Create a stream for real-time updates
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Function to send progress updates
    const sendProgress = async (data: Record<string, unknown>) => {
      const message = `data: ${JSON.stringify({ ...data, version: "v1" })}\n\n`;
      await writer.write(encoder.encode(message));
    };

    // Start processing in background
    (async () => {
      try {
        // Send initial status
        await sendProgress({ type: "status", message: "Initializing AI..." });

        // Build conversation context for system prompt
        let conversationContext = "";
        const currentConversationState = global.conversationState;
        if (
          currentConversationState &&
          currentConversationState.context.messages.length > 1
        ) {
          console.log("[V1 Chat Generate API] Building conversation context");

          conversationContext = `\n\n## Conversation History (Recent)\n`;

          // Include only the last 3 edits to save context
          const recentEdits = currentConversationState.context.edits.slice(-3);
          if (recentEdits.length > 0) {
            conversationContext += `\n### Recent Edits:\n`;
            recentEdits.forEach((edit) => {
              conversationContext += `- "${edit.userRequest}" → ${
                edit.editType
              } (${edit.targetFiles
                .map((f) => f.split("/").pop())
                .join(", ")})\n`;
            });
          }

          // Include recently created files - CRITICAL for preventing duplicates
          const recentMsgs =
            currentConversationState.context.messages.slice(-5);
          const recentlyCreatedFiles: string[] = [];
          recentMsgs.forEach((msg) => {
            if (msg.metadata?.editedFiles) {
              recentlyCreatedFiles.push(...msg.metadata.editedFiles);
            }
          });

          if (recentlyCreatedFiles.length > 0) {
            const uniqueFiles = [...new Set(recentlyCreatedFiles)];
            conversationContext += `\n### 🚨 RECENTLY CREATED/EDITED FILES (DO NOT RECREATE THESE):\n`;
            uniqueFiles.forEach((file) => {
              conversationContext += `- ${file}\n`;
            });
            conversationContext += `\nIf the user mentions any of these components, UPDATE the existing file!\n`;
          }

          // Include only last 5 messages for context
          const recentMessages = recentMsgs;
          if (recentMessages.length > 2) {
            conversationContext += `\n### Recent Messages:\n`;
            recentMessages.slice(0, -1).forEach((msg) => {
              if (msg.role === "user") {
                const truncatedContent =
                  msg.content.length > 100
                    ? msg.content.substring(0, 100) + "..."
                    : msg.content;
                conversationContext += `- "${truncatedContent}"\n`;
              }
            });
          }

          // Include user preferences
          const userPrefs = analyzeUserPreferences(
            currentConversationState.context.messages
          );
          if (userPrefs.commonPatterns.length > 0) {
            conversationContext += `\n### User Preferences:\n`;
            conversationContext += `- Edit style: ${userPrefs.preferredEditStyle}\n`;
          }

          // Limit total conversation context length
          if (conversationContext.length > 2000) {
            conversationContext =
              conversationContext.substring(0, 2000) +
              "\n[Context truncated to prevent length errors]";
          }
        }

        // Build system prompt with conversation awareness
        const systemPrompt = `You are an expert React developer with perfect memory of the conversation. You maintain context across messages and remember generated components and applied code. Generate clean, modern React code for Vite applications.
${conversationContext}

🚨 CRITICAL RULES - YOUR MOST IMPORTANT INSTRUCTIONS:
1. **DO EXACTLY WHAT IS ASKED - NOTHING MORE, NOTHING LESS**
   - Don't add features not requested
   - Don't fix unrelated issues
   - Don't improve things not mentioned
2. **CHECK App.jsx FIRST** - ALWAYS see what components exist before creating new ones
3. **NAVIGATION LIVES IN Header.jsx** - Don't create Nav.jsx if Header exists with nav
4. **USE STANDARD TAILWIND CLASSES ONLY**:
   - ✅ CORRECT: bg-white, text-black, bg-blue-500, bg-gray-100, text-gray-900
   - ❌ WRONG: bg-background, text-foreground, bg-primary, bg-muted, text-secondary
   - Use ONLY classes from the official Tailwind CSS documentation
5. **FILE COUNT LIMITS**:
   - Simple style/text change = 1 file ONLY
   - New component = 2 files MAX (component + parent)
   - If >3 files, YOU'RE DOING TOO MUCH

COMPONENT RELATIONSHIPS (CHECK THESE FIRST):
- Navigation usually lives INSIDE Header.jsx, not separate Nav.jsx
- Logo is typically in Header, not standalone
- Footer often contains nav links already
- Menu/Hamburger is part of Header, not separate

PACKAGE USAGE RULES:
- DO NOT use react-router-dom unless user explicitly asks for routing
- For simple nav links in a single-page app, use scroll-to-section or href="#"
- Only add routing if building a multi-page application
- Common packages are auto-installed from your imports

WEBSITE CLONING REQUIREMENTS:
When recreating/cloning a website, you MUST include:
1. **Header with Navigation** - Usually Header.jsx containing nav
2. **Hero Section** - The main landing area (Hero.jsx)
3. **Main Content Sections** - Features, Services, About, etc.
4. **Footer** - Contact info, links, copyright (Footer.jsx)
5. **App.jsx** - Main app component that imports and uses all components

${
  isEdit
    ? `CRITICAL: THIS IS AN EDIT TO AN EXISTING APPLICATION

YOU MUST FOLLOW THESE EDIT RULES:
0. NEVER create tailwind.config.js, vite.config.js, package.json, or any other config files - they already exist!
1. DO NOT regenerate the entire application
2. DO NOT create files that already exist (like App.jsx, index.css, tailwind.config.js)
3. ONLY edit the EXACT files needed for the requested change - NO MORE, NO LESS
4. If the user says "update the header", ONLY edit the Header component - DO NOT touch Footer, Hero, or any other components
5. If the user says "change the color", ONLY edit the relevant style or component file - DO NOT "improve" other parts
6. If you're unsure which file to edit, choose the SINGLE most specific one related to the request

CRITICAL FILE MODIFICATION RULES - VIOLATION = FAILURE:
- **NEVER TRUNCATE FILES** - Always return COMPLETE files with ALL content
- **NO ELLIPSIS (...)** - Include every single line of code
- **ALL IMPORTS, FUNCTIONS, JSX** must be present
- The file MUST be runnable as-is`
    : `CRITICAL: THIS IS NEW CODE GENERATION

Generate a complete, working React application with:
1. **App.jsx** - Main component that imports and renders all other components
2. **Component files** - Individual .jsx files for each component
3. **Proper imports** - All components must be properly imported
4. **Complete code** - No truncation, no ellipsis, full working code`
}

## OUTPUT FORMAT REQUIREMENTS:

Your response must use this EXACT format for each file:

<file path="src/App.jsx">
[COMPLETE FILE CONTENT HERE - NO TRUNCATION]
</file>

<file path="src/components/Header.jsx">
[COMPLETE FILE CONTENT HERE - NO TRUNCATION]
</file>

## CRITICAL SUCCESS CRITERIA:
- Every file must be COMPLETE and runnable
- Use proper JSX syntax and React patterns
- Include all necessary imports
- Use only standard Tailwind CSS classes
- Follow the conversation context and avoid duplicates
- Make ONLY the changes requested, nothing more

Remember: You are generating production-ready code that will be immediately executed!`;

        // Select AI model based on provider
        let aiModel;
        let actualModel = model;

        const isAnthropic = model.startsWith("anthropic/");
        const isGoogle = model.startsWith("google/");
        const isOpenAI = model.startsWith("openai/gpt-5");
        const isMoonshot = model.startsWith("moonshotai/");

        if (isAnthropic) {
          actualModel = model.replace("anthropic/", "");
          aiModel = anthropic(actualModel);
        } else if (isOpenAI) {
          actualModel = "gpt-5";
          aiModel = openai(actualModel);
        } else if (isGoogle) {
          actualModel = model.replace("google/", "");
          aiModel = googleGenerativeAI(actualModel);
        } else if (isMoonshot) {
          // Moonshot models use Groq for now
          aiModel = groq(model);
        } else {
          // Default fallback - use Groq for other models
          aiModel = groq(model);
        }

        console.log("[V1 Chat Generate API] Using AI model:", model);
        await sendProgress({
          type: "status",
          message: `Using ${model} for code generation...`,
        });

        // Configure streaming options based on model
        const streamOptions = {
          model: aiModel,
          messages: [
            {
              role: "system" as const,
              content: systemPrompt,
            },
            {
              role: "user" as const,
              content: prompt,
            },
          ],
          maxTokens: 4000,
        };

        // Add temperature for non-reasoning models
        if (!model.startsWith("openai/gpt-5")) {
          (streamOptions as Record<string, unknown>).temperature = 0.7;
        }

        // Add reasoning effort for GPT-5 models
        if (isOpenAI) {
          (
            streamOptions as Record<string, unknown>
          ).experimental_providerMetadata = {
            openai: {
              reasoningEffort: "high",
            },
          };
        }

        // Stream the AI response
        const result = streamText(streamOptions);

        // Stream the response and parse in real-time
        let generatedCode = "";
        let conversationalBuffer = "";
        let isInTag = false;

        await sendProgress({ type: "status", message: "Generating code..." });

        for await (const textPart of result.textStream) {
          const text = textPart || "";
          generatedCode += text;

          // Check if we're entering or leaving a tag
          const hasOpenTag =
            /<(file|package|packages|explanation|command|structure|template)\b/.test(
              text
            );
          const hasCloseTag =
            /<\/(file|package|packages|explanation|command|structure|template)>/.test(
              text
            );

          if (hasOpenTag) {
            // Send any buffered conversational text before the tag
            if (conversationalBuffer.trim() && !isInTag) {
              await sendProgress({
                type: "conversation",
                text: conversationalBuffer.trim(),
              });
              conversationalBuffer = "";
            }
            isInTag = true;
          }

          if (hasCloseTag) {
            isInTag = false;
          }

          // If we're not in a tag, buffer as conversational text
          if (!isInTag && !hasOpenTag) {
            conversationalBuffer += text;
          }

          // Stream the raw text for live preview
          await sendProgress({
            type: "stream",
            text: text,
            isInTag: isInTag,
          });
        }

        // Send any remaining conversational text
        if (conversationalBuffer.trim()) {
          await sendProgress({
            type: "conversation",
            text: conversationalBuffer.trim(),
          });
        }

        // Add assistant message to conversation history
        const assistantMessage: ConversationMessage = {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: generatedCode,
          timestamp: Date.now(),
          metadata: {
            sandboxId: context?.sandboxId,
          },
        };
        if (global.conversationState) {
          global.conversationState.context.messages.push(assistantMessage);
          global.conversationState.lastUpdated = Date.now();
        }

        // Send completion
        await sendProgress({
          type: "complete",
          message: "Code generation completed!",
          generatedCode: generatedCode,
          conversationId: global.conversationState?.conversationId,
        });
      } catch (error) {
        console.error("[V1 Chat Generate API] Error:", error);
        await sendProgress({
          type: "error",
          error: (error as Error).message,
        });
      } finally {
        await writer.close();
      }
    })();

    // Return the stream
    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-API-Version": "v1",
      },
    });
  } catch (error) {
    console.error("[V1 Chat Generate API] Error:", error);
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
