import { baseApi } from '../../../store/baseApi';

export const taxCategoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTaxCategories: builder.query<TaxCategory[], void>({
      queryFn: async () => {
        try {
          const taxCategories = await window.electron.getTaxCategories();
          return { data: taxCategories };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['TaxCategory'],
    }),
    getTaxCategory: builder.query<TaxCategory, number>({
      queryFn: async (id) => {
        try {
          const taxCategory = await window.electron.getTaxCategory(id);
          return { data: taxCategory };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'TaxCategory', id }],
    }),
    createTaxCategory: builder.mutation<TaxCategory, CreateTaxCategoryParams>({
      queryFn: async (params) => {
        try {
          const taxCategory = await window.electron.createTaxCategory(params);
          return { data: taxCategory };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['TaxCategory'],
    }),
    updateTaxCategory: builder.mutation<
      TaxCategory,
      { id: number; params: UpdateTaxCategoryParams }
    >({
      queryFn: async ({ id, params }) => {
        try {
          const taxCategory = await window.electron.updateTaxCategory(id, params);
          return { data: taxCategory };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        'TaxCategory',
        { type: 'TaxCategory', id },
      ],
    }),
    deleteTaxCategory: builder.mutation<void, number>({
      queryFn: async (id) => {
        try {
          await window.electron.deleteTaxCategory(id);
          return { data: undefined };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['TaxCategory'],
    }),
  }),
});

export const {
  useGetTaxCategoriesQuery,
  useGetTaxCategoryQuery,
  useCreateTaxCategoryMutation,
  useUpdateTaxCategoryMutation,
  useDeleteTaxCategoryMutation,
} = taxCategoryApi;
