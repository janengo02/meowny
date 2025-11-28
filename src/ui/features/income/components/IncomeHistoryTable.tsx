import {
  Box,
  Button,
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
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  useGetIncomeHistoriesBySourceQuery,
  useCreateIncomeHistoryMutation,
  useUpdateIncomeHistoryMutation,
  useDeleteIncomeHistoryMutation,
} from '../api/incomeHistoryApi';
import {
  useGetIncomeTaxesByIncomeHistoryQuery,
  useCreateIncomeTaxMutation,
} from '../api/incomeTaxApi';
import { IncomeCategorySelect } from './IncomeCategorySelect';
import { IncomeGrossInput } from './IncomeGrossInput';
import { ReceivedDateInput } from './ReceivedDateInput';
import { TaxCell } from './TaxCell';
import { NetAmountCell } from './NetAmountCell';

interface IncomeHistoryTableProps {
  incomeSourceId: number;
}

interface IncomeHistoryRowActionsProps {
  historyId: number;
  incomeId: number;
  incomeCategoryId: number | null;
  grossAmount: number;
  onDelete: (historyId: number) => void;
}

function IncomeHistoryRowActions({
  historyId,
  incomeId,
  incomeCategoryId,
  grossAmount,
  onDelete,
}: IncomeHistoryRowActionsProps) {
  const { data: incomeTaxes = [] } =
    useGetIncomeTaxesByIncomeHistoryQuery(historyId);
  const [createIncomeHistory] = useCreateIncomeHistoryMutation();
  const [createIncomeTax] = useCreateIncomeTaxMutation();

  const handleDuplicate = async () => {
    try {
      const now = new Date().toISOString();

      // Create new income history with same values
      const newHistory = await createIncomeHistory({
        income_id: incomeId,
        income_category_id: incomeCategoryId,
        gross_amount: grossAmount,
        received_date: now,
      }).unwrap();

      // Duplicate all taxes associated with the original income history
      for (const tax of incomeTaxes) {
        await createIncomeTax({
          income_history_id: newHistory.id,
          tax_category_id: tax.tax_category_id,
          tax_amount: tax.tax_amount,
        }).unwrap();
      }
    } catch (error) {
      console.error('Failed to duplicate income history:', error);
    }
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={handleDuplicate}
        color="primary"
        title="Duplicate"
      >
        <ContentCopyIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => onDelete(historyId)}
        color="error"
        title="Delete"
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </>
  );
}

export function IncomeHistoryTable({
  incomeSourceId,
}: IncomeHistoryTableProps) {
  const { data: incomeHistories = [], isLoading } =
    useGetIncomeHistoriesBySourceQuery(incomeSourceId);
  const [createIncomeHistory, { isLoading: isCreating }] =
    useCreateIncomeHistoryMutation();
  const [updateIncomeHistory] = useUpdateIncomeHistoryMutation();
  const [deleteIncomeHistory] = useDeleteIncomeHistoryMutation();

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
      const now = new Date().toISOString();
      await createIncomeHistory({
        income_id: incomeSourceId,
        gross_amount: 0,
        received_date: now,
      }).unwrap();
    } catch (error) {
      console.error('Failed to create income history:', error);
    }
  };

  const handleCategoryChange = async (
    historyId: number,
    categoryId: number | null,
  ) => {
    try {
      await updateIncomeHistory({
        id: historyId,
        params: { income_category_id: categoryId },
      }).unwrap();
    } catch (error) {
      console.error('Failed to update income category:', error);
    }
  };

  const handleDeleteHistory = async (historyId: number) => {
    try {
      await deleteIncomeHistory(historyId).unwrap();
    } catch (error) {
      console.error('Failed to delete income history:', error);
    }
  };

  const handleGrossAmountSave = async (
    historyId: number,
    newAmount: number,
  ) => {
    try {
      await updateIncomeHistory({
        id: historyId,
        params: { gross_amount: newAmount },
      }).unwrap();
    } catch (error) {
      console.error('Failed to update gross amount:', error);
    }
  };

  const handleReceivedDateSave = async (historyId: number, newDate: string) => {
    try {
      await updateIncomeHistory({
        id: historyId,
        params: { received_date: newDate },
      }).unwrap();
    } catch (error) {
      console.error('Failed to update received date:', error);
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
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
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
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
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
              <TableCell>Received Date</TableCell>
              <TableCell>Income Category</TableCell>
              <TableCell align="right" width={150}>
                Gross Amount
              </TableCell>
              <TableCell width={300}>Tax</TableCell>
              <TableCell align="right">Net Amount</TableCell>
              <TableCell>Notes</TableCell>
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
                    value={history.received_date}
                    onSave={(newDate) =>
                      handleReceivedDateSave(history.id, newDate)
                    }
                  />
                </TableCell>
                <TableCell>
                  <IncomeCategorySelect
                    value={history.income_category_id}
                    onChange={(categoryId) =>
                      handleCategoryChange(history.id, categoryId)
                    }
                  />
                </TableCell>
                <TableCell align="right" width={150}>
                  <IncomeGrossInput
                    value={history.gross_amount}
                    onSave={(newAmount) =>
                      handleGrossAmountSave(history.id, newAmount)
                    }
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
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {history.notes || '-'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <IncomeHistoryRowActions
                    historyId={history.id}
                    incomeId={incomeSourceId}
                    incomeCategoryId={history.income_category_id}
                    grossAmount={history.gross_amount}
                    onDelete={handleDeleteHistory}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
