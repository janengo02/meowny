import { baseApi } from '../../../store/baseApi';

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHiddenBuckets: builder.query<Bucket[], void>({
      queryFn: async () => {
        try {
          const buckets = await window.electron.getHiddenBuckets();
          return { data: buckets };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['Bucket'],
    }),
  }),
});

export const { useGetHiddenBucketsQuery } = settingsApi;
