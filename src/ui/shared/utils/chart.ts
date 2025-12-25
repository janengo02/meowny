import type { ChartOptions, Chart as ChartJS } from 'chart.js';
import dayjs, { type Dayjs } from 'dayjs';
import { formatMoney } from './formatMoney';

export const CHART_COLORS = [
  'rgba(136, 132, 216, 0.8)',
  'rgba(130, 202, 157, 0.8)',
  'rgba(255, 198, 88, 0.8)',
  'rgba(255, 124, 124, 0.8)',
  'rgba(164, 222, 108, 0.8)',
  'rgba(216, 136, 132, 0.8)',
  'rgba(141, 209, 225, 0.8)',
  'rgba(208, 132, 216, 0.8)',
  'rgba(255, 179, 71, 0.8)',
  'rgba(131, 166, 237, 0.8)',
];

export const lineStackedChartDefaultOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      right: 50, // Add padding on the right for total labels
    },
  },
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        boxWidth: 12,
        padding: 10,
        font: {
          size: 11,
        },
      },
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += formatMoney(context.parsed.y);
          }
          return label;
        },
      },
    },
  },
  scales: {
    x: {
      display: true,
      ticks: {
        maxRotation: 45,
        minRotation: 45,
        font: {
          size: 10,
        },
      },
    },
    y: {
      display: true,
      stacked: true,
      ticks: {
        callback: function (value) {
          return formatMoney(Number(value));
        },
        font: {
          size: 10,
        },
      },
    },
  },
};

// Custom chart options with return percentage in tooltip
export const barStackedChartForGainLossDefaultOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      top: 20,
    },
  },
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        boxWidth: 12,
        padding: 20,
        font: {
          size: 11,
        },
      },
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += formatMoney(context.parsed.y);
          }
          return label;
        },
        afterBody: function (context) {
          // Calculate total and return percentage
          const dataIndex = context[0].dataIndex;
          const datasets = context[0].chart.data.datasets;

          // Sum all values to get market value
          let marketValue = 0;
          datasets.forEach((dataset) => {
            const value = dataset.data[dataIndex] as number;
            marketValue += value || 0;
          });

          // Get contributed amount (first dataset)
          const contributedAmount =
            (datasets[0].data[dataIndex] as number) || 0;

          if (contributedAmount > 0) {
            const returnRate =
              ((marketValue - contributedAmount) / contributedAmount) * 100;
            return [
              '',
              `Total: ${formatMoney(marketValue)}`,
              `Return: ${returnRate >= 0 ? '+' : ''}${returnRate.toFixed(2)}%`,
            ];
          }
          return [``, `Total: ${formatMoney(marketValue)}`];
        },
      },
    },
  },
  scales: {
    x: {
      display: true,
      stacked: true,
      ticks: {
        maxRotation: 45,
        minRotation: 45,
        font: {
          size: 10,
        },
      },
    },
    y: {
      display: true,
      stacked: true,
      ticks: {
        callback: function (value) {
          return formatMoney(Number(value));
        },
        font: {
          size: 10,
        },
      },
    },
  },
};

// Plugin to display total values on top of the chart
export const totalLabelPlugin = {
  id: 'totalLabel',
  afterDatasetsDraw(chart: ChartJS<'line'>) {
    const { ctx, data, scales } = chart;

    if (!data.datasets.length) return;

    ctx.save();
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#c1c1c1';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // Calculate totals for each data point
    const dataLength = data.datasets[0].data.length;
    for (let i = 0; i < dataLength; i++) {
      // Sum all dataset values at this index
      const total = data.datasets.reduce((sum, dataset) => {
        const value = dataset.data[i] as number;
        return sum + (value || 0);
      }, 0);

      // Get the x position from the x-axis scale
      const x = scales.x.getPixelForValue(i);

      // Get the highest y position (top of the stack)
      let stackedY = 0;
      data.datasets.forEach((dataset) => {
        const value = dataset.data[i] as number;
        stackedY += value || 0;
      });
      const y = scales.y.getPixelForValue(stackedY);

      const label = formatMoney(total);
      ctx.fillText(label, x, y - 8);
    }

    ctx.restore();
  },
};

