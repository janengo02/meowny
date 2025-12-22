import { Box, Paper, IconButton } from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragIndicator as DragHandleIcon } from '@mui/icons-material';
import { ReactNode } from 'react';

type DraggableSectionProps = {
  id: string; // Format: "row-id:column-id"
  children: ReactNode;
  isDragEnabled: boolean;
};

export function DraggableSection({ id, children, isDragEnabled }: DraggableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id,
    disabled: !isDragEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
        minHeight: '100px',
        border: isDragEnabled ? '2px dashed' : 'none',
        borderColor: isOver ? 'primary.main' : isDragging ? 'primary.light' : 'divider',
        borderRadius: 2,
        p: isDragEnabled ? 2 : 0,
        backgroundColor: isOver
          ? 'action.hover'
          : isDragging
            ? 'action.selected'
            : 'transparent',
        transition: 'all 0.2s',
      }}
    >
      {/* Drag Handle - top right corner */}
      <Paper
        elevation={isDragging ? 8 : 0}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 10,
          cursor: isDragging ? 'grabbing' : 'grab',
          borderRadius: '4px',
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
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
          }}
        >
          <DragHandleIcon fontSize="small" />
        </IconButton>
      </Paper>

      {children}
    </Box>
  );
}
