import { useState } from 'react';
import { Card, Typography, Box, Grid } from '@mui/material';
import { ExpenseBucketCard } from '../../bucket/components/ExpenseBucketCard';
import { AddExpenseBucketCard } from '../../bucket/components/AddExpenseBucketCard';
import { AddCategoryCard } from '../../bucket/components/AddCategoryCard';
import { BucketModal } from '../../bucket/components/BucketModal';
import { useAppSelector } from '../../../store/hooks';
import {
  selectAccountById,
  selectBucketsByAccount,
  selectAllBucketCategories,
} from '../selectors/accountSelectors';
import { getColorConfig } from '../../../shared/theme/colors';
import { ExpenseCategoryModal } from '../../bucket/components/ExpenseCategoryModal';

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

  const categories = useAppSelector(selectAllBucketCategories);

  const [selectedBucketId, setSelectedBucketId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  if (!account) return null;

  // Group buckets by category
  const uncategorizedBuckets = buckets.filter(
    (bucket) => bucket.bucket_category_id === null,
  );

  const categoriesWithBuckets = categories
    .map((category) => {
      const categoryBuckets = buckets.filter(
        (bucket) => bucket.bucket_category_id === category.id,
      );
      return {
        category,
        buckets: categoryBuckets,
      };
    })
    .filter((group) => group.buckets.length > 0);

  const allGroups = [
    ...categoriesWithBuckets,
    ...[{ category: null, buckets: uncategorizedBuckets }],
  ];

  return (
    <>
      <Grid container>
        {allGroups.map((group) => (
          <Grid key={group.category?.id ?? 'uncategorized'} size={12}>
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
                    color: group.category
                      ? getColorConfig(group.category.color).color
                      : 'white',
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                  onClick={() => {
                    setSelectedCategoryId(group.category?.id ?? null);
                    setIsCategoryModalOpen(true);
                  }}
                >
                  {group.category?.name ?? 'Uncategorized'}
                </Typography>

                {group.buckets.map((bucket) => (
                  <ExpenseBucketCard
                    key={bucket.id}
                    bucket={bucket}
                    onClick={() => setSelectedBucketId(bucket.id)}
                    category={group.category}
                  />
                ))}
                <AddExpenseBucketCard
                  account={account}
                  categoryId={group.category?.id ?? null}
                />
              </Box>
            </Card>
          </Grid>
        ))}

        {/* Add Category Card */}
        <Grid size={12}>
          <AddCategoryCard account={account} />
        </Grid>
      </Grid>

      <BucketModal
        bucketId={selectedBucketId}
        open={selectedBucketId !== null}
        onClose={() => setSelectedBucketId(null)}
      />

      <ExpenseCategoryModal
        categoryId={selectedCategoryId}
        open={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </>
  );
}
