import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../store/store';

// ============================================
// BASE SELECTORS
// ============================================

// Account selectors
const selectAccountsById = (state: RootState) => state.account.accounts.byId;
const selectAccountsByType = (state: RootState) => state.account.accounts.byType;

// Bucket selectors
const selectBucketsById = (state: RootState) => state.account.buckets.byId;
const selectBucketsByAccountId = (state: RootState) => state.account.buckets.byAccountId;
const selectBucketsByCategoryId = (state: RootState) => state.account.buckets.byCategoryId;

// Category selectors
const selectCategoriesById = (state: RootState) => state.account.categories.byId;

// ============================================
// DIRECT LOOKUP SELECTORS (O(1))
// ============================================

/**
 * Select a single account by ID - O(1) lookup
 */
export const selectAccountById = createSelector(
  [selectAccountsById, (_state: RootState, accountId: number) => accountId],
  (accountsById, accountId) => accountsById[accountId] || null
);

/**
 * Select a single bucket by ID - O(1) lookup
 */
export const selectBucketById = createSelector(
  [selectBucketsById, (_state: RootState, bucketId: number) => bucketId],
  (bucketsById, bucketId) => bucketsById[bucketId] || null
);

/**
 * Select a single category by ID - O(1) lookup
 */
export const selectCategoryById = createSelector(
  [selectCategoriesById, (_state: RootState, categoryId: number) => categoryId],
  (categoriesById, categoryId) => categoriesById[categoryId] || null
);

/**
 * Select all bucket IDs for a specific account - Direct array access
 */
export const selectBucketIdsByAccountId = createSelector(
  [selectBucketsByAccountId, (_state: RootState, accountId: number) => accountId],
  (bucketsByAccountId, accountId) => bucketsByAccountId[accountId] || []
);

/**
 * Select all bucket IDs for a specific category - Direct array access
 */
export const selectBucketIdsByCategoryId = createSelector(
  [selectBucketsByCategoryId, (_state: RootState, categoryId: number) => categoryId],
  (bucketsByCategoryId, categoryId) => bucketsByCategoryId[categoryId] || []
);

/**
 * Select all buckets for a specific account - denormalized
 */
export const selectBucketsByAccount = createSelector(
  [selectBucketsById, selectBucketIdsByAccountId],
  (bucketsById, bucketIds) => bucketIds.map((id) => bucketsById[id]).filter(Boolean)
);

/**
 * Select all buckets for a specific category - denormalized
 */
export const selectBucketsByCategory = createSelector(
  [selectBucketsById, selectBucketIdsByCategoryId],
  (bucketsById, bucketIds) => bucketIds.map((id) => bucketsById[id]).filter(Boolean)
);

// ============================================
// ACCOUNT WITH BUCKETS SELECTORS (Denormalized for UI)
// ============================================

/**
 * Select account IDs by type - Direct array access
 */
export const selectAccountIdsByType = createSelector(
  [selectAccountsByType, (_state: RootState, type: BucketTypeEnum) => type],
  (accountsByType, type) => accountsByType[type]
);

/**
 * Select accounts with their buckets by type - Denormalized for UI
 * This is the primary selector for components that need account + bucket data
 */
export const selectAccountsWithBucketsByType = createSelector(
  [
    selectAccountsById,
    selectBucketsById,
    selectBucketsByAccountId,
    selectAccountIdsByType,
  ],
  (accountsById, bucketsById, bucketsByAccountId, accountIds) => {
    return accountIds.map((accountId) => {
      const account = accountsById[accountId];
      const bucketIds = bucketsByAccountId[accountId] || [];
      const buckets = bucketIds.map((bucketId) => bucketsById[bucketId]).filter(Boolean);

      return {
        ...account,
        buckets,
      } as AccountWithBuckets;
    });
  }
);

/**
 * Select all accounts with buckets (all types combined) - Denormalized
 */
