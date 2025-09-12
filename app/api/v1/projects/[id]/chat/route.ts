/**
 * V1 Project Chat API Route
 * Handles chat listing (GET) and creation (POST) for a specific project
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  chatQueries,
  createChatSchema,
  paginationSchema,
  projectIdParamSchema,
} from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  let projectId: string | undefined;

  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    projectId = resolvedParams.id;
    console.log(
      `[V1 Project Chat API] Fetching chats for project ${projectId}...`
    );

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Project Chat API] No session found");
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          version: "v1",
        },
        { status: 401 }
      );
    }

    // Validate project ID parameter
    const paramResult = projectIdParamSchema.safeParse({ id: projectId });
    if (!paramResult.success) {
      console.log(
        "[V1 Project Chat API] Invalid project ID:",
        paramResult.error
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid project ID",
          details: paramResult.error.issues,
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
        "[V1 Project Chat API] Invalid pagination parameters:",
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

    const { limit } = paginationResult.data;

    // Fetch chats for the project
    const chats = await chatQueries.listByProject(
      projectId,
      session.user.id,
      limit
    );

    console.log(
      `[V1 Project Chat API] Found ${chats.length} chats for project ${projectId}`
    );

    return NextResponse.json({
      success: true,
      data: {
        chats,
        pagination: {
          limit,
          total: chats.length,
        },
      },
      message: "Project chats retrieved successfully",
      version: "v1",
    });
  } catch (error) {
    console.error(
      `[V1 Project Chat API] Error fetching chats for project ${projectId}:`,
      error
    );

    // Handle specific error cases
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found or access denied",
          version: "v1",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch project chats",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  let projectId: string | undefined;

  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    projectId = resolvedParams.id;
    console.log(
      `[V1 Project Chat API] Creating new chat for project ${projectId}...`
    );

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Project Chat API] No session found");
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          version: "v1",
        },
        { status: 401 }
      );
    }

    // Validate project ID parameter
    const paramResult = projectIdParamSchema.safeParse({ id: projectId });
    if (!paramResult.success) {
      console.log(
        "[V1 Project Chat API] Invalid project ID:",
        paramResult.error
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid project ID",
          details: paramResult.error.issues,
          version: "v1",
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request data
    const validationResult = createChatSchema.safeParse({
      ...body,
      projectId, // Add projectId from URL params
    });

    if (!validationResult.success) {
      console.log(
        "[V1 Project Chat API] Invalid chat data:",
        validationResult.error
      );
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

    // Create the chat
    const chat = await chatQueries.createInProject(
      projectId,
      session.user.id,
      validationResult.data.name
    );

    console.log(
      `[V1 Project Chat API] Created chat ${chat.id} for project ${projectId}`
    );

    return NextResponse.json(
      {
        success: true,
        data: { chat },
        message: "Chat created successfully",
        version: "v1",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      `[V1 Project Chat API] Error creating chat for project ${projectId}:`,
      error
    );

    // Handle specific error cases
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found or access denied",
          version: "v1",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create chat",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}
