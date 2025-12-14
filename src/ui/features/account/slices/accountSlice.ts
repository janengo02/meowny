import { createSlice } from '@reduxjs/toolkit';
import { accountApi } from '../api/accountApi';
import { bucketApi } from '../../bucket/api/bucketApi';

interface AccountState {
  accounts: {
    byId: Record<number, Account>;
    byType: {
      saving: number[];
      investment: number[];
      expense: number[];
    };
  };
  buckets: {
    byId: Record<number, Bucket>;
    byAccountId: Record<number, number[]>;
  };
}

const initialState: AccountState = {
  accounts: {
    byId: {},
    byType: {
      saving: [],
      investment: [],
      expense: [],
    },
  },
  buckets: {
    byId: {},
    byAccountId: {},
  },
};

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // When accounts with buckets are fetched
      .addMatcher(
        accountApi.endpoints.getAccountsWithBuckets.matchFulfilled,
        (state, action) => {
          // Direct assignment - payload is already normalized
          state.accounts = action.payload.accounts;
          state.buckets = action.payload.buckets;
        },
      )
      // When a new account is created
      .addMatcher(
        accountApi.endpoints.createAccount.matchFulfilled,
        (state, action) => {
          const account = action.payload;
          const accountType = account.type as BucketTypeEnum;

          // Add to byId
          state.accounts.byId[account.id] = account;

          // Add ID to appropriate type array
          state.accounts.byType[accountType].push(account.id);

          // Initialize empty bucket array for this account
          state.buckets.byAccountId[account.id] = [];
        },
      )
      // When a new bucket is created
      .addMatcher(
        bucketApi.endpoints.createBucket.matchFulfilled,
        (state, action) => {
          const bucket = action.payload;

          // Add to byId
          state.buckets.byId[bucket.id] = bucket;

          // Add to account's bucket array if account exists
          if (bucket.account_id !== null) {
            if (!state.buckets.byAccountId[bucket.account_id]) {
              state.buckets.byAccountId[bucket.account_id] = [];
            }
            state.buckets.byAccountId[bucket.account_id].push(bucket.id);
          }
        },
      )
      // When a bucket is updated
      .addMatcher(
        bucketApi.endpoints.updateBucket.matchFulfilled,
        (state, action) => {
          const updatedBucket = action.payload;

          // Update bucket in byId
          state.buckets.byId[updatedBucket.id] = updatedBucket;
        },
      )
      // When a bucket is deleted
      .addMatcher(
        bucketApi.endpoints.deleteBucket.matchFulfilled,
        (state, action) => {
          const bucketId = action.meta.arg.originalArgs as number;
          const bucket = state.buckets.byId[bucketId];

          if (bucket) {
            // Remove from account's bucket array
            if (bucket.account_id !== null) {
              const accountBuckets =
                state.buckets.byAccountId[bucket.account_id];
              if (accountBuckets) {
                const index = accountBuckets.indexOf(bucketId);
                if (index !== -1) {
                  accountBuckets.splice(index, 1);
                }
              }
            }

            // Remove from byId
            delete state.buckets.byId[bucketId];
          }
        },
      );
  },
});

export default accountSlice.reducer;
