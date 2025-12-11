import { baseApi } from '../../../store/baseApi';

export const bucketGoalApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllBucketGoalsWithStatus: builder.query<AllBucketGoalsWithStatus[], void>({
      queryFn: async () => {
        try {
          const data = await window.electron.getAllBucketGoalsWithStatus();
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['Bucket'],
    }),
    getBucketGoalsByBucket: builder.query<BucketGoalWithStatus[], number>({
      queryFn: async (bucketId) => {
        try {
          const data = await window.electron.getBucketGoalsWithStatus(bucketId);
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: (_result, _error, bucketId) => [
        { type: 'Bucket', id: bucketId },
      ],
    }),
    createBucketGoal: builder.mutation<BucketGoal, CreateBucketGoalParams>({
      queryFn: async (params) => {
        try {
          const data = await window.electron.createBucketGoal(params);
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
    updateBucketGoal: builder.mutation<
      BucketGoal,
      { id: number; params: UpdateBucketGoalParams }
    >({
      queryFn: async ({ id, params }) => {
        try {
          const data = await window.electron.updateBucketGoal(id, params);
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: (_result, _error, { params }) => [
        'Bucket',
        { type: 'Bucket', id: params.bucket_id },
      ],
    }),
    deleteBucketGoal: builder.mutation<void, { id: number; bucketId: number }>({
      queryFn: async ({ id }) => {
        try {
          await window.electron.deleteBucketGoal(id);
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
  useGetAllBucketGoalsWithStatusQuery,
  useGetBucketGoalsByBucketQuery,
  useCreateBucketGoalMutation,
  useUpdateBucketGoalMutation,
  useDeleteBucketGoalMutation,
} = bucketGoalApi;
