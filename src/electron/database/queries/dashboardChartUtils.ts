import dayjs from 'dayjs';

// Dashboard chart utility functions for backend data processing

// Helper to get checkpoint dates (end of month or year)
export const getCheckpoints = (
  periodFrom: Date | string,
  periodTo: Date | string,
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

// Format checkpoint labels based on mode
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

// Get total net income at checkpoint from income histories
export const getNetIncomeAtCheckpoint = (
  incomeHistories: Pick<IncomeHistoryWithTaxes, 'received_date' | 'net_amount'>[],
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

// Get total gross income at checkpoint from income histories
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

// Get gross income by category at checkpoint
export const getGrossIncomeByCategory = (
  incomeHistories: Pick<
    IncomeHistoryWithTaxes,
    'received_date' | 'gross_amount' | 'income_category_id'
  >[],
  checkpoint: Date,
  mode: 'month' | 'year',
): Map<number | null, number> => {
  const checkpointDayjs = dayjs(checkpoint);
  const categoryMap = new Map<number | null, number>();

  incomeHistories.forEach((history) => {
    const receivedDate = dayjs(history.received_date);

    if (receivedDate.isSame(checkpointDayjs, mode)) {
      const categoryId = history.income_category_id;
      const currentAmount = categoryMap.get(categoryId) || 0;
      categoryMap.set(categoryId, currentAmount + history.gross_amount);
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
): Map<number | null, number> => {
  const checkpointDayjs = dayjs(checkpoint);
  const categoryMap = new Map<number | null, number>();

  incomeHistories.forEach((history) => {
    const receivedDate = dayjs(history.received_date);

    if (receivedDate.isSame(checkpointDayjs, mode)) {
      const categoryId = history.income_category_id;
      const currentAmount = categoryMap.get(categoryId) || 0;
      categoryMap.set(categoryId, currentAmount + history.net_amount);
    }
  });

  return categoryMap;
};

// Get total expense amount at checkpoint from expense transactions
export const getExpenseAtCheckpoint = (
  expenseTransactions: Pick<Transaction, 'transaction_date' | 'amount'>[],
  checkpoint: Date,
  mode: 'month' | 'year',
): number => {
  const checkpointDayjs = dayjs(checkpoint);

  return expenseTransactions.reduce((total, transaction) => {
    const transactionDate = dayjs(transaction.transaction_date);

    // Check if the transaction_date falls within the same period as checkpoint
    if (transactionDate.isSame(checkpointDayjs, mode)) {
      return total + transaction.amount;
    }

    return total;
  }, 0);
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
