/**
 * V1 Project Version Comparison API Route
 * Provides version comparison utilities
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { versionQueries, projectIdParamSchema } from "@/lib/db";
import { z } from "zod";

interface RouteParams {
  params: { id: string };
}

const compareRequestSchema = z.object({
  fromVersionId: z.string().uuid("Invalid from version ID format"),
  toVersionId: z.string().uuid("Invalid to version ID format"),
});

// Helper function to compare file contents
function compareFiles(
  fromFiles: Record<string, string>,
  toFiles: Record<string, string>
) {
  const allFiles = new Set([
    ...Object.keys(fromFiles),
    ...Object.keys(toFiles),
  ]);
  const changes: Array<{
    path: string;
    type: "added" | "removed" | "modified" | "unchanged";
    fromSize?: number;
    toSize?: number;
  }> = [];

  for (const filePath of allFiles) {
    const fromContent = fromFiles[filePath];
    const toContent = toFiles[filePath];

    if (!fromContent && toContent) {
      changes.push({
        path: filePath,
        type: "added",
        toSize: toContent.length,
      });
    } else if (fromContent && !toContent) {
      changes.push({
        path: filePath,
        type: "removed",
        fromSize: fromContent.length,
      });
    } else if (fromContent !== toContent) {
      changes.push({
        path: filePath,
        type: "modified",
        fromSize: fromContent.length,
        toSize: toContent.length,
      });
    } else {
      changes.push({
        path: filePath,
        type: "unchanged",
        fromSize: fromContent.length,
        toSize: toContent.length,
      });
    }
  }

  return changes;
}

// POST /api/v1/projects/[id]/versions/compare - Compare two versions
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const projectId = resolvedParams.id;
    console.log(
      `[V1 Project Version Compare API] Comparing versions for project ${projectId}...`
    );

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Project Version Compare API] No session found");
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
        "[V1 Project Version Compare API] Invalid project ID:",
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = compareRequestSchema.safeParse(body);

    if (!validationResult.success) {
      console.log(
        "[V1 Project Version Compare API] Invalid request data:",
        validationResult.error
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validationResult.error.issues,
          version: "v1",
        },
        { status: 400 }
      );
    }

    const { fromVersionId, toVersionId } = validationResult.data;

    // Get both versions
    const [fromVersion, toVersion] = await Promise.all([
      versionQueries.getById(fromVersionId, session.user.id),
      versionQueries.getById(toVersionId, session.user.id),
    ]);

    // Compare files
    const fileChanges = compareFiles(
      fromVersion.files as Record<string, string>,
      toVersion.files as Record<string, string>
    );

    // Calculate statistics
    const stats = {
      totalFiles: fileChanges.length,
      added: fileChanges.filter((c) => c.type === "added").length,
      removed: fileChanges.filter((c) => c.type === "removed").length,
      modified: fileChanges.filter((c) => c.type === "modified").length,
      unchanged: fileChanges.filter((c) => c.type === "unchanged").length,
    };

    console.log(
      `[V1 Project Version Compare API] Compared versions ${fromVersion.version} and ${toVersion.version}: ${stats.modified} modified, ${stats.added} added, ${stats.removed} removed`
    );

    return NextResponse.json({
      success: true,
      data: {
        fromVersion: {
          id: fromVersion.id,
          version: fromVersion.version,
          message: fromVersion.message,
          createdAt: fromVersion.createdAt,
        },
        toVersion: {
          id: toVersion.id,
          version: toVersion.version,
          message: toVersion.message,
          createdAt: toVersion.createdAt,
        },
        changes: fileChanges,
        statistics: stats,
      },
      message: "Version comparison completed successfully",
      version: "v1",
    });
  } catch (error) {
    console.error(
      `[V1 Project Version Compare API] Error comparing versions for project ${params}:`,
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
        error: "Failed to compare versions",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}
