import { getSupabase } from '../supabase.js';
import { getCurrentUserId } from '../auth.js';
import { updateBucketFromLatestHistory } from './bucket.js';
import {
  calculateBucketUpdate,
  deleteBucketValueHistoryByIdToDatabase,
  deleteBucketValueHistoryByTransactionToDatabase,
  getBucketValueHistoryByIdForDeletion,
  getBucketValueHistoryByTransaction,
  insertBucketValueHistoryToDatabase,
  updateBucketValueHistoryToDatabase,
  validateBucketValueHistoryParams,
} from './bucketValueHistoryUtils.js';

// ============================================
// GET HISTORY BEFORE AND AFTER ADDING
// ============================================
export async function getLastBucketValueHistoryBeforeAdding(
  bucketId: number,
  beforeDate: string,
): Promise<BucketValueHistory | null> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const query = supabase
    .from('bucket_value_history')
    .select()
    .eq('user_id', userId)
    .eq('bucket_id', bucketId)
    .lte('recorded_at', beforeDate)
    .order('recorded_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1);

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return data && data.length > 0 ? data[0] : null;
}

export async function getBucketValueHistoriesAfterAdding(
  bucketId: number,
  afterDate: string,
): Promise<BucketValueHistoryWithTransaction[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  // First, get the bucket value histories
  const { data: histories, error: historiesError } = await supabase
    .from('bucket_value_history')
    .select('*')
    .eq('user_id', userId)
    .eq('bucket_id', bucketId)
    .gt('recorded_at', afterDate)
    .order('recorded_at', { ascending: true })
    .order('created_at', { ascending: true });

  if (historiesError) throw new Error(historiesError.message);
  if (!histories || histories.length === 0) return [];

  // Get all transaction IDs from the histories where source_type is 'transaction'
  const transactionIds = histories
    .filter((h) => h.source_type === 'transaction' && h.source_id !== null)
    .map((h) => h.source_id as number);

  // If there are no transactions, return the histories with null transactions
  if (transactionIds.length === 0) {
    return histories.map((h) => ({ ...h, transaction: null }));
  }

  // Fetch all relevant transactions in one query
  const { data: transactions, error: transactionsError } = await supabase
    .from('transaction')
    .select('id, amount, from_bucket_id, to_bucket_id, from_units, to_units')
    .in('id', transactionIds)
    .eq('user_id', userId);

  if (transactionsError) throw new Error(transactionsError.message);

  // Create a map of transactions by ID for quick lookup
  const transactionMap = new Map(
    transactions?.map((t) => [t.id, t]) ?? [],
  );

  // Combine histories with their transactions
  return histories.map((history) => ({
    ...history,
    transaction:
      history.source_type === 'transaction' && history.source_id
        ? transactionMap.get(history.source_id) ?? null
        : null,
  }));
}

// ============================================
// ADDING TRANSACTION PROCEDURE
// ============================================
export async function bucketValueProcedureForAddingTransaction(
  bucketId: number,
  transactionDate: string,
  amountDelta: number,
  unitsDelta: number | null,
  transactionId: number,
  notes: string | null,
): Promise<void> {
  // Get the last bucket value history record before the transaction date
  const lastHistoryBefore = await getLastBucketValueHistoryBeforeAdding(
    bucketId,
    transactionDate,
  );

  // Calculate new values
  const { newContributedAmount, newMarketAmount, newTotalUnits } =
    calculateBucketUpdate(lastHistoryBefore, amountDelta, unitsDelta);

  // Adjust all subsequent bucket value history records
  await adjustBucketValueHistoryForAddingHistoricalTransaction(
    bucketId,
    transactionDate,
    {
      contributedAmount: newContributedAmount,
      marketValue: newMarketAmount,
      totalUnits: newTotalUnits,
    },
  );

  // Create bucket value history for this transaction
  // Must be done after adjustment to avoid double counting
  await insertBucketValueHistoryToDatabase({
    bucket_id: bucketId,
    contributed_amount: newContributedAmount,
    market_value: newMarketAmount,
    total_units: newTotalUnits,
    recorded_at: transactionDate,
    source_type: 'transaction',
    source_id: transactionId,
    notes: notes,
  });

  // Update the bucket table with the latest values from bucket_value_history
  await updateBucketFromLatestHistory(bucketId);
}

