import { baseApi } from '../../../store/baseApi';

export const incomeCategoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIncomeCategories: builder.query<IncomeCategory[], void>({
      queryFn: async () => {
        try {
          const incomeCategories = await window.electron.getIncomeCategories();
          return { data: incomeCategories };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['Income'],
    }),
    getIncomeCategory: builder.query<IncomeCategory, number>({
      queryFn: async (id) => {
        try {
          const incomeCategory = await window.electron.getIncomeCategory(id);
          return { data: incomeCategory };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'Income', id }],
    }),
    createIncomeCategory: builder.mutation<IncomeCategory, CreateIncomeCategoryParams>({
      queryFn: async (params) => {
        try {
          const incomeCategory = await window.electron.createIncomeCategory(params);
          return { data: incomeCategory };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['Income'],
    }),
    updateIncomeCategory: builder.mutation<
      IncomeCategory,
      { id: number; params: UpdateIncomeCategoryParams }
    >({
      queryFn: async ({ id, params }) => {
        try {
          const incomeCategory = await window.electron.updateIncomeCategory(id, params);
          return { data: incomeCategory };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        'Income',
        { type: 'Income', id },
      ],
    }),
  }),
});

export const {
  useGetIncomeCategoriesQuery,
  useGetIncomeCategoryQuery,
  useCreateIncomeCategoryMutation,
  useUpdateIncomeCategoryMutation,
} = incomeCategoryApi;
