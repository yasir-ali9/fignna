"use client";

interface FilesPanelProps {
  projectData: any;
}

export function FilesPanel({ projectData }: FilesPanelProps) {
  if (!projectData) {
    return (
      <div className="h-full bg-bk-50 p-4 overflow-y-auto">
        <div className="text-center text-fg-60 text-[12px] py-8">
          No project loaded. Create a project to see files here.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-bk-50 p-4 overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-fg-50 text-[14px] font-semibold">
            Project Files
          </h3>
          {projectData && (
            <div className="text-fg-60 text-[11px]">
              {Object.keys(projectData.files || {}).length} files • v
              {projectData.version}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {Object.entries(projectData.files || {}).map(
            ([filePath, content]) => (
              <div
                key={filePath}
                className="bg-bk-40 rounded-lg border border-bd-50"
              >
                <div className="px-3 py-2 border-b border-bd-50 flex items-center justify-between">
                  <span className="text-fg-50 text-[11px] font-mono">
                    {filePath}
                  </span>
                  <span className="text-fg-60 text-[9px]">
                    {(content as string).length} chars
                  </span>
                </div>
                <div className="p-3">
                  <pre className="text-fg-60 text-[9px] font-mono whitespace-pre-wrap overflow-x-auto max-h-32 overflow-y-auto">
                    {(content as string).length > 500
                      ? (content as string).substring(0, 500) + "..."
                      : (content as string)}
                  </pre>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
