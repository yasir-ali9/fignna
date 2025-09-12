/**
 * V1 Individual Chat API Route
 * Handles single chat operations: GET, PUT, DELETE
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  chatQueries,
  updateChatSchema,
  projectIdParamSchema,
  chatIdParamSchema,
} from "@/lib/db";

interface RouteParams {
  params: { id: string; chatId: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id: projectId, chatId } = resolvedParams;
    console.log(
      `[V1 Chat API] Fetching chat ${chatId} for project ${projectId}...`
    );

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Chat API] No session found");
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

    // Fetch the chat
    const chat = await chatQueries.getById(chatId, session.user.id);

    // Verify chat belongs to the specified project
    if (chat.projectId !== projectId) {
      return NextResponse.json(
        {
          success: false,
          error: "Chat does not belong to this project",
          version: "v1",
        },
        { status: 400 }
      );
    }

    console.log(
      `[V1 Chat API] Retrieved chat ${chat.id} for project ${projectId}`
    );

    return NextResponse.json({
      success: true,
      data: { chat },
      message: "Chat retrieved successfully",
      version: "v1",
    });
  } catch (error) {
    console.error(`[V1 Chat API] Error fetching chat:`, error);

    // Handle specific error cases
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        {
          success: false,
          error: "Chat not found or access denied",
          version: "v1",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch chat",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id: projectId, chatId } = resolvedParams;
    console.log(
      `[V1 Chat API] Updating chat ${chatId} for project ${projectId}...`
    );

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Chat API] No session found");
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
    const body = await request.json();

    // Validate update data
    const validationResult = updateChatSchema.safeParse(body);
    if (!validationResult.success) {
      console.log("[V1 Chat API] Invalid update data:", validationResult.error);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid chat data",
          details: validationResult.error.issues,
          version: "v1",
        },
        { status: 400 }
      );
    }

    // Update the chat
    const chat = await chatQueries.update(
      chatId,
      session.user.id,
      validationResult.data
    );

    console.log(
      `[V1 Chat API] Updated chat ${chat.id} for project ${projectId}`
    );

    return NextResponse.json({
      success: true,
      data: { chat },
      message: "Chat updated successfully",
      version: "v1",
    });
  } catch (error) {
    console.error(`[V1 Chat API] Error updating chat:`, error);

    // Handle specific error cases
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        {
          success: false,
          error: "Chat not found or access denied",
          version: "v1",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update chat",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id: projectId, chatId } = resolvedParams;
    console.log(
      `[V1 Chat API] Deleting chat ${chatId} for project ${projectId}...`
    );

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Chat API] No session found");
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

    // Delete the chat
    const deletedChat = await chatQueries.delete(chatId, session.user.id);

    console.log(
      `[V1 Chat API] Deleted chat ${deletedChat.id} for project ${projectId}`
    );

    return NextResponse.json({
      success: true,
      data: {
        chat: {
          id: deletedChat.id,
          name: deletedChat.name,
        },
      },
      message: "Chat deleted successfully",
      version: "v1",
    });
  } catch (error) {
    console.error(`[V1 Chat API] Error deleting chat:`, error);

    // Handle specific error cases
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        {
          success: false,
          error: "Chat not found or access denied",
          version: "v1",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete chat",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}
