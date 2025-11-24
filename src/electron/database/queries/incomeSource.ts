import { getSupabase } from '../supabase.js';
import { getCurrentUserId } from '../auth.js';

export async function createIncomeSource(
  params: CreateIncomeSourceParams,
): Promise<IncomeSource> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  if (!params.name?.trim()) {
    throw new Error('Income source name is required');
  }

  const { data, error } = await supabase
    .from('income_source')
    .insert({
      user_id: userId,
      name: params.name.trim(),
      color: params.color ?? 'default',
      is_active: params.is_active ?? true,
      notes: params.notes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getIncomeSources(): Promise<IncomeSource[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('income_source')
    .select()
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getIncomeSource(id: number): Promise<IncomeSource> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('income_source')
    .select()
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateIncomeSource(
  id: number,
  params: UpdateIncomeSourceParams,
): Promise<IncomeSource> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  if (params.name !== undefined && !params.name?.trim()) {
    throw new Error('Income source name cannot be empty');
  }

  const updateData: Record<string, unknown> = {};
  if (params.name !== undefined) updateData.name = params.name.trim();
  if (params.color !== undefined) updateData.color = params.color;
  if (params.is_active !== undefined) updateData.is_active = params.is_active;
  if (params.notes !== undefined) updateData.notes = params.notes;

  const { data, error } = await supabase
    .from('income_source')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteIncomeSource(id: number): Promise<void> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('income_source')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}
