import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AccountCard } from './AccountCard';

interface DraggableAccountCardProps {
  accountId: number;
  columnWidth: number;
  setSelectedBucketId: (bucketId: number | null) => void;
}

export function DraggableAccountCard({
  accountId,
  columnWidth,
  setSelectedBucketId,
}: DraggableAccountCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: accountId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <AccountCard
        accountId={accountId}
        columnWidth={columnWidth}
        setSelectedBucketId={setSelectedBucketId}
      />
    </div>
  );
}
