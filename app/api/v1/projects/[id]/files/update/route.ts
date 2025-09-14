/**
 * V1 Project Files Update API Route
 * Updates only specific files without affecting other files in the project
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { projectQueries, projectIdParamSchema } from "@/lib/db";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Schema for file updates - only files that are actually being changed
const fileUpdatesSchema = z.object({
  files: z.record(z.string(), z.string()), // Only files being updated
  metadata: z
    .object({
      updatedBy: z.string().optional(),
      source: z.enum(["editor", "ai", "manual"]).default("editor"),
    })
    .optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  let id: string | undefined;

  try {
    // Handle both sync and async params
    const resolvedParams = params instanceof Promise ? await params : params;
    id = resolvedParams?.id;

    console.log(
      `[V1 Files Update API] Updating specific files in project ${id}...`
    );

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Files Update API] No session found");
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
    const paramResult = projectIdParamSchema.safeParse({ id });
    if (!paramResult.success) {
      console.log(
        "[V1 Files Update API] Invalid project ID:",
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

    // Validate update data
    const validationResult = fileUpdatesSchema.safeParse(body);
    if (!validationResult.success) {
      console.log(
        "[V1 Files Update API] Invalid update data:",
        validationResult.error
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file update data",
          details: validationResult.error.issues,
          version: "v1",
        },
        { status: 400 }
      );
    }

    const { files: filesToUpdate, metadata } = validationResult.data;

    // CRITICAL SAFETY CHECK: Prevent updating with empty files
    const emptyFiles = Object.entries(filesToUpdate).filter(
      ([path, content]) =>
        typeof content === "string" && content.trim().length === 0
    );

    if (emptyFiles.length > 0) {
      console.error(
        `[V1 Files Update API] BLOCKED: Attempt to update files with empty content for project ${id}:`,
        emptyFiles.map(([path]) => path)
      );
      return NextResponse.json(
        {
          success: false,
          error: "Cannot update files with empty content",
          details: `Empty files detected: ${emptyFiles
            .map(([path]) => path)
            .join(", ")}. Use DELETE endpoint to remove files instead.`,
          version: "v1",
        },
        { status: 400 }
      );
    }

    // Get current project files
    const currentProject = await projectQueries.getFiles(id, session.user.id);

    // Merge only the updated files with existing files
    const updatedFiles = {
      ...currentProject.files, // Keep all existing files
      ...filesToUpdate, // Override only the files being updated
    };

    console.log(
      `[V1 Files Update API] Updating ${
        Object.keys(filesToUpdate).length
      } files out of ${Object.keys(currentProject.files).length} total files`
    );

    // Update project with merged files
    const updatedProject = await projectQueries.updateFiles(
      id,
      session.user.id,
      updatedFiles
    );

    console.log(
      `[V1 Files Update API] Successfully updated files in project ${id}`
    );

    return NextResponse.json({
      success: true,
      data: {
        projectId: updatedProject.id,
        updatedFiles: Object.keys(filesToUpdate),
        totalFiles: Object.keys(updatedFiles).length,
        version: updatedProject.version,
        lastSavedAt: updatedProject.lastSavedAt,
      },
      message: `Updated ${
        Object.keys(filesToUpdate).length
      } files successfully`,
      version: "v1",
    });
  } catch (error) {
    console.error(
      `[V1 Files Update API] Error updating files for project ${id}:`,
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update files",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}
