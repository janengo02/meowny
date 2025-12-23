import { Grid, Box, Paper, IconButton } from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragIndicator as DragHandleIcon } from '@mui/icons-material';

type DraggableRowProps = {
  row: DashboardRow;
  children: React.ReactNode;
  isDragEnabled: boolean;
};

export function DraggableRow({
  row,
  children,
  isDragEnabled,
}: DraggableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.id,
    disabled: !isDragEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!isDragEnabled) {
    // No drag handle when not in edit mode
    return (
      <Grid container spacing={3}>
        {children}
      </Grid>
    );
  }

  return (
    <Box ref={setNodeRef} style={style} sx={{ position: 'relative' }}>
      {/* Drag Handle */}
      <Paper
        elevation={isDragging ? 8 : 0}
        sx={{
          position: 'absolute',
          left: -48,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          cursor: isDragging ? 'grabbing' : 'grab',
          borderRadius: '8px',
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
            padding: '4px',
          }}
        >
          <DragHandleIcon fontSize="small" />
        </IconButton>
      </Paper>

      {/* Row Content */}
      <Box
        sx={{
          border: isDragEnabled ? '2px dashed' : 'none',
          borderColor: isDragging ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: isDragEnabled ? 2 : 0,
          backgroundColor: isDragging ? 'action.hover' : 'transparent',
          transition: 'all 0.2s',
        }}
      >
        <Grid container spacing={3}>
          {children}
        </Grid>
      </Box>
    </Box>
  );
}
