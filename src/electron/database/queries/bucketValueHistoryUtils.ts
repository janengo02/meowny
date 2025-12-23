import { logValidationError } from '../../logger/dbLogger.js';
import { getCurrentUserId } from '../auth.js';
import { getSupabase } from '../supabase.js';

// ============================================
// VALIDATION UTILITIES
// ============================================

export function validateBucketValueHistoryParams(
  params: CreateBucketValueHistoryParams,
): void {
  if (!params.bucket_id) {
    logValidationError(
      'createBucketValueHistory',
      'bucket_id',
      'Bucket ID is required',
    );
    throw new Error('Bucket ID is required');
  }
  if (!params.source_type) {
    logValidationError(
      'createBucketValueHistory',
      'source_type',
      'Source type is required',
    );
    throw new Error('Source type is required');
  }
  if (!params.recorded_at) {
    logValidationError(
      'createBucketValueHistory',
      'recorded_at',
      'Recorded at date is required',
    );
    throw new Error('Recorded at date is required');
  }
}

// ============================================
// DATABASE UPDATE UTILITIES
// ============================================

export async function insertBucketValueHistoryToDatabase(
  params: CreateBucketValueHistoryParams,
): Promise<BucketValueHistory> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('bucket_value_history')
    .insert({
      user_id: userId,
      bucket_id: params.bucket_id,
      contributed_amount: params.contributed_amount ?? 0,
      market_value: params.market_value ?? 0,
      total_units: params.total_units ?? null,
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

export async function updateBucketValueHistoryToDatabase(
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

export async function getBucketValueHistoryByTransaction(
  bucketId: number,
  transactionId: number,
): Promise<BucketValueHistory | null> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('bucket_value_history')
    .select()
    .eq('bucket_id', bucketId)
    .eq('source_type', 'transaction')
    .eq('source_id', transactionId)
    .eq('user_id', userId)
    .single();

  if (error) {
    // If no record found, return null instead of throwing
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }

  return data;
}

export async function deleteBucketValueHistoryByTransactionToDatabase(
  bucketId: number,
  transactionId: number,
): Promise<void> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('bucket_value_history')
    .delete()
    .eq('bucket_id', bucketId)
    .eq('source_type', 'transaction')
    .eq('source_id', transactionId)
    .eq('user_id', userId);

  if (error) {
    // If no record found, return null instead of throwing
    if (error.code === 'PGRST116') return;
    throw new Error(error.message);
  }
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

export async function getBucketValueHistoryByIdForDeletion(
  id: number,
): Promise<BucketValueHistory | null> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('bucket_value_history')
    .select()
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    // If no record found, return null instead of throwing
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }

  return data;
}

export async function deleteBucketValueHistoryByIdToDatabase(
  id: number,
): Promise<void> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('bucket_value_history')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    // If no record found, return null instead of throwing
    if (error.code === 'PGRST116') return;
    throw new Error(error.message);
  }
}

// ============================================
// CALCULATION UTILITIES
// ============================================

type CalculateBucketUpdateResult = {
  newContributedAmount: number;
  newMarketAmount: number;
  newTotalUnits: number | null;
};
export function calculateBucketUpdate(
  lastHistory: BucketValueHistory | null,
  amountDelta: number,
  unitsDelta: number | null,
): CalculateBucketUpdateResult {
  const baseContributedAmount = lastHistory?.contributed_amount ?? 0;
  const baseMarketValue = lastHistory?.market_value ?? 0;
  const baseTotalUnits = lastHistory?.total_units ?? null;

  let newContributedAmount = baseContributedAmount + amountDelta;
  let newMarketAmount = baseMarketValue + amountDelta;

  let newTotalUnits: number | null = baseTotalUnits;
  if (unitsDelta !== null) {
    newTotalUnits = (baseTotalUnits ?? 0) + unitsDelta;
  }
  if (newTotalUnits !== null && newTotalUnits === 0) {
    // When selling all units, the contributed and market amounts should be zeroed out
    newContributedAmount = 0;
    newMarketAmount = 0;
  }

  return {
    newContributedAmount,
    newMarketAmount,
    newTotalUnits,
  };
}
