import { Box } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';

export type DropPosition = 'top' | 'bottom' | 'left' | 'right';

type DropZoneProps = {
  id: string;
  position: DropPosition;
  isFirst?: boolean;
  isLast?: boolean;
};

export function DropZone({ id, position }: DropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { position },
  });

  const isHorizontal = position === 'left' || position === 'right';

  // For horizontal drop zones (left/right), show only when hovering
  if (isHorizontal) {
    return (
      <Box
        ref={setNodeRef}
        sx={{
          position: 'absolute',
          ...(position === 'left' && {
            left: -16,
            top: 0,
            bottom: 0,
            width: 32,
          }),
          ...(position === 'right' && {
            right: -16,
            top: 0,
            bottom: 0,
            width: 32,
          }),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
          opacity: isOver ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
      >
        <Box
          sx={{
            width: 4,
            height: '100%',
            backgroundColor: 'primary.main',
            borderRadius: 1,
            boxShadow: isOver ? 3 : 0,
          }}
        />
      </Box>
    );
  }

  // For vertical drop zones (top/bottom), show subtle indicator
  return (
    <Box
      ref={setNodeRef}
      sx={{
        minHeight: isOver ? 32 : 16,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'min-height 0.2s',
        opacity: isOver ? 1 : 0.4,
        my: 0.5,
      }}
    >
      {isOver && (
        <Box
          sx={{
            width: '100%',
            height: 4,
            backgroundColor: 'primary.main',
            borderRadius: 1,
            boxShadow: 2,
          }}
        />
      )}
    </Box>
  );
}
