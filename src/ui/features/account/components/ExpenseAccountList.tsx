import { Grid, Typography, Box, Button, Menu, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useState, useMemo, useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { ExpenseAccountCard } from './ExpenseAccountCard';
import { selectAccountIdsByType } from '../selectors/accountSelectors';
import { AddExpenseAccountDialog } from './AddExpenseAccountDialog';
import { CreateBucketDialog } from '../../bucket/components/CreateBucketDialog';
import {
  useGetExpenseAccountListLayoutQuery,
  useSaveExpenseAccountListLayoutMutation,
} from '../../dashboard/api/userPreferencesApi';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DraggableExpenseAccountCard } from './DraggableExpenseAccountCard';

export function ExpenseAccountList() {
  // Only select account IDs - ExpenseAccountCard will fetch its own buckets
  const accountIds = useAppSelector((state) =>
    selectAccountIdsByType(state, 'expense'),
  );

  const { data: layoutPreference } = useGetExpenseAccountListLayoutQuery();
  const [saveLayout] = useSaveExpenseAccountListLayoutMutation();

  const [activeId, setActiveId] = useState<number | null>(null);
  const [dragOverlayWidth, setDragOverlayWidth] = useState<number | null>(null);

  // State for Add button dropdown menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isBucketDialogOpen, setIsBucketDialogOpen] = useState(false);
  const isMenuOpen = Boolean(anchorEl);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts
      },
    }),
  );

  // Get ordered accounts based on saved order or default order
  const orderedAccountIds = useMemo(() => {
    if (layoutPreference?.accountOrder) {
      // Use saved order, filtering out any accounts that no longer exist
      const existingAccounts = layoutPreference.accountOrder.filter((id) =>
        accountIds.includes(id),
      );

      // Find accounts that are in accountIds but not in the saved order
      const accountsInOrder = new Set(existingAccounts);
      const newAccounts = accountIds.filter((id) => !accountsInOrder.has(id));

      // Return existing order plus new accounts at the end
      return [...existingAccounts, ...newAccounts];
    }

    // Default order
    return accountIds;
  }, [accountIds, layoutPreference]);

  // Automatically save layout when new accounts are added
  useEffect(() => {
    if (!layoutPreference?.accountOrder) return;

    // Check if there are new accounts not in the saved order
    const accountsInOrder = new Set(layoutPreference.accountOrder);
    const newAccounts = accountIds.filter((id) => !accountsInOrder.has(id));

    if (newAccounts.length > 0) {
      // Save the updated layout with new accounts added to the end
      saveLayout({
        accountOrder: [...layoutPreference.accountOrder, ...newAccounts],
      });
    }
  }, [accountIds, layoutPreference, saveLayout]);

  const handleAddClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExpenseAccountClick = () => {
    handleMenuClose();
    setIsAccountDialogOpen(true);
  };

  const handleExpenseBucketClick = () => {
    handleMenuClose();
    setIsBucketDialogOpen(true);
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as number;
    setActiveId(activeId);

    // Get actual pixel width from the dragged element's rect
    const rect = event.active.rect.current.translated;
    if (rect) {
      setDragOverlayWidth(rect.width);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setDragOverlayWidth(null);

    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = orderedAccountIds.indexOf(active.id as number);
    const newIndex = orderedAccountIds.indexOf(over.id as number);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(orderedAccountIds, oldIndex, newIndex);

      // Save the new order
      saveLayout({
        accountOrder: newOrder,
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
        }}
      >
        <Typography variant="h2">Expenses</Typography>
        <Button
          variant="contained"
          size="small"
          onClick={handleAddClick}
          aria-controls={isMenuOpen ? 'add-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={isMenuOpen ? 'true' : undefined}
          startIcon={<AddIcon />}
          endIcon={<ArrowDropDownIcon />}
        >
          Add
        </Button>
        <Menu
          id="add-menu"
          anchorEl={anchorEl}
          open={isMenuOpen}
          onClose={handleMenuClose}
          MenuListProps={{
            'aria-labelledby': 'add-button',
          }}
        >
          <MenuItem onClick={handleExpenseAccountClick}>
            Expense Account
          </MenuItem>
          <MenuItem onClick={handleExpenseBucketClick}>Expense Bucket</MenuItem>
        </Menu>
      </Box>

      <SortableContext
        items={orderedAccountIds}
        strategy={verticalListSortingStrategy}
      >
        <Grid container>
          {orderedAccountIds.map((accountId) => (
            <Grid key={accountId} size={{ xs: 12 }}>
              <DraggableExpenseAccountCard accountId={accountId} />
            </Grid>
          ))}
        </Grid>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeId && dragOverlayWidth ? (
          <Box sx={{ opacity: 0.95, width: dragOverlayWidth }}>
            <ExpenseAccountCard accountId={activeId} />
          </Box>
        ) : null}
      </DragOverlay>

      <AddExpenseAccountDialog
        open={isAccountDialogOpen}
        onClose={() => setIsAccountDialogOpen(false)}
      />

      <CreateBucketDialog
        open={isBucketDialogOpen}
        onClose={() => setIsBucketDialogOpen(false)}
        accountTypeFilter="expense"
      />
    </DndContext>
  );
}