// Plugin to display total values on top of bar charts
export const barTotalLabelPlugin = {
  id: 'barTotalLabel',
  afterDatasetsDraw(chart: ChartJS<'bar'>) {
    const { ctx, data, scales } = chart;

    if (!data.datasets.length) return;

    ctx.save();
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#c1c1c1';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // Calculate totals for each data point
    const dataLength = data.datasets[0].data.length;
    for (let i = 0; i < dataLength; i++) {
      // Sum all dataset values at this index
      const total = data.datasets.reduce((sum, dataset) => {
        const value = dataset.data[i] as number;
        return sum + (value || 0);
      }, 0);

      // Get the x position from the x-axis scale
      const x = scales.x.getPixelForValue(i);

      // Get the highest y position (top of the stack)
      let stackedY = 0;
      data.datasets.forEach((dataset) => {
        const value = dataset.data[i] as number;
        stackedY += value || 0;
      });
      const y = scales.y.getPixelForValue(stackedY);

      const label = formatMoney(total);
      ctx.fillText(label, x, y - 8);
    }

    ctx.restore();
  },
};

// Plugin to display total value and return percentage on top of bar charts
export const barTotalWithReturnPlugin = {
  id: 'barTotalWithReturn',
  afterDatasetsDraw(chart: ChartJS<'bar'>) {
    const { ctx, data, scales } = chart;

    if (!data.datasets.length) return;

    ctx.save();
    ctx.textAlign = 'center';

    // Calculate totals and return percentages for each data point
    const dataLength = data.datasets[0].data.length;
    for (let i = 0; i < dataLength; i++) {
      // Sum all dataset values at this index to get market value
      const marketValue = data.datasets.reduce((sum, dataset) => {
        const value = dataset.data[i] as number;
        return sum + (value || 0);
      }, 0);

      // Get contributed amount (first dataset)
      const contributedAmount = (data.datasets[0].data[i] as number) || 0;

      // Calculate return percentage
      let returnPercentage = 0;
      if (contributedAmount > 0) {
        returnPercentage =
          ((marketValue - contributedAmount) / contributedAmount) * 100;
      }

      // Get the x position from the x-axis scale
      const x = scales.x.getPixelForValue(i);

      // Get the highest y position (top of the stack)
      let stackedY = 0;
      data.datasets.forEach((dataset) => {
        const value = dataset.data[i] as number;
        stackedY += value > 0 ? value : 0;
      });
      const y = scales.y.getPixelForValue(stackedY);

      // Draw total value (top line)
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#9e9e9e';
      ctx.textBaseline = 'bottom';
      const totalLabel = formatMoney(marketValue);
      ctx.fillText(totalLabel, x, y - 20);

      // Draw return percentage with color coding (bottom line)
      if (contributedAmount > 0) {
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = returnPercentage >= 0 ? '#4CAF50' : '#F44336'; // Green for gain, red for loss
        ctx.textBaseline = 'bottom';
        const sign = returnPercentage >= 0 ? '+' : '';
        const percentLabel = `${sign}${returnPercentage.toFixed(1)}%`;
        ctx.fillText(percentLabel, x, y - 4);
      }
    }

    ctx.restore();
  },
};

