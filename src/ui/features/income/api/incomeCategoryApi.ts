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
      providesTags: ['IncomeCategory'],
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
      providesTags: (_result, _error, id) => [{ type: 'IncomeCategory', id }],
    }),
    createIncomeCategory: builder.mutation<
      IncomeCategory,
      CreateIncomeCategoryParams
    >({
      queryFn: async (params) => {
        try {
          const incomeCategory =
            await window.electron.createIncomeCategory(params);
          return { data: incomeCategory };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['IncomeCategory'],
    }),
    updateIncomeCategory: builder.mutation<
      IncomeCategory,
      { id: number; params: UpdateIncomeCategoryParams }
    >({
      queryFn: async ({ id, params }) => {
        try {
          const incomeCategory = await window.electron.updateIncomeCategory(
            id,
            params,
          );
          return { data: incomeCategory };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        'IncomeCategory',
        { type: 'IncomeCategory', id },
      ],
    }),
    deleteIncomeCategory: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await window.electron.deleteIncomeCategory(id);
          return { data: undefined };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['IncomeCategory'],
    }),
  }),
});

export const {
  useGetIncomeCategoriesQuery,
  useGetIncomeCategoryQuery,
  useCreateIncomeCategoryMutation,
  useUpdateIncomeCategoryMutation,
  useDeleteIncomeCategoryMutation,
} = incomeCategoryApi;
