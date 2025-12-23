import { useCallback, useMemo } from 'react';
import { Box, Container, Alert, Grid } from '@mui/material';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
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
import { DropZone, type DropPosition } from './DropZone';

type DashboardSectionProps = {
  section: DashboardSection;
  rowId: string;
  columnId: string;
  sectionIndex: number;
};

function DashboardSection({
  section,
  rowId,
  columnId,
  sectionIndex,
}: DashboardSectionProps) {
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
        return <AccountList type="asset" />;

      case 'expenseAccounts':
        return <AccountList type="expense" />;

      case 'income':
        return <IncomeList />;

      default:
        return null;
    }
  })();

  // Section ID format: "rowId:columnId:sectionIndex"
  const sectionId = `${rowId}:${columnId}:${sectionIndex}`;

  return (
    <DraggableSection id={sectionId} isDragEnabled={true}>
      {sectionContent}
    </DraggableSection>
  );
}

// Parse section ID: "rowId:columnId:sectionIndex"
function parseSectionId(id: string) {
  const parts = id.split(':');
  return {
    rowId: parts[0],
    columnId: parts[1],
    sectionIndex: parseInt(parts[2], 10),
  };
}

// Parse drop zone ID: "dropzone:rowId:columnId:position" or "dropzone:rowId:columnId:sectionIndex:position"
function parseDropZoneId(id: string): {
  rowId: string;
  columnId: string;
  sectionIndex?: number;
  position: DropPosition;
} {
  const parts = id.split(':');
  if (parts.length === 4) {
    // Column-level drop zone: "dropzone:rowId:columnId:position"
    return {
      rowId: parts[1],
      columnId: parts[2],
      position: parts[3] as DropPosition,
    };
  }
  // Section-level drop zone: "dropzone:rowId:columnId:sectionIndex:position"
  return {
    rowId: parts[1],
    columnId: parts[2],
    sectionIndex: parseInt(parts[3], 10),
    position: parts[4] as DropPosition,
  };
}