export const pieChartOptions: ChartOptions<'pie'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        boxWidth: 12,
        padding: 10,
        font: {
          size: 11,
        },
      },
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          const label = context.label || '';
          const value = context.parsed || 0;
          const total = context.dataset.data.reduce(
            (acc: number, val) => acc + (val as number),
            0,
          );
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label}: ${formatMoney(value)} (${percentage}%)`;
        },
      },
    },
  },
};

// Custom dataset type with metadata for horizontal bar charts
export interface DatasetWithMetadata {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  metadata: number[] | { amount: number; target?: number }[];
}

export const horizontalBarChartOptions: ChartOptions<'bar'> = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      beginAtZero: true,
      stacked: true,
      ticks: {
        callback: function (value) {
          return value + '%';
        },
      },
    },
    y: {
      stacked: true,
      ticks: {
        font: {
          size: 11,
        },
      },
    },
  },
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        boxWidth: 12,
        padding: 8,
        font: {
          size: 10,
        },
      },
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          const datasetLabel = context.dataset.label || '';
          const value = context.parsed.x || 0;
          const dataIndex = context.dataIndex;

          // Get the actual amounts from the dataset metadata
          const dataset = context.dataset as unknown as DatasetWithMetadata;
          if (!dataset.metadata || !dataset.metadata[dataIndex]) {
            return `${datasetLabel}: ${value.toFixed(1)}%`;
          }

          const metadataItem = dataset.metadata[dataIndex];

          // Handle both simple number and object with target
          if (typeof metadataItem === 'number') {
            return `${datasetLabel}: ${formatMoney(metadataItem)} (${value.toFixed(1)}%)`;
          } else {
            const lines = [
              `${datasetLabel}: ${formatMoney(metadataItem.amount)} (${value.toFixed(1)}%)`,
            ];
            if (metadataItem.target !== undefined) {
              lines.push(`🎯 Target: ${formatMoney(metadataItem.target)}`);
            }
            return lines;
          }
        },
      },
    },
  },
};

export const barChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      top: 25,
    },
  },
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  scales: {
    x: {
      stacked: false,
    },
    y: {
      stacked: false,
      beginAtZero: true,
      ticks: {
        callback: function (value) {
          return formatMoney(value as number);
        },
      },
    },
  },
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        boxWidth: 12,
        padding: 8,
        font: {
          size: 10,
        },
      },
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          const value = context.parsed.y || 0;
          // Skip showing zero values in tooltip
          if (value === 0) {
            return undefined;
          }
          const datasetLabel = context.dataset.label || '';
          return `${datasetLabel}: ${formatMoney(value)}`;
        },
      },
      filter: function (tooltipItem) {
        // Filter out zero values from tooltip
        return tooltipItem.parsed.y !== 0;
      },
    },
  },
};

// Helper to get checkpoint dates (end of month or year)
export const getCheckpoints = (
  periodFrom: Dayjs | Date | string,
  periodTo: Dayjs | Date | string,
  mode: 'month' | 'year',
): Date[] => {
  if (!periodFrom || !periodTo) return [];

  // Convert to dayjs
  const start = dayjs(periodFrom);
  const end = dayjs(periodTo);

  const checkpoints: Date[] = [];
  let current = start.endOf(mode);

  // Generate checkpoints at the end of each period
  while (current.isBefore(end) || current.isSame(end)) {
    checkpoints.push(current.toDate());
    current = current.add(1, mode).endOf(mode);
  }

  return checkpoints;
};
export const getCheckpointLabels = (
  checkpoints: Date[],
  mode: 'month' | 'year',
): string[] => {
  return checkpoints.map((date) => {
    const d = dayjs(date);
    if (mode === 'month') {
      return d.format('MMM YYYY');
    } else {
      return d.format('YYYY');
    }
  });
};

// Get market value at checkpoint (or nearest before) from bucket's history
export const getHistoryAtCheckpoint = (
  history: Pick<
    BucketValueHistory,
    | 'id'
    | 'market_value'
    | 'contributed_amount'
    | 'recorded_at'
    | 'source_type'
    | 'created_at'
  >[],
  checkpoint: Date,
): Pick<
  BucketValueHistory,
  | 'id'
  | 'market_value'
  | 'contributed_amount'
  | 'recorded_at'
  | 'source_type'
  | 'created_at'
> | null => {
  const checkpointTime = checkpoint.getTime();

  const nearestItem = history.findLast(
    (item) => new Date(item.recorded_at).getTime() <= checkpointTime,
  );

  return nearestItem ?? null;
};

// Get total income at checkpoint from income histories
export const getNetIncomeAtCheckpoint = (
  incomeHistories: Pick<
    IncomeHistoryWithTaxes,
    'received_date' | 'net_amount'
  >[],
  checkpoint: Date,
  mode: 'month' | 'year',
): number => {
  const checkpointDayjs = dayjs(checkpoint);

  return incomeHistories.reduce((total, history) => {
    const receivedDate = dayjs(history.received_date);

    // Check if the received_date falls within the same period as checkpoint
    if (receivedDate.isSame(checkpointDayjs, mode)) {
      return total + history.net_amount;
    }

    return total;
  }, 0);
};

// Get asset contribution at checkpoint (delta from previous checkpoint)
export const getAssetContributionAtCheckpoint = (
  bucketHistories: Map<
    number,
    Pick<
      BucketValueHistory,
      | 'id'
      | 'market_value'
      | 'contributed_amount'
      | 'recorded_at'
      | 'source_type'
      | 'created_at'
    >[]
  >,
  checkpoint: Date,
  previousCheckpoint: Date,
): number => {
  let totalContribution = 0;

  // For each bucket, calculate the contribution change
  bucketHistories.forEach((history) => {
    // Get the contributed_amount at this checkpoint
    const checkpointHistory = getHistoryAtCheckpoint(history, checkpoint);

    // Get the contributed_amount at the previous checkpoint
    const prevHistory = getHistoryAtCheckpoint(history, previousCheckpoint);
    const previousContributedAmount = prevHistory?.contributed_amount || 0;

    const currentContributedAmount = checkpointHistory?.contributed_amount || 0;
    const contribution = currentContributedAmount - previousContributedAmount;
    totalContribution += contribution;
  });

  return totalContribution;
};

// Get gross income by category at checkpoint
export const getGrossIncomeByCategory = (
  incomeHistories: Pick<
    IncomeHistoryWithTaxes,
    'received_date' | 'gross_amount' | 'income_category_id'
  >[],
  checkpoint: Date,
  mode: 'month' | 'year',
): Map<number, number> => {
  const checkpointDayjs = dayjs(checkpoint);
  const categoryMap = new Map<number, number>();

  incomeHistories.forEach((history) => {
    const receivedDate = dayjs(history.received_date);

    // Check if the received_date falls within the same period as checkpoint
    if (
      receivedDate.isSame(checkpointDayjs, mode) &&
      history.income_category_id !== null
    ) {
      const categoryId = history.income_category_id;
      categoryMap.set(
        categoryId,
        (categoryMap.get(categoryId) || 0) + history.gross_amount,
      );
    }
  });

  return categoryMap;
};

// Get net income by category at checkpoint
export const getNetIncomeByCategory = (
  incomeHistories: Pick<
    IncomeHistoryWithTaxes,
    'received_date' | 'net_amount' | 'income_category_id'
  >[],
  checkpoint: Date,
  mode: 'month' | 'year',
): Map<number, number> => {
  const checkpointDayjs = dayjs(checkpoint);
  const categoryMap = new Map<number, number>();

  incomeHistories.forEach((history) => {
    const receivedDate = dayjs(history.received_date);

    // Check if the received_date falls within the same period as checkpoint
    if (
      receivedDate.isSame(checkpointDayjs, mode) &&
      history.income_category_id !== null
    ) {
      const categoryId = history.income_category_id;
      categoryMap.set(
        categoryId,
        (categoryMap.get(categoryId) || 0) + history.net_amount,
      );
    }
  });

  return categoryMap;
};

// Get total gross income at checkpoint
export const getGrossIncomeAtCheckpoint = (
  incomeHistories: Pick<IncomeHistoryWithTaxes, 'received_date' | 'gross_amount'>[],
  checkpoint: Date,
  mode: 'month' | 'year',
): number => {
  const checkpointDayjs = dayjs(checkpoint);

  return incomeHistories.reduce((total, history) => {
    const receivedDate = dayjs(history.received_date);

    // Check if the received_date falls within the same period as checkpoint
    if (receivedDate.isSame(checkpointDayjs, mode)) {
      return total + history.gross_amount;
    }

    return total;
  }, 0);
};

// Get transaction sum at a specific checkpoint for a bucket
// Calculates net transaction amount (incoming - outgoing) for the checkpoint period
export const getTransactionSumAtCheckpoint = (
  transactions: Pick<Transaction, 'transaction_date' | 'amount' | 'from_bucket_id' | 'to_bucket_id'>[],
  checkpoint: Date,
  bucketId: number,
  mode: 'month' | 'year',
): number => {
  // Define the period for this checkpoint
  const checkpointStart = dayjs(checkpoint).startOf(mode);
  const checkpointEnd = dayjs(checkpoint).endOf(mode);

  // Calculate sum of transactions within this checkpoint period
  return transactions.reduce((sum, transaction) => {
    const transactionDate = dayjs(transaction.transaction_date);

    if (
      transactionDate.isSameOrAfter(checkpointStart) &&
      transactionDate.isSameOrBefore(checkpointEnd)
    ) {
      // Add if the target bucket is to_bucket_id (incoming)
      if (transaction.to_bucket_id === bucketId) {
        return sum + transaction.amount;
      }
      // Subtract if the target bucket is from_bucket_id (outgoing)
      if (transaction.from_bucket_id === bucketId) {
        return sum - transaction.amount;
      }
    }

    return sum;
  }, 0);
};
