import { baseApi } from '../../../store/baseApi';

export const incomeHistoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIncomeHistoryIdsBySource: builder.query<number[], number>({
      queryFn: async (incomeId) => {
        try {
          const incomeHistories =
            await window.electron.getIncomeHistoriesBySource(incomeId);

          // Sort by received_date desc, then by id desc
          const sorted = [...incomeHistories].sort((a, b) => {
            const dateComparison =
              new Date(b.received_date).getTime() -
              new Date(a.received_date).getTime();
            if (dateComparison !== 0) {
              return dateComparison;
            }
            return b.id - a.id;
          });

          return { data: sorted.map((history) => history.id) };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['IncomeHistory'],
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
      providesTags: (_result, _error, id) => [{ type: 'IncomeHistory', id }],
    }),

    createIncomeHistory: builder.mutation<
      IncomeHistory,
      CreateIncomeHistoryParams
    >({
      queryFn: async (params) => {
        try {
          const incomeHistory =
            await window.electron.createIncomeHistory(params);
          return { data: incomeHistory };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['IncomeHistory'],
    }),
    updateIncomeHistory: builder.mutation<
      IncomeHistory,
      { id: number; params: UpdateIncomeHistoryParams }
    >({
      queryFn: async ({ id, params }) => {
        try {
          const incomeHistory = await window.electron.updateIncomeHistory(
            id,
            params,
          );
          return { data: incomeHistory };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'IncomeHistory', id },
      ],
      onQueryStarted: async ({ id, params }, { dispatch, queryFulfilled }) => {
        // Optimistic update for getIncomeHistory
        const patchResult = dispatch(
          incomeHistoryApi.util.updateQueryData(
            'getIncomeHistory',
            id,
            (draft) => {
              Object.assign(draft, params);
            },
          ),
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
      invalidatesTags: ['IncomeHistory'],
    }),
  }),
});

export const {
  useGetIncomeHistoryQuery,
  useGetIncomeHistoryIdsBySourceQuery,
  useCreateIncomeHistoryMutation,
  useUpdateIncomeHistoryMutation,
  useDeleteIncomeHistoryMutation,
} = incomeHistoryApi;
