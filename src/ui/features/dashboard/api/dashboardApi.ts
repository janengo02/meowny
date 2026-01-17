import { baseApi } from '../../../store/baseApi';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIncomeVsSavingsChartData: builder.query<
      IncomeVsSavingsChartData,
      GetIncomeVsSavingsChartDataParams
    >({
      queryFn: async (params) => {
        try {
          const chartData =
            await window.electron.getIncomeVsSavingsChartData(params);
          return { data: chartData };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
    }),
    getAssetsOverTimeChartData: builder.query<
      AssetsOverTimeChartData,
      GetAssetsOverTimeChartDataParams
    >({
      queryFn: async (params) => {
        try {
          const chartData =
            await window.electron.getAssetsOverTimeChartData(params);
          return { data: chartData };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
    }),
    getExpensePieChartData: builder.query<
      ExpensePieChartData,
      GetExpensePieChartDataParams
    >({
      queryFn: async (params) => {
        try {
          const chartData =
            await window.electron.getExpensePieChartData(params);
          return { data: chartData };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
    }),
    getBucketGoalsChartData: builder.query<BucketGoalsChartData, void>({
      queryFn: async () => {
        try {
          const chartData = await window.electron.getBucketGoalsChartData();
          return { data: chartData };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
    }),
  }),
});

export const {
  useGetIncomeVsSavingsChartDataQuery,
  useGetAssetsOverTimeChartDataQuery,
  useGetExpensePieChartDataQuery,
  useGetBucketGoalsChartDataQuery,
} = dashboardApi;
