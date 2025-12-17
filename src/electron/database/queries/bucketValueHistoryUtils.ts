import { getCurrentUserId } from '../auth.js';
import { getSupabase } from '../supabase.js';

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