function DashboardContent() {
  const { error } = useDashboardError();
  const { layout, isLoading, saveLayout } = useDashboardLayout();

  // Fetch all accounts with their buckets to populate the store
  useGetAccountsWithBucketsQuery();

  // Initialize rows when layout changes
  const sortedRows = useMemo(
    () =>
      layout?.rows ? [...layout.rows].sort((a, b) => a.order - b.order) : [],
    [layout],
  );

  // Set up drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Check if dropping on a drop zone
      if (!overId.startsWith('dropzone:')) return;

      const draggedSection = parseSectionId(activeId);
      const dropZone = parseDropZoneId(overId);

      // Calculate new layout
      const calculateNewLayout = (rows: DashboardRow[]): DashboardRow[] => {
        // Find the dragged section
        const draggedRowIndex = rows.findIndex(
          (r) => r.id === draggedSection.rowId,
        );
        if (draggedRowIndex === -1) return rows;

        const draggedRow = rows[draggedRowIndex];
        const draggedColIndex = draggedRow.columns.findIndex(
          (c) => c.id === draggedSection.columnId,
        );
        if (draggedColIndex === -1) return rows;

        const draggedColumn = draggedRow.columns[draggedColIndex];
        const draggedSectionData =
          draggedColumn.sections[draggedSection.sectionIndex];

        if (!draggedSectionData) return rows;

        // Check if dropping on itself
        const isSameSectionHorizontal =
          draggedSection.rowId === dropZone.rowId &&
          draggedSection.columnId === dropZone.columnId &&
          (dropZone.position === 'left' || dropZone.position === 'right');

        const isSameSectionVertical =
          draggedSection.rowId === dropZone.rowId &&
          draggedSection.columnId === dropZone.columnId &&
          dropZone.sectionIndex === draggedSection.sectionIndex &&
          (dropZone.position === 'top' || dropZone.position === 'bottom');

        if (isSameSectionHorizontal || isSameSectionVertical) {
          // Can't drop a section on itself
          return rows;
        }

        // Check if this is a new row creation (top or bottom)
        const isNewRowCreation =
          dropZone.rowId.includes('row-top-new') ||
          dropZone.rowId.includes('row-new');

        // Find target row or create new one
        let targetRowIndex = rows.findIndex((r) => r.id === dropZone.rowId);
        let targetRow: DashboardRow;
        let isNewRow = false;
        let insertAtTop = false;

        if (targetRowIndex === -1 || isNewRowCreation) {
          // Create new row
          isNewRow = true;
          insertAtTop = dropZone.rowId.includes('row-top-new');
          const newRowId = `row-${Date.now()}`;
          targetRow = {
            id: newRowId,
            order: insertAtTop ? 0 : rows.length,
            columns: [
              {
                id: `col-${newRowId}-1`,
                width: 12,
                sections: [draggedSectionData],
              },
            ],
          };
          targetRowIndex = insertAtTop ? 0 : rows.length;
        } else {
          targetRow = rows[targetRowIndex];
        }

        // Build the new layout
        let updatedTargetRow: DashboardRow;

        // If we just created a new row, use it as-is (section already added)
        if (isNewRow && isNewRowCreation) {
          updatedTargetRow = targetRow;
        } else {
          // Check if this is a horizontal split (left/right) or vertical stack (top/bottom)
          const isHorizontalSplit =
            dropZone.position === 'left' || dropZone.position === 'right';

          if (isHorizontalSplit) {
            // Create new column next to the reference column
            const refColIndex = targetRow.columns.findIndex(
              (c) => c.id === dropZone.columnId,
            );

            const newColumnId = `col-${dropZone.rowId}-${Date.now()}`;
            const newColumn: DashboardColumn = {
              id: newColumnId,
              width: 6,
              sections: [draggedSectionData],
            };

            let newColumns: DashboardColumn[];

            if (refColIndex !== -1) {
              // Insert relative to the reference column
              if (dropZone.position === 'left') {
                // Insert before the reference column
                newColumns = [
                  ...targetRow.columns.slice(0, refColIndex),
                  newColumn,
                  ...targetRow.columns.slice(refColIndex),
                ];
              } else {
                // Insert after the reference column
                newColumns = [
                  ...targetRow.columns.slice(0, refColIndex + 1),
                  newColumn,
                  ...targetRow.columns.slice(refColIndex + 1),
                ];
              }
            } else {
              // Reference column not found, add to start or end
              if (dropZone.position === 'left') {
                newColumns = [newColumn, ...targetRow.columns];
              } else {
                newColumns = [...targetRow.columns, newColumn];
              }
            }

            // Recalculate widths
            const columnCount = newColumns.length;
            const baseWidth = Math.floor(12 / columnCount);
            const remainder = 12 - baseWidth * columnCount;

            newColumns = newColumns.map((col, i) => ({
              ...col,
              width: baseWidth + (i < remainder ? 1 : 0),
            }));

            updatedTargetRow = {
              ...targetRow,
              columns: newColumns,
            };
          } else {
            // Vertical stack - add to existing column (top or bottom)
            const targetColIndex = targetRow.columns.findIndex(
              (c) => c.id === dropZone.columnId,
            );

            if (targetColIndex === -1) {
              // Column not found - shouldn't happen for vertical drops
              console.warn('Target column not found for vertical drop');
              return rows;
            }

            const targetColumn = targetRow.columns[targetColIndex];
            let insertIndex = 0;

            if (dropZone.position === 'top') {
              if (dropZone.sectionIndex !== undefined) {
                insertIndex = dropZone.sectionIndex;
              } else {
                insertIndex = 0;
              }
            } else if (dropZone.position === 'bottom') {
              if (dropZone.sectionIndex !== undefined) {
                insertIndex = dropZone.sectionIndex + 1;
              } else {
                insertIndex = targetColumn.sections.length;
              }
            }

            const updatedSections = [...targetColumn.sections];
            updatedSections.splice(insertIndex, 0, draggedSectionData);

            updatedTargetRow = {
              ...targetRow,
              columns: targetRow.columns.map((col, i) =>
                i === targetColIndex
                  ? { ...col, sections: updatedSections }
                  : col,
              ),
            };
          }
        }

        // Remove section from source
        const updatedDraggedColumn = {
          ...draggedColumn,
          sections: draggedColumn.sections.filter(
            (_, i) => i !== draggedSection.sectionIndex,
          ),
        };

        let updatedDraggedRow: DashboardRow = {
          ...draggedRow,
          columns: draggedRow.columns.map((col, i) =>
            i === draggedColIndex ? updatedDraggedColumn : col,
          ),
        };

        // Remove empty columns
        updatedDraggedRow = {
          ...updatedDraggedRow,
          columns: updatedDraggedRow.columns.filter(
            (col) => col.sections.length > 0,
          ),
        };

        // Recalculate widths for source row if it still has columns
        if (updatedDraggedRow.columns.length > 0) {
          const columnCount = updatedDraggedRow.columns.length;
          const baseWidth = Math.floor(12 / columnCount);
          const remainder = 12 - baseWidth * columnCount;

          updatedDraggedRow = {
            ...updatedDraggedRow,
            columns: updatedDraggedRow.columns.map((col, i) => ({
              ...col,
              width: baseWidth + (i < remainder ? 1 : 0),
            })),
          };
        }

        // Build final rows array
        let finalRows: DashboardRow[];

        if (isNewRow) {
          // Add new row at top or bottom, and update source row
          const rowsWithSourceUpdated = rows.map((row, i) =>
            i === draggedRowIndex ? updatedDraggedRow : row,
          );

          if (insertAtTop) {
            finalRows = [updatedTargetRow, ...rowsWithSourceUpdated];
          } else {
            finalRows = [...rowsWithSourceUpdated, updatedTargetRow];
          }
        } else if (draggedRowIndex === targetRowIndex) {
          // Same row - need to merge both source removal and target addition
          // Start with the row that has the section removed from source
          let mergedRow = updatedDraggedRow;

          // Find the target column in the merged row and add the section
          const targetColIndexInMerged = mergedRow.columns.findIndex(
            (c) => c.id === dropZone.columnId,
          );

          if (targetColIndexInMerged !== -1) {
            // Target column exists, add section to it
            const targetColumnInMerged =
              mergedRow.columns[targetColIndexInMerged];
            let insertIndex = 0;

            if (dropZone.position === 'top') {
              insertIndex =
                dropZone.sectionIndex !== undefined ? dropZone.sectionIndex : 0;
            } else if (dropZone.position === 'bottom') {
              insertIndex =
                dropZone.sectionIndex !== undefined
                  ? dropZone.sectionIndex + 1
                  : targetColumnInMerged.sections.length;
            }

            const updatedSections = [...targetColumnInMerged.sections];
            updatedSections.splice(insertIndex, 0, draggedSectionData);

            mergedRow = {
              ...mergedRow,
              columns: mergedRow.columns.map((col, i) =>
                i === targetColIndexInMerged
                  ? { ...col, sections: updatedSections }
                  : col,
              ),
            };
          } else {
            // Target column doesn't exist (horizontal split case)
            // Use the updatedTargetRow which has the new column structure
            mergedRow = updatedTargetRow;

            // But we need to remove the source section from it
            const draggedColIndexInTarget = mergedRow.columns.findIndex(
              (c) => c.id === draggedSection.columnId,
            );

            if (draggedColIndexInTarget !== -1) {
              mergedRow = {
                ...mergedRow,
                columns: mergedRow.columns.map((col, i) =>
                  i === draggedColIndexInTarget
                    ? {
                        ...col,
                        sections: col.sections.filter(
                          (_, sIdx) => sIdx !== draggedSection.sectionIndex,
                        ),
                      }
                    : col,
                ),
              };

              // Remove empty columns
              mergedRow = {
                ...mergedRow,
                columns: mergedRow.columns.filter(
                  (col) => col.sections.length > 0,
                ),
              };

              // Recalculate widths
              if (mergedRow.columns.length > 0) {
                const columnCount = mergedRow.columns.length;
                const baseWidth = Math.floor(12 / columnCount);
                const remainder = 12 - baseWidth * columnCount;

                mergedRow = {
                  ...mergedRow,
                  columns: mergedRow.columns.map((col, i) => ({
                    ...col,
                    width: baseWidth + (i < remainder ? 1 : 0),
                  })),
                };
              }
            }
          }

          finalRows = rows.map((row, i) =>
            i === targetRowIndex ? mergedRow : row,
          );
        } else {
          // Different rows - update both
          finalRows = rows.map((row, i) => {
            if (i === draggedRowIndex) return updatedDraggedRow;
            if (i === targetRowIndex) return updatedTargetRow;
            return row;
          });
        }

        // Remove empty rows and reorder
        return finalRows
          .filter((row) => row.columns.length > 0)
          .map((row, index) => ({ ...row, order: index }));
      };

      // Calculate the new layout (make a copy to avoid mutating sortedRows)
      const newRows = calculateNewLayout([...sortedRows]);

      // Auto-save the layout
      if (layout) {
        const newLayout: DashboardLayout = {
          rows: newRows,
        };
        await saveLayout(newLayout);
      }
    },
    [layout, saveLayout, sortedRows],
  );

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
          display: 'flex',
          px: 6,
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            flexShrink: 0,
            flexGrow: 0,
            width: '100%',
            position: 'relative',
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Render rows with section-level drag-and-drop */}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <DndContext
              sensors={sensors}
              collisionDetection={pointerWithin}
              onDragEnd={handleDragEnd}
            >
              {/* Drop zone at the very top for creating new row */}
              {sortedRows.length > 0 && (
                <Box>
                  <DropZone
                    id={`dropzone:row-top-new:col-new:top`}
                    position="top"
                  />
                </Box>
              )}

              {sortedRows.map((row) => (
                <Grid container spacing={3} key={row.id} sx={{ mb: 3 }}>
                  {row.columns.map((column) => (
                    <Grid key={column.id} size={{ xs: 12, md: column.width }}>
                      <Box>
                        {/* Column content */}
                        <Box>
                          {/* Top drop zone for the column */}
                          {column.sections.length > 0 && (
                            <DropZone
                              id={`dropzone:${row.id}:${column.id}:top`}
                              position="top"
                              isFirst
                            />
                          )}

                          {/* Render sections with drop zones */}
                          {column.sections.map((section, sectionIndex) => (
                            <Box
                              key={sectionIndex}
                              sx={{ position: 'relative' }}
                            >
                              {/* Left drop zone for creating new column */}
                              {sectionIndex === 0 && (
                                <DropZone
                                  id={`dropzone:${row.id}:${column.id}:left`}
                                  position="left"
                                />
                              )}

                              {/* Right drop zone for creating new column */}
                              {sectionIndex === 0 && (
                                <DropZone
                                  id={`dropzone:${row.id}:${column.id}:right`}
                                  position="right"
                                />
                              )}

                              <DashboardSection
                                section={section}
                                rowId={row.id}
                                columnId={column.id}
                                sectionIndex={sectionIndex}
                              />

                              {/* Bottom drop zone after each section */}
                              <DropZone
                                id={`dropzone:${row.id}:${column.id}:${sectionIndex}:bottom`}
                                position="bottom"
                                isLast={
                                  sectionIndex === column.sections.length - 1
                                }
                              />
                            </Box>
                          ))}

                          {/* Bottom drop zone for empty columns */}
                          {column.sections.length === 0 && (
                            <Box
                              sx={{
                                minHeight: 100,
                                border: '2px dashed',
                                borderColor: 'divider',
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'text.disabled',
                              }}
                            >
                              <DropZone
                                id={`dropzone:${row.id}:${column.id}:bottom`}
                                position="bottom"
                              />
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ))}

              {/* Drop zone for creating a new row at the bottom */}
              {sortedRows.length > 0 && (
                <Box
                  sx={{
                    mt: 2,
                    minHeight: '60px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <DropZone
                    id={`dropzone:row-new:col-new:bottom`}
                    position="bottom"
                  />
                </Box>
              )}
            </DndContext>
          </Box>
        </Container>
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
