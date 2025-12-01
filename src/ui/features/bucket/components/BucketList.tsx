import { useState, useEffect, useMemo } from 'react';
import { Box, Button, CircularProgress, Grid, Typography } from '@mui/material';
import { useAppSelector } from '../../../store/hooks';
import { useCreateBucketMutation, useGetBucketsQuery } from '../api/bucketApi';
import { useGetBucketCategoriesQuery } from '../api/bucketCategoryApi';
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
  const { data: categories = [], isLoading: isLoadingCategories } =
    useGetBucketCategoriesQuery();
  const [createBucket, { isLoading: isCreatingBucket }] =
    useCreateBucketMutation();
  const { setError } = useDashboardError();

  if (bucketsError) {
    setError('Failed to load buckets. Please try again.');
  }

  // Group buckets by category
  const groupedBuckets = useMemo(() => {
    const uncategorized: Bucket[] = [];
    const categorized: Record<number, Bucket[]> = {};

    buckets.forEach((bucket) => {
      if (bucket.bucket_category_id === null) {
        uncategorized.push(bucket);
      } else {
        if (!categorized[bucket.bucket_category_id]) {
          categorized[bucket.bucket_category_id] = [];
        }
        categorized[bucket.bucket_category_id].push(bucket);
      }
    });

    return { uncategorized, categorized };
  }, [buckets]);

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

  if (isLoadingBuckets || isLoadingCategories) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const gridSize =
    type === 'expense'
      ? { xs: 12, sm: 3, md: 2 }
      : { xs: 12, sm: 6, md: 4 };

  const renderBucketGrid = (buckets: Bucket[]) => (
    <>
      {buckets.map((bucket) => (
        <Grid size={gridSize} key={bucket.id} sx={{ display: 'flex' }}>
          <BucketCard
            bucket={bucket}
            onClick={() => setSelectedBucketId(bucket.id)}
          />
        </Grid>
      ))}
    </>
  );

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

      {/* Uncategorized buckets */}
      {groupedBuckets.uncategorized.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            {renderBucketGrid(groupedBuckets.uncategorized)}
            {Object.keys(groupedBuckets.categorized).length === 0 && (
              <Grid size={gridSize} sx={{ display: 'flex' }}>
                <AddBucketCard onClick={handleCreateBucket} />
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Categorized buckets */}
      {categories.map((category) => {
        const categoryBuckets = groupedBuckets.categorized[category.id];
        if (!categoryBuckets || categoryBuckets.length === 0) return null;

        return (
          <Box key={category.id} sx={{ mb: 3 }}>
            <Typography
              variant="h3"
              sx={{
                mb: 1.5,
                color: `${category.color}.main`,
              }}
            >
              {category.name}
            </Typography>
            <Grid container spacing={2}>
              {renderBucketGrid(categoryBuckets)}
            </Grid>
          </Box>
        );
      })}

      {/* Add bucket card at the end */}
      {(groupedBuckets.uncategorized.length > 0 ||
        Object.keys(groupedBuckets.categorized).length > 0) && (
        <Box>
          <Grid container spacing={2}>
            <Grid size={gridSize} sx={{ display: 'flex' }}>
              <AddBucketCard onClick={handleCreateBucket} />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Empty state */}
      {groupedBuckets.uncategorized.length === 0 &&
        Object.keys(groupedBuckets.categorized).length === 0 && (
          <Grid container spacing={2}>
            <Grid size={gridSize} sx={{ display: 'flex' }}>
              <AddBucketCard onClick={handleCreateBucket} />
            </Grid>
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
