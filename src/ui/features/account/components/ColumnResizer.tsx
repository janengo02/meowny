import { useEffect, useState, useCallback } from 'react';
import type { MouseEvent } from 'react';
import { Box } from '@mui/material';

interface ColumnResizerProps {
  onResizeMove: (leftWidth: number, rightWidth: number) => void;
  onResizeEnd: (leftWidth: number, rightWidth: number) => void;
  leftWidth: number;
  rightWidth: number;
  minWidth?: number;
}

export function ColumnResizer({
  onResizeMove,
  onResizeEnd,
  leftWidth,
  rightWidth,
  minWidth = 2,
}: ColumnResizerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startLeftWidth, setStartLeftWidth] = useState(0);
  const [startRightWidth, setStartRightWidth] = useState(0);
  const [currentLeftWidth, setCurrentLeftWidth] = useState(leftWidth);
  const [currentRightWidth, setCurrentRightWidth] = useState(rightWidth);

  const handleMouseDown = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
      setStartX(e.clientX);
      setStartLeftWidth(leftWidth);
      setStartRightWidth(rightWidth);
      setCurrentLeftWidth(leftWidth);
      setCurrentRightWidth(rightWidth);
    },
    [leftWidth, rightWidth],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      e.preventDefault();

      // Calculate how much the mouse has moved
      const deltaX = e.clientX - startX;

      // Get the container to calculate relative movement
      const container = document.querySelector('[data-resizable-container]');
      if (!container) return;

      const containerWidth = container.getBoundingClientRect().width;
      const totalGridUnits = startLeftWidth + startRightWidth;

      // Calculate delta in grid units
      const deltaGridUnits = Math.round(
        (deltaX / containerWidth) * totalGridUnits,
      );

      // Calculate new widths
      let newLeftWidth = startLeftWidth + deltaGridUnits;
      let newRightWidth = startRightWidth - deltaGridUnits;

      // Apply minimum width constraints
      if (newLeftWidth < minWidth) {
        newLeftWidth = minWidth;
        newRightWidth = totalGridUnits - minWidth;
      } else if (newRightWidth < minWidth) {
        newRightWidth = minWidth;
        newLeftWidth = totalGridUnits - minWidth;
      }

      // Only update if widths actually changed
      if (
        newLeftWidth !== currentLeftWidth ||
        newRightWidth !== currentRightWidth
      ) {
        setCurrentLeftWidth(newLeftWidth);
        setCurrentRightWidth(newRightWidth);
        // Call onResizeMove for preview updates
        onResizeMove(newLeftWidth, newRightWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Trigger final resize with current widths
      onResizeEnd(currentLeftWidth, currentRightWidth);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDragging,
    startX,
    startLeftWidth,
    startRightWidth,
    currentLeftWidth,
    currentRightWidth,
    minWidth,
    onResizeMove,
    onResizeEnd,
  ]);

  return (
    <Box
      onMouseDown={handleMouseDown}
      sx={{
        width: '8px',
        marginX: 0.5,
        cursor: 'col-resize',
        flexShrink: 0,
        backgroundColor: isDragging ? 'primary.main' : 'transparent',
        '&:hover': {
          backgroundColor: 'primary.light',
        },
        transition: 'background-color 0.2s',
        position: 'relative',
        zIndex: 10,
        userSelect: 'none',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '2px',
          height: '40px',
          backgroundColor: 'divider',
          borderRadius: '1px',
        },
      }}
    />
  );
}