export async function adjustBucketValueHistoryForAddingHistoricalTransaction(
  bucketId: number,
  transactionDate: string,
  newTransactionValues: {
    contributedAmount: number;
    marketValue: number;
    totalUnits: number | null;
  },
): Promise<void> {
  // Get all bucket value history records after the transaction date (with transaction details)
  const historiesAfter = await getBucketValueHistoriesAfterAdding(
    bucketId,
    transactionDate,
  );

  // Use the newly added transaction values as the base for recalculation
  let previousHistory: BucketValueHistory = {
    contributed_amount: newTransactionValues.contributedAmount,
    market_value: newTransactionValues.marketValue,
    total_units: newTransactionValues.totalUnits,
  } as BucketValueHistory;

  // Recalculate all subsequent records based on their deltas
  for (const history of historiesAfter) {
    // If it's a market update, handle differently
    if (history.source_type === 'market') {
      // For market updates, we only update market_value, keep contributed_amount and total_units from previous
      const newMarketValue = history.market_value; // Keep the market value as is
      await updateBucketValueHistoryToDatabase(history.id, {
        contributed_amount: previousHistory.contributed_amount,
        market_value: newMarketValue,
        total_units: previousHistory.total_units,
      });

      // Update previousHistory for next iteration
      previousHistory = {
        contributed_amount: previousHistory.contributed_amount,
        market_value: newMarketValue,
        total_units: previousHistory.total_units,
      } as BucketValueHistory;
    } else if (history.source_type === 'transaction' && history.transaction) {
      // For transaction updates, use the transaction amount/units as deltas
      const transaction = Array.isArray(history.transaction)
        ? history.transaction[0]
        : history.transaction;

      // Determine the delta based on which bucket this is
      let amountDelta = 0;
      let unitsDelta: number | null = null;

      if (transaction.from_bucket_id === bucketId) {
        // This bucket is the source, so subtract
        amountDelta = -transaction.amount;
        unitsDelta = transaction.from_units ? -transaction.from_units : null;
      } else if (transaction.to_bucket_id === bucketId) {
        // This bucket is the destination, so add
        amountDelta = transaction.amount;
        unitsDelta = transaction.to_units ? transaction.to_units : null;
      }

      // Recalculate based on the transaction delta
      const recalculated = calculateBucketUpdate(
        previousHistory,
        amountDelta,
        unitsDelta,
      );

      await updateBucketValueHistoryToDatabase(history.id, {
        contributed_amount: recalculated.newContributedAmount,
        market_value: recalculated.newMarketAmount,
        total_units: recalculated.newTotalUnits,
      });

      // Update previousHistory for next iteration
      previousHistory = {
        contributed_amount: recalculated.newContributedAmount,
        market_value: recalculated.newMarketAmount,
        total_units: recalculated.newTotalUnits,
      } as BucketValueHistory;
    }
  }
}

// ============================================
// ADDING MARKET VALUE PROCEDURE
// ============================================
export async function createBucketValueHistory(
  params: CreateBucketValueHistoryParams,
): Promise<BucketValueHistory> {
  // Step 1: Validate parameters
  validateBucketValueHistoryParams(params);

  // Step 2: Get the last bucket value history record before the recorded date
  const lastHistoryBefore = await getLastBucketValueHistoryBeforeAdding(
    params.bucket_id,
    params.recorded_at,
  );
  const newContributedAmount = lastHistoryBefore?.contributed_amount ?? 0;
  const newMarketAmount = params.market_value ?? 0;
  const newTotalUnits = lastHistoryBefore?.total_units ?? null;

  // Step 3:Adjust all subsequent bucket value history records
  await adjustBucketValueHistoryForAddingHistoricalMarket(
    params.bucket_id,
    params.recorded_at,
    {
      contributedAmount: newContributedAmount,
      marketValue: newMarketAmount,
      totalUnits: newTotalUnits,
    },
  );

  // Step 4: Create bucket value history
  // Must be done after adjustment to avoid double counting
  const insertedHistory = await insertBucketValueHistoryToDatabase({
    bucket_id: params.bucket_id,
    contributed_amount: newContributedAmount,
    market_value: newMarketAmount,
    total_units: newTotalUnits,
    recorded_at: params.recorded_at,
    source_type: 'market', // Always 'market' here
    source_id: null, // No source_id for market updates
    notes: params.notes ?? null,
  });

  // Step 5:Update the bucket table with the latest values from bucket_value_history
  await updateBucketFromLatestHistory(params.bucket_id);

  return insertedHistory;
}

