import { baseApi } from '../../../store/baseApi';

export const bucketCategoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBucketCategories: builder.query<BucketCategory[], void>({
      queryFn: async () => {
        try {
          const categories = await window.electron.getBucketCategories();
          return { data: categories };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['BucketCategory'],
    }),
    createBucketCategory: builder.mutation<
      BucketCategory,
      CreateBucketCategoryParams
    >({
      queryFn: async (params) => {
        try {
          const category = await window.electron.createBucketCategory(params);
          return { data: category };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['BucketCategory'],
    }),
  }),
});

export const { useGetBucketCategoriesQuery, useCreateBucketCategoryMutation } =
  bucketCategoryApi;
