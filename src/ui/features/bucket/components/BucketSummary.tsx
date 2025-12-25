import { Box, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import { formatMoney, formatPercent, formatUnits } from '../../../shared/utils';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ImportExportIcon from '@mui/icons-material/ImportExport';
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
                  </Box>
                  <Tooltip
                    title="Create new transaction"
                    slotProps={{
                      tooltip: {
                        sx: {
                          fontSize: '0.75rem',
                        },
                      },
                    }}
                  >
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
                      <ImportExportIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
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
                  </Box>
                  <Tooltip
                    title="Report market value"
                    slotProps={{
                      tooltip: {
                        sx: {
                          fontSize: '0.75rem',
                        },
                      },
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => setMarketValueModalOpen(true)}
                      sx={{
                        ml: 1,
                        bgcolor: 'warning.main',
                        color: 'warning.contrastText',
                        '&:hover': {
                          bgcolor: 'warning.dark',
                        },
                      }}
                    >
                      <TrendingUpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
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
                <Tooltip
                  title="Create new transaction"
                  slotProps={{
                    tooltip: {
                      sx: {
                        fontSize: '0.75rem',
                      },
                    },
                  }}
                >
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
                    <ImportExportIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
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
