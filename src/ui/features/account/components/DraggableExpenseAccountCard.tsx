import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExpenseAccountCard } from './ExpenseAccountCard';

interface DraggableExpenseAccountCardProps {
  accountId: number;
}

export function DraggableExpenseAccountCard({
  accountId,
}: DraggableExpenseAccountCardProps) {
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
      <ExpenseAccountCard accountId={accountId} />
    </div>
  );
}
