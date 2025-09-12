/**
 * V1 Individual Project API Route
 * Handles single project operations: GET, PUT, DELETE
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  projectQueries,
  updateProjectSchema,
  projectIdParamSchema,
} from "@/lib/db";
import { id } from "zod/v4/locales";

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;
    console.log(`[V1 Project API] Fetching project ${id}...`);

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Project API] No session found");
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
      console.log("[V1 Project API] Invalid project ID:", paramResult.error);
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

    // Fetch the project
    const project = await projectQueries.getById(id, session.user.id);

    console.log(
      `[V1 Project API] Retrieved project ${project.id} for user ${session.user.id}`
    );

    return NextResponse.json({
      success: true,
      data: { project },
      message: "Project retrieved successfully",
      version: "v1",
    });
  } catch (error) {
    console.error(
      `[V1 Project API] Error fetching project ${params.id}:`,
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
        error: "Failed to fetch project",
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
    console.log(`[V1 Project API] Updating project ${id}...`);

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Project API] No session found");
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
      console.log("[V1 Project API] Invalid project ID:", paramResult.error);
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
    const validationResult = updateProjectSchema.safeParse(body);
    if (!validationResult.success) {
      console.log(
        "[V1 Project API] Invalid update data:",
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

    // Update the project
    const project = await projectQueries.update(
      id,
      session.user.id,
      validationResult.data
    );

    console.log(
      `[V1 Project API] Updated project ${project.id} for user ${session.user.id}`
    );

    return NextResponse.json({
      success: true,
      data: { project },
      message: "Project updated successfully",
      version: "v1",
    });
  } catch (error) {
    console.error(`[V1 Project API] Error updating project ${id}:`, error);

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
        error: "Failed to update project",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = resolvedParams.id;
    console.log(`[V1 Project API] Deleting project ${id}...`);

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      console.log("[V1 Project API] No session found");
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
      console.log("[V1 Project API] Invalid project ID:", paramResult.error);
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

    // Delete the project (soft delete)
    const deletedProject = await projectQueries.delete(id, session.user.id);

    console.log(
      `[V1 Project API] Deleted project ${deletedProject.id} for user ${session.user.id}`
    );

    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: deletedProject.id,
          name: deletedProject.name,
        },
      },
      message: "Project deleted successfully",
      version: "v1",
    });
  } catch (error) {
    console.error(`[V1 Project API] Error deleting project ${id}:`, error);

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
        error: "Failed to delete project",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}
