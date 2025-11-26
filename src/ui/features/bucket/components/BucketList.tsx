import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import { useAppSelector } from '../../../store/hooks';
import { useCreateBucketMutation, useGetBucketsQuery } from '../api/bucketApi';
import { useDashboardError } from '../../dashboard/hooks/useDashboardError';
import AddIcon from '@mui/icons-material/Add';
import { BucketCard } from './BucketCard';
import { BucketModal } from './BucketModal';

export function BucketList() {
  const buckets = useAppSelector((state) => state.bucket.buckets);
  const [selectedBucketId, setSelectedBucketId] = useState<number | null>(null);
  const { isLoading: isLoadingBuckets, error: bucketsError } =
    useGetBucketsQuery();
  const [createBucket, { isLoading: isCreatingBucket }] =
    useCreateBucketMutation();
  const { setError } = useDashboardError();

  if (bucketsError) {
    setError('Failed to load buckets. Please try again.');
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

  if (isLoadingBuckets) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

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
              <BucketCard
                bucket={bucket}
                onClick={() => setSelectedBucketId(bucket.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <BucketModal
        bucketId={selectedBucketId}
        open={selectedBucketId !== null}
        onClose={() => setSelectedBucketId(null)}
      />
    </Box>
  );
}
