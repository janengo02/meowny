import { getSupabase } from '../supabase.js';
import { getCurrentUserId } from '../auth.js';

export async function createBucketGoal(
  params: CreateBucketGoalParams,
): Promise<BucketGoal> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  if (!params.bucket_id) {
    throw new Error('Bucket ID is required');
  }

  const { data, error } = await supabase
    .from('bucket_goal')
    .insert({
      user_id: userId,
      bucket_id: params.bucket_id,
      min_amount: params.min_amount ?? null,
      max_amount: params.max_amount ?? null,
      start_date: params.start_date ?? null,
      end_date: params.end_date ?? null,
      notes: params.notes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getBucketGoals(): Promise<BucketGoal[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('bucket_goal')
    .select()
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getBucketGoal(id: number): Promise<BucketGoal> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('bucket_goal')
    .select()
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getBucketGoalsByBucket(
  bucketId: number,
): Promise<BucketGoal[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('bucket_goal')
    .select()
    .eq('user_id', userId)
    .eq('bucket_id', bucketId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function updateBucketGoal(
  id: number,
  params: UpdateBucketGoalParams,
): Promise<BucketGoal> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const updateData: Record<string, unknown> = {};
  if (params.bucket_id !== undefined) updateData.bucket_id = params.bucket_id;
  if (params.min_amount !== undefined) updateData.min_amount = params.min_amount;
  if (params.max_amount !== undefined) updateData.max_amount = params.max_amount;
  if (params.start_date !== undefined) updateData.start_date = params.start_date;
  if (params.end_date !== undefined) updateData.end_date = params.end_date;
  if (params.notes !== undefined) updateData.notes = params.notes;

  const { data, error } = await supabase
    .from('bucket_goal')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteBucketGoal(id: number): Promise<void> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('bucket_goal')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}
