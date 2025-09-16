'use client';

import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { Terminal } from './terminal';

interface TerminalPanelProps {
  workspaceId?: string;
}

/**
 * Terminal panel component that shows terminal in a resizable bottom panel
 * Displays terminal icon and other future tabs in the header
 */
export const TerminalPanel = observer(({ workspaceId }: TerminalPanelProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('terminal');
  const [height, setHeight] = useState(250);

  // Handle panel resizing
  const handleResize = (newHeight: number) => {
    setHeight(Math.max(100, Math.min(500, newHeight)));
  };

  // Toggle panel collapse/expand
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div 
      className="flex flex-col bg-bk-70 border-t border-bd-50"
      style={{ height: isCollapsed ? '32px' : `${height}px` }}
    >
      {/* Terminal header with tabs */}
      <div className="flex items-center justify-between h-8 px-3 bg-bk-60 border-b border-bd-50">
        <div className="flex items-center gap-2">
          {/* Terminal tab */}
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-2 px-2 py-1 text-xs rounded transition-colors ${
              activeTab === 'terminal'
                ? 'bg-bk-70 text-fg-30'
                : 'text-fg-60 hover:text-fg-40'
            }`}
          >
            <TerminalIcon size={14} />
            Terminal
          </button>
          
          {/* Future tabs can be added here */}
{/*           
          <button className="flex items-center gap-2 px-2 py-1 text-xs text-fg-60 hover:text-fg-40">
            <OtherIcon size={14} />
            Other Tab
          </button>
          */}
        </div>

        {/* Collapse/expand button */}
        <button
          onClick={toggleCollapse}
          className="p-1 text-fg-60 hover:text-fg-40 transition-colors"
          title={isCollapsed ? 'Expand terminal' : 'Collapse terminal'}
        >
          <ChevronIcon isCollapsed={isCollapsed} />
        </button>
      </div>

      {/* Terminal content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-hidden">
          {activeTab === 'terminal' && <Terminal workspaceId={workspaceId} />}
        </div>
      )}

      {/* Resize handle */}
      {!isCollapsed && (
        <div
          className="h-1 bg-bd-50 cursor-row-resize hover:bg-ac-01 transition-colors"
          onMouseDown={(e) => {
            e.preventDefault();
            const startY = e.clientY;
            const startHeight = height;

            const handleMouseMove = (e: MouseEvent) => {
              const newHeight = startHeight - (e.clientY - startY);
              handleResize(newHeight);
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />
      )}
    </div>
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
 * Chevron icon for collapse/expand
 */
const ChevronIcon = ({ isCollapsed }: { isCollapsed: boolean }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="12" 
    height="12" 
    viewBox="0 0 256 256"
    fill="currentColor"
    className={`transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
  >
    <path d="M213.66 165.66a8 8 0 0 1-11.32 0L128 91.31 53.66 165.66a8 8 0 0 1-11.32-11.32l80-80a8 8 0 0 1 11.32 0l80 80a8 8 0 0 1 0 11.32Z"/>
  </svg>
);