export async function adjustBucketValueHistoryForAddingHistoricalMarket(
  bucketId: number,
  recordedAt: string,
  newTransactionValues: {
    contributedAmount: number;
    marketValue: number;
    totalUnits: number | null;
  },
): Promise<void> {
  // Get all bucket value history records after the transaction date (with transaction details)
  const historiesAfter = await getBucketValueHistoriesAfterAdding(
    bucketId,
    recordedAt,
  );

  // Use the newly added transaction values as the base for recalculation
  let previousHistory: BucketValueHistory = {
    contributed_amount: newTransactionValues.contributedAmount,
    market_value: newTransactionValues.marketValue,
    total_units: newTransactionValues.totalUnits,
  } as BucketValueHistory;

  // Recalculate all subsequent records based on their deltas
  for (const history of historiesAfter) {
    // If it's a market update, handle differently
    if (history.source_type === 'market') {
      // Stop adjusting when we encounter the next market update
      break;
    } else if (history.source_type === 'transaction' && history.transaction) {
      // For transaction updates, use the transaction amount/units as deltas
      const transaction = Array.isArray(history.transaction)
        ? history.transaction[0]
        : history.transaction;

      // Determine the delta based on which bucket this is
      let amountDelta = 0;
      let unitsDelta: number | null = null;

      if (transaction.from_bucket_id === bucketId) {
        // This bucket is the source, so subtract
        amountDelta = -transaction.amount;
        unitsDelta = transaction.from_units ? -transaction.from_units : null;
      } else if (transaction.to_bucket_id === bucketId) {
        // This bucket is the destination, so add
        amountDelta = transaction.amount;
        unitsDelta = transaction.to_units ? transaction.to_units : null;
      }

      // Recalculate based on the transaction delta
      const recalculated = calculateBucketUpdate(
        previousHistory,
        amountDelta,
        unitsDelta,
      );

      await updateBucketValueHistoryToDatabase(history.id, {
        contributed_amount: recalculated.newContributedAmount,
        market_value: recalculated.newMarketAmount,
        total_units: recalculated.newTotalUnits,
      });

      // Update previousHistory for next iteration
      previousHistory = {
        contributed_amount: recalculated.newContributedAmount,
        market_value: recalculated.newMarketAmount,
        total_units: recalculated.newTotalUnits,
      } as BucketValueHistory;
    }
  }
}

// ============================================
// GET HISTORY BEFORE AND AFTER DELETING
// ============================================
export async function getLastBucketValueHistoryBeforeDeleting(
  bucketId: number,
  beforeDate: string,
  beforeCreatedAt: string,
): Promise<BucketValueHistory | null> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  // Get all records with recorded_at <= beforeDate
  const { data: allRecords, error } = await supabase
    .from('bucket_value_history')
    .select()
    .eq('user_id', userId)
    .eq('bucket_id', bucketId)
    .lte('recorded_at', beforeDate)
    .order('recorded_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!allRecords || allRecords.length === 0) return null;

  // Filter: if recorded_at equals beforeDate, created_at must be before beforeCreatedAt
  const filteredRecords = allRecords.filter((record) => {
    if (record.recorded_at === beforeDate) {
      return record.created_at < beforeCreatedAt;
    }
    // If recorded_at < beforeDate, include it regardless of created_at
    return true;
  });

  // Return the first one (already sorted by recorded_at desc, created_at desc)
  return filteredRecords.length > 0 ? filteredRecords[0] : null;
}

