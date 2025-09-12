/**
 * V1 Project Versions API Route
 * Manages project version snapshots and history
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { versionQueries, projectIdParamSchema } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/projects/[id]/versions - List project versions
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const projectId = resolvedParams.id;
    console.log(
      `[V1 Project Versions API] Fetching versions for project ${projectId}...`
    );

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Project Versions API] No session found");
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
        "[V1 Project Versions API] Invalid project ID:",
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

    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);

    // Get version history
    const versions = await versionQueries.getHistory(
      projectId,
      session.user.id,
      limit,
      offset
    );

    console.log(
      `[V1 Project Versions API] Found ${versions.length} versions for project ${projectId}`
    );

    return NextResponse.json({
      success: true,
      data: {
        versions,
        pagination: {
          limit,
          offset,
          count: versions.length,
        },
      },
      message: "Project versions retrieved successfully",
      version: "v1",
    });
  } catch (error) {
    console.error(
      `[V1 Project Versions API] Error fetching versions for project ${params}:`,
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
        error: "Failed to fetch project versions",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}

// POST /api/v1/projects/[id]/versions - Create version snapshot
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const projectId = resolvedParams.id;
    console.log(
      `[V1 Project Versions API] Creating version for project ${projectId}...`
    );

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Project Versions API] No session found");
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
        "[V1 Project Versions API] Invalid project ID:",
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
    const validationResult = {
      success: true,
      data: {
        files: body.files || {},
        dependencies: body.dependencies || {},
        message: body.message || "Manual version snapshot",
        changeType: body.changeType || "manual",
      },
    };

    if (!validationResult.success) {
      console.log("[V1 Project Versions API] Invalid request data");
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          version: "v1",
        },
        { status: 400 }
      );
    }

    // Create version snapshot
    const version = await versionQueries.create({
      projectId,
      files: validationResult.data.files,
      dependencies: validationResult.data.dependencies,
      message: validationResult.data.message,
      changeType: validationResult.data.changeType as
        | "manual"
        | "auto"
        | "sync",
    });

    console.log(
      `[V1 Project Versions API] Created version ${version.version} for project ${projectId}`
    );

    return NextResponse.json({
      success: true,
      data: { version },
      message: "Version snapshot created successfully",
      version: "v1",
    });
  } catch (error) {
    console.error(
      `[V1 Project Versions API] Error creating version for project ${params}:`,
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
        error: "Failed to create version snapshot",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}
