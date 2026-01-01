import { Typography, Box } from '@mui/material';
import { useCallback, useState } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { AccountCard } from './AccountCard';
import { AddAccountCard } from './AddAccountCard';
import { selectAccountIdsByType } from '../selectors/accountSelectors';
import { LayoutSettings } from './LayoutSettings';
import { ColumnResizer } from './ColumnResizer';
import {
  useGetAssetAccountListLayoutQuery,
  useSaveAssetAccountListLayoutMutation,
} from '../../dashboard/api/userPreferencesApi';

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
  const [localColumnWidths, setLocalColumnWidths] = useState<number[] | null>(null);

  // Get current columns and widths (use local state during drag, otherwise from preference)
  const columns = layoutPreference?.columns ?? DEFAULT_LAYOUT.columns;
  const columnWidths =
    localColumnWidths ?? layoutPreference?.columnWidths ?? DEFAULT_LAYOUT.columnWidths;

  const handleColumnsChange = (newColumns: 1 | 2 | 3) => {
    // Set default widths based on column count
    const defaultWidths =
      newColumns === 1 ? [12] : newColumns === 2 ? [6, 6] : [4, 4, 4];

    // Clear local state
    setLocalColumnWidths(null);

    // Save with optimistic update (handled by onQueryStarted)
    saveLayout({
      columns: newColumns,
      columnWidths: defaultWidths,
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
      saveLayout({
        columns,
        columnWidths: newWidths,
      });
    },
    [columns, columnWidths, saveLayout],
  );

  // Calculate grid size for each column
  const getGridSize = (columnIndex: number) => {
    return columnWidths[columnIndex] ?? 12;
  };

  // Distribute accounts across columns
  const accountsPerColumn = Math.ceil(accountIds.length / columns);
  const columnAccounts: number[][] = Array.from({ length: columns }, (_, i) =>
    accountIds.slice(i * accountsPerColumn, (i + 1) * accountsPerColumn),
  );

  // Render columns with resizers between them
  const renderColumnsWithResizers = () => {
    const elements: React.ReactNode[] = [];

    columnAccounts.forEach((accounts, columnIndex) => {
      const flexBasis = `${(getGridSize(columnIndex) / 12) * 100}%`;
      const currentColumnWidth = getGridSize(columnIndex);

      // Add column
      elements.push(
        <Box
          key={`col-${columnIndex}`}
          sx={{
            flex: `0 0 ${flexBasis}`,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          {accounts.map((accountId) => (
            <AccountCard
              key={accountId}
              accountId={accountId}
              columnWidth={currentColumnWidth}
            />
          ))}
        </Box>,
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
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
        }}
      >
        <Typography variant="h2">Asset Accounts</Typography>
        <LayoutSettings
          currentColumns={columns}
          onColumnsChange={handleColumnsChange}
        />
      </Box>

      <Box
        data-resizable-container
        sx={{
          display: 'flex',
          gap: 0,
          alignItems: 'stretch',
        }}
      >
        {columns === 1 ? (
          <Box sx={{ flex: 1 }}>
            {accountIds.map((accountId) => (
              <AccountCard
                key={accountId}
                accountId={accountId}
                columnWidth={12}
              />
            ))}
          </Box>
        ) : (
          renderColumnsWithResizers()
        )}
      </Box>

      <Box sx={{ mt: 2 }}>
        <AddAccountCard type="asset" />
      </Box>
    </>
  );
}