export async function getBucketValueHistoriesAfterDeleting(
  bucketId: number,
  afterDate: string,
  afterCreatedAt: string,
): Promise<BucketValueHistoryWithTransaction[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  // Get all records with recorded_at >= afterDate
  const { data: allRecords, error: historiesError } = await supabase
    .from('bucket_value_history')
    .select('*')
    .eq('user_id', userId)
    .eq('bucket_id', bucketId)
    .gte('recorded_at', afterDate)
    .order('recorded_at', { ascending: true })
    .order('created_at', { ascending: true });

  if (historiesError) throw new Error(historiesError.message);
  if (!allRecords || allRecords.length === 0) return [];

  // Filter: if recorded_at equals afterDate, created_at must be after afterCreatedAt
  const histories = allRecords.filter((record) => {
    if (record.recorded_at === afterDate) {
      return record.created_at > afterCreatedAt;
    }
    // If recorded_at > afterDate, include it regardless of created_at
    return true;
  });

  if (histories.length === 0) return [];

  // Get all transaction IDs from the histories where source_type is 'transaction'
  const transactionIds = histories
    .filter((h) => h.source_type === 'transaction' && h.source_id !== null)
    .map((h) => h.source_id as number);

  // If there are no transactions, return the histories with null transactions
  if (transactionIds.length === 0) {
    return histories.map((h) => ({ ...h, transaction: null }));
  }

  // Fetch all relevant transactions in one query
  const { data: transactions, error: transactionsError } = await supabase
    .from('transaction')
    .select('id, amount, from_bucket_id, to_bucket_id, from_units, to_units')
    .in('id', transactionIds)
    .eq('user_id', userId);

  if (transactionsError) throw new Error(transactionsError.message);

  // Create a map of transactions by ID for quick lookup
  const transactionMap = new Map(
    transactions?.map((t) => [t.id, t]) ?? [],
  );

  // Combine histories with their transactions
  return histories.map((history) => ({
    ...history,
    transaction:
      history.source_type === 'transaction' && history.source_id
        ? transactionMap.get(history.source_id) ?? null
        : null,
  }));
}

// ============================================
// DELETING TRANSACTION PROCEDURE
// ============================================
export async function bucketValueProcedureForDeletingTransaction(
  bucketId: number,
  transactionDate: string,
  transactionId: number,
): Promise<void> {
  // Step 1: Get the bucket value history record for this transaction before deleting
  const historyToDelete = await getBucketValueHistoryByTransaction(
    bucketId,
    transactionId,
  );

  if (!historyToDelete) {
    throw new Error(
      `No bucket value history found for transaction ${transactionId} in bucket ${bucketId}`,
    );
  }

  // Step 2: Get the last bucket value history record before the deleted transaction
  const lastHistoryBefore = await getLastBucketValueHistoryBeforeDeleting(
    bucketId,
    transactionDate,
    historyToDelete.created_at,
  );

  // Step 3: Delete the bucket value history record for this transaction
  await deleteBucketValueHistoryByTransactionToDatabase(bucketId, transactionId);

  // Step 4: Adjust all subsequent bucket value history records
  await adjustBucketValueHistoryForDeletingHistoricalTransaction(
    bucketId,
    transactionDate,
    historyToDelete.created_at,
    {
      contributedAmount: lastHistoryBefore?.contributed_amount ?? 0,
      marketValue: lastHistoryBefore?.market_value ?? 0,
      totalUnits: lastHistoryBefore?.total_units ?? null,
    },
  );

  // Step 5: Update the bucket table with the latest values from bucket_value_history
  await updateBucketFromLatestHistory(bucketId);
}

export async function adjustBucketValueHistoryForDeletingHistoricalTransaction(
  bucketId: number,
  transactionDate: string,
  deletedCreatedAt: string,
  previousValues: {
    contributedAmount: number;
    marketValue: number;
    totalUnits: number | null;
  },
): Promise<void> {
  // Get all bucket value history records after the deleted transaction
  const historiesAfter = await getBucketValueHistoriesAfterDeleting(
    bucketId,
    transactionDate,
    deletedCreatedAt,
  );

  // Use the previous history values as the base for recalculation
  let previousHistory: BucketValueHistory = {
    contributed_amount: previousValues.contributedAmount,
    market_value: previousValues.marketValue,
    total_units: previousValues.totalUnits,
  } as BucketValueHistory;

  // Recalculate all subsequent records based on their deltas
  for (const history of historiesAfter) {
    // If it's a market update, handle differently
    if (history.source_type === 'market') {
      // For market updates, we only update market_value, keep contributed_amount and total_units from previous
      const newMarketValue = history.market_value; // Keep the market value as is
      await updateBucketValueHistoryToDatabase(history.id, {
        contributed_amount: previousHistory.contributed_amount,
        market_value: newMarketValue,
        total_units: previousHistory.total_units,
      });

      // Update previousHistory for next iteration
      previousHistory = {
        contributed_amount: previousHistory.contributed_amount,
        market_value: newMarketValue,
        total_units: previousHistory.total_units,
      } as BucketValueHistory;
    } else if (history.source_type === 'transaction' && history.transaction) {
      // For transaction updates, use the transaction amount/units as deltas
      const transaction = Array.isArray(history.transaction)
        ? history.transaction[0]
        : history.transaction;

      // Determine the delta based on which bucket this is
      let amountDelta = 0;
      let unitsDelta: number | null = null;

      if (transaction.from_bucket_id === bucketId) {
        // This bucket is the source, so subtract
        amountDelta = -transaction.amount;
        unitsDelta = transaction.from_units ? -transaction.from_units : null;
      } else if (transaction.to_bucket_id === bucketId) {
        // This bucket is the destination, so add
        amountDelta = transaction.amount;
        unitsDelta = transaction.to_units ? transaction.to_units : null;
      }

      // Recalculate based on the transaction delta
      const recalculated = calculateBucketUpdate(
        previousHistory,
        amountDelta,
        unitsDelta,
      );

      await updateBucketValueHistoryToDatabase(history.id, {
        contributed_amount: recalculated.newContributedAmount,
        market_value: recalculated.newMarketAmount,
        total_units: recalculated.newTotalUnits,
      });

      // Update previousHistory for next iteration
      previousHistory = {
        contributed_amount: recalculated.newContributedAmount,
        market_value: recalculated.newMarketAmount,
        total_units: recalculated.newTotalUnits,
      } as BucketValueHistory;
    }
  }
}

