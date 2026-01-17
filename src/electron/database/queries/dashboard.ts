import dayjs from 'dayjs';
import { getIncomeHistoriesByPeriod } from './incomeHistory.js';
import {
  getAssetsValueHistory,
  getBucketValueHistoriesByBucket,
} from './bucketValueHistory.js';
import {
  getExpenseTransactionsWithDatesByPeriod,
  getExpenseTransactionsByPeriod,
  getTransactionsByBucket,
  getExpenseTransactionsByCategoryAndPeriod,
} from './transaction.js';
import {
  getCheckpoints,
  getCheckpointLabels,
  getNetIncomeAtCheckpoint,
  getGrossIncomeAtCheckpoint,
  getGrossIncomeByCategory,
  getNetIncomeByCategory,
  getExpenseAtCheckpoint,
  getAssetContributionAtCheckpoint,
  getHistoryAtCheckpoint,
} from './dashboardChartUtils.js';
import { getAllBucketGoalsWithStatus } from './bucketGoal.js';
import { getIncomeCategories } from './incomeCategory.js';

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
  const labels = getCheckpointLabels(checkpoints, mode);

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
  const labels = getCheckpointLabels(checkpoints, mode);

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

export async function getExpensePieChartData(
  params: GetExpensePieChartDataParams,
): Promise<ExpensePieChartData> {
  const { startDate, endDate, groupBy } = params;

  // Fetch expense transactions by period
  const data = await getExpenseTransactionsByPeriod({ startDate, endDate });

  // Filter out items with zero amounts
  const filteredData = data.filter((item) => item.total_amount > 0);

  if (filteredData.length === 0) {
    return {
      labels: [],
      values: [],
      ids: [],
    };
  }

  let groupedData: { name: string; total: number; id: number | null }[];

  if (groupBy === 'category') {
    // Group by category
    const categoryMap = new Map<string, { total: number; id: number | null }>();

    filteredData.forEach((item) => {
      const categoryName = item.category_name || 'Uncategorized';
      const existing = categoryMap.get(categoryName);

      if (existing) {
        existing.total += item.total_amount;
      } else {
        categoryMap.set(categoryName, {
          total: item.total_amount,
          id: item.category_id,
        });
      }
    });

    groupedData = Array.from(categoryMap.entries())
      .map(([name, { total, id }]) => ({ name, total, id }))
      .sort((a, b) => b.total - a.total);
  } else if (groupBy === 'account') {
    // Group by account
    const accountMap = new Map<string, { total: number; id: number | null }>();

    filteredData.forEach((item) => {
      const accountName = item.account_name || 'No Account';
      const existing = accountMap.get(accountName);

      if (existing) {
        existing.total += item.total_amount;
      } else {
        accountMap.set(accountName, {
          total: item.total_amount,
          id: item.account_id,
        });
      }
    });

    groupedData = Array.from(accountMap.entries())
      .map(([name, { total, id }]) => ({ name, total, id }))
      .sort((a, b) => b.total - a.total);
  } else {
    // Group by bucket (default)
    groupedData = filteredData
      .map((item) => ({
        name: item.bucket_name,
        total: item.total_amount,
        id: item.bucket_id,
      }))
      .sort((a, b) => b.total - a.total);
  }

  const labels = groupedData.map((item) => item.name);
  const values = groupedData.map((item) => item.total);
  const ids = groupedData.map((item) => item.id);

  return {
    labels,
    values,
    ids,
  };
}

