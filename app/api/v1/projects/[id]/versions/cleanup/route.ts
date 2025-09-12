/**
 * V1 Project Version Cleanup API Route
 * Manages cleanup of old project versions
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { versionQueries, projectIdParamSchema } from "@/lib/db";

interface RouteParams {
  params: { id: string };
}

// POST /api/v1/projects/[id]/versions/cleanup - Clean up old versions
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const projectId = resolvedParams.id;
    console.log(
      `[V1 Project Version Cleanup API] Cleaning up versions for project ${projectId}...`
    );

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Project Version Cleanup API] No session found");
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
        "[V1 Project Version Cleanup API] Invalid project ID:",
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

    // Parse request body for cleanup options
    const body = await request.json().catch(() => ({}));
    const keepCount = Math.max(parseInt(body.keepCount || "10"), 1);

    // Clean up old versions
    const result = await versionQueries.cleanup(
      projectId,
      session.user.id,
      keepCount
    );

    console.log(
      `[V1 Project Version Cleanup API] Cleaned up ${result.deletedCount} versions for project ${projectId}, keeping ${keepCount} most recent`
    );

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
        keptCount: keepCount,
      },
      message: `Cleaned up ${result.deletedCount} old versions, kept ${keepCount} most recent`,
      version: "v1",
    });
  } catch (error) {
    console.error(
      `[V1 Project Version Cleanup API] Error cleaning up versions for project ${params}:`,
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
        error: "Failed to cleanup versions",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}
