/**
 * V1 Project Version Restore API Route
 * Restores a project to a specific version
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

// POST /api/v1/projects/[id]/versions/[versionId]/restore - Restore project to version
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { id: projectId, versionId } = resolvedParams;
    console.log(
      `[V1 Project Version Restore API] Restoring project ${projectId} to version ${versionId}...`
    );

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Project Version Restore API] No session found");
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
        "[V1 Project Version Restore API] Invalid parameters:",
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

    // Restore project to version
    const restoredProject = await versionQueries.restore(
      versionId,
      session.user.id
    );

    console.log(
      `[V1 Project Version Restore API] Restored project ${projectId} to version ${versionId}`
    );

    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: restoredProject.id,
          name: restoredProject.name,
          version: restoredProject.version,
          lastSavedAt: restoredProject.lastSavedAt,
          updatedAt: restoredProject.updatedAt,
        },
      },
      message: "Project restored to version successfully",
      version: "v1",
    });
  } catch (error) {
    console.error(
      `[V1 Project Version Restore API] Error restoring version ${params}:`,
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
        error: "Failed to restore version",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}
