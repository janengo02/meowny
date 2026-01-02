import { useState, useMemo } from 'react';
import { Card, Typography, Box, Grid } from '@mui/material';
import { ExpenseBucketCard } from '../../bucket/components/ExpenseBucketCard';
import { DraggableExpenseBucketCard } from '../../bucket/components/DraggableExpenseBucketCard';
import { AddExpenseBucketCard } from '../../bucket/components/AddExpenseBucketCard';
import { BucketModal } from '../../bucket/components/BucketModal';
import { useAppSelector } from '../../../store/hooks';
import {
  selectAccountById,
  selectBucketsByAccount,
} from '../selectors/accountSelectors';
import { AccountCardMenu } from './AccountCardMenu';
import { getColorConfig } from '../../../shared/theme/colors';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  useGetBucketOrderQuery,
  useSaveBucketOrderMutation,
} from '../../dashboard/api/userPreferencesApi';

interface ExpenseAccountCardProps {
  accountId: number;
}

export function ExpenseAccountCard({ accountId }: ExpenseAccountCardProps) {
  const account = useAppSelector((state) =>
    selectAccountById(state, accountId),
  );

  const buckets = useAppSelector((state) =>
    selectBucketsByAccount(state, accountId),
  );

  const [selectedBucketId, setSelectedBucketId] = useState<number | null>(null);
  const [activeBucketId, setActiveBucketId] = useState<number | null>(null);

  // Get bucket order preferences
  const { data: bucketOrderPreference } = useGetBucketOrderQuery();
  const [saveBucketOrder] = useSaveBucketOrderMutation();

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts
      },
    }),
  );

  // Get ordered buckets based on saved preference or default order
  const orderedBuckets = useMemo(() => {
    const savedOrder = bucketOrderPreference?.[accountId];
    if (savedOrder) {
      // Use saved order, filtering out buckets that no longer exist
      const orderedList = savedOrder
        .map((id) => buckets.find((b) => b.id === id))
        .filter((b): b is Bucket => b !== undefined);

      // Add any new buckets that aren't in the saved order
      const newBuckets = buckets.filter((b) => !savedOrder.includes(b.id));

      return [...orderedList, ...newBuckets];
    }

    return buckets;
  }, [buckets, bucketOrderPreference, accountId]);

  if (!account) return null;

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveBucketId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveBucketId(null);

    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = orderedBuckets.findIndex((b) => b.id === active.id);
    const newIndex = orderedBuckets.findIndex((b) => b.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(orderedBuckets, oldIndex, newIndex);
    const newOrderIds = newOrder.map((b) => b.id);

    // Save the new order
    const updatedPreference = {
      ...(bucketOrderPreference || {}),
      [accountId]: newOrderIds,
    };

    saveBucketOrder(updatedPreference);
  };

  const activeBucket = orderedBuckets.find((b) => b.id === activeBucketId);
  const colorConfig = getColorConfig(account.color);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Grid container>
        <Grid size={12}>
          <Card
            sx={{
              px: 1.5,
              py: 1,
              height: '100%',
              backgroundColor: colorConfig.bgColor + '50',
              color: colorConfig.color,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'nowrap',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Typography
                  variant="body1"
                  fontWeight="bold"
                  sx={{
                    color: colorConfig.color,
                  }}
                >
                  {account.name}
                </Typography>

                <SortableContext
                  items={orderedBuckets.map((b) => b.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {orderedBuckets.map((bucket) => (
                    <DraggableExpenseBucketCard
                      key={bucket.id}
                      bucket={bucket}
                      onClick={() => setSelectedBucketId(bucket.id)}
                    />
                  ))}
                </SortableContext>
                <AddExpenseBucketCard account={account} />
              </Box>
              <AccountCardMenu account={account} />
            </Box>
          </Card>
        </Grid>
      </Grid>

      <BucketModal
        bucketId={selectedBucketId}
        open={selectedBucketId !== null}
        onClose={() => setSelectedBucketId(null)}
      />

      <DragOverlay>
        {activeBucket ? (
          <Box sx={{ opacity: 0.95 }}>
            <ExpenseBucketCard bucket={activeBucket} />
          </Box>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
