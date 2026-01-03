import {
  Typography,
  Box,
  Button,
  Menu,
  MenuItem,
  Card,
  CardContent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useCallback, useState, useMemo, useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { AccountCard } from './AccountCard';
import { selectAccountIdsByType } from '../selectors/accountSelectors';
import { LayoutSettings } from './LayoutSettings';
import { ColumnResizer } from './ColumnResizer';
import { DroppableColumn } from './DroppableColumn';
import {
  useGetAssetAccountListLayoutQuery,
  useSaveAssetAccountListLayoutMutation,
} from '../../dashboard/api/userPreferencesApi';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { CreateBucketDialog } from '../../bucket/components/CreateBucketDialog';
import { AddAssetAccountDialog } from './AddAssetAccountDialog';

const DEFAULT_LAYOUT: AssetAccountListLayoutPreference = {
  columns: 1,
  columnWidths: [12],
};

export function AssetAccountList() {
  // Only select account IDs - AccountCard will fetch its own buckets
  const accountIds = useAppSelector((state) =>
    selectAccountIdsByType(state, 'asset'),
  );

  const { data: layoutPreference } = useGetAssetAccountListLayoutQuery();
  const [saveLayout] = useSaveAssetAccountListLayoutMutation();

  // Local state for preview during drag
  const [localColumnWidths, setLocalColumnWidths] = useState<number[] | null>(
    null,
  );
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeColumnWidth, setActiveColumnWidth] = useState<number>(12);
  const [dragOverlayWidth, setDragOverlayWidth] = useState<number | null>(null);

  // State for Add button dropdown menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isBucketDialogOpen, setIsBucketDialogOpen] = useState(false);
  const isMenuOpen = Boolean(anchorEl);

  const handleAddClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAssetAccountClick = () => {
    handleMenuClose();
    setIsAccountDialogOpen(true);
  };

  const handleAssetBucketClick = () => {
    handleMenuClose();
    setIsBucketDialogOpen(true);
  };

  // Get current columns and widths (use local state during drag, otherwise from preference)
  const columns = layoutPreference?.columns ?? DEFAULT_LAYOUT.columns;
  const columnWidths =
    localColumnWidths ??
    layoutPreference?.columnWidths ??
    DEFAULT_LAYOUT.columnWidths;

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts
      },
    }),
  );

  // Distribute accounts across columns based on saved order or default distribution
  const columnAccounts = useMemo(() => {
    if (layoutPreference?.accountOrder) {
      // Use saved order, filtering out any accounts that no longer exist
      const existingAccounts = layoutPreference.accountOrder.map((columnIds) =>
        columnIds.filter((id) => accountIds.includes(id)),
      );

      // Find accounts that are in accountIds but not in any column
      const accountsInOrder = new Set(existingAccounts.flat());
      const newAccounts = accountIds.filter((id) => !accountsInOrder.has(id));

      // If there are new accounts, add them to the last column
      if (newAccounts.length > 0) {
        const updatedAccounts = [...existingAccounts];
        const lastColumnIndex = updatedAccounts.length - 1;
        updatedAccounts[lastColumnIndex] = [
          ...(updatedAccounts[lastColumnIndex] || []),
          ...newAccounts,
        ];
        return updatedAccounts;
      }

      return existingAccounts;
    }

    // Default distribution: evenly distribute accounts
    const accountsPerColumn = Math.ceil(accountIds.length / columns);
    return Array.from({ length: columns }, (_, i) =>
      accountIds.slice(i * accountsPerColumn, (i + 1) * accountsPerColumn),
    );
  }, [accountIds, columns, layoutPreference]);

  // Automatically save layout when new accounts are added
  useEffect(() => {
    if (!layoutPreference?.accountOrder) return;

    // Check if there are new accounts not in the saved order
    const accountsInOrder = new Set(layoutPreference.accountOrder.flat());
    const newAccounts = accountIds.filter((id) => !accountsInOrder.has(id));

    if (newAccounts.length > 0) {
      // Save the updated layout with new accounts added to last column
      const lastColumnIndex = layoutPreference.accountOrder.length - 1;
      const updatedOrder = layoutPreference.accountOrder.map(
        (columnIds, index) =>
          index === lastColumnIndex
            ? [...columnIds, ...newAccounts]
            : columnIds,
      );

      saveLayout({
        columns,
        columnWidths,
        accountOrder: updatedOrder,
      });
    }
  }, [accountIds, layoutPreference, columns, columnWidths, saveLayout]);

  const handleColumnsChange = (newColumns: 1 | 2 | 3) => {
    // Set default widths based on column count
    const defaultWidths =
      newColumns === 1 ? [12] : newColumns === 2 ? [6, 6] : [4, 4, 4];

    // Clear local state
    setLocalColumnWidths(null);

    // Redistribute accounts evenly when changing column count
    const accountsPerColumn = Math.ceil(accountIds.length / newColumns);
    const newAccountOrder = Array.from({ length: newColumns }, (_, i) =>
      accountIds.slice(i * accountsPerColumn, (i + 1) * accountsPerColumn),
    );

    // Save with optimistic update (handled by onQueryStarted)
    saveLayout({
      columns: newColumns,
      columnWidths: defaultWidths,
      accountOrder: newAccountOrder,
    });
  };

  // Handle resize move - update local state for preview
  const handleResizeMove = useCallback(
    (leftIndex: number, newLeftWidth: number, newRightWidth: number) => {
      const newWidths = [...columnWidths];
      newWidths[leftIndex] = newLeftWidth;
      newWidths[leftIndex + 1] = newRightWidth;

      // Update local state for immediate visual feedback
      setLocalColumnWidths(newWidths);
    },
    [columnWidths],
  );

  // Handle resize end - save to database with optimistic update
  const handleResizeEnd = useCallback(
    (leftIndex: number, newLeftWidth: number, newRightWidth: number) => {
      const newWidths = [...columnWidths];
      newWidths[leftIndex] = newLeftWidth;
      newWidths[leftIndex + 1] = newRightWidth;

      // Clear local state (optimistic update will take over)
      setLocalColumnWidths(null);

      // Save to database with optimistic update (handled by onQueryStarted)
      // Preserve accountOrder when resizing
      saveLayout({
        columns,
        columnWidths: newWidths,
        accountOrder: layoutPreference?.accountOrder,
      });
    },
    [columns, columnWidths, saveLayout, layoutPreference?.accountOrder],
  );

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as number;
    setActiveId(activeId);

    // Find which column the active item is in and save its width
    const activeColumnIndex = columnAccounts.findIndex((accounts) =>
      accounts.includes(activeId),
    );
    if (activeColumnIndex !== -1) {
      setActiveColumnWidth(getGridSize(activeColumnIndex));

      // Get actual pixel width from the dragged element's rect
      const rect = event.active.rect.current.translated;
      if (rect) {
        setDragOverlayWidth(rect.width);
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id;

    // Find which column the active item is in
    const activeColumnIndex = columnAccounts.findIndex((accounts) =>
      accounts.includes(activeId),
    );

    // Determine which column we're over
    let overColumnIndex: number;
    if (typeof overId === 'string' && overId.startsWith('column-')) {
      // Dropping over a column container
      overColumnIndex = parseInt(overId.split('-')[1]);
    } else {
      // Dropping over another account
      overColumnIndex = columnAccounts.findIndex((accounts) =>
        accounts.includes(overId as number),
      );
    }

    if (activeColumnIndex === -1 || overColumnIndex === -1) return;

    // If moving between columns or reordering within a column
    if (activeColumnIndex !== overColumnIndex || typeof overId === 'number') {
      const newColumnAccounts = [...columnAccounts];
      const activeAccounts = [...newColumnAccounts[activeColumnIndex]];
      const overAccounts =
        activeColumnIndex === overColumnIndex
          ? activeAccounts
          : [...newColumnAccounts[overColumnIndex]];

      const activeIndex = activeAccounts.indexOf(activeId);
      const overIndex =
        typeof overId === 'number'
          ? overAccounts.indexOf(overId as number)
          : overAccounts.length;

      // Remove from source
      activeAccounts.splice(activeIndex, 1);

      // Add to destination
      if (activeColumnIndex === overColumnIndex) {
        // Reordering within same column
        activeAccounts.splice(overIndex, 0, activeId);
        newColumnAccounts[activeColumnIndex] = activeAccounts;
      } else {
        // Moving between columns
        newColumnAccounts[activeColumnIndex] = activeAccounts;
        overAccounts.splice(overIndex, 0, activeId);
        newColumnAccounts[overColumnIndex] = overAccounts;
      }

      // Save immediately for smooth UX
      saveLayout({
        columns,
        columnWidths,
        accountOrder: newColumnAccounts,
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setDragOverlayWidth(null);

    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id;

    // Find columns
    const activeColumnIndex = columnAccounts.findIndex((accounts) =>
      accounts.includes(activeId),
    );

    let overColumnIndex: number;
    if (typeof overId === 'string' && overId.startsWith('column-')) {
      overColumnIndex = parseInt(overId.split('-')[1]);
    } else {
      overColumnIndex = columnAccounts.findIndex((accounts) =>
        accounts.includes(overId as number),
      );
    }

    if (activeColumnIndex === -1 || overColumnIndex === -1) return;

    const newColumnAccounts = [...columnAccounts];
    const activeAccounts = [...newColumnAccounts[activeColumnIndex]];
    const overAccounts =
      activeColumnIndex === overColumnIndex
        ? activeAccounts
        : [...newColumnAccounts[overColumnIndex]];

    const activeIndex = activeAccounts.indexOf(activeId);

    if (activeColumnIndex === overColumnIndex) {
      // Reordering within same column
      if (typeof overId === 'number') {
        const overIndex = activeAccounts.indexOf(overId as number);
        if (activeIndex !== overIndex) {
          newColumnAccounts[activeColumnIndex] = arrayMove(
            activeAccounts,
            activeIndex,
            overIndex,
          );
        }
      }
    } else {
      // Moving between columns
      activeAccounts.splice(activeIndex, 1);
      newColumnAccounts[activeColumnIndex] = activeAccounts;

      if (typeof overId === 'number') {
        const overIndex = overAccounts.indexOf(overId as number);
        overAccounts.splice(overIndex, 0, activeId);
      } else {
        overAccounts.push(activeId);
      }
      newColumnAccounts[overColumnIndex] = overAccounts;
    }

    // Save the new order
    saveLayout({
      columns,
      columnWidths,
      accountOrder: newColumnAccounts,
    });
  };

  // Calculate grid size for each column
  const getGridSize = (columnIndex: number) => {
    return columnWidths[columnIndex] ?? 12;
  };

  // Render columns with resizers between them
  const renderColumnsWithResizers = () => {
    const elements: React.ReactNode[] = [];

    columnAccounts.forEach((accounts, columnIndex) => {
      const flexBasis = `${(getGridSize(columnIndex) / 12) * 100}%`;
      const currentColumnWidth = getGridSize(columnIndex);

      // Add droppable column
      elements.push(
        <DroppableColumn
          key={`col-${columnIndex}`}
          columnId={`column-${columnIndex}`}
          accountIds={accounts}
          columnWidth={currentColumnWidth}
          flexBasis={flexBasis}
        />,
      );

      // Add resizer between columns (except after the last column)
      if (columnIndex < columnAccounts.length - 1) {
        elements.push(
          <ColumnResizer
            key={`resizer-${columnIndex}`}
            leftWidth={columnWidths[columnIndex]}
            rightWidth={columnWidths[columnIndex + 1]}
            onResizeMove={(newLeft, newRight) =>
              handleResizeMove(columnIndex, newLeft, newRight)
            }
            onResizeEnd={(newLeft, newRight) =>
              handleResizeEnd(columnIndex, newLeft, newRight)
            }
          />,
        );
      }
    });

    return elements;
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
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
        <Typography variant="h2">Assets</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
            <MenuItem onClick={handleAssetAccountClick}>Asset Account</MenuItem>
            <MenuItem onClick={handleAssetBucketClick}>Asset Bucket</MenuItem>
          </Menu>
          <LayoutSettings
            currentColumns={columns}
            onColumnsChange={handleColumnsChange}
          />
        </Box>
      </Box>

      <Box
        data-resizable-container
        sx={{
          display: 'flex',
          gap: 0,
          alignItems: 'stretch',
        }}
      >
        {accountIds.length === 0 ? (
          <Card sx={{ width: '100%' }}>
            <CardContent
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pt: 3,
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No asset accounts yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click the "Add" button above to create your first asset account
              </Typography>
            </CardContent>
          </Card>
        ) : columns === 1 ? (
          <DroppableColumn
            columnId="column-0"
            accountIds={columnAccounts[0] || []}
            columnWidth={12}
            flexBasis="100%"
          />
        ) : (
          renderColumnsWithResizers()
        )}
      </Box>

      <DragOverlay dropAnimation={null}>
        {activeId && dragOverlayWidth ? (
          <Box sx={{ opacity: 0.95, width: dragOverlayWidth }}>
            <AccountCard accountId={activeId} columnWidth={activeColumnWidth} />
          </Box>
        ) : null}
      </DragOverlay>

      <AddAssetAccountDialog
        open={isAccountDialogOpen}
        onClose={() => setIsAccountDialogOpen(false)}
      />

      <CreateBucketDialog
        open={isBucketDialogOpen}
        onClose={() => setIsBucketDialogOpen(false)}
        accountTypeFilter="asset"
      />
    </DndContext>
  );
}
