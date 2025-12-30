import { Grid, Typography } from '@mui/material';
import { useAppSelector } from '../../../store/hooks';
import { AccountCard } from './AccountCard';
import { AddAccountCard } from './AddAccountCard';
import { selectAccountIdsByType } from '../selectors/accountSelectors';

export function AssetAccountList() {
  // Only select account IDs - AccountCard will fetch its own buckets
  const accountIds = useAppSelector((state) =>
    selectAccountIdsByType(state, 'asset'),
  );

  return (
    <>
      <Typography variant="h2" sx={{ p: 1 }}>
        Asset Accounts
      </Typography>

      <Grid container>
        {accountIds.map((accountId) => (
          <Grid key={accountId} size={{ xs: 12 }}>
            <AccountCard accountId={accountId} />
          </Grid>
        ))}

        <Grid size={{ xs: 12 }}>
          <AddAccountCard type="asset" />
        </Grid>
      </Grid>
    </>
  );
}
