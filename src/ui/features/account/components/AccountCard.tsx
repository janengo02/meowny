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
}

export function AccountCard({ accountId }: AccountCardProps) {
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
            <Grid key={bucket.id} size={{ xs: 6, sm: 3, md: 2 }}>
              <BucketCard
                bucket={bucket}
                onClick={() => setSelectedBucketId(bucket.id)}
              />
            </Grid>
          ))}
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
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
