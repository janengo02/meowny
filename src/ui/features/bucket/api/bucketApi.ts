import { baseApi } from '../../../store/baseApi';

export const bucketApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createBucket: builder.mutation<Bucket, CreateBucketParams>({
      queryFn: async (params) => {
        try {
          const bucket = await window.electron.createBucket(params);
          return { data: bucket };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['Bucket'],
    }),
  }),
});

export const { useCreateBucketMutation } = bucketApi;
