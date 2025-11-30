import { getSupabase } from '../supabase.js';
import { getCurrentUserId } from '../auth.js';

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

  const { data, error } = await supabase
    .from('bucket_value_history')
    .insert({
      user_id: userId,
      bucket_id: params.bucket_id,
      contributed_amount: params.contributed_amount ?? 0,
      market_value: params.market_value ?? 0,
      recorded_at: params.recorded_at ?? new Date().toISOString(),
      source_type: params.source_type,
      source_id: params.source_id ?? null,
      notes: params.notes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getBucketValueHistories(): Promise<BucketValueHistory[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('bucket_value_history')
    .select()
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false });

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
    .order('recorded_at', { ascending: false });

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

export async function getAssetsValueHistory(): Promise<
  BucketValueHistoryWithBucket[]
> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  // First get all saving and investment buckets for the user
  const { data: buckets, error: bucketsError } = await supabase
    .from('bucket')
    .select('id')
    .eq('user_id', userId)
    .in('type', ['saving', 'investment']);

  if (bucketsError) throw new Error(bucketsError.message);
  if (!buckets || buckets.length === 0) return [];

  const bucketIds = buckets.map((b) => b.id);

  // Then get value history for those buckets with bucket details
  const { data, error } = await supabase
    .from('bucket_value_history')
    .select('*, bucket:bucket_id(id, name, type)')
    .eq('user_id', userId)
    .in('bucket_id', bucketIds)
    .order('recorded_at', { ascending: true });

  if (error) throw new Error(error.message);

  return data;
}
