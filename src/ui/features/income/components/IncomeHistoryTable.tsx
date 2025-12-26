import {
  Box,
  Button,
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
import AddIcon from '@mui/icons-material/Add';

import {
  useGetIncomeHistoriesBySourceQuery,
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

export function IncomeHistoryTable({
  incomeSourceId,
}: IncomeHistoryTableProps) {
  const { data: incomeHistories = [], isLoading } =
    useGetIncomeHistoriesBySourceQuery(incomeSourceId);
  const [createIncomeHistory, { isLoading: isCreating }] =
    useCreateIncomeHistoryMutation();

  // Sort income histories by received_date desc, then by id asc
  const sortedIncomeHistories = [...incomeHistories].sort((a, b) => {
    // First sort by received_date descending
    const dateComparison =
      new Date(b.received_date).getTime() - new Date(a.received_date).getTime();
    if (dateComparison !== 0) {
      return dateComparison;
    }
    // If dates are equal, sort by id ascending
    return b.id - a.id;
  });

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

  if (!sortedIncomeHistories || sortedIncomeHistories.length === 0) {
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
            {sortedIncomeHistories.map((history) => (
              <TableRow
                key={history.id}
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
                  <IncomeGrossInput
                    historyId={history.id}
                    value={history.gross_amount}

                  />
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>
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
  );
}
