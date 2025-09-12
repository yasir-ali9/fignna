/**
 * V1 Projects API Route
 * Handles project listing (GET) and creation (POST) operations
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  projectQueries,
  createProjectSchema,
  paginationSchema,
} from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    console.log("[V1 Projects API] Fetching projects list...");

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Projects API] No session found");
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          version: "v1",
        },
        { status: 401 }
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
        "[V1 Projects API] Invalid pagination parameters:",
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

    // Fetch projects for the user
    const projects = await projectQueries.listByUser(
      session.user.id,
      limit,
      offset
    );

    console.log(
      `[V1 Projects API] Found ${projects.length} projects for user ${session.user.id}`
    );
    console.log(
      "[V1 Projects API] Projects:",
      projects.map((p) => ({ id: p.id, name: p.name, userId: p.userId }))
    );

    return NextResponse.json({
      success: true,
      data: {
        projects,
        pagination: {
          limit,
          offset,
          total: projects.length, // Note: This is just the current page count
        },
      },
      message: "Projects retrieved successfully",
      version: "v1",
    });
  } catch (error) {
    console.error("[V1 Projects API] Error fetching projects:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch projects",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[V1 Projects API] Creating new project...");

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Projects API] No session found");
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          version: "v1",
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request data
    const validationResult = createProjectSchema.safeParse({
      ...body,
      userId: session.user.id, // Add userId from session
    });

    if (!validationResult.success) {
      console.log(
        "[V1 Projects API] Invalid project data:",
        validationResult.error
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid project data",
          details: validationResult.error.issues,
          version: "v1",
        },
        { status: 400 }
      );
    }

    // Create the project
    const project = await projectQueries.create(validationResult.data);

    console.log(
      `[V1 Projects API] Created project ${project.id} for user ${session.user.id}`
    );

    return NextResponse.json(
      {
        success: true,
        data: { project },
        message: "Project created successfully",
        version: "v1",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[V1 Projects API] Error creating project:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create project",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}
