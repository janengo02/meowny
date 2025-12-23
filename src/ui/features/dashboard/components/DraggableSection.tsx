import { Box, Paper, IconButton } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import { DragIndicator as DragHandleIcon } from '@mui/icons-material';
import type { ReactNode } from 'react';

type DraggableSectionProps = {
  id: string; // Format: "row-id:column-id:section-index"
  children: ReactNode;
  isDragEnabled: boolean;
};

export function DraggableSection({
  id,
  children,
  isDragEnabled,
}: DraggableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      disabled: !isDragEnabled,
    });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!isDragEnabled) {
    return <>{children}</>;
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        position: 'relative',
        opacity: isDragging ? 0.5 : 1,
        transition: 'opacity 0.2s',
        '&:hover .drag-handle': {
          opacity: 1,
        },
      }}
    >
      {/* Drag Handle - outside left, visible on hover */}
      <Paper
        className="drag-handle"
        elevation={isDragging ? 8 : 2}
        sx={{
          position: 'absolute',
          top: 4,
          left: -24,
          zIndex: 10,
          cursor: isDragging ? 'grabbing' : 'grab',
          borderRadius: '3px',
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: isDragging ? 'primary.main' : 'divider',
          opacity: 0,
          transition: 'opacity 0.2s, border-color 0.2s',
          '&:hover': {
            backgroundColor: 'action.hover',
            borderColor: 'primary.main',
          },
        }}
      >
        <IconButton
          size="small"
          {...attributes}
          {...listeners}
          sx={{
            cursor: 'inherit',
            padding: '2px',
            borderRadius: '3px',
            fontSize: '0.75rem',
          }}
        >
          <DragHandleIcon fontSize="inherit" />
        </IconButton>
      </Paper>
      {children}
    </Box>
  );
}
