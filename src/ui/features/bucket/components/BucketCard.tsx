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
    <Card>
      <CardActionArea onClick={onClick}>
        <CardContent>
          <Typography variant="h3" gutterBottom>
            {bucket.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip
              label={bucket.type}
              size="small"
              color="primary"
              variant="outlined"
            />
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
                Contributed
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                ${bucket.contributed_amount.toFixed(2)}
              </Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary">
                Market Value
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                ${bucket.market_value.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
          {bucket.notes && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 2,
                pt: 2,
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              {bucket.notes}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
