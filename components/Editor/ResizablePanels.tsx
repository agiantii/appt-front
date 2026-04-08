
import React, { useState, useCallback, useEffect, useRef } from 'react';

interface ResizableLayoutProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  leftOpen: boolean;
  rightOpen: boolean;
}

const ResizableLayout: React.FC<ResizableLayoutProps> = ({ left, center, right, leftOpen, rightOpen }) => {
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(45); // percentage
  const containerRef = useRef<HTMLDivElement>(null);

  const startResizingLeft = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (containerRef.current) {
        const newWidth = Math.max(160, Math.min(450, moveEvent.clientX));
        setLeftWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const startResizingRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const newWidthPx = containerWidth - moveEvent.clientX;
        const newWidthPct = (newWidthPx / containerWidth) * 100;
        setRightWidth(Math.max(20, Math.min(70, newWidthPct)));
      }
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
      {/* Left Sidebar */}
      {leftOpen && (
        <div style={{ width: `${leftWidth}px` }} className="flex-shrink-0 border-r border-border bg-background flex flex-col min-w-0">
          {left}
        </div>
      )}
      
      {/* Left Resizer */}
      {leftOpen && (
        <div 
          onMouseDown={startResizingLeft}
          className="w-1 hover:w-1.5 transition-all cursor-col-resize bg-transparent hover:bg-accent z-20 flex-shrink-0" 
        />
      )}

      {/* Editor Center */}
      <div className="flex-1 min-w-0 flex flex-col bg-card relative">
        {center}
      </div>

      {/* Right Resizer */}
      {rightOpen && (
        <div 
          onMouseDown={startResizingRight}
          className="w-1 hover:w-1.5 transition-all cursor-col-resize bg-transparent hover:bg-accent z-20 flex-shrink-0" 
        />
      )}

      {/* Right Preview */}
      {rightOpen && (
        <div style={{ width: `${rightWidth}%` }} className="flex-shrink-0 border-l border-border bg-card flex flex-col min-w-0">
          {right}
        </div>
      )}
    </div>
  );
};

export default ResizableLayout;
