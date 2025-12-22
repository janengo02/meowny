import { Box, Grid, IconButton, Typography } from '@mui/material';
import { formatMoney, formatPercent, formatUnits } from '../../../shared/utils';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import EditIcon from '@mui/icons-material/Edit';
import { useState } from 'react';
import { TransactionModal } from '../../transaction/components/TransactionModal';
import { MarketValueModal } from './MarketValueModal';

interface BucketSummaryProps {
  bucket: Bucket;
}
export function BucketSummary({ bucket }: BucketSummaryProps) {
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [marketValueModalOpen, setMarketValueModalOpen] = useState(false);

  const gainLoss = bucket.market_value - bucket.contributed_amount;
  const gainLossPercent =
    bucket.contributed_amount > 0
      ? (gainLoss / bucket.contributed_amount) * 100
      : 0;
  const isPositive = gainLoss >= 0;

  const totalUnits = bucket.total_units ?? 0;

  return (
    <>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Investment-only fields */}
        {bucket.type === 'investment' && (
          <>
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

            {/* Contributed with Avg Cost/Unit */}
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
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Contributed
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 0.5 }}>
                      {formatMoney(bucket.contributed_amount)}
                    </Typography>
                    {bucket.type === 'investment' && totalUnits > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {formatMoney(bucket.contributed_amount / totalUnits)}{' '}
                        per unit
                      </Typography>
                    )}
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => setTransactionModalOpen(true)}
                    sx={{
                      ml: 1,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                    }}
                  >
                    <SyncAltIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Grid>

            {/* Market Value with Current Price/Unit */}
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
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Market Value
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 0.5 }}>
                      {formatMoney(bucket.market_value)}
                    </Typography>
                    {bucket.type === 'investment' && totalUnits > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {formatMoney(bucket.market_value / totalUnits)} per unit
                      </Typography>
                    )}
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => setMarketValueModalOpen(true)}
                    sx={{
                      ml: 1,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
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
                <Typography variant="caption" color="text.secondary">
                  Gain/Loss
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    mt: 0.5,
                    color: isPositive ? 'success.main' : 'error.main',
                  }}
                >
                  {formatMoney(gainLoss, { showSign: true })}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    display: 'block',
                    color: isPositive ? 'success.main' : 'error.main',
                  }}
                >
                  Return: {formatPercent(gainLossPercent, 2, true)}
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
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {bucket.type === 'expense' ? 'Spent' : 'Contributed'}
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 0.5 }}>
                    {formatMoney(bucket.contributed_amount)}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => setTransactionModalOpen(true)}
                  sx={{
                    ml: 1,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  }}
                >
                  <SyncAltIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Transaction Modal */}
      <TransactionModal
        bucketId={bucket.id}
        open={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
      />
      <MarketValueModal
        bucketId={bucket.id}
        currentMarketValue={bucket.market_value}
        open={marketValueModalOpen}
        onClose={() => setMarketValueModalOpen(false)}
      />
    </>
  );
}
