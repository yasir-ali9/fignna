import { NextResponse } from "next/server";
import type { Sandbox } from "@e2b/code-interpreter";

// Global sandbox state declaration
declare global {
  var activeSandbox: Sandbox | null;
}

// GET endpoint to fetch sandbox system logs
export async function GET() {
  try {
    // Check if there's an active sandbox
    if (!global.activeSandbox) {
      return NextResponse.json(
        {
          success: false,
          error: "No active sandbox",
          version: "v1",
        },
        { status: 404 }
      );
    }

    console.log("[V1 Sandbox Logs] Fetching Vite dev server logs...");

    // Get the last N lines of the Next.js dev server output and system status
    const result = await global.activeSandbox.runCode(`
import subprocess
import os
import json

# Try to get the Next.js process output and system status
try:
    log_content = []
    
    # Check if there are any Vite processes running
    ps_result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
    vite_processes = [line for line in ps_result.stdout.split('\\n') if 'vite' in line.lower()]
    
    if vite_processes:
        log_content.append("Vite dev server is running")
        # Add process details
        for proc in vite_processes[:3]:  # Limit to first 3 processes
            log_content.append(f"Process: {proc.strip()}")
    else:
        log_content.append("Vite process not found")
    
    # Check system resources
    try:
        # Memory usage
        mem_result = subprocess.run(['free', '-h'], capture_output=True, text=True)
        if mem_result.returncode == 0:
            log_content.append(f"Memory status: {mem_result.stdout.split()[7]} available")
    except:
        pass
    
    # Check disk space
    try:
        disk_result = subprocess.run(['df', '-h', '/home/user/app'], capture_output=True, text=True)
        if disk_result.returncode == 0:
            lines = disk_result.stdout.strip().split('\\n')
            if len(lines) > 1:
                log_content.append(f"Disk usage: {lines[1].split()[4]} used")
    except:
        pass
    
    # Check if port 5173 is in use
    try:
        port_result = subprocess.run(['netstat', '-tlnp'], capture_output=True, text=True)
        if ':5173' in port_result.stdout:
            log_content.append("Port 5173 is active")
        else:
            log_content.append("Port 5173 is not in use")
    except:
        pass
    
    print(json.dumps({
        "hasErrors": len(vite_processes) == 0,
        "logs": log_content,
        "status": "running" if vite_processes else "stopped",
        "processCount": len(vite_processes)
    }))
except Exception as e:
    print(json.dumps({
        "hasErrors": True,
        "logs": [str(e)],
        "status": "error",
        "processCount": 0
    }))
    `);

    try {
      // Parse the JSON output from the Python script
      const output = result.logs?.stdout?.join("") || "{}";
      const logData = JSON.parse(output);
      return NextResponse.json({
        success: true,
        ...logData,
        version: "v1",
      });
    } catch {
      // Fallback if JSON parsing fails
      const output = result.logs?.stdout?.join("") || "No output received";
      return NextResponse.json({
        success: true,
        hasErrors: false,
        logs: [output],
        status: "unknown",
        processCount: 0,
        version: "v1",
      });
    }
  } catch (error) {
    console.error("[V1 Sandbox Logs] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        version: "v1",
      },
      { status: 500 }
    );
  }
}
