import {
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Dayjs } from 'dayjs';
import {
  useGetValueHistoryWithTransactionsByBucketQuery,
  useDeleteBucketValueHistoryMutation,
} from '../api/bucketValueHistoryApi';
import { useDeleteTransactionMutation } from '../../transaction/api/transactionApi';
import { formatMoney, formatUnits } from '../../../shared/utils';
import { formatDateForDB } from '../../../shared/utils/dateTime';
import { useMemo } from 'react';

interface BucketValueHistoryTableProps {
  bucketId: number;
  bucketType: BucketTypeEnum;
  periodFrom: Dayjs;
  periodTo: Dayjs;
}

export function BucketValueHistoryTable({
  bucketId,
  bucketType,
  periodFrom,
  periodTo,
}: BucketValueHistoryTableProps) {
  // Query parameters for the API
  const queryParams = useMemo(
    () => ({
      bucketId,
      startDate: formatDateForDB(periodFrom),
      endDate: formatDateForDB(periodTo),
    }),
    [bucketId, periodFrom, periodTo],
  );

  const { data: valueHistory, isLoading } =
    useGetValueHistoryWithTransactionsByBucketQuery(queryParams);

  const [deleteBucketValueHistory] = useDeleteBucketValueHistoryMutation();
  const [deleteTransaction] = useDeleteTransactionMutation();

  const handleDelete = async (history: ValueHistoryWithTransaction) => {
    const confirmMessage =
      history.source_type === 'transaction'
        ? 'Are you sure you want to delete this transaction? This will also remove history record(s) of all related buckets.'
        : 'Are you sure you want to delete this market value entry?';

    if (window.confirm(confirmMessage)) {
      try {
        if (history.source_type === 'transaction') {
          // Delete transaction (which will automatically handle bucket value history)
          if (history.source_id) {
            await deleteTransaction(history.source_id).unwrap();
          }
        } else {
          // Delete market value history
          await deleteBucketValueHistory({ id: history.id, bucketId }).unwrap();
        }
      } catch (error) {
        console.error('Failed to delete history:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!valueHistory || valueHistory.length === 0) {
    return (
      <Box
        sx={{
          p: 3,
          borderRadius: 1,
          bgcolor: 'background.paper',
          border: '1px dashed',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography color="text.secondary">
          No value history available for the selected period
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography
          variant="caption"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              bgcolor: 'rgba(25, 118, 210, 0.08)',
              border: '1px solid',
              borderColor: 'primary.main',
            }}
          />
          Transaction
        </Typography>
        <Typography
          variant="caption"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              bgcolor: 'rgba(228, 195, 61, 0.21)',
              border: '1px solid',
              borderColor: 'warning.main',
            }}
          />
          Market Value Update
        </Typography>
      </Box>
      <TableContainer
        component={Paper}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell rowSpan={2}>Date</TableCell>
              <TableCell rowSpan={2}>Transaction</TableCell>
              <TableCell rowSpan={2}>Notes</TableCell>
              <TableCell
                align="center"
                colSpan={bucketType === 'investment' ? 3 : 1}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                Balance
              </TableCell>
              <TableCell rowSpan={2} align="center">
                Actions
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                {bucketType === 'expense' ? 'Spent' : 'Contributed'}
              </TableCell>
              {bucketType === 'investment' && (
                <>
                  <TableCell>Market Value</TableCell>
                  <TableCell>Total Units</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {valueHistory.map((history) => (
              <TableRow
                key={history.id}
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                  bgcolor:
                    history.source_type === 'transaction'
                      ? 'rgba(25, 118, 210, 0.08)' // primary.main with low opacity
                      : 'rgba(228, 195, 61, 0.21)', // secondary.main with low opacity
                  borderLeft: 3,
                  borderLeftColor:
                    history.source_type === 'transaction'
                      ? 'primary.main'
                      : 'warning.main',
                }}
              >
                <TableCell>
                  <Typography variant="body2">
                    {new Date(history.recorded_at).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(history.recorded_at).toLocaleTimeString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  {history.transaction ? (
                    <Box>
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        sx={{
                          color:
                            history.transaction.from_bucket_id === bucketId
                              ? 'error.main'
                              : history.transaction.to_bucket_id === bucketId
                                ? 'success.main'
                                : 'text.primary',
                        }}
                      >
                        {history.transaction.from_bucket_id === bucketId
                          ? '- '
                          : history.transaction.to_bucket_id === bucketId
                            ? '+ '
                            : ''}
                        {formatMoney(history.transaction.amount)}
                      </Typography>

                      {bucketType === 'investment' && (
                        <>
                          <Typography variant="caption" color="text.secondary">
                            {history.transaction.from_bucket_id === bucketId &&
                            history.transaction.from_units
                              ? `-${formatUnits(history.transaction.from_units)} units`
                              : history.transaction.to_bucket_id === bucketId &&
                                  history.transaction.to_units
                                ? `+${formatUnits(history.transaction.to_units)} units`
                                : ''}
                          </Typography>
                          <br />
                        </>
                      )}
                      {history.transaction.from_bucket_id !== bucketId && (
                        <Typography variant="caption" color="text.secondary">
                          From:{' '}
                          {history.transaction.from_bucket_id === null
                            ? 'Income'
                            : history.transaction.from_bucket_name}
                        </Typography>
                      )}
                      {history.transaction.to_bucket_id !== bucketId && (
                        <Typography variant="caption" color="text.secondary">
                          To:{' '}
                          {history.transaction.to_bucket_id === null
                            ? 'Untracked Expenses'
                            : history.transaction.to_bucket_name}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {history.notes ? (
                    <Typography variant="caption" color="text.secondary">
                      {history.notes}
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {formatMoney(history.contributed_amount)}
                  </Typography>
                </TableCell>
                {bucketType === 'investment' && (
                  <>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatMoney(history.market_value)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {history.total_units !== null
                          ? formatUnits(history.total_units)
                          : '-'}
                      </Typography>
                    </TableCell>
                  </>
                )}

                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(history)}
                    aria-label="delete"
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
