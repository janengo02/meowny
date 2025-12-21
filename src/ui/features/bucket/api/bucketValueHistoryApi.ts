import { baseApi } from '../../../store/baseApi';

export const bucketValueHistoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getValueHistoryWithTransactionsByBucket: builder.query<
      ValueHistoryWithTransaction[],
      GetValueHistoryWithTransactionsByBucketParams
    >({
      queryFn: async (params) => {
        try {
          const data =
            await window.electron.getValueHistoryWithTransactionsByBucket(
              params,
            );
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: (_result, _error, params) => [
        { type: 'Bucket', id: params.bucketId },
      ],
    }),
    getBucketValueHistoriesByBucket: builder.query<
      BucketValueHistory[],
      GetBucketValueHistoriesByBucketParams
    >({
      queryFn: async (params) => {
        try {
          const data =
            await window.electron.getBucketValueHistoriesByBucket(params);
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: (_result, _error, params) => [
        { type: 'Bucket', id: params.bucketId },
      ],
    }),
    getAssetsValueHistory: builder.query<
      AssetsValueHistoryResponse,
      GetAssetsValueHistoryParams
    >({
      queryFn: async (params) => {
        try {
          const data = await window.electron.getAssetsValueHistory(params);
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['Bucket'],
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
    updateBucketValueHistory: builder.mutation<
      BucketValueHistory,
      { id: number; bucketId: number; params: UpdateBucketValueHistoryParams }
    >({
      queryFn: async ({ id, params }) => {
        try {
          const data = await window.electron.updateBucketValueHistory(id, params);
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: (_result, _error, { bucketId }) => [
        'Bucket',
        { type: 'Bucket', id: bucketId },
      ],
    }),
    deleteBucketValueHistory: builder.mutation<void, { id: number; bucketId: number }>({
      queryFn: async ({ id }) => {
        try {
          await window.electron.deleteBucketValueHistory(id);
          return { data: undefined };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: (_result, _error, { bucketId }) => [
        'Bucket',
        { type: 'Bucket', id: bucketId },
      ],
    }),
  }),
});

export const {
  useGetValueHistoryWithTransactionsByBucketQuery,
  useGetBucketValueHistoriesByBucketQuery,
  useGetAssetsValueHistoryQuery,
  useCreateBucketValueHistoryMutation,
  useUpdateBucketValueHistoryMutation,
  useDeleteBucketValueHistoryMutation,
} = bucketValueHistoryApi;
