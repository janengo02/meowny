import { useFormContext, useWatch } from 'react-hook-form';
import {
  TableRow,
  TableCell,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { FormMoneyInput } from '../../../shared/components/form/FormMoneyInput';
import { FormTextField } from '../../../shared/components/form/FormTextField';
import { formatMoney, formatPercent, formatUnits } from '../../../shared/utils';

interface InvestmentReportRowProps {
  index: number;
  onRemove: (index: number) => void;
}

export function InvestmentReportRow({
  index,
  onRemove,
}: InvestmentReportRowProps) {
  const { control } = useFormContext();

  // Watch the bucket data for this row
  const bucket = useWatch({
    control,
    name: `buckets.${index}`,
  });

  if (!bucket) return null;

  const gainLoss = bucket.market_value - bucket.contributed_amount;
  const gainLossPercent =
    bucket.contributed_amount > 0
      ? ((bucket.market_value - bucket.contributed_amount) /
          bucket.contributed_amount) *
        100
      : 0;
  const isPositive = gainLoss >= 0;

  return (
    <TableRow>
      <TableCell>
        <Typography variant="body2" fontWeight="medium">
          {bucket.bucket_name}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2">
          {bucket.total_units != null ? formatUnits(bucket.total_units) : 'N/A'}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2">
          {formatMoney(bucket.contributed_amount)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Box>
          <Typography
            variant="body2"
            sx={{
              color: isPositive ? 'success.main' : 'error.main',
            }}
          >
            {formatMoney(gainLoss, { showSign: true })}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: isPositive ? 'success.main' : 'error.main',
            }}
          >
            ({formatPercent(gainLossPercent, 2, true)})
          </Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ minWidth: 200 }}>
        <FormTextField
          name={`buckets.${index}.notes`}
          label=""
          placeholder="Notes..."
          multiline
          rows={1}
          size="small"
        />
      </TableCell>
      <TableCell align="right" sx={{ minWidth: 150 }}>
        <FormMoneyInput
          name={`buckets.${index}.market_value`}
          label=""
          variant="outlined"
          allowNegative={false}
          size="small"
        />
      </TableCell>

      <TableCell align="center">
        <IconButton onClick={() => onRemove(index)} size="small" color="error">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
