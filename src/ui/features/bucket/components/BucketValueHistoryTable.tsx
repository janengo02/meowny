import {
  Box,
  Chip,
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
import ShowChartIcon from '@mui/icons-material/ShowChart';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Dayjs } from 'dayjs';
import { useGetValueHistoryWithTransactionsByBucketQuery, useDeleteBucketValueHistoryMutation } from '../api/bucketValueHistoryApi';
import { formatMoney } from '../../../shared/utils';
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

  const handleDelete = async (historyId: number) => {
    if (window.confirm('Are you sure you want to delete this history entry?')) {
      try {
        await deleteBucketValueHistory({ id: historyId, bucketId }).unwrap();
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
            <TableCell>Date</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Transaction</TableCell>
            <TableCell>
              {bucketType === 'expense' ? 'Spent' : 'Contributed'}
            </TableCell>
            {bucketType === 'investment' && (
              <TableCell>Market Value</TableCell>
            )}
            <TableCell>Notes</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {valueHistory.map((history) => (
            <TableRow
              key={history.id}
              sx={{
                '&:last-child td, &:last-child th': { border: 0 },
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
                <Chip
                  label={history.source_type}
                  size="small"
                  color={
                    history.source_type === 'transaction'
                      ? 'primary'
                      : 'secondary'
                  }
                  icon={
                    history.source_type === 'market' ? (
                      <ShowChartIcon />
                    ) : undefined
                  }
                />
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
                    <Typography variant="caption" color="text.secondary">
                      From:{' '}
                      {history.transaction.from_bucket_id === null
                        ? 'Income'
                        : history.transaction.from_bucket_id === bucketId
                          ? 'This bucket'
                          : history.transaction.from_bucket_name}
                    </Typography>
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      To:{' '}
                      {history.transaction.to_bucket_id === null
                        ? 'Untracked Expenses'
                        : history.transaction.to_bucket_id === bucketId
                          ? 'This bucket'
                          : history.transaction.to_bucket_name}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
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
                <TableCell align="right">
                  <Typography variant="body2">
                    {formatMoney(history.market_value)}
                  </Typography>
                </TableCell>
              )}

              <TableCell>
                {history.notes ? (
                  <Typography variant="body2" color="text.secondary">
                    {history.notes}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    -
                  </Typography>
                )}
              </TableCell>
              <TableCell align="center">
                <IconButton
                  size="small"
                  onClick={() => handleDelete(history.id)}
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
  );
}
