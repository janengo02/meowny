import type { ChartOptions, Chart as ChartJS } from 'chart.js';
import dayjs, { type Dayjs } from 'dayjs';

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
            label += '¥' + context.parsed.y.toLocaleString();
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
          return '¥' + Number(value).toLocaleString();
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

      const label = '¥' + total.toLocaleString();
      ctx.fillText(label, x, y - 8);
    }

    ctx.restore();
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

// Get value at checkpoint (or nearest before) from bucket's history
export const getValueAtCheckpoint = (
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
): number => {
  const checkpointTime = checkpoint.getTime();

  const nearestItem = history.findLast(
    (item) => new Date(item.recorded_at).getTime() <= checkpointTime,
  );

  return nearestItem?.market_value ?? 0;
};
