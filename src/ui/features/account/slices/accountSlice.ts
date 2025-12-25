import { createSlice } from '@reduxjs/toolkit';
import { accountApi } from '../api/accountApi';
import { bucketApi } from '../../bucket/api/bucketApi';
import { bucketCategoryApi } from '../../bucket/api/bucketCategoryApi';

interface AccountState {
  accounts: {
    byId: Record<number, Account>;
    byType: {
      asset: number[];
      expense: number[];
    };
  };
  buckets: {
    byId: Record<number, Bucket>;
    byAccountId: Record<number, number[]>;
    byCategoryId: Record<number, number[]>;
  };
  categories: {
    byId: Record<number, BucketCategory>;
  };
}

const initialState: AccountState = {
  accounts: {
    byId: {},
    byType: {
      asset: [],
      expense: [],
    },
  },
  buckets: {
    byId: {},
    byAccountId: {},
    byCategoryId: {},
  },
  categories: {
    byId: {},
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
          state.categories = action.payload.categories;
        },
      )
      // When a new account is created
      .addMatcher(
        accountApi.endpoints.createAccount.matchFulfilled,
        (state, action) => {
          const account = action.payload;
          const accountType = account.type as AccountTypeEnum;

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

          // Add to category's bucket array if category exists
          if (bucket.bucket_category_id !== null) {
            if (!state.buckets.byCategoryId[bucket.bucket_category_id]) {
              state.buckets.byCategoryId[bucket.bucket_category_id] = [];
            }
            state.buckets.byCategoryId[bucket.bucket_category_id].push(bucket.id);
          }
        },
      )
      // When a bucket is updated
      .addMatcher(
        bucketApi.endpoints.updateBucket.matchFulfilled,
        (state, action) => {
          const updatedBucket = action.payload;
          const oldBucket = state.buckets.byId[updatedBucket.id];

          // Handle category change
          if (oldBucket && oldBucket.bucket_category_id !== updatedBucket.bucket_category_id) {
            // Remove from old category
            if (oldBucket.bucket_category_id !== null) {
              const categoryBuckets = state.buckets.byCategoryId[oldBucket.bucket_category_id];
              if (categoryBuckets) {
                const index = categoryBuckets.indexOf(updatedBucket.id);
                if (index !== -1) {
                  categoryBuckets.splice(index, 1);
                }
              }
            }

            // Add to new category
            if (updatedBucket.bucket_category_id !== null) {
              if (!state.buckets.byCategoryId[updatedBucket.bucket_category_id]) {
                state.buckets.byCategoryId[updatedBucket.bucket_category_id] = [];
              }
              state.buckets.byCategoryId[updatedBucket.bucket_category_id].push(updatedBucket.id);
            }
          }

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

            // Remove from category's bucket array
            if (bucket.bucket_category_id !== null) {
              const categoryBuckets =
                state.buckets.byCategoryId[bucket.bucket_category_id];
              if (categoryBuckets) {
                const index = categoryBuckets.indexOf(bucketId);
                if (index !== -1) {
                  categoryBuckets.splice(index, 1);
                }
              }
            }

            // Remove from byId
            delete state.buckets.byId[bucketId];
          }
        },
      )
      // When a bucket category is created
      .addMatcher(
        bucketCategoryApi.endpoints.createBucketCategory.matchFulfilled,
        (state, action) => {
          const category = action.payload;
          state.categories.byId[category.id] = category;
        },
      )
      // When a bucket category is updated
      .addMatcher(
        bucketCategoryApi.endpoints.updateBucketCategory.matchFulfilled,
        (state, action) => {
          const category = action.payload;
          state.categories.byId[category.id] = category;
        },
      );
  },
});

export default accountSlice.reducer;
