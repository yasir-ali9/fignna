'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: TooltipPosition;
  delay?: number;
  disabled?: boolean;
  className?: string;
}

export function Tooltip({
  children,
  content,
  position = 'top',
  delay = 500,
  disabled = false,
  className = ''
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (disabled) return;
    
    setIsVisible(true);
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
    setShowTooltip(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getTooltipClasses = () => {
    const baseClasses = `
      absolute z-[200] px-2 py-1 text-[11px] font-normal text-fg-30 bg-bk-30 border border-bd-50 
      rounded-md shadow-sm backdrop-blur-sm pointer-events-none transition-opacity duration-200
      whitespace-nowrap
    `;

    const positionClasses = {
      'top': 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      'bottom': 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      'left': 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      'right': 'left-full top-1/2 transform -translate-y-1/2 ml-2',
      'top-left': 'bottom-full right-0 mb-2',
      'top-right': 'bottom-full left-0 mb-2',
      'bottom-left': 'top-full right-0 mt-2',
      'bottom-right': 'top-full left-0 mt-2'
    };

    return `${baseClasses} ${positionClasses[position]} ${showTooltip ? 'opacity-100' : 'opacity-0'}`;
  };

  const getArrowClasses = () => {
    const arrowClasses = {
      'top': 'top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-bk-30 drop-shadow-sm',
      'bottom': 'bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-bk-30 drop-shadow-sm',
      'left': 'left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-bk-30 drop-shadow-sm',
      'right': 'right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent border-r-bk-30 drop-shadow-sm',
      'top-left': 'top-full right-2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-bk-30 drop-shadow-sm',
      'top-right': 'top-full left-2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-bk-30 drop-shadow-sm',
      'bottom-left': 'bottom-full right-2 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-bk-30 drop-shadow-sm',
      'bottom-right': 'bottom-full left-2 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-bk-30 drop-shadow-sm'
    };

    return `absolute ${arrowClasses[position]} ${showTooltip ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`;
  };

  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div className={getTooltipClasses()}>
          {content}
          <div className={getArrowClasses()} />
        </div>
      )}
    </div>
  );
}
