import { getSupabase } from './supabase.js';
import { getCurrentUserId } from './auth.js';

export async function createBucket(
  params: CreateBucketParams,
): Promise<Bucket> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  // Validate required params
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
