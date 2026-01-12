import dayjs from 'dayjs';
import { getIncomeHistoriesByPeriod } from './incomeHistory.js';
import { getAssetsValueHistory } from './bucketValueHistory.js';
import { getExpenseTransactionsWithDatesByPeriod } from './transaction.js';
import {
  getCheckpoints,
  getNetIncomeAtCheckpoint,
  getExpenseAtCheckpoint,
  getAssetContributionAtCheckpoint,
} from './dashboardChartUtils.js';

export async function getIncomeVsSavingsChartData(
  params: GetIncomeVsSavingsChartDataParams,
): Promise<IncomeVsSavingsChartData> {
  const { startDate, endDate, mode } = params;

  // Fetch data from database in parallel
  const [incomeHistories, assetsData, expenseTransactions] = await Promise.all([
    getIncomeHistoriesByPeriod({ startDate, endDate }),
    getAssetsValueHistory({ startDate, endDate }),
    getExpenseTransactionsWithDatesByPeriod({ startDate, endDate }),
  ]);

  // Generate time checkpoints based on mode
  const periodFrom = dayjs(startDate);
  const periodTo = dayjs(endDate);
  const checkpoints = getCheckpoints(
    periodFrom.toDate(),
    periodTo.toDate(),
    mode,
  );

  if (checkpoints.length === 0) {
    return {
      labels: [],
      incomeData: [],
      expenseData: [],
      assetContributionData: [],
    };
  }

  // Format checkpoint labels
  const labels = checkpoints.map((date) => {
    const d = dayjs(date);
    if (mode === 'month') {
      return d.format('MMM YYYY');
    } else {
      return d.format('YYYY');
    }
  });

  // Calculate income by checkpoint
  const incomeData = checkpoints.map((checkpoint) =>
    getNetIncomeAtCheckpoint(incomeHistories, checkpoint, mode),
  );

  // Calculate expense totals by checkpoint
  const expenseData = checkpoints.map((checkpoint) =>
    getExpenseAtCheckpoint(expenseTransactions, checkpoint, mode),
  );

  // Group all bucket histories by bucket
  const bucketHistoriesMap = new Map<
    number,
    (typeof assetsData.buckets)[0]['history']
  >();
  assetsData.buckets.forEach((bucket) => {
    bucketHistoriesMap.set(bucket.id, bucket.history);
  });

  // Calculate asset contribution by checkpoint
  const assetContributionData = checkpoints.map((checkpoint, index) => {
    // For the first checkpoint, use the day before periodFrom at 23:59:59
    // For subsequent checkpoints, use the previous checkpoint
    const previousCheckpoint =
      index > 0
        ? checkpoints[index - 1]
        : dayjs(periodFrom).subtract(1, 'day').endOf('day').toDate();

    return getAssetContributionAtCheckpoint(
      bucketHistoriesMap,
      checkpoint,
      previousCheckpoint,
    );
  });

  return {
    labels,
    incomeData,
    expenseData,
    assetContributionData,
  };
}
