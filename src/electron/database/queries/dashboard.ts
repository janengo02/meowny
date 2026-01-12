import dayjs from 'dayjs';
import { getIncomeHistoriesByPeriod } from './incomeHistory.js';
import { getAssetsValueHistory } from './bucketValueHistory.js';
import { getExpenseTransactionsWithDatesByPeriod } from './transaction.js';
import {
  getCheckpoints,
  getNetIncomeAtCheckpoint,
  getExpenseAtCheckpoint,
  getAssetContributionAtCheckpoint,
  getHistoryAtCheckpoint,
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

export async function getAssetsOverTimeChartData(
  params: GetAssetsOverTimeChartDataParams,
): Promise<AssetsOverTimeChartData> {
  const { startDate, endDate, mode, groupBy } = params;

  // Fetch assets data
  const assetsData = await getAssetsValueHistory({ startDate, endDate });

  // Generate time checkpoints based on mode
  const periodFrom = dayjs(startDate);
  const periodTo = dayjs(endDate);
  const checkpoints = getCheckpoints(
    periodFrom.toDate(),
    periodTo.toDate(),
    mode,
  );

  if (checkpoints.length === 0 || !assetsData.buckets?.length) {
    return {
      labels: [],
      datasets: [],
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

  // Group buckets by the specified groupBy field
  const bucketGroup = new Map<
    string | number,
    {
      id: string | number;
      name: string;
      buckets: (typeof assetsData.buckets)[0][];
    }
  >();

  assetsData.buckets.forEach((bucket) => {
    let groupKey: string | number;
    let groupName: string;

    switch (groupBy) {
      case 'category':
        groupKey = bucket.category ? bucket.category.id : 'no_group';
        groupName = bucket.category ? bucket.category.name : 'No Category';
        break;
      case 'account':
        groupKey = bucket.account ? bucket.account.id : 'no_group';
        groupName = bucket.account ? bucket.account.name : 'No Account';
        break;
      case 'bucket':
      default:
        groupKey = bucket.id;
        groupName = bucket.name;
        break;
    }

    if (!bucketGroup.has(groupKey)) {
      bucketGroup.set(groupKey, {
        id: groupKey,
        name: groupName,
        buckets: [],
      });
    }
    bucketGroup.get(groupKey)!.buckets.push(bucket);
  });

  // Create datasets for each group
  const datasets = Array.from(bucketGroup.values()).map((group) => {
    return {
      label: group.name,
      data: checkpoints.map((checkpoint) =>
        group.buckets.reduce((sum, bucket) => {
          const historyAtCheckpoint = getHistoryAtCheckpoint(
            bucket.history,
            checkpoint,
          );
          return sum + (historyAtCheckpoint?.market_value || 0);
        }, 0),
      ),
    };
  });

  return {
    labels,
    datasets,
  };
}
