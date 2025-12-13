import { useMemo } from 'react';
import { ChipAutocomplete } from '../../../shared/components/form/ChipAutocomplete';
import { useUpdateBucketMutation } from '../api/bucketApi';
import {
  useGetAccountsQuery,
  useCreateAccountMutation,
} from '../api/accountApi';

interface AccountSelectProps {
  bucketId: number;
  bucketType: BucketTypeEnum;
  value: number | null;
  disabled?: boolean;
}

export function AccountSelect({
  bucketId,
  bucketType,
  value,
  disabled = false,
}: AccountSelectProps) {
  const { data: accounts = [] } = useGetAccountsQuery();
  const [updateBucket, { isLoading: isUpdating }] = useUpdateBucketMutation();
  const [
    createAccount,
    { isLoading: isCreating, data: newlyCreatedAccount },
  ] = useCreateAccountMutation();

  const handleAccountChange = async (accountId: string | null) => {
    try {
      await updateBucket({
        id: bucketId,
        params: { account_id: accountId ? Number(accountId) : null },
      }).unwrap();
    } catch (error) {
      console.error('Failed to update bucket account:', error);
    }
  };

  const handleCreateAccount = async (name: string) => {
    try {
      const newAccount = await createAccount({ name, type: bucketType }).unwrap();
      if (newAccount) {
        await updateBucket({
          id: bucketId,
          params: { account_id: newAccount.id },
        }).unwrap();
      }
    } catch (error) {
      console.error('Failed to create account:', error);
    }
  };

  // Include the newly created account in options if it's not yet in the cached list
  const options = useMemo(() => {
    const accountOptions = accounts.map((acc) => ({
      value: acc.id.toString(),
      label: acc.name,
    }));

    // If we just created an account and it's not in the list yet, add it temporarily
    if (
      newlyCreatedAccount &&
      !accounts.find((acc) => acc.id === newlyCreatedAccount.id)
    ) {
      accountOptions.push({
        value: newlyCreatedAccount.id.toString(),
        label: newlyCreatedAccount.name,
      });
    }

    return accountOptions;
  }, [accounts, newlyCreatedAccount]);

  return (
    <ChipAutocomplete
      value={value?.toString() ?? null}
      options={options}
      onChange={handleAccountChange}
      onCreate={handleCreateAccount}
      label="Account"
      placeholder="Search accounts..."
      variant="outlined"
      disabled={disabled || isUpdating || isCreating}
    />
  );
}
