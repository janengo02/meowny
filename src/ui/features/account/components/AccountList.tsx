import { Grid, Typography } from '@mui/material';
import { useAppSelector } from '../../../store/hooks';
import { AccountCard } from './AccountCard';
import { ExpenseAccountCard } from './ExpenseAccountCard';
import { AddAccountCard } from './AddAccountCard';
import { selectAccountIdsByType } from '../selectors/accountSelectors';

interface AccountListProps {
  type: AccountTypeEnum;
}

export function AccountList({ type }: AccountListProps) {
  // Only select account IDs - AccountCard will fetch its own buckets
  const accountIds = useAppSelector((state) =>
    selectAccountIdsByType(state, type),
  );

  return (
    <>
      <Typography variant="h2" sx={{ p: 1 }}>
        {type.charAt(0).toUpperCase() + type.slice(1)} Accounts
      </Typography>

      <Grid container>
        {accountIds.map((accountId) => (
          <Grid key={accountId} size={{ xs: 12 }}>
            {type === 'expense' ? (
              <ExpenseAccountCard accountId={accountId} />
            ) : (
              <AccountCard accountId={accountId} />
            )}
          </Grid>
        ))}

        {type !== 'expense' && (
          <Grid size={{ xs: 12 }}>
            <AddAccountCard type={type} />
          </Grid>
        )}
      </Grid>
    </>
  );
}
