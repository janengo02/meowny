import { Box, Grid, Typography } from '@mui/material';
import { formatMoney, formatPercent, formatUnits } from '../../../shared/utils';

interface BucketSummaryProps {
  bucket: Bucket;
}
export function BucketSummary({ bucket }: BucketSummaryProps) {
  const gainLoss = bucket.market_value - bucket.contributed_amount;
  const gainLossPercent =
    bucket.contributed_amount > 0
      ? (gainLoss / bucket.contributed_amount) * 100
      : 0;
  const isPositive = gainLoss >= 0;

  const totalUnits = bucket.total_units ?? 0;

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Investment-only fields */}
        {bucket.type === 'investment' && (
          <>
            {/* Contributed */}
            <Grid size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  position: 'relative',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Contributed
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.5 }}>
                  {formatMoney(bucket.contributed_amount)}
                </Typography>
              </Box>
            </Grid>

            {/* Market Value */}
            <Grid size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  position: 'relative',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Market Value
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.5 }}>
                  {formatMoney(bucket.market_value)}
                </Typography>
              </Box>
            </Grid>

            {/* Gain/Loss with Return % */}
            <Grid size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  Gain/Loss
                  <Typography
                    variant="caption"
                    color={isPositive ? 'success.main' : 'error.main'}
                  >
                    {`(${formatPercent(gainLossPercent, 2, true)})`}
                  </Typography>
                </Typography>

                <Typography
                  variant="h4"
                  color={isPositive ? 'success.main' : 'error.main'}
                  sx={{
                    mt: 0.5,
                  }}
                >
                  {formatMoney(gainLoss, { showSign: true })}{' '}
                </Typography>
              </Box>
            </Grid>

            {/* Total Units */}
            <Grid size={{ xs: 6, sm: 3 }} sx={{ display: 'flex' }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Total Units
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.5 }}>
                  {formatUnits(totalUnits)}
                </Typography>
              </Box>
            </Grid>
          </>
        )}

        {/* Non-investment buckets - Contributed/Spent only */}
        {bucket.type !== 'investment' && (
          <Grid size={{ xs: 12, sm: 3 }} sx={{ display: 'flex' }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                position: 'relative',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {bucket.type === 'expense' ? 'Spent' : 'Contributed'}
              </Typography>
              <Typography variant="h4" sx={{ mt: 0.5 }}>
                {formatMoney(bucket.contributed_amount)}
              </Typography>
            </Box>
          </Grid>
        )}
    </Grid>
  );
}
