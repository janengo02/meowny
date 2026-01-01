import { baseApi } from '../../../store/baseApi';

export const accountApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAccounts: builder.query<Account[], void>({
      queryFn: async () => {
        try {
          const accounts = await window.electron.getAccounts();
          return { data: accounts };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['Account'],
    }),
    createAccount: builder.mutation<Account, CreateAccountParams>({
      queryFn: async (params) => {
        try {
          const account = await window.electron.createAccount(params);
          return { data: account };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['Account', 'Bucket'],
    }),
    updateAccount: builder.mutation<
      Account,
      { id: number; params: UpdateAccountParams }
    >({
      queryFn: async ({ id, params }) => {
        try {
          const account = await window.electron.updateAccount(id, params);
          return { data: account };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['Account', 'Bucket'],
    }),
    deleteAccount: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await window.electron.deleteAccount(id);
          return { data: undefined };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['Account', 'Bucket'],
    }),
    getAccountsWithBuckets: builder.query<NormalizedAccountsResponse, void>({
      queryFn: async () => {
        try {
          const accountsWithBuckets = await window.electron.getAccountsWithBuckets();
          return { data: accountsWithBuckets };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['Account', 'Bucket'],
    }),
  }),
});

export const {
  useGetAccountsQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useGetAccountsWithBucketsQuery,
} = accountApi;
