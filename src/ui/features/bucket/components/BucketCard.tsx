import {
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Typography,
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
          <Typography variant="h3" gutterBottom>
            {bucket.name}
          </Typography>
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
                <Grid size={6}>
                  <Typography variant="caption" color="text.secondary">
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
