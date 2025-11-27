import { useState } from 'react';
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import EditIcon from '@mui/icons-material/Edit';
import { useGetBucketQuery } from '../api/bucketApi';
import { BucketTypeSelect } from './BucketTypeSelect';
import { BucketCategorySelect } from './BucketCategorySelect';
import { BucketLocationSelect } from './BucketLocationSelect';
import { BucketValueHistoryTable } from './BucketValueHistoryTable';
import { TransactionModal } from '../../transaction/components/TransactionModal';
import { MarketValueModal } from './MarketValueModal';
import { BucketGoal } from './BucketGoal';
import { formatMoney, formatPercent } from '../../../shared/utils';

interface BucketModalProps {
  bucketId: number | null;
  open: boolean;
  onClose: () => void;
}

export function BucketModal({ bucketId, open, onClose }: BucketModalProps) {
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [marketValueModalOpen, setMarketValueModalOpen] = useState(false);
  const { data: bucket, isLoading } = useGetBucketQuery(bucketId!, {
    skip: !bucketId,
  });

  if (!bucketId) return null;

  if (isLoading || !bucket) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 6,
          }}
        >
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }

  const gainLoss = bucket.market_value - bucket.contributed_amount;
  const gainLossPercent =
    bucket.contributed_amount > 0
      ? (gainLoss / bucket.contributed_amount) * 100
      : 0;
  const isPositive = gainLoss >= 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.default',
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="h2" component="span">
            {bucket.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <BucketTypeSelect bucketId={bucket.id} value={bucket.type} />
            <BucketCategorySelect
              bucketId={bucket.id}
              value={bucket.bucket_category_id}
            />
            <BucketLocationSelect
              bucketId={bucket.id}
              value={bucket.bucket_location_id}
            />
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Summary Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Contributed/Spent - shown for all types */}
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 1,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                position: 'relative',
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
                  <Typography variant="h3" sx={{ mt: 0.5 }}>
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

          {/* Investment-only fields */}
          {bucket.type === 'investment' && (
            <>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    position: 'relative',
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
                      <Typography variant="h3" sx={{ mt: 0.5 }}>
                        {formatMoney(bucket.market_value)}
                      </Typography>
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
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Gain/Loss
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      mt: 0.5,
                      color: isPositive ? 'success.main' : 'error.main',
                    }}
                  >
                    {formatMoney(gainLoss, { showSign: true })}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Return
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      mt: 0.5,
                      color: isPositive ? 'success.main' : 'error.main',
                    }}
                  >
                    {formatPercent(gainLossPercent, 2, true)}
                  </Typography>
                </Box>
              </Grid>
            </>
          )}
        </Grid>

        {/* Graph Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Performance
          </Typography>
          <Box
            sx={{
              height: 240,
              borderRadius: 1,
              bgcolor: 'background.paper',
              border: '1px dashed',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <TrendingUpIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
            <Typography color="text.secondary">
              Performance graph coming soon
            </Typography>
          </Box>
        </Box>

        {/* Bucket Goal Section */}
        <Divider sx={{ my: 3 }} />
        <BucketGoal bucketId={bucketId} />

        {/* Value History Logs Section */}
        <Divider sx={{ my: 3 }} />
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Value History Logs
          </Typography>
          <BucketValueHistoryTable bucketId={bucketId} bucketType={bucket.type} />
        </Box>

        {/* Notes Section */}
        {bucket.notes && (
          <>
            <Divider sx={{ mb: 3 }} />
            <Box>
              <Typography variant="h3" sx={{ mb: 1 }}>
                Notes
              </Typography>
              <Typography color="text.secondary">{bucket.notes}</Typography>
            </Box>
          </>
        )}

        {/* Metadata */}
        <Divider sx={{ my: 3 }} />
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Created
            </Typography>
            <Typography variant="body2">
              {new Date(bucket.created_at).toLocaleDateString()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Last Updated
            </Typography>
            <Typography variant="body2">
              {new Date(bucket.updated_at).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <TransactionModal
        bucketId={bucketId}
        open={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
      />
      <MarketValueModal
        bucketId={bucketId}
        currentMarketValue={bucket.market_value}
        currentContributedAmount={bucket.contributed_amount}
        open={marketValueModalOpen}
        onClose={() => setMarketValueModalOpen(false)}
      />
    </Dialog>
  );
}
