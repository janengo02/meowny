import {
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import { formatMoney, formatPercent } from '../../../shared/utils';
interface BucketCardProps {
  bucket: Bucket;
  onClick?: () => void;
}

export function BucketCard({ bucket, onClick }: BucketCardProps) {
  const gainLoss = bucket.market_value - bucket.contributed_amount;
  const gainLossPercent =
    bucket.contributed_amount > 0
      ? (gainLoss / bucket.contributed_amount) * 100
      : 0;
  const isPositive = gainLoss >= 0;

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          width: '100%',
        }}
      >
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'start', gap: 1, mb: 1 }}>
            <Typography variant="h3" sx={{ flex: 1 }}>
              {bucket.name}
            </Typography>
            {(bucket.type === 'saving' || bucket.type === 'investment') && (
              <Chip
                label={bucket.type.charAt(0).toUpperCase() + bucket.type.slice(1)}
                size="small"
                variant="outlined"
                color={bucket.type === 'saving' ? 'info' : 'warning'}
                sx={{ textTransform: 'capitalize' }}
              />
            )}
          </Box>
          {bucket.type !== 'expense' && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={6}>
                <Typography variant="caption" color="text.secondary">
                  Contributed
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatMoney(bucket.contributed_amount)}
                </Typography>
              </Grid>
              {bucket.type === 'investment' && (
                <>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">
                    Market Value
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatMoney(bucket.market_value)}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">
                    Units
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {bucket.total_units ? bucket.total_units.toFixed(4) : 0}
                  </Typography>
                </Grid>
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">
                    Gain/Lost
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    sx={{
                      mt: 0.5,
                      color: isPositive ? 'success.main' : 'error.main',
                    }}
                  >
                    {formatPercent(gainLossPercent, 2, true)}
                  </Typography>
                </Grid>
                </>
              )}
            </Grid>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
