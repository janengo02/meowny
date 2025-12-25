import { Typography } from '@mui/material';
import { useGetIncomeTaxesByIncomeHistoryQuery } from '../api/incomeTaxApi';
import { formatMoney } from '../../../shared/utils';

interface NetAmountCellProps {
  incomeHistoryId: number;
  grossAmount: number;
}

export function NetAmountCell({
  incomeHistoryId,
  grossAmount,
}: NetAmountCellProps) {
  const { data: incomeTaxes = [] } =
    useGetIncomeTaxesByIncomeHistoryQuery(incomeHistoryId);

  // Calculate total tax amount
  const totalTaxAmount = incomeTaxes.reduce(
    (sum, tax) => sum + tax.tax_amount,
    0,
  );

  // Calculate net amount
  const netAmount = grossAmount - totalTaxAmount;

  return (
    <Typography
      variant="body1"
      fontWeight={600}
      sx={{ paddingY: 1, color: 'text.secondary' }}
    >
      {formatMoney(netAmount)}
    </Typography>
  );
}
