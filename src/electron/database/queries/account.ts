import { getSupabase } from '../supabase.js';
import { getCurrentUserId } from '../auth.js';

export async function createAccount(
  params: CreateAccountParams,
): Promise<Account> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  if (!params.name?.trim()) {
    throw new Error('Account name is required');
  }

  const { data, error } = await supabase
    .from('account')
    .insert({
      user_id: userId,
      name: params.name.trim(),
      type: params.type,
      color: params.color ?? 'default',
      notes: params.notes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getAccounts(): Promise<Account[]> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('account')
    .select()
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getAccount(id: number): Promise<Account> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('account')
    .select()
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateAccount(
  id: number,
  params: UpdateAccountParams,
): Promise<Account> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  if (params.name !== undefined && !params.name?.trim()) {
    throw new Error('Account name cannot be empty');
  }

  const updateData: Record<string, unknown> = {};
  if (params.name !== undefined) updateData.name = params.name.trim();
  if (params.type !== undefined) updateData.type = params.type;
  if (params.color !== undefined) updateData.color = params.color;
  if (params.notes !== undefined) updateData.notes = params.notes;

  const { data, error } = await supabase
    .from('account')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAccount(id: number): Promise<void> {
  const supabase = getSupabase();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('account')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}
