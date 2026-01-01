import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExpenseBucketCard } from './ExpenseBucketCard';

interface DraggableExpenseBucketCardProps {
  bucket: Bucket;
  onClick?: () => void;
}

export function DraggableExpenseBucketCard({
  bucket,
  onClick,
}: DraggableExpenseBucketCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bucket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ExpenseBucketCard bucket={bucket} onClick={onClick} />
    </div>
  );
}
