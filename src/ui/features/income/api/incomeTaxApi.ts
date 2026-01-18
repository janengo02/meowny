import { baseApi } from '../../../store/baseApi';

export const incomeTaxApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIncomeTaxesByIncomeHistory: builder.query<IncomeTax[], number>({
      queryFn: async (incomeHistoryId) => {
        try {
          const incomeTaxes =
            await window.electron.getIncomeTaxesByIncomeHistory(
              incomeHistoryId,
            );
          return { data: incomeTaxes };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: (result, _error, incomeHistoryId) => [
        { type: 'IncomeTax', id: `LIST-${incomeHistoryId}` },
        ...(result?.map((tax) => ({
          type: 'IncomeTax' as const,
          id: tax.id,
        })) || []),
      ],
    }),
    getIncomeTax: builder.query<IncomeTax, number>({
      queryFn: async (id) => {
        try {
          const incomeTax = await window.electron.getIncomeTax(id);
          return { data: incomeTax };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'IncomeTax', id }],
    }),

    createIncomeTax: builder.mutation<IncomeTax, CreateIncomeTaxParams>({
      queryFn: async (params) => {
        try {
          const incomeTax = await window.electron.createIncomeTax(params);
          return { data: incomeTax };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: (_result, _error, params) => [
        { type: 'IncomeTax', id: `LIST-${params.income_history_id}` },
      ],
    }),
    updateIncomeTax: builder.mutation<
      IncomeTax,
      { id: number; params: UpdateIncomeTaxParams }
    >({
      queryFn: async ({ id, params }) => {
        try {
          const incomeTax = await window.electron.updateIncomeTax(id, params);
          return { data: incomeTax };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: (result, _error, { id }) => [
        { type: 'IncomeTax', id },
        ...(result?.income_history_id
          ? [{ type: 'IncomeTax' as const, id: `LIST-${result.income_history_id}` }]
          : []),
      ],
    }),
    deleteIncomeTax: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await window.electron.deleteIncomeTax(id);
          return { data: undefined };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: (_result, _error, id) => [
        { type: 'IncomeTax', id },
      ],
      onQueryStarted: async (id, { dispatch, queryFulfilled, getState }) => {
        try {
          // Get the income tax before deletion to know which income history to invalidate
          const state = getState();
          const incomeTax =
            incomeTaxApi.endpoints.getIncomeTax.select(id)(state);

          await queryFulfilled;

          // Invalidate the specific income history's tax list
          if (incomeTax.data?.income_history_id) {
            dispatch(
              baseApi.util.invalidateTags([
                { type: 'IncomeTax', id: `LIST-${incomeTax.data.income_history_id}` },
              ]),
            );
          }
        } catch {
          // Query failed, no need to invalidate
        }
      },
    }),
  }),
});

export const {
  useGetIncomeTaxesByIncomeHistoryQuery,
  useCreateIncomeTaxMutation,
  useUpdateIncomeTaxMutation,
  useDeleteIncomeTaxMutation,
} = incomeTaxApi;
