import { NextResponse } from "next/server";

// Global sandbox state declaration
declare global {
  var activeSandbox: any;
}

// GET endpoint to monitor Next.js project logs and errors
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

    console.log("[V1 Project Logs] Checking Vite project logs and errors...");

    // Check for Vite build errors, import errors, and project issues
    const result = await global.activeSandbox.runCode(
      `
import json
import subprocess
import re
import os

errors = []
warnings = []

# First check for any stored error files
try:
    with open('/tmp/nextjs-errors.json', 'r') as f:
        data = json.load(f)
        errors.extend(data.get('errors', []))
        warnings.extend(data.get('warnings', []))
except:
    pass

# Check Vite process logs for errors
try:
    # Try to get the Vite process PID
    with open('/tmp/vite-process.pid', 'r') as f:
        pid = int(f.read().strip())
    
    # Check if process is still running
    result = subprocess.run(['ps', '-p', str(pid)], capture_output=True, text=True)
    if result.returncode == 0:
        # Process is running
        pass
except:
    pass

# Scan log files for Vite specific errors
try:
    log_files = []
    # Check common log locations
    for root, dirs, files in os.walk('/tmp'):
        for file in files:
            if ('vite' in file.lower() or 'build' in file.lower()) and file.endswith('.log'):
                log_files.append(os.path.join(root, file))
    
    # Also check the app directory for dist build logs
    if os.path.exists('/home/user/app/dist'):
        for root, dirs, files in os.walk('/home/user/app/dist'):
            for file in files:
                if file.endswith('.log'):
                    log_files.append(os.path.join(root, file))
    
    for log_file in log_files[:5]:  # Check up to 5 log files
        try:
            with open(log_file, 'r') as f:
                content = f.read()
                
                # Look for import/module errors
                import_errors = re.findall(r'Module not found: Can\'t resolve \'([^\']*)\' in', content)
                for pkg in import_errors:
                    if not pkg.startswith('.') and not pkg.startswith('/'):
                        # Extract base package name
                        if pkg.startswith('@'):
                            parts = pkg.split('/')
                            final_pkg = '/'.join(parts[:2]) if len(parts) >= 2 else pkg
                        else:
                            final_pkg = pkg.split('/')[0]
                        
                        error_obj = {
                            "type": "npm-missing",
                            "package": final_pkg,
                            "message": f"Module not found: Can't resolve '{pkg}'",
                            "file": "Unknown"
                        }
                        
                        # Avoid duplicates
                        if not any(e.get('package') == error_obj['package'] for e in errors):
                            errors.append(error_obj)
                
                # Look for TypeScript errors
                ts_errors = re.findall(r'Type error: (.+)', content)
                for ts_error in ts_errors[:5]:  # Limit to 5 TS errors
                    error_obj = {
                        "type": "typescript",
                        "message": ts_error.strip(),
                        "file": "Unknown"
                    }
                    if not any(e.get('message') == error_obj['message'] for e in errors):
                        errors.append(error_obj)
                
                # Look for build errors
                build_errors = re.findall(r'Error: (.+)', content)
                for build_error in build_errors[:3]:  # Limit to 3 build errors
                    error_obj = {
                        "type": "build",
                        "message": build_error.strip(),
                        "file": "Unknown"
                    }
                    if not any(e.get('message') == error_obj['message'] for e in errors):
                        errors.append(error_obj)
                
                # Look for warnings
                warning_patterns = re.findall(r'Warning: (.+)', content)
                for warning in warning_patterns[:3]:  # Limit to 3 warnings
                    warning_obj = {
                        "type": "warning",
                        "message": warning.strip(),
                        "file": "Unknown"
                    }
                    if not any(w.get('message') == warning_obj['message'] for w in warnings):
                        warnings.append(warning_obj)
                        
        except Exception as e:
            pass
except Exception as e:
    print(f"Error scanning logs: {e}")

# Check package.json for potential issues
try:
    with open('/home/user/app/package.json', 'r') as f:
        package_data = json.load(f)
        
    # Check if node_modules exists
    if not os.path.exists('/home/user/app/node_modules'):
        errors.append({
            "type": "dependency",
            "message": "node_modules directory not found - run npm install",
            "file": "package.json"
        })
except:
    pass

# Deduplicate errors and warnings
unique_errors = []
seen_error_messages = set()
for error in errors:
    error_key = f"{error.get('type', '')}:{error.get('message', '')}:{error.get('package', '')}"
    if error_key not in seen_error_messages:
        seen_error_messages.add(error_key)
        unique_errors.append(error)

unique_warnings = []
seen_warning_messages = set()
for warning in warnings:
    warning_key = f"{warning.get('type', '')}:{warning.get('message', '')}"
    if warning_key not in seen_warning_messages:
        seen_warning_messages.add(warning_key)
        unique_warnings.append(warning)

print(json.dumps({
    "errors": unique_errors,
    "warnings": unique_warnings,
    "errorCount": len(unique_errors),
    "warningCount": len(unique_warnings)
}))
    `,
      { timeout: 8000 }
    );

    const data = JSON.parse(result.output || '{"errors": [], "warnings": []}');

    return NextResponse.json({
      success: true,
      hasErrors: data.errors.length > 0,
      hasWarnings: data.warnings.length > 0,
      errors: data.errors,
      warnings: data.warnings,
      errorCount: data.errorCount || 0,
      warningCount: data.warningCount || 0,
      version: "v1",
    });
  } catch (error) {
    console.error("[V1 Project Logs] Error:", error);
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
