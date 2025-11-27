import {
  Box,
  Chip,
  CircularProgress,
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
import { useGetValueHistoryWithTransactionsByBucketQuery } from '../api/bucketValueHistoryApi';
import { formatMoney } from '../../../shared/utils';

interface BucketValueHistoryTableProps {
  bucketId: number;
}

export function BucketValueHistoryTable({
  bucketId,
}: BucketValueHistoryTableProps) {
  const { data: valueHistory, isLoading } =
    useGetValueHistoryWithTransactionsByBucketQuery(bucketId);

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
          No value history available
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
            <TableCell align="right">Contributed</TableCell>
            <TableCell align="right">Market Value</TableCell>
            <TableCell>Transaction</TableCell>
            <TableCell>Notes</TableCell>
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
              <TableCell align="right">
                <Typography variant="body2">
                  {formatMoney(history.contributed_amount)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2">
                  {formatMoney(history.market_value)}
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
