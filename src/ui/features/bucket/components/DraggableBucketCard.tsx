import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BucketCard } from './BucketCard';

interface DraggableBucketCardProps {
  bucket: Bucket;
  onClick?: () => void;
}

export function DraggableBucketCard({
  bucket,
  onClick,
}: DraggableBucketCardProps) {
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
      <BucketCard bucket={bucket} onClick={onClick} />
    </div>
  );
}
