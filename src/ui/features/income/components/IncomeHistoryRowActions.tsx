import { memo } from 'react';
import dayjs from 'dayjs';
import { formatDateForDB } from '../../../shared/utils/dateTime';
import { useCreateIncomeHistoryMutation, useDeleteIncomeHistoryMutation } from '../api/incomeHistoryApi';
import { useCreateIncomeTaxMutation, useGetIncomeTaxesByIncomeHistoryQuery } from '../api/incomeTaxApi';
import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface IncomeHistoryRowActionsProps {
  historyId: number;
  incomeId: number;
  incomeCategoryId: number | null;
  grossAmount: number;
}

function IncomeHistoryRowActionsComponent({
  historyId,
  incomeId,
  incomeCategoryId,
  grossAmount,
}: IncomeHistoryRowActionsProps) {
  const { data: incomeTaxes = [] } =
    useGetIncomeTaxesByIncomeHistoryQuery(historyId);
  const [createIncomeHistory] = useCreateIncomeHistoryMutation();
  const [createIncomeTax] = useCreateIncomeTaxMutation();
  const [deleteIncomeHistory] = useDeleteIncomeHistoryMutation();


  const handleDeleteHistory = async (historyId: number) => {
    try {
      await deleteIncomeHistory(historyId).unwrap();
    } catch (error) {
      console.error('Failed to delete income history:', error);
    }
  };

  const handleDuplicate = async () => {
    try {
      // Create new income history with same values
      const newHistory = await createIncomeHistory({
        income_id: incomeId,
        income_category_id: incomeCategoryId,
        gross_amount: grossAmount,
        received_date: formatDateForDB(dayjs()),
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
        <ContentCopyIcon fontSize="small" sx={{ fontSize: '1rem' }} />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => handleDeleteHistory(historyId)}
        color="error"
        title="Delete"
      >
        <DeleteIcon fontSize="small" sx={{ fontSize: '1rem' }} />
      </IconButton>
    </>
  );
}

export const IncomeHistoryRowActions = memo(IncomeHistoryRowActionsComponent);