export async function getBucketGoalsChartData(): Promise<BucketGoalsChartData> {
  // Fetch all bucket goals with status
  const goalsData = await getAllBucketGoalsWithStatus();

  if (goalsData.length === 0) {
    return {
      labels: [],
      bucketTypes: [],
      datasets: [],
    };
  }

  const labels = goalsData.map((goal) => goal.bucket_name);
  const bucketTypes = goalsData.map((goal) => goal.bucket_type);

  // Pre-calculate common values for each goal
  const goalMetrics = goalsData.map((goal) => {
    const base100 = goal.max_amount ?? goal.min_amount ?? 0;
    const minAmount = goal.min_amount ?? 0;
    const maxAmount = goal.max_amount ?? 0;
    const currentStatus = goal.current_status;
    const currentPercent = base100 > 0 ? (currentStatus / base100) * 100 : 0;
    const minPercent =
      base100 > 0 && minAmount > 0 ? (minAmount / base100) * 100 : 0;

    return {
      base100,
      minAmount,
      maxAmount,
      currentStatus,
      currentPercent,
      minPercent,
    };
  });

  // Layer 1: Yellow when current < min (shows current_status)
  const yellowCurrent = goalMetrics.reduce(
    (acc: { data: number[]; metadata: number[] }, metric) => {
      if (metric.currentPercent < metric.minPercent) {
        acc.data.push(metric.currentPercent);
        acc.metadata.push(metric.currentStatus);
      } else {
        acc.data.push(0);
        acc.metadata.push(0);
      }
      return acc;
    },
    { data: [] as number[], metadata: [] as number[] },
  );

  // Layer 2: Transparent outline when current < min (shows min - current)
  const transparentMinRemaining = goalMetrics.reduce(
    (
      acc: {
        data: number[];
        metadata: { amount: number; target?: number }[];
      },
      metric,
    ) => {
      if (
        metric.base100 > 0 &&
        metric.minAmount > 0 &&
        metric.currentPercent < metric.minPercent
      ) {
        acc.data.push(metric.minPercent - metric.currentPercent);
        acc.metadata.push({
          amount: metric.minAmount - metric.currentStatus,
          target: metric.minAmount,
        });
      } else {
        acc.data.push(0);
        acc.metadata.push({ amount: 0 });
      }
      return acc;
    },
    { data: [], metadata: [] },
  );

  // Layer 3: Green when current >= min (shows min amount)
  const greenMin = goalMetrics.reduce(
    (acc: { data: number[]; metadata: number[] }, metric) => {
      if (!metric.minAmount && metric.maxAmount) {
        acc.data.push(0);
        acc.metadata.push(0);
      } else if (metric.currentPercent >= metric.minPercent) {
        acc.data.push(metric.minPercent);
        acc.metadata.push(metric.minAmount);
      } else {
        acc.data.push(0);
        acc.metadata.push(0);
      }
      return acc;
    },
    { data: [], metadata: [] },
  );

  // Layer 4: Green when min <= current <= max (shows current - min)
  const greenCurrent = goalMetrics.reduce(
    (acc: { data: number[]; metadata: number[] }, metric) => {
      if (!metric.minAmount && metric.maxAmount) {
        acc.data.push(Math.min(metric.currentPercent, 100));
        acc.metadata.push(Math.min(metric.currentStatus, metric.maxAmount));
      } else if (metric.currentPercent < metric.minPercent) {
        acc.data.push(0);
        acc.metadata.push(0);
      } else if (metric.maxAmount) {
        acc.data.push(
          Math.min(
            metric.currentPercent - metric.minPercent,
            100 - metric.minPercent,
          ),
        );
        acc.metadata.push(
          Math.min(metric.currentStatus, metric.maxAmount) - metric.minAmount,
        );
      } else {
        acc.data.push(metric.currentPercent - metric.minPercent);
        acc.metadata.push(metric.currentStatus - metric.minAmount);
      }
      return acc;
    },
    { data: [], metadata: [] },
  );

  // Layer 5: Transparent outline when max exists
  const transparentMaxRemaining = goalMetrics.reduce(
    (
      acc: {
        data: number[];
        metadata: { amount: number; target?: number }[];
      },
      metric,
    ) => {
      if (!metric.maxAmount) {
        acc.data.push(0);
        acc.metadata.push({ amount: 0 });
      } else if (metric.currentPercent < metric.minPercent) {
        acc.data.push(100 - metric.minPercent);
        acc.metadata.push({
          amount: metric.maxAmount - metric.minAmount,
          target: metric.maxAmount,
        });
      } else {
        acc.data.push(100 - Math.min(metric.currentPercent, 100));
        acc.metadata.push({
          amount:
            metric.maxAmount - Math.min(metric.currentStatus, metric.maxAmount),
          target: metric.maxAmount,
        });
      }
      return acc;
    },
    { data: [], metadata: [] },
  );

  // Layer 6: Red when current > max (shows current - max)
  const redExceedMax = goalMetrics.reduce(
    (acc: { data: number[]; metadata: number[] }, metric) => {
      if (metric.maxAmount > 0) {
        acc.data.push(Math.max(0, metric.currentPercent - 100));
        acc.metadata.push(Math.max(0, metric.currentStatus - metric.maxAmount));
      } else {
        acc.data.push(0);
        acc.metadata.push(0);
      }
      return acc;
    },
    { data: [], metadata: [] },
  );

  return {
    labels,
    bucketTypes,
    datasets: [
      {
        label: 'Below Min',
        data: yellowCurrent.data,
        metadata: yellowCurrent.metadata,
      },
      {
        label: 'To Min Goal',
        data: transparentMinRemaining.data,
        metadata: transparentMinRemaining.metadata,
      },
      {
        label: 'Min Goal Met',
        data: greenMin.data,
        metadata: greenMin.metadata,
      },
      {
        label: 'On Track',
        data: greenCurrent.data,
        metadata: greenCurrent.metadata,
      },
      {
        label: 'To Max Goal',
        data: transparentMaxRemaining.data,
        metadata: transparentMaxRemaining.metadata,
      },
      {
        label: 'Over Max',
        data: redExceedMax.data,
        metadata: redExceedMax.metadata,
      },
    ],
  };
}

