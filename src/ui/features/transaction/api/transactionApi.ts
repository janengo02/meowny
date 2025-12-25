import { baseApi } from '../../../store/baseApi';

export const transactionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTransactions: builder.query<Transaction[], void>({
      queryFn: async () => {
        try {
          const transactions = await window.electron.getTransactions();
          return { data: transactions };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['Transaction'],
    }),
    getTransaction: builder.query<Transaction, number>({
      queryFn: async (id) => {
        try {
          const transaction = await window.electron.getTransaction(id);
          return { data: transaction };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'Transaction', id }],
    }),
    getTransactionsByBucket: builder.query<
      Transaction[],
      GetTransactionsByBucketParams
    >({
      queryFn: async (params) => {
        try {
          const transactions =
            await window.electron.getTransactionsByBucket(params);
          return { data: transactions };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: (_result, _error, params) => [
        { type: 'Transaction', id: `bucket-${params.bucketId}` },
      ],
    }),
    createTransaction: builder.mutation<Transaction, CreateTransactionParams>({
      queryFn: async (params) => {
        try {
          const transaction = await window.electron.createTransaction(params);
          return { data: transaction };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['Transaction', 'Bucket'],
    }),
    batchCreateTransactions: builder.mutation<
      Transaction[],
      CreateTransactionParams[]
    >({
      queryFn: async (paramsArray) => {
        try {
          const transactions =
            await window.electron.batchCreateTransactions(paramsArray);
          return { data: transactions };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['Transaction', 'Bucket'],
    }),
    updateTransaction: builder.mutation<
      Transaction,
      { id: number; params: UpdateTransactionParams }
    >({
      queryFn: async ({ id, params }) => {
        try {
          const transaction = await window.electron.updateTransaction(
            id,
            params,
          );
          return { data: transaction };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        'Transaction',
        'Bucket',
        { type: 'Transaction', id },
      ],
    }),
    deleteTransaction: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await window.electron.deleteTransaction(id);
          return { data: undefined };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['Transaction', 'Bucket'],
    }),
    getExpenseTransactionsByPeriod: builder.query<
      ExpenseTransactionSummary[],
      GetExpenseTransactionsByPeriodParams
    >({
      queryFn: async (params) => {
        try {
          const data =
            await window.electron.getExpenseTransactionsByPeriod(params);
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['Transaction'],
    }),
  }),
});

export const {
  useGetTransactionsQuery,
  useGetTransactionQuery,
  useGetTransactionsByBucketQuery,
  useCreateTransactionMutation,
  useBatchCreateTransactionsMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
  useGetExpenseTransactionsByPeriodQuery,
} = transactionApi;
