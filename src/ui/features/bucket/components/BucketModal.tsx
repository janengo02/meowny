import {
  Box,
  Chip,
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
import CategoryIcon from '@mui/icons-material/Category';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { ChipSelect } from '../../../shared/components/ChipSelect';

const BUCKET_TYPES: BucketTypeEnum[] = ['expense', 'saving', 'investment'];

interface BucketModalProps {
  bucket: Bucket | null;
  category?: BucketCategory | null;
  location?: BucketLocation | null;
  open: boolean;
  onClose: () => void;
}

export function BucketModal({
  bucket,
  category,
  location,
  open,
  onClose,
}: BucketModalProps) {
  if (!bucket) return null;

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
            <ChipSelect
              value={bucket.type}
              options={BUCKET_TYPES}
              onChange={() => {}}
            />
            <Chip
              icon={<CategoryIcon sx={{ fontSize: 14 }} />}
              label={category ? category.name : 'Uncategorized'}
              size="small"
              variant="outlined"
              sx={
                category
                  ? { borderColor: category.color, color: category.color }
                  : { borderColor: 'text.secondary', color: 'text.secondary' }
              }
            />
            <Chip
              icon={<LocationOnIcon sx={{ fontSize: 14 }} />}
              label={location ? location.name : 'No location'}
              size="small"
              variant="outlined"
              sx={
                location
                  ? { borderColor: location.color, color: location.color }
                  : { borderColor: 'text.secondary', color: 'text.secondary' }
              }
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
                Contributed
              </Typography>
              <Typography variant="h3" sx={{ mt: 0.5 }}>
                ${bucket.contributed_amount.toFixed(2)}
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
                Market Value
              </Typography>
              <Typography variant="h3" sx={{ mt: 0.5 }}>
                ${bucket.market_value.toFixed(2)}
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
                Gain/Loss
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  mt: 0.5,
                  color: isPositive ? 'success.main' : 'error.main',
                }}
              >
                {isPositive ? '+' : ''}${gainLoss.toFixed(2)}
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
                {isPositive ? '+' : ''}
                {gainLossPercent.toFixed(2)}%
              </Typography>
            </Box>
          </Grid>
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
              Category
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: category ? category.color : 'text.secondary' }}
            >
              {category ? category.name : 'Uncategorized'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Location
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: location ? location.color : 'text.secondary' }}
            >
              {location ? location.name : 'No location'}
            </Typography>
          </Box>
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
    </Dialog>
  );
}
