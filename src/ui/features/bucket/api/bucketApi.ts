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
    getBucket: builder.query<Bucket, number>({
      queryFn: async (id) => {
        try {
          const bucket = await window.electron.getBucket(id);
          return { data: bucket };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: (_result, _error, id) => [{ type: 'Bucket', id }],
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
    updateBucket: builder.mutation<
      Bucket,
      { id: number; params: UpdateBucketParams }
    >({
      queryFn: async ({ id, params }) => {
        try {
          const bucket = await window.electron.updateBucket(id, params);
          return { data: bucket };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        'Bucket',
        { type: 'Bucket', id },
      ],
      onQueryStarted: async ({ id, params }, { dispatch, queryFulfilled }) => {
        // Optimistic update for getBucket
        const patchResult = dispatch(
          bucketApi.util.updateQueryData('getBucket', id, (draft) => {
            Object.assign(draft, params);
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});

export const {
  useGetBucketsQuery,
  useGetBucketQuery,
  useCreateBucketMutation,
  useUpdateBucketMutation,
} = bucketApi;
