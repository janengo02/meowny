import {
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import { formatMoney } from '../../../shared/utils';
interface BucketCardProps {
  bucket: Bucket;
  onClick?: () => void;
}

export function BucketCard({ bucket, onClick }: BucketCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translate(-2px, -2px)',
          boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.8)',
        },
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
        <CardContent
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            px: 2,
            py: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'start',
              gap: 1,
              mb: 1,
            }}
          >
            {(bucket.type === 'saving' || bucket.type === 'investment') && (
              <Chip
                label={
                  bucket.type.charAt(0).toUpperCase() + bucket.type.slice(1)
                }
                size="small"
                variant="outlined"
                color={bucket.type === 'saving' ? 'primary' : 'warning'}
                sx={{
                  textTransform: 'capitalize',
                  ml: -1,
                  fontSize: '0.75rem',
                }}
              />
            )}
            <Typography variant="h4" sx={{ flex: 1 }}>
              {bucket.name}
            </Typography>
          </Box>
          {bucket.type !== 'expense' && (
            <Grid container spacing={2} flexWrap="wrap">
              <Grid size={{ xs: 12, sm: 6 }} sx={{ width: 'fit-content' }}>
                <Typography variant="caption" color="text.secondary">
                  Contributed
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatMoney(bucket.contributed_amount)}
                </Typography>
              </Grid>
              {bucket.type === 'investment' && (
                <Grid size={{ xs: 12, sm: 6 }} sx={{ width: 'fit-content' }}>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    Market Value
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatMoney(bucket.market_value)}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
