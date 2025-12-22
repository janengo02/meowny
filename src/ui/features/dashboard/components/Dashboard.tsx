import { useState, useCallback } from 'react';
import { Box, Container, Alert, Grid, IconButton, Tooltip } from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Navbar } from './Navbar';
import { AccountList } from '../../account/components/AccountList';
import { DashboardErrorProvider } from '../context/DashboardErrorProvider';
import { DashboardLayoutProvider } from '../context/DashboardLayoutProvider';
import { useDashboardError } from '../hooks/useDashboardError';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { IncomeList } from '../../income/components/IncomeList';
import { AssetsOverTimeChart } from './AssetsOverTimeChart';
import { ExpensePieChart } from './ExpensePieChart';
import { BucketGoalsChart } from './BucketGoalsChart';
import { IncomeOverTimeChart } from './IncomeOverTimeChart';
import { IncomeVsSavingsChart } from './IncomeVsSavingsChart';
import { useGetAccountsWithBucketsQuery } from '../../account/api/accountApi';
import { DraggableSection } from './DraggableSection';

type DashboardSectionProps = {
  section: DashboardSection;
  rowId: string;
  columnId: string;
  isEditMode: boolean;
};

function DashboardSection({ section, rowId, columnId, isEditMode }: DashboardSectionProps) {
  const sectionContent = (() => {
    switch (section.type) {
      case 'assetsOverTimeChart':
        return <AssetsOverTimeChart />;

      case 'expensePieChart':
        return <ExpensePieChart />;

      case 'bucketGoalsChart':
        return <BucketGoalsChart />;

      case 'incomeOverTimeChart':
        return <IncomeOverTimeChart />;

      case 'incomeVsSavingsChart':
        return <IncomeVsSavingsChart />;

      case 'assetAccounts':
        return (
          <Box sx={{ mb: 4 }}>
            <AccountList type="asset" />
          </Box>
        );

      case 'expenseAccounts':
        return (
          <Box sx={{ mb: 4 }}>
            <AccountList type="expense" />
          </Box>
        );

      case 'income':
        return (
          <Box sx={{ mb: 4 }}>
            <IncomeList />
          </Box>
        );

      default:
        return null;
    }
  })();

  // Section ID format: "rowId:columnId"
  const sectionId = `${rowId}:${columnId}`;

  return (
    <DraggableSection id={sectionId} isDragEnabled={isEditMode}>
      {sectionContent}
    </DraggableSection>
  );
}

