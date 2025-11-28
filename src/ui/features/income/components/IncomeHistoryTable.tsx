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
import {
  useGetIncomeHistoriesBySourceQuery,
  useCreateIncomeHistoryMutation,
  useUpdateIncomeHistoryMutation,
  useDeleteIncomeHistoryMutation,
} from '../api/incomeHistoryApi';
import { IncomeCategorySelect } from './IncomeCategorySelect';
import { IncomeGrossInput } from './IncomeGrossInput';

interface IncomeHistoryTableProps {
  incomeSourceId: number;
}

export function IncomeHistoryTable({
  incomeSourceId,
}: IncomeHistoryTableProps) {
  const { data: incomeHistories, isLoading } =
    useGetIncomeHistoriesBySourceQuery(incomeSourceId);
  const [createIncomeHistory, { isLoading: isCreating }] =
    useCreateIncomeHistoryMutation();
  const [updateIncomeHistory] = useUpdateIncomeHistoryMutation();
  const [deleteIncomeHistory] = useDeleteIncomeHistoryMutation();

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

  if (!incomeHistories || incomeHistories.length === 0) {
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
              <TableCell align="right">Tax</TableCell>
              <TableCell align="right">Net Amount</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell align="center" width={60}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {incomeHistories.map((history) => (
              <TableRow
                key={history.id}
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                }}
              >
                <TableCell>
                  <Typography variant="body2">
                    {new Date(history.received_date).toLocaleString()}
                  </Typography>
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
                <TableCell align="right">
                  <Typography variant="body2" color="text.secondary">
                    -
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="text.secondary">
                    -
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {history.notes || '-'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteHistory(history.id)}
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
    </Box>
  );
}
