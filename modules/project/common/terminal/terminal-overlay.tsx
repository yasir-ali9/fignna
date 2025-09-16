'use client';

import { observer } from 'mobx-react-lite';
import { useEditorEngine } from '@/lib/stores/editor/hooks';
import { Terminal } from './terminal';

interface TerminalOverlayProps {
  workspaceId?: string;
}

/**
 * Terminal overlay that appears at the bottom of the canvas
 * Positioned between left and right panels
 * Pushes floating toolbar upward when open
 */
export const TerminalOverlay = observer(({ workspaceId }: TerminalOverlayProps) => {
  const editorEngine = useEditorEngine();

  if (!editorEngine.state.isTerminalOpen) {
    return null;
  }

  return (
    <>
      {/* Terminal Overlay - positioned at bottom of canvas */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-bk-70 border-t border-bd-50 z-20"
        style={{ 
          height: '250px', // Fixed height for now, can be made resizable later
        }}
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between h-8 px-3 bg-bk-70">
          <div className="flex items-center gap-2">
            <TerminalIcon size={14} />
            <span className="text-[11px] font-medium text-fg-30">Terminal</span>
          </div>

          {/* Close button */}
          <button
            onClick={() => editorEngine.state.setTerminalOpen(false)}
            className="p-1 text-fg-60 hover:text-fg-40 transition-colors"
            title="Close terminal"
          >
            <CloseIcon size={12} />
          </button>
        </div>

        {/* Terminal Content */}
        <div className="h-[calc(100%-32px)]">
          <Terminal workspaceId={workspaceId} />
        </div>
      </div>

      {/* Overlay backdrop (optional - for visual separation) */}
      <div 
        className="absolute inset-0 bg-black/5 pointer-events-none z-10"
        style={{
          bottom: '250px', // Don't cover the terminal
        }}
      />
    </>
  );
});

/**
 * Terminal icon component
 */
const TerminalIcon = ({ size = 16 }: { size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 256 256"
    fill="currentColor"
  >
    <g>
      <path d="M216 80v112H40V64h160a16 16 0 0 1 16 16" opacity=".2"/>
      <path d="m117.31 134l-72 64a8 8 0 1 1-10.63-12L100 128L34.69 70a8 8 0 1 1 10.63-12l72 64a8 8 0 0 1 0 12ZM216 184h-96a8 8 0 0 0 0 16h96a8 8 0 0 0 0-16"/>
    </g>
  </svg>
);

/**
 * Close icon component
 */
const CloseIcon = ({ size = 16 }: { size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 256 256"
    fill="currentColor"
  >
    <path d="M205.66 194.34a8 8 0 0 1-11.32 11.32L128 139.31 61.66 205.66a8 8 0 0 1-11.32-11.32L116.69 128 50.34 61.66a8 8 0 0 1 11.32-11.32L128 116.69l66.34-66.35a8 8 0 0 1 11.32 11.32L139.31 128Z"/>
  </svg>
);
