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
    getIncomeOverTimeChartData: builder.query<
      IncomeOverTimeChartData,
      GetIncomeOverTimeChartDataParams
    >({
      queryFn: async (params) => {
        try {
          const chartData =
            await window.electron.getIncomeOverTimeChartData(params);
          return { data: chartData };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
    }),
    getBucketTransactionHistoryChartData: builder.query<
      BucketTransactionHistoryChartData,
      GetBucketTransactionHistoryChartDataParams
    >({
      queryFn: async (params) => {
        try {
          const chartData =
            await window.electron.getBucketTransactionHistoryChartData(params);
          return { data: chartData };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
    }),
    getBucketValueHistoryChartData: builder.query<
      BucketValueHistoryChartData,
      GetBucketValueHistoryChartDataParams
    >({
      queryFn: async (params) => {
        try {
          const chartData =
            await window.electron.getBucketValueHistoryChartData(params);
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
  useGetIncomeOverTimeChartDataQuery,
  useGetBucketTransactionHistoryChartDataQuery,
  useGetBucketValueHistoryChartDataQuery,
} = dashboardApi;
