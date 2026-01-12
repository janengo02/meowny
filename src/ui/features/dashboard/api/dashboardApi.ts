import { baseApi } from '../../../store/baseApi';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIncomeVsSavingsChartData: builder.query<
      IncomeVsSavingsChartData,
      GetIncomeVsSavingsChartDataParams
    >({
      queryFn: async (params) => {
        try {
          const chartData = await window.electron.getIncomeVsSavingsChartData(
            params,
          );
          return { data: chartData };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
      providesTags: ['Income', 'Transaction', 'Bucket'],
    }),
  }),
});

export const { useGetIncomeVsSavingsChartDataQuery } = dashboardApi;
