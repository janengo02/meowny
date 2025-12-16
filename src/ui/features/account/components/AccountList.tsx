import { Grid, Typography, Box } from '@mui/material';
import { useAppSelector } from '../../../store/hooks';
import { AccountCard } from './AccountCard';
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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h2" gutterBottom>
          {type.charAt(0).toUpperCase() + type.slice(1)} Accounts
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {accountIds.map((accountId) => (
          <Grid key={accountId} size={{ xs: 12 }}>
            <AccountCard accountId={accountId} />
          </Grid>
        ))}

        <Grid size={{ xs: 12 }}>
          <AddAccountCard type={type} />
        </Grid>
      </Grid>
    </>
  );
}
