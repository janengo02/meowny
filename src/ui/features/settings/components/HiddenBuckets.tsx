import { Box, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import { useGetHiddenBucketsQuery } from '../api/settingsApi';
import { BucketCard } from '../../bucket/components/BucketCard';
import { useState } from 'react';
import { BucketModal } from '../../bucket/components/BucketModal';
import { Navbar } from '../../dashboard/components/Navbar';

export function HiddenBuckets() {
  const { data: hiddenBuckets, isLoading, error } = useGetHiddenBucketsQuery();
  const [selectedBucketId, setSelectedBucketId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
          }}
        >
          <CircularProgress />
        </Box>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <Box sx={{ p: 3 }}>
          <Alert severity="error">Failed to load hidden buckets</Alert>
        </Box>
      </>
    );
  }

  const assetBuckets = hiddenBuckets?.filter(
    (b) => b.type === 'saving' || b.type === 'investment',
  ) || [];
  const expenseBuckets = hiddenBuckets?.filter((b) => b.type === 'expense') || [];

  return (
    <>
      <Navbar />
      <Box sx={{ p: 3 }}>
        <Typography variant="h1" sx={{ mb: 3 }}>
          Hidden Buckets
        </Typography>

        {!hiddenBuckets || hiddenBuckets.length === 0 ? (
          <Alert severity="info">No hidden buckets found</Alert>
        ) : (
          <>
            {assetBuckets.length > 0 && (
              <>
                <Typography variant="h2" sx={{ mb: 2, mt: 3 }}>
                  Asset Buckets
                </Typography>
                <Grid container spacing={2}>
                  {assetBuckets.map((bucket) => (
                    <Grid key={bucket.id} size={{ xs: 12, sm: 6, md: 4 }}>
                      <BucketCard
                        bucket={bucket}
                        onClick={() => setSelectedBucketId(bucket.id)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {expenseBuckets.length > 0 && (
              <>
                <Typography variant="h2" sx={{ mb: 2, mt: 3 }}>
                  Expense Buckets
                </Typography>
                <Grid container spacing={2}>
                  {expenseBuckets.map((bucket) => (
                    <Grid key={bucket.id} size={{ xs: 12, sm: 6, md: 4 }}>
                      <BucketCard
                        bucket={bucket}
                        onClick={() => setSelectedBucketId(bucket.id)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </>
        )}
      </Box>

      <BucketModal
        bucketId={selectedBucketId}
        open={selectedBucketId !== null}
        onClose={() => setSelectedBucketId(null)}
      />
    </>
  );
}
