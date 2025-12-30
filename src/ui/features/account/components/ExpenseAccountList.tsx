import { Grid, Typography } from '@mui/material';
import { useAppSelector } from '../../../store/hooks';
import { ExpenseAccountCard } from './ExpenseAccountCard';
import { selectAccountIdsByType } from '../selectors/accountSelectors';

export function ExpenseAccountList() {
  // Only select account IDs - ExpenseAccountCard will fetch its own buckets
  const accountIds = useAppSelector((state) =>
    selectAccountIdsByType(state, 'expense'),
  );

  return (
    <>
      <Typography variant="h2" sx={{ p: 1 }}>
        Expense Accounts
      </Typography>

      <Grid container>
        {accountIds.map((accountId) => (
          <Grid key={accountId} size={{ xs: 12 }}>
            <ExpenseAccountCard accountId={accountId} />
          </Grid>
        ))}
      </Grid>
    </>
  );
}
