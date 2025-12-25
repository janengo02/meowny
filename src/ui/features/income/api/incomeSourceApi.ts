import { baseApi } from '../../../store/baseApi';

export const incomeSourceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIncomeSources: builder.query<IncomeSource[], void>({
      queryFn: async () => {
        try {
          const incomeSources = await window.electron.getIncomeSources();
          const activeIncomeSources = incomeSources.filter(
            (source) => source.is_active,
          );
          return { data: activeIncomeSources };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['Income'],
    }),
    getIncomeSource: builder.query<IncomeSource, number>({
      queryFn: async (id) => {
        try {
          const incomeSource = await window.electron.getIncomeSource(id);
          return { data: incomeSource };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'Income', id }],
    }),
    createIncomeSource: builder.mutation<IncomeSource, CreateIncomeSourceParams>({
      queryFn: async (params) => {
        try {
          const incomeSource = await window.electron.createIncomeSource(params);
          return { data: incomeSource };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['Income'],
    }),
    updateIncomeSource: builder.mutation<
      IncomeSource,
      { id: number; params: UpdateIncomeSourceParams }
    >({
      queryFn: async ({ id, params }) => {
        try {
          const incomeSource = await window.electron.updateIncomeSource(id, params);
          return { data: incomeSource };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        'Income',
        { type: 'Income', id },
      ],
      onQueryStarted: async ({ id, params }, { dispatch, queryFulfilled }) => {
        // Optimistic update for getIncomeSource
        const patchResult = dispatch(
          incomeSourceApi.util.updateQueryData('getIncomeSource', id, (draft) => {
            Object.assign(draft, params);
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});

export const {
  useGetIncomeSourcesQuery,
  useGetIncomeSourceQuery,
  useCreateIncomeSourceMutation,
  useUpdateIncomeSourceMutation,
} = incomeSourceApi;