// ============================================
// DELETE MARKET VALUE HISTORY PROCEDURE
// ============================================
export async function deleteBucketValueHistory(id: number): Promise<void> {
  // Step 1: Get the bucket value history record to be deleted
  const historyToDelete = await getBucketValueHistoryByIdForDeletion(id);

  if (!historyToDelete) {
    throw new Error(`Bucket value history with id ${id} not found`);
  }

  // Only allow deletion of market value history, not transaction history
  if (historyToDelete.source_type !== 'market') {
    throw new Error(
      'Only market value history records can be deleted. Transaction history is managed automatically.',
    );
  }

  // Step 2: Get the last bucket value history record before the deleted record
  const lastHistoryBefore = await getLastBucketValueHistoryBeforeDeleting(
    historyToDelete.bucket_id,
    historyToDelete.recorded_at,
    historyToDelete.created_at,
  );

  // Step 3: Delete the bucket value history record
  await deleteBucketValueHistoryByIdToDatabase(id);

  // Step 4: Adjust all subsequent bucket value history records
  await adjustBucketValueHistoryForDeletingHistoricalMarket(
    historyToDelete.bucket_id,
    historyToDelete.recorded_at,
    historyToDelete.created_at,
    {
      contributedAmount: lastHistoryBefore?.contributed_amount ?? 0,
      marketValue: lastHistoryBefore?.market_value ?? 0,
      totalUnits: lastHistoryBefore?.total_units ?? null,
    },
  );

  // Step 5: Update the bucket table with the latest values from bucket_value_history
  await updateBucketFromLatestHistory(historyToDelete.bucket_id);
}

export async function adjustBucketValueHistoryForDeletingHistoricalMarket(
  bucketId: number,
  recordedAt: string,
  deletedCreatedAt: string,
  previousValues: {
    contributedAmount: number;
    marketValue: number;
    totalUnits: number | null;
  },
): Promise<void> {
  // Get all bucket value history records after the deleted market update
  const historiesAfter = await getBucketValueHistoriesAfterDeleting(
    bucketId,
    recordedAt,
    deletedCreatedAt,
  );

  // Use the previous history values as the base for recalculation
  let previousHistory: BucketValueHistory = {
    contributed_amount: previousValues.contributedAmount,
    market_value: previousValues.marketValue,
    total_units: previousValues.totalUnits,
  } as BucketValueHistory;

  // Recalculate all subsequent records based on their deltas
  for (const history of historiesAfter) {
    // If it's a market update, handle differently
    if (history.source_type === 'market') {
      // Stop adjusting when we encounter the next market update
      break;
    } else if (history.source_type === 'transaction' && history.transaction) {
      // For transaction updates, use the transaction amount/units as deltas
      const transaction = Array.isArray(history.transaction)
        ? history.transaction[0]
        : history.transaction;

      // Determine the delta based on which bucket this is
      let amountDelta = 0;
      let unitsDelta: number | null = null;

      if (transaction.from_bucket_id === bucketId) {
        // This bucket is the source, so subtract
        amountDelta = -transaction.amount;
        unitsDelta = transaction.from_units ? -transaction.from_units : null;
      } else if (transaction.to_bucket_id === bucketId) {
        // This bucket is the destination, so add
        amountDelta = transaction.amount;
        unitsDelta = transaction.to_units ? transaction.to_units : null;
      }

      // Recalculate based on the transaction delta
      const recalculated = calculateBucketUpdate(
        previousHistory,
        amountDelta,
        unitsDelta,
      );

      await updateBucketValueHistoryToDatabase(history.id, {
        contributed_amount: recalculated.newContributedAmount,
        market_value: recalculated.newMarketAmount,
        total_units: recalculated.newTotalUnits,
      });

      // Update previousHistory for next iteration
      previousHistory = {
        contributed_amount: recalculated.newContributedAmount,
        market_value: recalculated.newMarketAmount,
        total_units: recalculated.newTotalUnits,
      } as BucketValueHistory;
    }
  }
}

