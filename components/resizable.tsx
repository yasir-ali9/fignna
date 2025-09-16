'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
  position: 'left' | 'right';
  className?: string;
}

export function ResizablePanel({
  children,
  defaultWidth,
  minWidth = 200,
  maxWidth = 600,
  position,
  className = ''
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Ensure initial width respects viewport constraints
  useEffect(() => {
    const checkAndAdjustWidth = () => {
      if (panelRef.current?.parentElement) {
        const parentWidth = panelRef.current.parentElement.clientWidth;
        const maxAllowedWidth = Math.min(maxWidth, parentWidth * 0.8);
        if (width > maxAllowedWidth) {
          setWidth(Math.max(minWidth, maxAllowedWidth));
        }
      }
    };

    // Check on mount and window resize
    checkAndAdjustWidth();
    window.addEventListener('resize', checkAndAdjustWidth);
    
    return () => window.removeEventListener('resize', checkAndAdjustWidth);
  }, [maxWidth, minWidth, width]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !panelRef.current) return;

    const rect = panelRef.current.getBoundingClientRect();
    const parentRect = panelRef.current.parentElement?.getBoundingClientRect();
    
    if (!parentRect) return;
    
    let newWidth: number;

    if (position === 'left') {
      newWidth = e.clientX - rect.left;
    } else {
      newWidth = rect.right - e.clientX;
    }

    // Ensure the panel doesn't exceed viewport or parent constraints
    const maxAllowedWidth = Math.min(maxWidth, parentRect.width * 0.8); // Max 80% of parent
    newWidth = Math.max(minWidth, Math.min(maxAllowedWidth, newWidth));
    setWidth(newWidth);
  }, [isResizing, minWidth, maxWidth, position]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={panelRef}
      className={`relative bg-bk-50 flex-shrink-0 overflow-hidden ${className}`}
      style={{ 
        width: `${width}px`,
        minWidth: `${minWidth}px`,
        maxWidth: `${maxWidth}px`
      }}
    >
      {children}
      
      {/* Resize handle */}
      <div
        className={`absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-ac-01 transition-colors ${
          position === 'left' ? 'right-0' : 'left-0'
        } ${isResizing ? 'bg-ac-01' : 'bg-transparent'}`}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
