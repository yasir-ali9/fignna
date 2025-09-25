// Enhanced sandbox status API with intelligent timeout management

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { projectQueries, projectIdParamSchema } from "@/lib/db";
import type { SandboxInfo } from "@/lib/db/schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Enhanced status response interface
interface StatusAPIResponse {
  success: boolean;
  status: "running" | "expired" | "not_found";
  sandbox_info?: {
    sandbox_id: string;
    preview_url: string;
    start_time: string;
    end_time: string;
    remaining_time_minutes: number;
  };
  action_required: "none" | "sync_needed";
  message: string;
  version: string;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  let id: string | undefined;

  try {
    // Handle both sync and async params
    const resolvedParams = params instanceof Promise ? await params : params;
    id = resolvedParams?.id;

    console.log(`Status API - Checking sandbox status for project ${id}...`);

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
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

    // Get project with sandbox info
    const project = await projectQueries.getById(id, session.user.id);

    // Check if project has sandbox info (with fallback to legacy fields)
    if (!project.sandboxInfo) {
      console.log(`Status API - No sandbox_info found for project ${id}`);
      console.log(`Status API - Project data:`, {
        id: project.id,
        name: project.name,
        hasSandboxInfo: !!project.sandboxInfo,
      });

      return NextResponse.json({
        success: true,
        status: "not_found",
        action_required: "sync_needed",
        message:
          "No sandbox information found. Sync required to create sandbox.",
        version: "v1",
      } as StatusAPIResponse);
    }

    const sandboxInfo = project.sandboxInfo as SandboxInfo;
    const currentTime = new Date();
    const endTime = new Date(sandboxInfo.end_time);

    console.log(
      `Status API - Sandbox end time: ${
        sandboxInfo.end_time
      }, Current time: ${currentTime.toISOString()}`
    );

    // Check if sandbox should still be running based on stored end_time
    if (endTime <= currentTime) {
      console.log(`Status API - Sandbox expired for project ${id}`);

      return NextResponse.json({
        success: true,
        status: "expired",
        action_required: "sync_needed",
        message: "Sandbox has expired. Sync required to create new sandbox.",
        version: "v1",
      } as StatusAPIResponse);
    }

    // Sandbox should be running - verify with E2B getInfo()
    console.log(
      `Status API - Verifying sandbox ${sandboxInfo.sandbox_id} with E2B...`
    );

    try {
      // Check if there's an active sandbox in global state
      if (!global.activeSandbox) {
        console.log(
          `Status API - No active sandbox in global state for project ${id}`
        );

        return NextResponse.json({
          success: true,
          status: "expired",
          action_required: "sync_needed",
          message: "Sandbox not found in active state. Sync required.",
          version: "v1",
        } as StatusAPIResponse);
      }

      // Get sandbox info from E2B
      const e2bSandboxInfo = await global.activeSandbox.getInfo();

      console.log(`Status API - E2B sandbox info:`, e2bSandboxInfo);

      // Verify this is the correct sandbox
      if (e2bSandboxInfo.sandboxId !== sandboxInfo.sandbox_id) {
        console.log(
          `Status API - Sandbox ID mismatch. Expected: ${sandboxInfo.sandbox_id}, Got: ${e2bSandboxInfo.sandboxId}`
        );

        return NextResponse.json({
          success: true,
          status: "expired",
          action_required: "sync_needed",
          message: "Sandbox ID mismatch. Sync required.",
          version: "v1",
        } as StatusAPIResponse);
      }

      // Convert E2B Date to ISO string if needed
      const endAtString =
        e2bSandboxInfo.endAt instanceof Date
          ? e2bSandboxInfo.endAt.toISOString()
          : e2bSandboxInfo.endAt;

      // Update database with actual end time from E2B
      const updatedSandboxInfo: SandboxInfo = {
        ...sandboxInfo,
        end_time: endAtString,
      };

      await projectQueries.updateSandboxInfo(
        id,
        session.user.id,
        updatedSandboxInfo
      );

      // Calculate remaining time
      const actualEndTime = new Date(endAtString);
      const remainingTimeMs = actualEndTime.getTime() - currentTime.getTime();
      const remainingTimeMinutes = Math.max(
        0,
        Math.floor(remainingTimeMs / 60000)
      );

      console.log(
        `Status API - Sandbox is running. Remaining time: ${remainingTimeMinutes} minutes`
      );

      return NextResponse.json({
        success: true,
        status: "running",
        sandbox_info: {
          sandbox_id: sandboxInfo.sandbox_id,
          preview_url: sandboxInfo.preview_url,
          start_time: sandboxInfo.start_time,
          end_time: endAtString, // Now guaranteed to be a string
          remaining_time_minutes: remainingTimeMinutes,
        },
        action_required: "none",
        message: `Sandbox is running. ${remainingTimeMinutes} minutes remaining.`,
        version: "v1",
      } as StatusAPIResponse);
    } catch (e2bError) {
      console.error(
        `Status API - E2B getInfo failed for sandbox ${sandboxInfo.sandbox_id}:`,
        e2bError
      );

      // If E2B call fails, assume sandbox is expired
      return NextResponse.json({
        success: true,
        status: "expired",
        action_required: "sync_needed",
        message: "Unable to verify sandbox status with E2B. Sync required.",
        version: "v1",
      } as StatusAPIResponse);
    }
  } catch (error) {
    console.error(
      `Status API - Error checking sandbox status for project ${id}:`,
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to check sandbox status",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}

// POST endpoint to manually update sandbox info (for internal use)
export async function POST(request: NextRequest, { params }: RouteParams) {
  let id: string | undefined;

  try {
    // Handle both sync and async params
    const resolvedParams = params instanceof Promise ? await params : params;
    id = resolvedParams?.id;

    console.log(`Status API - Manual sandbox info update for project ${id}...`);

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
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

    // Parse request body for sandbox info update
    const body = await request.json();
    const { sandbox_info } = body;

    if (!sandbox_info) {
      return NextResponse.json(
        {
          success: false,
          error: "sandbox_info is required",
          version: "v1",
        },
        { status: 400 }
      );
    }

    // Update project with new sandbox info
    await projectQueries.updateSandboxInfo(id, session.user.id, sandbox_info);

    console.log(`Status API - Updated sandbox info for project ${id}`);

    return NextResponse.json({
      success: true,
      message: "Sandbox info updated successfully",
      version: "v1",
    });
  } catch (error) {
    console.error(
      `Status API - Error updating sandbox info for project ${id}:`,
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update sandbox info",
        details: error instanceof Error ? error.message : "Unknown error",
        version: "v1",
      },
      { status: 500 }
    );
  }
}