export const selectAllAccountsWithBuckets = createSelector(
  [
    selectAccountsById,
    selectBucketsById,
    selectBucketsByAccountId,
    selectAccountsByType,
  ],
  (accountsById, bucketsById, bucketsByAccountId, accountsByType) => {
    const allAccountIds = [
      ...accountsByType.saving,
      ...accountsByType.investment,
      ...accountsByType.expense,
    ];

    return allAccountIds.map((accountId) => {
      const account = accountsById[accountId];
      const bucketIds = bucketsByAccountId[accountId] || [];
      const buckets = bucketIds.map((bucketId) => bucketsById[bucketId]).filter(Boolean);

      return {
        ...account,
        buckets,
      } as AccountWithBuckets;
    });
  }
);

/**
 * Select all accounts with buckets organized by type - Denormalized AccountsByType structure
 * Use this when components need the traditional byType structure
 */
export const selectAccountsByTypeStructure = createSelector(
  [
    selectAccountsById,
    selectBucketsById,
    selectBucketsByAccountId,
    selectAccountsByType,
  ],
  (accountsById, bucketsById, bucketsByAccountId, accountsByType) => {
    const result: AccountsByType = {
      saving: [],
      investment: [],
      expense: [],
    };

    (['saving', 'investment', 'expense'] as BucketTypeEnum[]).forEach((type) => {
      result[type] = accountsByType[type].map((accountId) => {
        const account = accountsById[accountId];
        const bucketIds = bucketsByAccountId[accountId] || [];
        const buckets = bucketIds.map((bucketId) => bucketsById[bucketId]).filter(Boolean);

        return {
          ...account,
          buckets,
        } as AccountWithBuckets;
      });
    });

    return result;
  }
);

// ============================================
// LEGACY SELECTORS (for backward compatibility)
// ============================================

/**
 * Direct selectors for specific account types
 * @deprecated Use selectAccountsWithBucketsByType instead
 */
export const selectSavingAccounts = (state: RootState) =>
  selectAccountsWithBucketsByType(state, 'saving');

export const selectInvestmentAccounts = (state: RootState) =>
  selectAccountsWithBucketsByType(state, 'investment');

export const selectExpenseAccounts = (state: RootState) =>
  selectAccountsWithBucketsByType(state, 'expense');

/**
 * Factory function to create type-specific selector
 * @deprecated Use selectAccountsWithBucketsByType directly instead
 */
export const makeSelectAccountsByType = () =>
  createSelector(
    [
      (state: RootState) => state,
      (_state: RootState, type: BucketTypeEnum) => type,
    ],
    (state, type) => selectAccountsWithBucketsByType(state, type)
  );

// ============================================
// UTILITY SELECTORS
// ============================================

/**
 * Get all buckets (flat array)
 */
export const selectAllBuckets = createSelector(
  [selectBucketsById],
  (bucketsById) => Object.values(bucketsById)
);

/**
 * Get all accounts (flat array)
 */
export const selectAllAccounts = createSelector(
  [selectAccountsById],
  (accountsById) => Object.values(accountsById)
);

/**
 * Get all bucket categories (flat array)
 */
export const selectAllBucketCategories = createSelector(
  [selectCategoriesById],
  (categoriesById) => Object.values(categoriesById)
);

/**
 * Count buckets by type
 */
export const selectBucketCountByType = createSelector(
  [selectAllBuckets],
  (buckets) => {
    return buckets.reduce(
      (acc, bucket) => {
        acc[bucket.type]++;
        return acc;
      },
      { saving: 0, investment: 0, expense: 0 } as Record<BucketTypeEnum, number>
    );
  }
);

/**
 * Count accounts by type
 */
export const selectAccountCountByType = createSelector(
  [selectAccountsByType],
  (accountsByType) => ({
    saving: accountsByType.saving.length,
    investment: accountsByType.investment.length,
    expense: accountsByType.expense.length,
  })
);