export async function getIncomeOverTimeChartData(
  params: GetIncomeOverTimeChartDataParams,
): Promise<IncomeOverTimeChartData> {
  const { startDate, endDate, mode } = params;

  // Fetch data from database in parallel
  const [incomeHistories, incomeCategories] = await Promise.all([
    getIncomeHistoriesByPeriod({ startDate, endDate }),
    getIncomeCategories(),
  ]);

  if (incomeHistories.length === 0 || incomeCategories.length === 0) {
    return {
      labels: [],
      grossByCategory: [],
      netByCategory: [],
      grossTotal: [],
      netTotal: [],
    };
  }

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
      grossByCategory: [],
      netByCategory: [],
      grossTotal: [],
      netTotal: [],
    };
  }

  // Format checkpoint labels
  const labels = getCheckpointLabels(checkpoints, mode);

  // Create category name map
  const categoryNameMap = new Map<number | null, string>();
  incomeCategories.forEach((cat) => {
    categoryNameMap.set(cat.id, cat.name);
  });
  categoryNameMap.set(null, 'Uncategorized');

  // Get unique categories from income histories
  const uniqueCategoryIds = Array.from(
    new Set(incomeHistories.map((h) => h.income_category_id)),
  );

  // Build gross income by category datasets
  const grossByCategory: {
    label: string;
    data: number[];
  }[] = [];

  uniqueCategoryIds.forEach((categoryId) => {
    const categoryName = categoryNameMap.get(categoryId) || 'Unknown';

    const data = checkpoints.map((checkpoint) => {
      const categoryMap = getGrossIncomeByCategory(
        incomeHistories,
        checkpoint,
        mode,
      );
      return categoryMap.get(categoryId) || 0;
    });

    // Only add dataset if it has non-zero values
    const hasNonZeroValues = data.some((value) => value > 0);
    if (hasNonZeroValues) {
      grossByCategory.push({
        label: categoryName,
        data,
      });
    }
  });

  // Build net income by category datasets
  const netByCategory: {
    label: string;
    data: number[];
  }[] = [];

  uniqueCategoryIds.forEach((categoryId) => {
    const categoryName = categoryNameMap.get(categoryId) || 'Unknown';

    const data = checkpoints.map((checkpoint) => {
      const categoryMap = getNetIncomeByCategory(
        incomeHistories,
        checkpoint,
        mode,
      );
      return categoryMap.get(categoryId) || 0;
    });

    // Only add dataset if it has non-zero values
    const hasNonZeroValues = data.some((value) => value > 0);
    if (hasNonZeroValues) {
      netByCategory.push({
        label: categoryName,
        data,
      });
    }
  });

  // Calculate total gross and net (for comparison view)
  const grossTotal = checkpoints.map((checkpoint) =>
    getGrossIncomeAtCheckpoint(incomeHistories, checkpoint, mode),
  );

  const netTotal = checkpoints.map((checkpoint) =>
    getNetIncomeAtCheckpoint(incomeHistories, checkpoint, mode),
  );

  return {
    labels,
    grossByCategory,
    netByCategory,
    grossTotal,
    netTotal,
  };
}

