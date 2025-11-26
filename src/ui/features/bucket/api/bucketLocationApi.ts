import { baseApi } from '../../../store/baseApi';

export const bucketLocationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBucketLocations: builder.query<BucketLocation[], void>({
      queryFn: async () => {
        try {
          const locations = await window.electron.getBucketLocations();
          return { data: locations };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['BucketLocation'],
    }),
    createBucketLocation: builder.mutation<
      BucketLocation,
      CreateBucketLocationParams
    >({
      queryFn: async (params) => {
        try {
          const location = await window.electron.createBucketLocation(params);
          return { data: location };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      invalidatesTags: ['BucketLocation'],
    }),
  }),
});

export const { useGetBucketLocationsQuery, useCreateBucketLocationMutation } =
  bucketLocationApi;