// ============================================
// QUERIES FOR CHARTS
// ============================================
export async function getAssetsValueHistory(
  params: GetAssetsValueHistoryParams,
): Promise<AssetsValueHistoryResponse> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  // Use specified bucket types
  const bucketTypes = ['saving', 'investment'];

  // First get all buckets of the specified types with category and location
  const { data: buckets, error: bucketsError } = await supabase
    .from('bucket')
    .select(
      `
      id,
      name,
      type,
      bucket_category_id,
      account_id,
      category:bucket_category_id(id, name, color),
      account:account_id(id, name, color)
    `,
    )
    .eq('user_id', userId)
    .in('type', bucketTypes)
    .order('type', { ascending: true });

  if (bucketsError) throw new Error(bucketsError.message);
  if (!buckets || buckets.length === 0) {
    return { buckets: [] };
  }

  const bucketIds = buckets.map((b) => b.id);

  // Get value history for all buckets
  const { data: historyData, error: historyError } = await supabase
    .from('bucket_value_history')
    .select(
      'id, bucket_id, market_value, contributed_amount, recorded_at, source_type, created_at',
    )
    .eq('user_id', userId)
    .in('bucket_id', bucketIds)
    .gte('recorded_at', params.startDate)
    .lte('recorded_at', params.endDate)
    .order('recorded_at', { ascending: true }) // Must be ascending for history
    .order('created_at', { ascending: true });

  if (historyError) throw new Error(historyError.message);

  // Map history data by bucket
  const historyByBucket = new Map<number, AssetsBucketData['history']>();
  historyData?.forEach((item) => {
    if (!historyByBucket.has(item.bucket_id)) {
      historyByBucket.set(item.bucket_id, []);
    }
    historyByBucket.get(item.bucket_id)!.push(item);
  });

  // Combine bucket info with history
  const result: AssetsBucketData[] = buckets.map((bucket) => ({
    id: bucket.id,
    name: bucket.name,
    type: bucket.type,
    category: Array.isArray(bucket.category)
      ? bucket.category[0] || null
      : bucket.category || null,
    account: Array.isArray(bucket.account)
      ? bucket.account[0] || null
      : bucket.account || null,
    history: historyByBucket.get(bucket.id) || [],
  }));

  return { buckets: result };
}

export async function getValueHistoryWithTransactionsByBucket(
  params: GetValueHistoryWithTransactionsByBucketParams,
): Promise<ValueHistoryWithTransaction[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  // Using PostgreSQL view or direct SQL via PostgREST is limited
  // The cleanest approach is using a stored function (RPC)
  const { data, error } = await supabase.rpc(
    'get_value_history_with_transactions_by_bucket',
    {
      p_bucket_id: params.bucketId,
      p_user_id: userId,
      p_start_date: params.startDate ?? null,
      p_end_date: params.endDate ?? null,
    },
  );

  if (error) throw new Error(error.message);
  return data;
}

export async function getBucketValueHistoriesByBucket(
  params: GetBucketValueHistoriesByBucketParams,
): Promise<BucketValueHistory[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  let query = supabase
    .from('bucket_value_history')
    .select()
    .eq('user_id', userId)
    .eq('bucket_id', params.bucketId);

  // Add period filters if provided
  if (params.startDate) {
    query = query.gte('recorded_at', params.startDate);
  }
  if (params.endDate) {
    query = query.lte('recorded_at', params.endDate);
  }

  const { data, error } = await query
    .order('recorded_at', { ascending: true }) // Must be ascending for history
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}