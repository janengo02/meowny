import { baseApi } from '../../../store/baseApi';

export const userPreferencesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardLayout: builder.query<DashboardLayoutPreference | null, void>({
      queryFn: async () => {
        try {
          const preference = await window.electron.getUserPreference({
            preference_key: 'dashboard_layout',
          });

          if (!preference) {
            return { data: null };
          }

          return {
            data: preference.preference_value as DashboardLayoutPreference,
          };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['UserPreferences'],
    }),
    saveDashboardLayout: builder.mutation<
      UserPreference,
      DashboardLayoutPreference
    >({
      queryFn: async (layout) => {
        try {
          const preference = await window.electron.upsertUserPreference({
            preference_key: 'dashboard_layout',
            preference_value: layout,
          });
          return { data: preference };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['UserPreferences'],
    }),
    getAssetAccountListLayout: builder.query<
      AssetAccountListLayoutPreference | null,
      void
    >({
      queryFn: async () => {
        try {
          const preference = await window.electron.getUserPreference({
            preference_key: 'asset_account_list_layout',
          });

          if (!preference) {
            return { data: null };
          }

          return {
            data: preference.preference_value as AssetAccountListLayoutPreference,
          };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['UserPreferences'],
    }),
    saveAssetAccountListLayout: builder.mutation<
      UserPreference,
      AssetAccountListLayoutPreference
    >({
      queryFn: async (layout) => {
        try {
          const preference = await window.electron.upsertUserPreference({
            preference_key: 'asset_account_list_layout',
            preference_value: layout,
          });
          return { data: preference };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      async onQueryStarted(layout, { dispatch, queryFulfilled }) {
        // Optimistic update
        const patchResult = dispatch(
          userPreferencesApi.util.updateQueryData(
            'getAssetAccountListLayout',
            undefined,
            () => layout
          )
        );
        try {
          await queryFulfilled;
        } catch {
          // Undo optimistic update on error
          patchResult.undo();
        }
      },
      invalidatesTags: ['UserPreferences'],
    }),
    getBucketOrder: builder.query<BucketOrderPreference | null, void>({
      queryFn: async () => {
        try {
          const preference = await window.electron.getUserPreference({
            preference_key: 'bucket_order',
          });

          if (!preference) {
            return { data: null };
          }

          return {
            data: preference.preference_value as BucketOrderPreference,
          };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['UserPreferences'],
    }),
    saveBucketOrder: builder.mutation<UserPreference, BucketOrderPreference>({
      queryFn: async (order) => {
        try {
          const preference = await window.electron.upsertUserPreference({
            preference_key: 'bucket_order',
            preference_value: order,
          });
          return { data: preference };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      async onQueryStarted(order, { dispatch, queryFulfilled }) {
        // Optimistic update
        const patchResult = dispatch(
          userPreferencesApi.util.updateQueryData(
            'getBucketOrder',
            undefined,
            () => order
          )
        );
        try {
          await queryFulfilled;
        } catch {
          // Undo optimistic update on error
          patchResult.undo();
        }
      },
      invalidatesTags: ['UserPreferences'],
    }),
    getExpenseAccountListLayout: builder.query<
      ExpenseAccountListLayoutPreference | null,
      void
    >({
      queryFn: async () => {
        try {
          const preference = await window.electron.getUserPreference({
            preference_key: 'expense_account_list_layout',
          });

          if (!preference) {
            return { data: null };
          }

          return {
            data: preference.preference_value as ExpenseAccountListLayoutPreference,
          };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['UserPreferences'],
    }),
    saveExpenseAccountListLayout: builder.mutation<
      UserPreference,
      ExpenseAccountListLayoutPreference
    >({
      queryFn: async (layout) => {
        try {
          const preference = await window.electron.upsertUserPreference({
            preference_key: 'expense_account_list_layout',
            preference_value: layout,
          });
          return { data: preference };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      async onQueryStarted(layout, { dispatch, queryFulfilled }) {
        // Optimistic update
        const patchResult = dispatch(
          userPreferencesApi.util.updateQueryData(
            'getExpenseAccountListLayout',
            undefined,
            () => layout
          )
        );
        try {
          await queryFulfilled;
        } catch {
          // Undo optimistic update on error
          patchResult.undo();
        }
      },
      invalidatesTags: ['UserPreferences'],
    }),
  }),
});

export const {
  useGetDashboardLayoutQuery,
  useSaveDashboardLayoutMutation,
  useGetAssetAccountListLayoutQuery,
  useSaveAssetAccountListLayoutMutation,
  useGetBucketOrderQuery,
  useSaveBucketOrderMutation,
  useGetExpenseAccountListLayoutQuery,
  useSaveExpenseAccountListLayoutMutation,
} = userPreferencesApi;
