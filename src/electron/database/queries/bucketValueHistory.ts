import { getSupabase } from '../supabase.js';
import { getCurrentUserId } from '../auth.js';
import { updateBucketFromLatestHistory } from './bucket.js';
import { deleteTransaction } from './transaction.js';

export async function createBucketValueHistory(
  params: CreateBucketValueHistoryParams,
): Promise<BucketValueHistory> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  if (!params.bucket_id) {
    throw new Error('Bucket ID is required');
  }
  if (!params.source_type) {
    throw new Error('Source type is required');
  }

  const recordedAt = params.recorded_at ?? new Date().toISOString();

  // Get the previous record before creating the new one (needed for contributed_amount and market adjustment)
  const previousRecord = await getLastBucketValueHistoryBefore(
    params.bucket_id,
    recordedAt,
  );

  // Determine contributed_amount based on source_type and previous record
  const contributedAmount =
    params.contributed_amount ?? previousRecord?.contributed_amount ?? 0;

  const totalUnits = params.total_units ?? previousRecord?.total_units ?? null;

  const { data, error } = await supabase
    .from('bucket_value_history')
    .insert({
      user_id: userId,
      bucket_id: params.bucket_id,
      contributed_amount: contributedAmount,
      market_value: params.market_value ?? 0,
      total_units: totalUnits,
      recorded_at: recordedAt,
      source_type: params.source_type,
      source_id: params.source_id ?? null,
      notes: params.notes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // If this is a market update, adjust subsequent records
  if (params.source_type === 'market') {
    await adjustBucketValueHistoryForHistoricalMarket(
      params.bucket_id,
      recordedAt,
      params.market_value ?? 0,
      previousRecord,
    );
    // Update the bucket table with the latest values
    await updateBucketFromLatestHistory(params.bucket_id);
  }

  return data;
}

export async function getBucketValueHistories(): Promise<BucketValueHistory[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('bucket_value_history')
    .select()
    .eq('user_id', userId)
    .order('recorded_at', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getBucketValueHistory(
  id: number,
): Promise<BucketValueHistory> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('bucket_value_history')
    .select()
    .eq('id', id)
    .eq('user_id', userId)
    .single();

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

export async function updateBucketValueHistory(
  id: number,
  params: UpdateBucketValueHistoryParams,
): Promise<BucketValueHistory> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const updateData: Record<string, unknown> = {};
  if (params.bucket_id !== undefined) updateData.bucket_id = params.bucket_id;
  if (params.contributed_amount !== undefined)
    updateData.contributed_amount = params.contributed_amount;
  if (params.market_value !== undefined)
    updateData.market_value = params.market_value;
  if (params.total_units !== undefined)
    updateData.total_units = params.total_units;
  if (params.recorded_at !== undefined)
    updateData.recorded_at = params.recorded_at;
  if (params.source_type !== undefined)
    updateData.source_type = params.source_type;
  if (params.source_id !== undefined) updateData.source_id = params.source_id;
  if (params.notes !== undefined) updateData.notes = params.notes;

  const { data, error } = await supabase
    .from('bucket_value_history')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteBucketValueHistory(id: number): Promise<void> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  // First, get the history record to check its source_type and other properties
  const historyRecord = await getBucketValueHistory(id);

  if (!historyRecord) {
    throw new Error('Bucket value history record not found');
  }

  const { bucket_id, source_type, source_id, recorded_at, market_value } =
    historyRecord;

  // If it's a transaction, delete the transaction and adjust history for involved buckets
  if (source_type === 'transaction' && source_id) {
    // Get the transaction details before deleting
    const { data: transaction, error: transactionError } = await supabase
      .from('transaction')
      .select()
      .eq('id', source_id)
      .eq('user_id', userId)
      .single();

    if (transactionError) {
      throw new Error(transactionError.message);
    }

    if (transaction) {
      // Delete the transaction
      await deleteTransaction(source_id);

      // Adjust history for from_bucket (if it exists)
      if (transaction.from_bucket_id) {
        await adjustBucketValueHistoryForHistoricalTransaction(
          transaction.from_bucket_id,
          transaction.transaction_date,
          transaction.amount, // Reverse the deduction by adding back
          transaction.from_units ? transaction.from_units : null, // Reverse units change
          historyRecord.created_at, // Need when there are multiple records on the same date
        );
        // Update the bucket table with the latest values
        await updateBucketFromLatestHistory(transaction.from_bucket_id);
      }

      // Adjust history for to_bucket (if it exists)
      if (transaction.to_bucket_id) {
        await adjustBucketValueHistoryForHistoricalTransaction(
          transaction.to_bucket_id,
          transaction.transaction_date,
          -transaction.amount, // Reverse the addition by subtracting
          transaction.to_units ? -transaction.to_units : null, // Reverse units change
          historyRecord.created_at, // Need when there are multiple records on the same date
        );
        // Update the bucket table with the latest values
        await updateBucketFromLatestHistory(transaction.to_bucket_id);
      }
    }
  }

  // If it's a market update, adjust subsequent history records
  if (source_type === 'market') {
    // Get the previous record to calculate the market value change
    const previousRecord = await getLastBucketValueHistoryBefore(
      bucket_id,
      recorded_at,
      historyRecord.created_at, // Need when there are multiple records on the same date
    );

    // Calculate the market value change that was applied
    const marketValueChange = previousRecord
      ? market_value - previousRecord.market_value
      : market_value;

    // Get all records after this one
    const recordsAfter = await getBucketValueHistoriesAfter(
      bucket_id,
      recorded_at,
      historyRecord.created_at, // Need when there are multiple records on the same date
    );

    // Reverse the adjustment by subtracting the market value change
    for (const record of recordsAfter) {
      if (record.source_type === 'market') {
        // Stop adjusting when we encounter the next market update
        break;
      }

      // Reverse the market_value adjustment
      const adjustedMarketValue = record.market_value - marketValueChange;
      const normalizedMarketValue =
        adjustedMarketValue < 0 ? 0 : adjustedMarketValue;

      await updateBucketValueHistory(record.id, {
        market_value: normalizedMarketValue,
      });
    }
    // Update the bucket table with the latest values
    await updateBucketFromLatestHistory(bucket_id);
  }

  // Finally, delete the history record
  const { error } = await supabase
    .from('bucket_value_history')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function adjustBucketValueHistoryForHistoricalTransaction(
  bucketId: number,
  transactionDate: string,
  amountChange: number,
  unitsChange?: number | null,
  createdAt?: string,
): Promise<void> {
  // Get all bucket value history records after the transaction date
  const historiesAfter = await getBucketValueHistoriesAfter(
    bucketId,
    transactionDate,
    createdAt,
  );

  // Adjust all subsequent records
  let stopAdjustingMarketValue = false;

  for (const history of historiesAfter) {
    // Always adjust contributed_amount
    const newContributedAmount = history.contributed_amount + amountChange;

    // Stop adjusting market_value if we encounter a 'market' source_type
    if (history.source_type === 'market') {
      stopAdjustingMarketValue = true;
    }
    // Adjust market_value unless we've encountered a 'market' source_type
    let newMarketValue = history.market_value;
    if (!stopAdjustingMarketValue) {
      newMarketValue = history.market_value + amountChange;
    }

    // Adjust units if unitsChange is provided and total_units exists
    let newTotalUnits: number | null = history.total_units;
    if (
      unitsChange !== null &&
      unitsChange !== undefined &&
      history.total_units !== null
    ) {
      newTotalUnits = history.total_units + unitsChange;
    }

    // Update the history record
    await updateBucketValueHistory(history.id, {
      contributed_amount: newContributedAmount,
      market_value: newMarketValue,
      total_units: newTotalUnits,
    });
  }
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

export async function getLastBucketValueHistoryBefore(
  bucketId: number,
  beforeDate: string,
  beforeCreatedAt?: string,
): Promise<BucketValueHistory | null> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  let query = supabase
    .from('bucket_value_history')
    .select()
    .eq('user_id', userId)
    .eq('bucket_id', bucketId)
    .lte('recorded_at', beforeDate)
    .order('recorded_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1);

  // If beforeCreatedAt is provided, add it as a query filter
  if (beforeCreatedAt) {
    query = query.lt('created_at', beforeCreatedAt);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return data && data.length > 0 ? data[0] : null;
}

export async function getBucketValueHistoriesAfter(
  bucketId: number,
  afterDate: string,
  afterCreatedAt?: string,
): Promise<BucketValueHistory[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  let query = supabase
    .from('bucket_value_history')
    .select()
    .eq('user_id', userId)
    .eq('bucket_id', bucketId)
    .gte('recorded_at', afterDate)
    .order('recorded_at', { ascending: true })
    .order('created_at', { ascending: true });

  // If afterCreatedAt is provided, filter out records with the same recorded_at
  // but created_at <= afterCreatedAt
  if (afterCreatedAt) {
    query = query.gt('created_at', afterCreatedAt);
  }
  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function getLatestBucketValueHistory(
  bucketId: number,
): Promise<BucketValueHistory | null> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('bucket_value_history')
    .select()
    .eq('user_id', userId)
    .eq('bucket_id', bucketId)
    .order('recorded_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  return data && data.length > 0 ? data[0] : null;
}

async function adjustBucketValueHistoryForHistoricalMarket(
  bucketId: number,
  recordedAt: string,
  newMarketValue: number,
  previousRecord: BucketValueHistory | null,
  createdAt?: string,
): Promise<void> {
  // Get all records after this one
  const recordsAfter = await getBucketValueHistoriesAfter(
    bucketId,
    recordedAt,
    createdAt,
  );
  if (recordsAfter.length > 0) {
    // Use the previously fetched record to calculate the market value change

    // Calculate the market value change
    const marketValueChange = previousRecord
      ? newMarketValue - previousRecord.market_value
      : newMarketValue;
    // Adjust subsequent records until we encounter another 'market' source_type
    for (const record of recordsAfter) {
      if (record.source_type === 'market') {
        // Stop adjusting when we encounter the next market update
        break;
      }

      // Adjust the market_value
      const adjustedMarketValue = record.market_value + marketValueChange;

      await updateBucketValueHistory(record.id, {
        market_value: adjustedMarketValue,
      });
    }
  }
}
