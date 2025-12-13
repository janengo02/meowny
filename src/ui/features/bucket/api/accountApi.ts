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
    createAccount: builder.mutation<
      Account,
      CreateAccountParams
    >({
      queryFn: async (params) => {
        try {
          const account = await window.electron.createAccount(params);
          return { data: account };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['Account'],
    }),
  }),
});

export const { useGetAccountsQuery, useCreateAccountMutation } =
  accountApi;
