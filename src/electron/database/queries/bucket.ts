import { getSupabase } from '../supabase.js';
import { getCurrentUserId } from '../auth.js';
import { clearKeywordMappingsForBucket } from './keywordBucketMapping.js';
import { getAccount } from './account.js';
import { getLatestBucketValueHistory } from './bucketValueHistoryUtils.js';

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

  // If an account is specified, validate bucket type compatibility with account type
  if (params.account_id !== undefined && params.account_id !== null) {
    const account = await getAccount(params.account_id);

    // Expense account can only have expense buckets
    if (account.type === 'expense' && params.type !== 'expense') {
      throw new Error('Expense accounts can only contain expense buckets');
    }

    // Asset account can only have saving or investment buckets
    if (account.type === 'asset' && params.type === 'expense') {
      throw new Error(
        'Asset accounts cannot contain expense buckets. Only saving or investment buckets are allowed',
      );
    }
  }

  const { data, error } = await supabase
    .from('bucket')
    .insert({
      user_id: userId,
      name: params.name.trim(),
      type: params.type,
      bucket_category_id: params.bucket_category_id ?? null,
      account_id: params.account_id ?? null,
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

  // Get current bucket data for validation
  const bucket = await getBucket(id);

  // If trying to change type, check if bucket has an account
  if (params.type !== undefined && bucket.account_id !== null) {
    throw new Error(
      'Cannot change bucket type when it has an account assigned',
    );
  }

  // If assigning an account, validate bucket type compatibility with account type
  if (params.account_id !== undefined && params.account_id !== null) {
    const account = await getAccount(params.account_id);

    // Use the new type if being updated, otherwise use current bucket type
    const bucketType = params.type !== undefined ? params.type : bucket.type;

    // Expense account can only have expense buckets
    if (account.type === 'expense' && bucketType !== 'expense') {
      throw new Error('Expense accounts can only contain expense buckets');
    }

    // Asset account can only have saving or investment buckets
    if (account.type === 'asset' && bucketType === 'expense') {
      throw new Error(
        'Asset accounts cannot contain expense buckets. Only saving or investment buckets are allowed',
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  if (params.name !== undefined) updateData.name = params.name.trim();
  if (params.type !== undefined) updateData.type = params.type;
  if (params.bucket_category_id !== undefined)
    updateData.bucket_category_id = params.bucket_category_id;
  if (params.account_id !== undefined)
    updateData.account_id = params.account_id;
  if (params.contributed_amount !== undefined)
    updateData.contributed_amount = params.contributed_amount;
  if (params.market_value !== undefined)
    updateData.market_value = params.market_value;
  if (params.total_units !== undefined)
    updateData.total_units = params.total_units;
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

  if (latestHistory) {
    await updateBucket(bucketId, {
      contributed_amount: latestHistory.contributed_amount,
      market_value: latestHistory.market_value,
      total_units: latestHistory.total_units,
    });
  }
}
