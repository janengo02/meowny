import { getSupabase } from '../supabase.js';
import { getCurrentUserId } from '../auth.js';
import { getLatestBucketValueHistory } from './bucketValueHistory.js';
import { clearKeywordMappingsForBucket } from './keywordBucketMapping.js';

export async function createBucket(
  params: CreateBucketParams,
): Promise<Bucket> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  if (!params.name?.trim()) {
    throw new Error('Bucket name is required');
  }
  if (!params.type) {
    throw new Error('Bucket type is required');
  }

  const { data, error } = await supabase
    .from('bucket')
    .insert({
      user_id: userId,
      name: params.name.trim(),
      type: params.type,
      bucket_category_id: params.bucket_category_id ?? null,
      bucket_location_id: params.bucket_location_id ?? null,
      contributed_amount: params.contributed_amount ?? 0,
      market_value: params.market_value ?? 0,
      is_hidden: params.is_hidden ?? false,
      notes: params.notes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getBuckets(): Promise<Bucket[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('bucket')
    .select()
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getBucket(id: number): Promise<Bucket> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('bucket')
    .select()
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateBucket(
  id: number,
  params: UpdateBucketParams,
): Promise<Bucket> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  if (params.name !== undefined && !params.name?.trim()) {
    throw new Error('Bucket name cannot be empty');
  }

  const updateData: Record<string, unknown> = {};
  if (params.name !== undefined) updateData.name = params.name.trim();
  if (params.type !== undefined) updateData.type = params.type;
  if (params.bucket_category_id !== undefined)
    updateData.bucket_category_id = params.bucket_category_id;
  if (params.bucket_location_id !== undefined)
    updateData.bucket_location_id = params.bucket_location_id;
  if (params.contributed_amount !== undefined)
    updateData.contributed_amount = params.contributed_amount;
  if (params.market_value !== undefined)
    updateData.market_value = params.market_value;
  if (params.is_hidden !== undefined) updateData.is_hidden = params.is_hidden;
  if (params.notes !== undefined) updateData.notes = params.notes;

  const { data, error } = await supabase
    .from('bucket')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteBucket(id: number): Promise<void> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  // Clear keyword mappings for this bucket
  await clearKeywordMappingsForBucket(id);

  const { error } = await supabase
    .from('bucket')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function updateBucketFromLatestHistory(
  bucketId: number,
): Promise<void> {
  const latestHistory = await getLatestBucketValueHistory(bucketId);

  if (!latestHistory) {
    // No history records exist, reset bucket to 0
    await updateBucket(bucketId, {
      contributed_amount: 0,
      market_value: 0,
    });
    return;
  }

  await updateBucket(bucketId, {
    contributed_amount: latestHistory.contributed_amount,
    market_value: latestHistory.market_value,
  });
}
