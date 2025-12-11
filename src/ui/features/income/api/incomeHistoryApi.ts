import { baseApi } from '../../../store/baseApi';

export const incomeHistoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIncomeHistories: builder.query<IncomeHistory[], void>({
      queryFn: async () => {
        try {
          const incomeHistories = await window.electron.getIncomeHistories();
          return { data: incomeHistories };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['Income'],
    }),
    getIncomeHistoriesByPeriod: builder.query<
      IncomeHistory[],
      { startDate?: string; endDate?: string }
    >({
      queryFn: async ({ startDate, endDate }) => {
        try {
          const incomeHistories = await window.electron.getIncomeHistoriesByPeriod({
            startDate,
            endDate,
          });
          return { data: incomeHistories };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['Income'],
    }),
    getIncomeHistory: builder.query<IncomeHistory, number>({
      queryFn: async (id) => {
        try {
          const incomeHistory = await window.electron.getIncomeHistory(id);
          return { data: incomeHistory };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'Income', id }],
    }),
    getIncomeHistoriesBySource: builder.query<IncomeHistory[], number>({
      queryFn: async (incomeId) => {
        try {
          const incomeHistories = await window.electron.getIncomeHistoriesBySource(incomeId);
          return { data: incomeHistories };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['Income'],
    }),
    createIncomeHistory: builder.mutation<IncomeHistory, CreateIncomeHistoryParams>({
      queryFn: async (params) => {
        try {
          const incomeHistory = await window.electron.createIncomeHistory(params);
          return { data: incomeHistory };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['Income'],
    }),
    updateIncomeHistory: builder.mutation<
      IncomeHistory,
      { id: number; params: UpdateIncomeHistoryParams }
    >({
      queryFn: async ({ id, params }) => {
        try {
          const incomeHistory = await window.electron.updateIncomeHistory(id, params);
          return { data: incomeHistory };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        'Income',
        { type: 'Income', id },
      ],
      onQueryStarted: async ({ id, params }, { dispatch, queryFulfilled }) => {
        // Optimistic update for getIncomeHistory
        const patchResult = dispatch(
          incomeHistoryApi.util.updateQueryData('getIncomeHistory', id, (draft) => {
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
    deleteIncomeHistory: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await window.electron.deleteIncomeHistory(id);
          return { data: undefined };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['Income'],
    }),
  }),
});

export const {
  useGetIncomeHistoriesQuery,
  useGetIncomeHistoriesByPeriodQuery,
  useGetIncomeHistoryQuery,
  useGetIncomeHistoriesBySourceQuery,
  useCreateIncomeHistoryMutation,
  useUpdateIncomeHistoryMutation,
  useDeleteIncomeHistoryMutation,
} = incomeHistoryApi;
