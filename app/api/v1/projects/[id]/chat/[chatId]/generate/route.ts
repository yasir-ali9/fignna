// AI-powered code generation with chat context from database
// Automatically saves user message and AI response to chat

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  messageQueries,
  chatQueries,
  projectIdParamSchema,
  chatIdParamSchema,
} from "@/lib/db";
import { createGroq } from "@ai-sdk/groq";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { modelsConfig } from "@/lib/config/models.config";

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

interface RouteParams {
  params: Promise<{ id: string; chatId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id: projectId, chatId } = resolvedParams;

    console.log(
      `Chat Generate API -  Generating code for chat ${chatId} in project ${projectId}...`
    );

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("Chat Generate API -  No session found");
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          version: "v1",
        },
        { status: 401 }
      );
    }

    // Validate parameters
    const projectParamResult = projectIdParamSchema.safeParse({
      id: projectId,
    });
    const chatParamResult = chatIdParamSchema.safeParse({ id: chatId });

    if (!projectParamResult.success || !chatParamResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid parameters",
          version: "v1",
        },
        { status: 400 }
      );
    }

    // Parse request body
    const {
      prompt,
      model = modelsConfig.defaultModel,
      isEdit = false,
    } = await request.json();

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

    // Verify chat exists and user has access
    const chatData = await chatQueries.getById(chatId, session.user.id);
    if (chatData.projectId !== projectId) {
      return NextResponse.json(
        {
          success: false,
          error: "Chat does not belong to this project",
          version: "v1",
        },
        { status: 400 }
      );
    }

    // Save user message to database
    const userMessage = await messageQueries.createInChat(
      chatId,
      session.user.id,
      {
        role: "user",
        content: prompt,
        metadata: {
          model,
          status: "completed",
        },
      }
    );

    console.log(`Chat Generate API -  Saved user message ${userMessage.id}`);

    // Get conversation context from database
    const contextMessages = await messageQueries.getContextForAI(
      chatId,
      session.user.id,
      15 // Last 15 messages for context
    );

    console.log(
      `Chat Generate API -  Loaded ${contextMessages.length} context messages`
    );

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
      let assistantMessageId: string | null = null;

      try {
        // Send initial status
        await sendProgress({ type: "status", message: "Initializing AI..." });

        // Build conversation context
        let conversationContext = "";
        if (contextMessages.length > 1) {
          conversationContext = `\n\n## Conversation History\n`;

          // Include recent messages (excluding the current one)
          const recentMessages = contextMessages.slice(0, -1);
          if (recentMessages.length > 0) {
            conversationContext += `\n### Recent Messages:\n`;
            recentMessages.forEach((msg) => {
              const truncatedContent =
                msg.content.length > 100
                  ? msg.content.substring(0, 100) + "..."
                  : msg.content;
              conversationContext += `- ${msg.role}: "${truncatedContent}"\n`;
            });
          }

          // Include recently applied files
          const recentlyAppliedFiles: string[] = [];
          recentMessages.forEach((msg) => {
            if (msg.metadata?.appliedFiles) {
              recentlyAppliedFiles.push(...msg.metadata.appliedFiles);
            }
          });

          if (recentlyAppliedFiles.length > 0) {
            const uniqueFiles = [...new Set(recentlyAppliedFiles)];
            conversationContext += `\n### 🚨 RECENTLY CREATED/EDITED FILES (DO NOT RECREATE):\n`;
            uniqueFiles.forEach((file) => {
              conversationContext += `- ${file}\n`;
            });
            conversationContext += `\nIf the user mentions any of these components, UPDATE the existing file!\n`;
          }
        }

        // Build system prompt
        const systemPrompt = `You are an expert React developer with perfect memory of the conversation. You maintain context across messages and remember generated components and applied code. Generate clean, modern React code for Vite applications.
${conversationContext}

🚨 CRITICAL RULES - YOUR MOST IMPORTANT INSTRUCTIONS:
1. **DO EXACTLY WHAT IS ASKED - NOTHING MORE, NOTHING LESS**
2. **USE STANDARD TAILWIND CLASSES ONLY**
3. **CHECK CONVERSATION HISTORY** - Don't recreate existing components
4. **FILE COUNT LIMITS**: Simple changes = 1 file, New component = 2 files MAX

${
  isEdit
    ? `CRITICAL: THIS IS AN EDIT TO AN EXISTING APPLICATION
- DO NOT regenerate the entire application
- ONLY edit the EXACT files needed for the requested change
- NEVER TRUNCATE FILES - Always return COMPLETE files with ALL content`
    : `CRITICAL: THIS IS NEW CODE GENERATION
- Generate a complete, working React application
- Include all necessary imports and proper JSX syntax`
}

## OUTPUT FORMAT REQUIREMENTS:
Your response must use this EXACT format for each file:

<file path="src/App.jsx">
[COMPLETE FILE CONTENT HERE - NO TRUNCATION]
</file>

Remember: You are generating production-ready code that will be immediately executed!`;

        // Select AI model based on provider
        let aiModel;
        let actualModel = model;

        if (model.startsWith("anthropic/")) {
          actualModel = model.replace("anthropic/", "");
          aiModel = anthropic(actualModel);
        } else if (model.startsWith("openai/")) {
          actualModel = model.replace("openai/", "");
          aiModel = openai(actualModel);
        } else if (model.startsWith("google/")) {
          actualModel = model.replace("google/", "");
          aiModel = googleGenerativeAI(actualModel);
        } else if (model.startsWith("moonshotai/")) {
          // Moonshot models use Groq for now
          aiModel = groq(model);
        } else {
          // Default fallback
          aiModel = openai("gpt-4o-mini");
        }

        console.log(`Chat Generate API -  Using AI model: ${model}`);
        await sendProgress({
          type: "status",
          message: `Using ${model} for code generation...`,
        });

        // Create assistant message with pending status
        const assistantMessage = await messageQueries.createInChat(
          chatId,
          session.user.id,
          {
            role: "assistant",
            content: "", // Will be updated with generated content
            metadata: {
              model,
              status: "streaming",
            },
          }
        );
        assistantMessageId = assistantMessage.id;

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
        if (model.startsWith("openai/gpt-5")) {
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

        let generatedCode = "";
        await sendProgress({ type: "status", message: "Generating code..." });

        for await (const textPart of result.textStream) {
          const text = textPart || "";
          generatedCode += text;

          // Stream the raw text for live preview
          await sendProgress({
            type: "stream",
            text: text,
          });
        }

        // Update assistant message with final content
        await messageQueries.update(assistantMessageId, session.user.id, {
          content: generatedCode,
          metadata: {
            model,
            status: "completed",
            generatedCode,
          },
        });

        console.log(
          `Chat Generate API -  Updated assistant message ${assistantMessageId}`
        );

        // Send completion
        await sendProgress({
          type: "complete",
          message: "Code generation completed!",
          generatedCode: generatedCode,
          messageId: assistantMessageId,
        });

        // Auto-save files from sandbox to project database
        try {
          await sendProgress({
            type: "status",
            message: "Saving files to project...",
          });

          const saveResponse = await fetch(
            `${
              process.env.BETTER_AUTH_URL || "http://localhost:3000"
            }/api/v1/projects/${projectId}/save`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Cookie: request.headers.get("cookie") || "",
              },
            }
          );

          if (saveResponse.ok) {
            const saveResult = await saveResponse.json();
            console.log(
              `Chat Generate API -  Auto-saved ${
                saveResult.data?.filesCount || 0
              } files to project`
            );

            await sendProgress({
              type: "status",
              message: `Saved ${
                saveResult.data?.filesCount || 0
              } files to project`,
            });
          } else {
            console.warn(
              "Chat Generate API -  Failed to auto-save files:",
              await saveResponse.text()
            );
          }
        } catch (saveError) {
          console.warn("Chat Generate API -  Auto-save failed:", saveError);
          // Don't fail the entire generation if save fails
        }
      } catch (error) {
        console.error("Chat Generate API -  Error:", error);

        // Update assistant message with error status if it was created
        if (assistantMessageId) {
          try {
            await messageQueries.update(assistantMessageId, session.user.id, {
              metadata: {
                model,
                status: "failed",
                errorMessage: (error as Error).message,
              },
            });
          } catch (updateError) {
            console.error(
              "Chat Generate API -  Failed to update message with error:",
              updateError
            );
          }
        }

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
    console.error("Chat Generate API -  Error:", error);
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
