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
  }),
});

export const { useGetValueHistoryWithTransactionsByBucketQuery } =
  bucketValueHistoryApi;