export async function getBucketTransactionHistoryChartData(
  params: GetBucketTransactionHistoryChartDataParams,
): Promise<BucketTransactionHistoryChartData> {
  const { bucketId, startDate, endDate, mode } = params;

  // Fetch transactions for the bucket
  const transactions = await getTransactionsByBucket(
    bucketId,
    startDate,
    endDate,
  );

  if (transactions.length === 0) {
    return {
      labels: [],
      data: [],
    };
  }

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
      data: [],
    };
  }

  // Format checkpoint labels
  const labels = getCheckpointLabels(checkpoints, mode);

  // Calculate transaction sums for each checkpoint
  const data = checkpoints.map((checkpoint) => {
    const checkpointDayjs = dayjs(checkpoint);

    return transactions.reduce((total, transaction) => {
      const transactionDate = dayjs(transaction.transaction_date);

      // Check if the transaction_date falls within the same period as checkpoint
      if (transactionDate.isSame(checkpointDayjs, mode)) {
        return total + transaction.amount;
      }

      return total;
    }, 0);
  });

  return {
    labels,
    data,
  };
}

export async function getBucketValueHistoryChartData(
  params: GetBucketValueHistoryChartDataParams,
): Promise<BucketValueHistoryChartData> {
  const { bucketId, startDate, endDate, mode } = params;

  // Fetch bucket value histories
  const data = await getBucketValueHistoriesByBucket({
    bucketId,
    startDate,
    endDate,
  });

  if (data.length === 0) {
    return {
      labels: [],
      contributedAmounts: [],
      gains: [],
      losses: [],
    };
  }

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
      contributedAmounts: [],
      gains: [],
      losses: [],
    };
  }

  // Format checkpoint labels
  const labels = getCheckpointLabels(checkpoints, mode);

  // Calculate contributed amount and gains/losses for each checkpoint
  const contributedAmounts: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  checkpoints.forEach((checkpoint) => {
    const historyAtCheckpoint = getHistoryAtCheckpoint(data, checkpoint);
    const contributedAmount = historyAtCheckpoint?.contributed_amount || 0;
    const marketValue = historyAtCheckpoint?.market_value || 0;
    const gainLoss = marketValue - contributedAmount;

    contributedAmounts.push(contributedAmount);

    // Separate gains and losses for color coding
    if (gainLoss >= 0) {
      gains.push(gainLoss);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(gainLoss); // This will be negative
    }
  });

  return {
    labels,
    contributedAmounts,
    gains,
    losses,
  };
}

export async function getExpenseCategoryChartData(
  params: GetExpenseCategoryChartDataParams,
): Promise<ExpenseCategoryChartData> {
  const { categoryId, startDate, endDate, mode } = params;

  // Fetch expense transactions by category
  const transactions = await getExpenseTransactionsByCategoryAndPeriod({
    categoryId,
    startDate,
    endDate,
  });

  if (transactions.length === 0) {
    return {
      labels: [],
      data: [],
    };
  }

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
      data: [],
    };
  }

  // Format checkpoint labels
  const labels = getCheckpointLabels(checkpoints, mode);

  // Calculate transaction sums for each checkpoint
  const data = checkpoints.map((checkpoint) =>
    getExpenseAtCheckpoint(transactions, checkpoint, mode),
  );

  return {
    labels,
    data,
  };
}
