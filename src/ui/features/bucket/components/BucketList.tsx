import { useState, useEffect } from 'react';
import { Box, Button, CircularProgress, Grid, Typography } from '@mui/material';
import { useAppSelector } from '../../../store/hooks';
import { useCreateBucketMutation, useGetBucketsQuery } from '../api/bucketApi';
import { useDashboardError } from '../../dashboard/hooks/useDashboardError';
import AddIcon from '@mui/icons-material/Add';
import { BucketCard } from './BucketCard';
import { BucketModal } from './BucketModal';
import { AddBucketCard } from './AddBucketCard';

interface BucketListProps {
  type?: BucketTypeEnum;
  title?: string;
  showCreateButton?: boolean;
  onModalOpenChange?: (isOpen: boolean) => void;
}

export function BucketList({
  type,
  title = 'Your Buckets',
  showCreateButton = true,
  onModalOpenChange,
}: BucketListProps) {
  const allBuckets = useAppSelector((state) => state.bucket.buckets);
  const buckets = type
    ? allBuckets.filter((bucket) => bucket.type === type)
    : allBuckets;
  const [selectedBucketId, setSelectedBucketId] = useState<number | null>(null);
  const { isLoading: isLoadingBuckets, error: bucketsError } =
    useGetBucketsQuery();
  const [createBucket, { isLoading: isCreatingBucket }] =
    useCreateBucketMutation();
  const { setError } = useDashboardError();

  if (bucketsError) {
    setError('Failed to load buckets. Please try again.');
  }

  useEffect(() => {
    onModalOpenChange?.(selectedBucketId !== null);
  }, [selectedBucketId, onModalOpenChange]);

  const handleCreateBucket = async () => {
    try {
      const bucketType = type || 'expense';
      const result = await createBucket({
        name: `New ${bucketType.charAt(0).toUpperCase() + bucketType.slice(1)} Bucket`,
        type: bucketType,
        notes: '',
      }).unwrap();
      // Open the modal for the newly created bucket
      setSelectedBucketId(result.id);
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
        <Typography variant="h2">{title}</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {showCreateButton && (
            <Button
              variant="text"
              startIcon={<AddIcon />}
              onClick={handleCreateBucket}
              disabled={isCreatingBucket}
            >
              New
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={2}>
        {buckets.map((bucket) => (
          <Grid
            size={
              type === 'expense'
                ? { xs: 12, sm: 3, md: 2 }
                : { xs: 12, sm: 6, md: 4 }
            }
            key={bucket.id}
            sx={{ display: 'flex' }}
          >
            <BucketCard
              bucket={bucket}
              onClick={() => setSelectedBucketId(bucket.id)}
            />
          </Grid>
        ))}
        <Grid
          size={
            type === 'expense'
              ? { xs: 4, sm: 3, md: 2 }
              : { xs: 12, sm: 6, md: 6 }
          }
          sx={{ display: 'flex' }}
        >
          <AddBucketCard onClick={handleCreateBucket} />
        </Grid>
      </Grid>

      <BucketModal
        bucketId={selectedBucketId}
        open={selectedBucketId !== null}
        onClose={() => setSelectedBucketId(null)}
      />
    </Box>
  );
}
