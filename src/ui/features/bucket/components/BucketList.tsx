import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import { useAppSelector } from '../../../store/hooks';
import {
  useCreateBucketMutation,
  useGetBucketsQuery,
} from '../api/bucketApi';
import { useDashboardError } from '../../dashboard/hooks/useDashboardError';
import AddIcon from '@mui/icons-material/Add';

export function BucketList() {
  const buckets = useAppSelector((state) => state.bucket.buckets);
  const { isLoading: isLoadingBuckets, error: bucketsError } =
    useGetBucketsQuery();
  const [createBucket, { isLoading: isCreatingBucket }] =
    useCreateBucketMutation();
  const { setError } = useDashboardError();

  if (bucketsError) {
    setError('Failed to load buckets. Please try again.');
  }

  if (isLoadingBuckets) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleCreateBucket = async () => {
    try {
      await createBucket({
        name: `Bucket ${buckets.length + 1}`,
        type: 'expense',
        notes: 'Created from dashboard',
      }).unwrap();
    } catch {
      setError('Failed to create bucket. Please try again.');
    }
  };
  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h2">Your Buckets</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateBucket}
          disabled={isCreatingBucket}
        >
          Create Bucket
        </Button>
      </Box>

      {buckets.length === 0 ? (
        <Card
          sx={{
            border: '1px dashed',
            borderColor: 'divider',
            bgcolor: 'transparent',
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">
              No buckets yet. Create your first bucket to get started!
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {buckets.map((bucket) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={bucket.id}>
              <Card>
                <CardContent>
                  <Typography variant="h3" gutterBottom>
                    {bucket.name}
                  </Typography>
                  <Chip
                    label={bucket.type}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ textTransform: 'capitalize', mb: 2 }}
                  />
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
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
