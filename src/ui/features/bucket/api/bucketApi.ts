import { baseApi } from '../../../store/baseApi';

export const bucketApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBuckets: builder.query<Bucket[], void>({
      queryFn: async () => {
        try {
          const buckets = await window.electron.getBuckets();
          return { data: buckets };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['Bucket'],
    }),
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

export const { useGetBucketsQuery, useCreateBucketMutation } = bucketApi;
