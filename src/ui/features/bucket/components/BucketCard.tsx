import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  Typography,
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { formatMoney } from '../../../shared/utils';

interface BucketCardProps {
  bucket: Bucket;
  category?: BucketCategory | null;
  location?: BucketLocation | null;
  onClick?: () => void;
}

export function BucketCard({
  bucket,
  category,
  location,
  onClick,
}: BucketCardProps) {
  return (
    <Card sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardActionArea onClick={onClick} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%' }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h3" gutterBottom>
            {bucket.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {category && (
              <Chip
                icon={<CategoryIcon sx={{ fontSize: 14 }} />}
                label={category.name}
                size="small"
                variant="outlined"
                sx={{ borderColor: category.color, color: category.color }}
              />
            )}
            {location && (
              <Chip
                icon={<LocationOnIcon sx={{ fontSize: 14 }} />}
                label={location.name}
                size="small"
                variant="outlined"
                sx={{ borderColor: location.color, color: location.color }}
              />
            )}
          </Box>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary">
                {bucket.type === 'expense' ? 'Spent' : 'Contributed'}
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
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
