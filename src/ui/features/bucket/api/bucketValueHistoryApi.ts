import { baseApi } from '../../../store/baseApi';

export const bucketValueHistoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getValueHistoryWithTransactionsByBucket: builder.query<
      ValueHistoryWithTransaction[],
      number
    >({
      queryFn: async (bucketId) => {
        try {
          const data =
            await window.electron.getValueHistoryWithTransactionsByBucket(
              bucketId,
            );
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: (_result, _error, bucketId) => [
        { type: 'Bucket', id: bucketId },
      ],
    }),
    createBucketValueHistory: builder.mutation<
      BucketValueHistory,
      CreateBucketValueHistoryParams
    >({
      queryFn: async (params) => {
        try {
          const data = await window.electron.createBucketValueHistory(params);
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: (_result, _error, { bucket_id }) => [
        'Bucket',
        { type: 'Bucket', id: bucket_id },
      ],
    }),
  }),
});

export const {
  useGetValueHistoryWithTransactionsByBucketQuery,
  useCreateBucketValueHistoryMutation,
} = bucketValueHistoryApi;
