import { baseApi } from '../../../store/baseApi';

export const incomeTaxApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIncomeTaxes: builder.query<IncomeTax[], void>({
      queryFn: async () => {
        try {
          const incomeTaxes = await window.electron.getIncomeTaxes();
          return { data: incomeTaxes };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['Income'],
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
      providesTags: (_result, _error, id) => [{ type: 'Income', id }],
    }),
    getIncomeTaxesByIncomeHistory: builder.query<IncomeTax[], number>({
      queryFn: async (incomeHistoryId) => {
        try {
          const incomeTaxes = await window.electron.getIncomeTaxesByIncomeHistory(incomeHistoryId);
          return { data: incomeTaxes };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['Income'],
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
      invalidatesTags: ['Income'],
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
      invalidatesTags: (_result, _error, { id }) => [
        'Income',
        { type: 'Income', id },
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
      invalidatesTags: ['Income'],
    }),
  }),
});

export const {
  useGetIncomeTaxesQuery,
  useGetIncomeTaxQuery,
  useGetIncomeTaxesByIncomeHistoryQuery,
  useCreateIncomeTaxMutation,
  useUpdateIncomeTaxMutation,
  useDeleteIncomeTaxMutation,
} = incomeTaxApi;
