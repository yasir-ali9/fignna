// Handles project file operations: GET (retrieve files), PUT (update files)


import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  projectQueries,
  versionQueries,
  updateFilesSchema,
  projectIdParamSchema,
} from "@/lib/db";
import { id } from "zod/v4/locales";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;
    console.log(`Files API - Fetching files for project ${id}...`);

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("Files API - No session found");
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
        "Files API - Invalid project ID:",
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

    // Fetch project files
    const projectFiles = await projectQueries.getFiles(id, session.user.id);

    console.log(
      `Files API - Retrieved ${
        Object.keys(projectFiles.files).length
      } files for project ${id}`
    );

    return NextResponse.json({
      success: true,
      data: {
        projectId: projectFiles.id,
        files: projectFiles.files,
        version: projectFiles.version,
        fileCount: Object.keys(projectFiles.files).length,
      },
      message: "Project files retrieved successfully",
      version: "v1",
    });
  } catch (error) {
    console.error(
      `Files API - Error fetching files for project ${id}:`,
      error
    );

    // Handle specific error cases
    if (error instanceof Error && error.message === "Project not found") {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
          version: "v1",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch project files",
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
    const id = resolvedParams.id;
    console.log(`Files API - Updating files for project ${id}...`);

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("Files API - No session found");
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
        "Files API - Invalid project ID:",
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

    // Validate files data
    const validationResult = updateFilesSchema.safeParse(body);
    if (!validationResult.success) {
      console.log(
        "Files API - Invalid files data:",
        validationResult.error
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid files data",
          details: validationResult.error.issues,
          version: "v1",
        },
        { status: 400 }
      );
    }

    // CRITICAL SAFETY CHECK: Prevent mass file overwrites with empty content
    const emptyFiles = Object.entries(validationResult.data.files).filter(
      ([path, content]) =>
        typeof content === "string" && content.trim().length === 0
    );

    // If more than 50% of files are empty, this is likely a dangerous operation
    const totalFiles = Object.keys(validationResult.data.files).length;
    const emptyFileCount = emptyFiles.length;
    const emptyFilePercentage = (emptyFileCount / totalFiles) * 100;

    if (emptyFileCount > 3 || emptyFilePercentage > 50) {
      console.error(
        `Files API - BLOCKED: Dangerous mass file overwrite detected for project ${id}:`,
        {
          totalFiles,
          emptyFiles: emptyFileCount,
          emptyPercentage: emptyFilePercentage.toFixed(1) + "%",
          emptyFilePaths: emptyFiles.map(([path]) => path),
        }
      );
      return NextResponse.json(
        {
          success: false,
          error: "Dangerous mass file overwrite detected",
          details: `${emptyFileCount} out of ${totalFiles} files (${emptyFilePercentage.toFixed(
            1
          )}%) are empty. Use PATCH /files/update endpoint for safer updates.`,
          version: "v1",
        },
        { status: 400 }
      );
    }

    // Update project files
    const updatedProject = await projectQueries.updateFiles(
      id,
      session.user.id,
      validationResult.data.files
    );

    // Create automatic version snapshot for significant changes
    try {
      const fileCount = Object.keys(validationResult.data.files).length;
      if (fileCount > 0) {
        await versionQueries.create({
          projectId: id,
          files: validationResult.data.files,
          dependencies: {}, // Could be extracted from package.json if needed
          message: `Auto-save: Updated ${fileCount} files`,
          changeType: "auto",
        });
        console.log(
          `Files API - Created auto-version for project ${id}`
        );
      }
    } catch (versionError) {
      // Don't fail the file update if version creation fails
      console.warn(
        `Files API - Failed to create auto-version:`,
        versionError
      );
    }

    console.log(
      `Files API - Updated ${
        Object.keys(validationResult.data.files).length
      } files for project ${id}`
    );

    return NextResponse.json({
      success: true,
      data: {
        projectId: updatedProject.id,
        version: updatedProject.version,
        lastSavedAt: updatedProject.lastSavedAt,
        fileCount: Object.keys(validationResult.data.files).length,
      },
      message: "Project files updated successfully",
      version: "v1",
    });
  } catch (error) {
    console.error(
      `Files API - Error updating files for project ${id}:`,
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
        error: "Failed to update project files",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}
