import { getSupabase } from '../supabase.js';
import { getCurrentUserId } from '../auth.js';

export async function createBucketLocation(
  params: CreateBucketLocationParams,
): Promise<BucketLocation> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  if (!params.name?.trim()) {
    throw new Error('Location name is required');
  }

  const { data, error } = await supabase
    .from('bucket_location')
    .insert({
      user_id: userId,
      name: params.name.trim(),
      color: params.color ?? 'default',
      notes: params.notes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getBucketLocations(): Promise<BucketLocation[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('bucket_location')
    .select()
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getBucketLocation(id: number): Promise<BucketLocation> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('bucket_location')
    .select()
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateBucketLocation(
  id: number,
  params: UpdateBucketLocationParams,
): Promise<BucketLocation> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  if (params.name !== undefined && !params.name?.trim()) {
    throw new Error('Location name cannot be empty');
  }

  const updateData: Record<string, unknown> = {};
  if (params.name !== undefined) updateData.name = params.name.trim();
  if (params.color !== undefined) updateData.color = params.color;
  if (params.notes !== undefined) updateData.notes = params.notes;

  const { data, error } = await supabase
    .from('bucket_location')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteBucketLocation(id: number): Promise<void> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('bucket_location')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}
