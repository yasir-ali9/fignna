/**
 * V1 Project Version API Route
 * Manages individual project version operations
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { versionQueries } from "@/lib/db";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string; versionId: string }>;
}

const versionIdParamSchema = z.object({
  id: z.string().uuid("Invalid project ID format"),
  versionId: z.string().uuid("Invalid version ID format"),
});

// GET /api/v1/projects/[id]/versions/[versionId] - Get specific version
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id: projectId, versionId } = resolvedParams;
    console.log(
      `[V1 Project Version API] Fetching version ${versionId} for project ${projectId}...`
    );

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Project Version API] No session found");
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
    const paramResult = versionIdParamSchema.safeParse({
      id: projectId,
      versionId,
    });
    if (!paramResult.success) {
      console.log(
        "[V1 Project Version API] Invalid parameters:",
        paramResult.error
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid parameters",
          details: paramResult.error.issues,
          version: "v1",
        },
        { status: 400 }
      );
    }

    // Get version data
    const version = await versionQueries.getById(versionId, session.user.id);

    console.log(
      `[V1 Project Version API] Retrieved version ${version.version} for project ${projectId}`
    );

    return NextResponse.json({
      success: true,
      data: { version },
      message: "Version retrieved successfully",
      version: "v1",
    });
  } catch (error) {
    console.error(
      `[V1 Project Version API] Error fetching version ${params}:`,
      error
    );

    // Handle specific error cases
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        {
          success: false,
          error: "Version not found or access denied",
          version: "v1",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch version",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}
