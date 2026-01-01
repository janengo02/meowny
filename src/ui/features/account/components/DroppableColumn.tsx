import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Box } from '@mui/material';
import { DraggableAccountCard } from './DraggableAccountCard';

interface DroppableColumnProps {
  columnId: string;
  accountIds: number[];
  columnWidth: number;
  flexBasis: string;
}

export function DroppableColumn({
  columnId,
  accountIds,
  columnWidth,
  flexBasis,
}: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({
    id: columnId,
  });

  return (
    <SortableContext
      id={columnId}
      items={accountIds}
      strategy={verticalListSortingStrategy}
    >
      <Box
        ref={setNodeRef}
        sx={{
          flex: `0 0 ${flexBasis}`,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          minHeight: 100, // Minimum height to allow dropping into empty columns
        }}
      >
        {accountIds.map((accountId) => (
          <DraggableAccountCard
            key={accountId}
            accountId={accountId}
            columnWidth={columnWidth}
          />
        ))}
      </Box>
    </SortableContext>
  );
}
