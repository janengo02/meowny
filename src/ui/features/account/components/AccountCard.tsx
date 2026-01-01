import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { BucketCard } from '../../bucket/components/BucketCard';
import { DraggableBucketCard } from '../../bucket/components/DraggableBucketCard';
import { AddBucketCard } from '../../bucket/components/AddBucketCard';
import { BucketModal } from '../../bucket/components/BucketModal';
import { useAppSelector } from '../../../store/hooks';
import {
  selectAccountById,
  selectBucketsByAccount,
} from '../selectors/accountSelectors';
import {
  useUpdateAccountMutation,
  useDeleteAccountMutation,
} from '../api/accountApi';
import { RenameAccountDialog } from './RenameAccountDialog';
import { DeleteAccountDialog } from './DeleteAccountDialog';
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
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  useGetBucketOrderQuery,
  useSaveBucketOrderMutation,
} from '../../dashboard/api/userPreferencesApi';

interface AccountCardProps {
  accountId: number;
  columnWidth?: number; // Grid units (out of 12) for the parent column
}

export function AccountCard({ accountId, columnWidth = 12 }: AccountCardProps) {
  // Select account data - only re-renders if THIS account changes
  const account = useAppSelector((state) =>
    selectAccountById(state, accountId),
  );

  // Select buckets for THIS account - only re-renders if THIS account's buckets change
  const buckets = useAppSelector((state) =>
    selectBucketsByAccount(state, accountId),
  );

  const [selectedBucketId, setSelectedBucketId] = useState<number | null>(null);
  const [activeBucketId, setActiveBucketId] = useState<number | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Get bucket order preferences
  const { data: bucketOrderPreference } = useGetBucketOrderQuery();
  const [saveBucketOrder] = useSaveBucketOrderMutation();
  const [updateAccount] = useUpdateAccountMutation();
  const [deleteAccount] = useDeleteAccountMutation();

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

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRenameClick = () => {
    handleMenuClose();
    setIsRenameDialogOpen(true);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setIsDeleteDialogOpen(true);
  };

  const handleRename = async (newName: string) => {
    try {
      await updateAccount({
        id: accountId,
        params: { name: newName },
      }).unwrap();
      setIsRenameDialogOpen(false);
    } catch (error) {
      console.error('Failed to rename account:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAccount(accountId).unwrap();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

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

  // Calculate bucket card size based on column width
  // For narrow columns (< 6 grid units), use full width
  // For medium columns (6-8 grid units), use half width
  // For wide columns (> 8 grid units), use smaller cards
  const getBucketCardSize = () => {
    switch (columnWidth) {
      case 12:
        return { xs: 6, sm: 4, md: 2 };
      case 11:
      case 10:
      case 9:
      case 8:
        return { xs: 12, sm: 6, md: 3 };
      case 7:
      case 6:
        return { xs: 12, sm: 6, md: 4 };
      case 5:
      case 4:
        return { xs: 12, sm: 6 };
      case 3:
      case 2:
      case 1:
      default:
        return { xs: 12 };
    }
  };

  const bucketCardSize = getBucketCardSize();

  const activeBucket = orderedBuckets.find((b) => b.id === activeBucketId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Card>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h4" gutterBottom>
              {account.name}
            </Typography>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              aria-label="account options"
            >
              <MoreVertIcon sx={{ fontSize: '0.75rem' }} />
            </IconButton>
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleRenameClick}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Rename</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleDeleteClick}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </Menu>

          <SortableContext
            items={orderedBuckets.map((b) => b.id)}
            strategy={rectSortingStrategy}
          >
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {orderedBuckets.map((bucket) => (
                <Grid key={bucket.id} size={bucketCardSize}>
                  <DraggableBucketCard
                    bucket={bucket}
                    onClick={() => setSelectedBucketId(bucket.id)}
                  />
                </Grid>
              ))}
              <Grid size={bucketCardSize}>
                <AddBucketCard account={account} />
              </Grid>
            </Grid>
          </SortableContext>
        </CardContent>

        <BucketModal
          bucketId={selectedBucketId}
          open={selectedBucketId !== null}
          onClose={() => setSelectedBucketId(null)}
        />
      </Card>

      <DragOverlay>
        {activeBucket ? (
          <Box sx={{ opacity: 0.95, width: 200 }}>
            <BucketCard bucket={activeBucket} />
          </Box>
        ) : null}
      </DragOverlay>

      <RenameAccountDialog
        open={isRenameDialogOpen}
        currentName={account.name}
        onClose={() => setIsRenameDialogOpen(false)}
        onRename={handleRename}
      />

      <DeleteAccountDialog
        open={isDeleteDialogOpen}
        accountName={account.name}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDelete={handleDelete}
      />
    </DndContext>
  );
}
