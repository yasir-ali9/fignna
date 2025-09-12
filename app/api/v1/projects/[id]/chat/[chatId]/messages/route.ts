/**
 * V1 Chat Messages API Route
 * Handles message listing (GET) and creation (POST) for a specific chat
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  messageQueries,
  createMessageSchema,
  paginationSchema,
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
      `[V1 Messages API] Fetching messages for chat ${chatId} in project ${projectId}...`
    );

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Messages API] No session found");
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const paginationResult = paginationSchema.safeParse({
      limit: searchParams.get("limit") || undefined,
      offset: searchParams.get("offset") || undefined,
    });

    if (!paginationResult.success) {
      console.log(
        "[V1 Messages API] Invalid pagination parameters:",
        paginationResult.error
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid pagination parameters",
          details: paginationResult.error.issues,
          version: "v1",
        },
        { status: 400 }
      );
    }

    const { limit, offset } = paginationResult.data;

    // Fetch messages for the chat
    const messages = await messageQueries.listByChat(
      chatId,
      session.user.id,
      limit,
      offset
    );

    console.log(
      `[V1 Messages API] Found ${messages.length} messages for chat ${chatId}`
    );

    return NextResponse.json({
      success: true,
      data: {
        messages,
        pagination: {
          limit,
          offset,
          total: messages.length,
        },
      },
      message: "Messages retrieved successfully",
      version: "v1",
    });
  } catch (error) {
    console.error(
      `[V1 Messages API] Error fetching messages for chat ${params.chatId}:`,
      error
    );

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
        error: "Failed to fetch messages",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id: projectId, chatId } = resolvedParams;
    console.log(
      `[V1 Messages API] Creating new message for chat ${chatId} in project ${projectId}...`
    );

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Messages API] No session found");
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

    // Validate request data
    const validationResult = createMessageSchema.safeParse(body);

    if (!validationResult.success) {
      console.log(
        "[V1 Messages API] Invalid message data:",
        validationResult.error
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid message data",
          details: validationResult.error.issues,
          version: "v1",
        },
        { status: 400 }
      );
    }

    // Create the message
    const message = await messageQueries.createInChat(
      chatId,
      session.user.id,
      validationResult.data
    );

    console.log(
      `[V1 Messages API] Created message ${message.id} for chat ${chatId}`
    );

    return NextResponse.json(
      {
        success: true,
        data: { message },
        message: "Message created successfully",
        version: "v1",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      `[V1 Messages API] Error creating message for chat ${params.chatId}:`,
      error
    );

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
        error: "Failed to create message",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}
