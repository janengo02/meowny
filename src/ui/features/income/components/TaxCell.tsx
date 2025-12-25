import { useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import {
  useGetIncomeTaxesByIncomeHistoryQuery,
  useCreateIncomeTaxMutation,
  useUpdateIncomeTaxMutation,
  useDeleteIncomeTaxMutation,
} from '../api/incomeTaxApi';
import { TaxCategorySelect } from './TaxCategorySelect';
import { TaxAmountInput } from './TaxAmountInput';
import { formatMoney } from '../../../shared/utils';

interface TaxCellProps {
  incomeHistoryId: number;
  grossAmount: number;
}

export function TaxCell({ incomeHistoryId, grossAmount }: TaxCellProps) {
  const { data: incomeTaxes = [] } =
    useGetIncomeTaxesByIncomeHistoryQuery(incomeHistoryId);
  const [createIncomeTax] = useCreateIncomeTaxMutation();
  const [updateIncomeTax] = useUpdateIncomeTaxMutation();
  const [deleteIncomeTax] = useDeleteIncomeTaxMutation();
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort income taxes by ID in ascending order
  const sortedIncomeTaxes = [...incomeTaxes].sort((a, b) => a.id - b.id);

  // Calculate total tax amount
  const totalTaxAmount = sortedIncomeTaxes.reduce(
    (sum, tax) => sum + tax.tax_amount,
    0,
  );

  // Calculate percentage of gross amount
  const taxPercentage =
    grossAmount > 0 ? (totalTaxAmount / grossAmount) * 100 : 0;

  const handleAddTax = async () => {
    try {
      await createIncomeTax({
        income_history_id: incomeHistoryId,
        tax_amount: 0,
      }).unwrap();
    } catch (error) {
      console.error('Failed to create tax:', error);
    }
  };

  const handleTaxCategoryChange = async (
    taxId: number,
    categoryId: number | null,
  ) => {
    try {
      await updateIncomeTax({
        id: taxId,
        params: { tax_category_id: categoryId },
      }).unwrap();
    } catch (error) {
      console.error('Failed to update tax category:', error);
    }
  };

  const handleTaxAmountSave = async (taxId: number, amount: number) => {
    try {
      await updateIncomeTax({
        id: taxId,
        params: { tax_amount: amount },
      }).unwrap();
    } catch (error) {
      console.error('Failed to update tax amount:', error);
    }
  };

  const handleDeleteTax = async (taxId: number) => {
    try {
      await deleteIncomeTax(taxId).unwrap();
    } catch (error) {
      console.error('Failed to delete tax:', error);
    }
  };

  return (
    <Box>
      {/* Tax Summary Row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" fontWeight={600}>
            Total Tax:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ({taxPercentage.toFixed(2)}%)
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {formatMoney(totalTaxAmount)}
          </Typography>

          <IconButton
            size="small"
            onClick={() => setIsExpanded(!isExpanded)}
            sx={{ ml: -0.5 }}
          >
            {isExpanded ? (
              <ExpandLessIcon sx={{ fontSize: '1rem' }} />
            ) : (
              <ExpandMoreIcon sx={{ fontSize: '1rem' }} />
            )}
          </IconButton>
        </Stack>
      </Box>

      {isExpanded && (
        <Stack spacing={1}>
          {sortedIncomeTaxes.map((tax) => (
            <Stack
              key={tax.id}
              pb={1}
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': {
                  borderBottom: 'none',
                },
              }}
            >
              <Box sx={{ minWidth: 120 }}>
                <TaxCategorySelect
                  value={tax.tax_category_id}
                  onChange={(categoryId) =>
                    handleTaxCategoryChange(tax.id, categoryId)
                  }
                />
              </Box>
              <Box sx={{ minWidth: 80 }}>
                <TaxAmountInput
                  value={tax.tax_amount}
                  onSave={(amount) => handleTaxAmountSave(tax.id, amount)}
                />
              </Box>
              <IconButton
                size="small"
                onClick={() => handleDeleteTax(tax.id)}
                color="error"
                sx={{ ml: 'auto' }}
              >
                <DeleteIcon fontSize="small" sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      )}

      {isExpanded && (
        <Button
          variant="text"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddTax}
          sx={{
            fontSize: '0.75rem',
            border: 'none',
            boxShadow: 'none',
            '&:hover': {
              // bgcolor: 'transparent',
              boxShadow: 'none',
              transform: 'none',
            },
            pl: 1,
            pr: 1.5,
            py: 0,
            mt: 0.5,
          }}
        >
          Add Tax
        </Button>
      )}
    </Box>
  );
}
