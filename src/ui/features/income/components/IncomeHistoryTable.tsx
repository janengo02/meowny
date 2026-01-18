import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { memo } from 'react';

import {
  useGetIncomeHistoryIdsBySourceQuery,
  useGetIncomeHistoryQuery,
  useCreateIncomeHistoryMutation,
} from '../api/incomeHistoryApi';

import { IncomeCategorySelect } from './IncomeCategorySelect';
import { IncomeGrossInput } from './IncomeGrossInput';
import { ReceivedDateInput } from './ReceivedDateInput';
import { TaxCell } from './TaxCell';
import { NetAmountCell } from './NetAmountCell';
import dayjs from 'dayjs';
import { formatDateForDB } from '../../../shared/utils/dateTime';
import { IncomeHistoryRowActions } from './IncomeHistoryRowActions';

interface IncomeHistoryTableProps {
  incomeSourceId: number;
}

interface IncomeHistoryRowProps {
  historyId: number;
  incomeSourceId: number;
}
const IncomeRowSkeleton = () => (
  <TableRow>
    <TableCell>
      <Skeleton variant="rectangular" height={20} sx={{ borderRadius: 2 }} />
    </TableCell>
    <TableCell>
      <Skeleton variant="rectangular" height={20} sx={{ borderRadius: 2 }} />
    </TableCell>
    <TableCell>
      <Skeleton variant="rectangular" height={20} sx={{ borderRadius: 2 }} />
    </TableCell>
    <TableCell>
      <Skeleton variant="rectangular" height={20} sx={{ borderRadius: 2 }} />
    </TableCell>
    <TableCell>
      <Skeleton variant="rectangular" height={20} sx={{ borderRadius: 2 }} />
    </TableCell>
    <TableCell>
      <Skeleton variant="rectangular" height={20} sx={{ borderRadius: 2 }} />
    </TableCell>
  </TableRow>
);
const IncomeHistoryRow = memo(function IncomeHistoryRow({
  historyId,
  incomeSourceId,
}: IncomeHistoryRowProps) {
  const { data: history, isLoading } = useGetIncomeHistoryQuery(historyId);

  if (isLoading) {
    return <IncomeRowSkeleton />;
  }
  if (!history) {
    return null;
  }

  return (
    <TableRow
      sx={{
        '&:last-child td, &:last-child th': { border: 0 },
        verticalAlign: 'top',
      }}
    >
      <TableCell sx={{ verticalAlign: 'top' }}>
        <ReceivedDateInput
          historyId={history.id}
          value={history.received_date}
        />
      </TableCell>
      <TableCell>
        <IncomeCategorySelect
          value={history.income_category_id}
          historyId={history.id}
        />
      </TableCell>
      <TableCell align="right">
        <IncomeGrossInput historyId={history.id} value={history.gross_amount} />
      </TableCell>
      <TableCell>
        <TaxCell
          incomeHistoryId={history.id}
          grossAmount={history.gross_amount}
        />
      </TableCell>
      <TableCell align="right">
        <NetAmountCell
          incomeHistoryId={history.id}
          grossAmount={history.gross_amount}
        />
      </TableCell>
      <TableCell align="center">
        <IncomeHistoryRowActions
          historyId={history.id}
          incomeId={incomeSourceId}
          incomeCategoryId={history.income_category_id}
          grossAmount={history.gross_amount}
        />
      </TableCell>
    </TableRow>
  );
});

export function IncomeHistoryTable({
  incomeSourceId,
}: IncomeHistoryTableProps) {
  const { data: incomeHistoryIds = [], isLoading } =
    useGetIncomeHistoryIdsBySourceQuery(incomeSourceId);
  const [createIncomeHistory, { isLoading: isCreating }] =
    useCreateIncomeHistoryMutation();

  // Show skeleton only when creating a new income history
  const showSkeleton = isCreating;

  const handleAddIncomeHistory = async () => {
    try {
      await createIncomeHistory({
        income_id: incomeSourceId,
        gross_amount: 0,
        received_date: formatDateForDB(dayjs()),
      }).unwrap();
    } catch (error) {
      console.error('Failed to create income history:', error);
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

  if (!incomeHistoryIds || incomeHistoryIds.length === 0) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddIncomeHistory}
            disabled={isCreating}
          >
            Add Income History
          </Button>
        </Box>
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
            No income history available
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" justifyContent="center" gap={1}>
      <Button
        variant="contained"
        size="small"
        startIcon={<AddIcon />}
        onClick={handleAddIncomeHistory}
        disabled={isCreating}
        sx={{ width: 'fit-content', ml: 'auto' }}
      >
        Add Income History
      </Button>
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
              <TableCell width={155}>Received Date</TableCell>
              <TableCell width={170}>Income Category</TableCell>
              <TableCell align="right" width={120}>
                Gross Amount
              </TableCell>
              <TableCell width={350}>Tax</TableCell>
              <TableCell align="right" width={120}>
                Net Amount
              </TableCell>
              <TableCell align="center" width={100}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {showSkeleton && <IncomeRowSkeleton />}
            {incomeHistoryIds.map((historyId) => (
              <IncomeHistoryRow
                key={historyId}
                historyId={historyId}
                incomeSourceId={incomeSourceId}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
