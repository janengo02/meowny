import { useState } from 'react';
import { Card, Typography, Box, Grid } from '@mui/material';
import { ExpenseBucketCard } from '../../bucket/components/ExpenseBucketCard';
import { AddExpenseBucketCard } from '../../bucket/components/AddExpenseBucketCard';
import { BucketModal } from '../../bucket/components/BucketModal';
import { useAppSelector } from '../../../store/hooks';
import {
  selectAccountById,
  selectBucketsByAccount,
} from '../selectors/accountSelectors';

interface ExpenseAccountCardProps {
  accountId: number;
}

export function ExpenseAccountCard({ accountId }: ExpenseAccountCardProps) {
  const account = useAppSelector((state) =>
    selectAccountById(state, accountId),
  );

  const buckets = useAppSelector((state) =>
    selectBucketsByAccount(state, accountId),
  );

  const [selectedBucketId, setSelectedBucketId] = useState<number | null>(null);

  if (!account) return null;

  return (
    <>
      <Grid container>
        <Grid size={12}>
          <Card
            sx={{
              px: 1.5,
              py: 1,
              height: '100%',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Typography
                variant="body1"
                fontWeight="bold"
                sx={{
                  color: 'white',
                }}
              >
                {account.name}
              </Typography>

              {buckets.map((bucket) => (
                <ExpenseBucketCard
                  key={bucket.id}
                  bucket={bucket}
                  onClick={() => setSelectedBucketId(bucket.id)}
                />
              ))}
              <AddExpenseBucketCard
                account={account}
                categoryId={null}
              />
            </Box>
          </Card>
        </Grid>
      </Grid>

      <BucketModal
        bucketId={selectedBucketId}
        open={selectedBucketId !== null}
        onClose={() => setSelectedBucketId(null)}
      />
    </>
  );
}
