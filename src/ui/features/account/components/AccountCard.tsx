import { useState } from 'react';
import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import { BucketCard } from '../../bucket/components/BucketCard';
import { AddBucketCard } from '../../bucket/components/AddBucketCard';
import { BucketModal } from '../../bucket/components/BucketModal';
import { useAppSelector } from '../../../store/hooks';
import {
  selectAccountById,
  selectBucketsByAccount,
} from '../selectors/accountSelectors';

interface AccountCardProps {
  accountId: number;
  columnWidth?: number; // Grid units (out of 12) for the parent column
}

export function AccountCard({ accountId, columnWidth = 12 }: AccountCardProps) {
  // Select account data - only re-renders if THIS account changes
  const account = useAppSelector((state) =>
    selectAccountById(state, accountId),
  );

  // Select buckets for THIS account - only re-renders if THIS account's buckets change
  const buckets = useAppSelector((state) =>
    selectBucketsByAccount(state, accountId),
  );

  const [selectedBucketId, setSelectedBucketId] = useState<number | null>(null);

  if (!account) return null;

  // Calculate bucket card size based on column width
  // For narrow columns (< 6 grid units), use full width
  // For medium columns (6-8 grid units), use half width
  // For wide columns (> 8 grid units), use smaller cards
  const getBucketCardSize = () => {
    switch (columnWidth) {
      case 12:
        return { xs: 6, sm: 4, md: 2 };
      case 11:
      case 10:
      case 9:
      case 8:
        return { xs: 12, sm: 6, md: 3 };
      case 7:
      case 6:
        return { xs: 12, sm: 6, md: 4 };
      case 5:
      case 4:
        return { xs: 12, sm: 6 };
      case 3:
      case 2:
      case 1:
      default:
        return { xs: 12 };
    }
  };

  const bucketCardSize = getBucketCardSize();

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              {account.name}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {buckets.map((bucket) => (
            <Grid key={bucket.id} size={bucketCardSize}>
              <BucketCard
                bucket={bucket}
                onClick={() => setSelectedBucketId(bucket.id)}
              />
            </Grid>
          ))}
          <Grid size={bucketCardSize}>
            <AddBucketCard account={account} />
          </Grid>
        </Grid>
      </CardContent>

      <BucketModal
        bucketId={selectedBucketId}
        open={selectedBucketId !== null}
        onClose={() => setSelectedBucketId(null)}
      />
    </Card>
  );
}
