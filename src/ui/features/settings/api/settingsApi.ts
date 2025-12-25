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
    getHiddenIncomeSources: builder.query<IncomeSource[], void>({
      queryFn: async () => {
        try {
          const incomeSources = await window.electron.getIncomeSources();
          const hiddenIncomeSources = incomeSources.filter(
            (source) => !source.is_active,
          );
          return { data: hiddenIncomeSources };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['Income'],
    }),
  }),
});

export const { useGetHiddenBucketsQuery, useGetHiddenIncomeSourcesQuery } =
  settingsApi;
