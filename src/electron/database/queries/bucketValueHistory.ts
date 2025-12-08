import { getSupabase } from '../supabase.js';
import { getCurrentUserId } from '../auth.js';
import { updateBucketFromLatestHistory } from './bucket.js';

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
  let contributedAmount: number;

  if (
    params.contributed_amount !== undefined &&
    params.contributed_amount !== null
  ) {
    // If explicitly provided, use it
    contributedAmount = params.contributed_amount;
  } else {
    // Otherwise, get from previous record (or 0 if no previous record)
    contributedAmount = previousRecord ? previousRecord.contributed_amount : 0;
  }

  const { data, error } = await supabase
    .from('bucket_value_history')
    .insert({
      user_id: userId,
      bucket_id: params.bucket_id,
      contributed_amount: contributedAmount,
      market_value: params.market_value ?? 0,
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
    .order('recorded_at', { ascending: false })
    .order('created_at', { ascending: false });

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
  bucketId: number,
): Promise<BucketValueHistory[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('bucket_value_history')
    .select()
    .eq('user_id', userId)
    .eq('bucket_id', bucketId)
    .order('recorded_at', { ascending: false })
    .order('created_at', { ascending: false });

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

  const { error } = await supabase
    .from('bucket_value_history')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function getValueHistoryWithTransactionsByBucket(
  bucketId: number,
): Promise<ValueHistoryWithTransaction[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  // Using PostgreSQL view or direct SQL via PostgREST is limited
  // The cleanest approach is using a stored function (RPC)
  const { data, error } = await supabase.rpc(
    'get_value_history_with_transactions_by_bucket',
    {
      p_bucket_id: bucketId,
      p_user_id: userId,
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
      bucket_location_id,
      category:bucket_category_id(id, name, color),
      location:bucket_location_id(id, name, color)
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
    .order('recorded_at', { ascending: true })
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
    location: Array.isArray(bucket.location)
      ? bucket.location[0] || null
      : bucket.location || null,
    history: historyByBucket.get(bucket.id) || [],
  }));

  return { buckets: result };
}

export async function getLastBucketValueHistoryBefore(
  bucketId: number,
  beforeDate: string,
): Promise<BucketValueHistory | null> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('bucket_value_history')
    .select()
    .eq('user_id', userId)
    .eq('bucket_id', bucketId)
    .lte('recorded_at', beforeDate)
    .order('recorded_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  return data && data.length > 0 ? data[0] : null;
}

export async function getBucketValueHistoriesAfter(
  bucketId: number,
  afterDate: string,
): Promise<BucketValueHistory[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('bucket_value_history')
    .select()
    .eq('user_id', userId)
    .eq('bucket_id', bucketId)
    .gt('recorded_at', afterDate)
    .order('recorded_at', { ascending: true })
    .order('created_at', { ascending: true });

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
): Promise<void> {
  // Get all records after this one
  console.log('==========================');
  const recordsAfter = await getBucketValueHistoriesAfter(bucketId, recordedAt);
  if (recordsAfter.length > 0) {
    // Use the previously fetched record to calculate the market value change
    console.log('Recorded At:', recordedAt);
    console.log('Previous Record:', previousRecord);

    // Calculate the market value change
    const marketValueChange = previousRecord
      ? newMarketValue - previousRecord.market_value
      : newMarketValue;
    console.log('Market Value Change:', marketValueChange);
    // Adjust subsequent records until we encounter another 'market' source_type
    for (const record of recordsAfter) {
      console.log('Adjusting record:', record);
      if (record.source_type === 'market') {
        // Stop adjusting when we encounter the next market update
        break;
      }

      // Adjust the market_value
      const adjustedMarketValue = record.market_value + marketValueChange;
      const normalizedMarketValue =
        adjustedMarketValue < 0 ? 0 : adjustedMarketValue;
      console.log('New Market Value:', normalizedMarketValue);

      await updateBucketValueHistory(record.id, {
        market_value: normalizedMarketValue,
      });
    }
  }

  // Update the bucket table with the latest values
  await updateBucketFromLatestHistory(bucketId);
}