function DashboardContent() {
  const { error } = useDashboardError();
  const { layout, isLoading, saveLayout } = useDashboardLayout();
  const [isEditMode, setIsEditMode] = useState(false);
  const [localRows, setLocalRows] = useState<DashboardRow[]>([]);

  // Fetch all accounts with their buckets to populate the store
  useGetAccountsWithBucketsQuery();

  // Initialize local rows when layout changes
  const sortedRows = layout?.rows
    ? [...layout.rows].sort((a, b) => a.order - b.order)
    : [];

  // Update local rows when layout changes or edit mode is entered
  if (!isEditMode && localRows.length !== sortedRows.length) {
    setLocalRows(sortedRows);
  }

  // Set up drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );


  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      // Parse section IDs (format: "rowId:columnId")
      const [draggedRowId, draggedColId] = (active.id as string).split(':');
      const [targetRowId, targetColId] = (over.id as string).split(':');

      setLocalRows((rows) => {
        // Find dragged and target sections
        const draggedRowIndex = rows.findIndex((r) => r.id === draggedRowId);
        const targetRowIndex = rows.findIndex((r) => r.id === targetRowId);

        if (draggedRowIndex === -1 || targetRowIndex === -1) return rows;

        const draggedRow = rows[draggedRowIndex];
        const targetRow = rows[targetRowIndex];

        const draggedColIndex = draggedRow.columns.findIndex((c) => c.id === draggedColId);
        const targetColIndex = targetRow.columns.findIndex((c) => c.id === targetColId);

        if (draggedColIndex === -1 || targetColIndex === -1) return rows;

        const draggedColumn = draggedRow.columns[draggedColIndex];

        // If dropping on the same row, just reorder columns
        if (draggedRowId === targetRowId) {
          const newColumns = arrayMove(draggedRow.columns, draggedColIndex, targetColIndex);
          const updatedRow = { ...draggedRow, columns: newColumns };
          return rows.map((row) => (row.id === draggedRowId ? updatedRow : row));
        }

        // If dropping on a different row, merge into target row
        // Check if target row can accept more columns (max 3)
        if (targetRow.columns.length >= 3) {
          console.warn('Cannot add more than 3 columns to a row');
          return rows;
        }

        // Calculate new column widths for target row
        const newColumnCount = targetRow.columns.length + 1;
        const newWidth = Math.floor(12 / newColumnCount);

        // Update target row with new column
        const updatedTargetRow: DashboardRow = {
          ...targetRow,
          columns: [
            ...targetRow.columns.slice(0, targetColIndex + 1).map((col) => ({
              ...col,
              width: newWidth,
            })),
            {
              ...draggedColumn,
              id: `col-${targetRowId}-${newColumnCount}`,
              width: 12 - newWidth * (newColumnCount - 1),
            },
            ...targetRow.columns.slice(targetColIndex + 1).map((col) => ({
              ...col,
              width: newWidth,
            })),
          ],
        };

        // Remove column from dragged row
        const updatedDraggedRow: DashboardRow = {
          ...draggedRow,
          columns: draggedRow.columns.filter((_, i) => i !== draggedColIndex),
        };

        // If dragged row now has no columns, remove it
        const newRows = updatedDraggedRow.columns.length === 0
          ? rows.filter((_, i) => i !== draggedRowIndex)
          : rows;

        // Update rows
        return newRows
          .map((row) => {
            if (row.id === targetRowId) return updatedTargetRow;
            if (row.id === draggedRowId) return updatedDraggedRow;
            return row;
          })
          .filter((row) => row.columns.length > 0)
          .map((row, index) => ({ ...row, order: index }));
      });
    },
    [],
  );

  const handleEnterEditMode = () => {
    setLocalRows(sortedRows);
    setIsEditMode(true);
  };

  const handleSaveLayout = async () => {
    if (layout) {
      const newLayout: DashboardLayout = {
        rows: localRows,
      };
      await saveLayout(newLayout);
      setIsEditMode(false);
    }
  };

  const handleCancelEdit = () => {
    setLocalRows(sortedRows);
    setIsEditMode(false);
  };


  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Navbar />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          Loading dashboard...
        </Container>
      </Box>
    );
  }

  const rowsToDisplay = isEditMode ? localRows : sortedRows;

  // Collect all section IDs for sortable context
  const sectionIds = rowsToDisplay.flatMap((row) =>
    row.columns.map((col) => `${row.id}:${col.id}`),
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Navbar />
      <Box
        sx={{
          width: '100%',
          overflowX: 'auto',
        }}
      >
        <Box
          sx={{
            display: 'flex',
          }}
        >
          <Container
            maxWidth="xl"
            sx={{ py: 4, flexShrink: 0, flexGrow: 0, width: '100%', position: 'relative' }}
          >
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Edit Mode Toggle */}
            <Box
              sx={{
                position: 'fixed',
                top: 80,
                right: 24,
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                alignItems: 'flex-end',
              }}
            >
              {!isEditMode ? (
                <Tooltip title="Edit Layout">
                  <IconButton
                    color="primary"
                    onClick={handleEnterEditMode}
                    sx={{
                      backgroundColor: 'background.paper',
                      boxShadow: 2,
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Save Layout">
                    <IconButton
                      color="success"
                      onClick={handleSaveLayout}
                      sx={{
                        backgroundColor: 'background.paper',
                        boxShadow: 2,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <SaveIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cancel">
                    <IconButton
                      color="error"
                      onClick={handleCancelEdit}
                      sx={{
                        backgroundColor: 'background.paper',
                        boxShadow: 2,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>

            {/* Render rows with section-level drag-and-drop */}
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={sectionIds}>
                  {rowsToDisplay.map((row) => (
                    <Grid container spacing={3} key={row.id} sx={{ mb: 3 }}>
                      {row.columns.map((column) => (
                        <Grid key={column.id} size={{ xs: 12, md: column.width }}>
                          <DashboardSection
                            section={column.section}
                            rowId={row.id}
                            columnId={column.id}
                            isEditMode={isEditMode}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  ))}
                </SortableContext>
              </DndContext>
            </Box>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}

export function Dashboard() {
  return (
    <DashboardErrorProvider>
      <DashboardLayoutProvider>
        <DashboardContent />
      </DashboardLayoutProvider>
    </DashboardErrorProvider>
  );
}
